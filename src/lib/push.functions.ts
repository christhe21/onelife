import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subscriptionSchema = z.object({
  platform: z.enum(["web", "android"]),
  endpoint: z.string().min(8).max(2000),
  p256dh: z.string().max(500).optional().nullable(),
  auth: z.string().max(500).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
});

const reminderSchema = z.object({
  dedupeKey: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  body: z.string().max(500).default(""),
  url: z.string().max(300).optional().nullable(),
  fireAt: z.string().min(10).max(40),
});

/** Public push configuration needed by the browser to subscribe. */
export const getPushConfig = createServerFn({ method: "GET" }).handler(async () => ({
  vapidPublicKey: process.env["VAPID_PUBLIC_KEY"] ?? null,
  fcmConfigured: Boolean(process.env["FCM_SERVICE_ACCOUNT"]),
}));

/** Registers (or refreshes) this device for push reminders. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => subscriptionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        platform: data.platform,
        endpoint: data.endpoint,
        p256dh: data.p256dh ?? null,
        auth: data.auth ?? null,
        user_agent: data.userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Unregisters this device. */
export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ endpoint: z.string().max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", context.userId)
      .eq("endpoint", data.endpoint);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Replaces this user's pending reminders with the given set. Rows already sent
 * are kept so a re-sync never re-delivers the same reminder.
 */
export const syncReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ reminders: z.array(reminderSchema).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const keep = data.reminders.map((r) => r.dedupeKey);

    let del = context.supabase
      .from("reminder_queue")
      .delete()
      .eq("user_id", context.userId)
      .is("sent_at", null);
    if (keep.length > 0) {
      del = del.not("dedupe_key", "in", `(${keep.map((k) => `"${k}"`).join(",")})`);
    }
    const { error: delError } = await del;
    if (delError) throw new Error(delError.message);

    if (data.reminders.length > 0) {
      const { error } = await context.supabase.from("reminder_queue").upsert(
        data.reminders.map((r) => ({
          user_id: context.userId,
          dedupe_key: r.dedupeKey,
          title: r.title,
          body: r.body,
          url: r.url ?? "/",
          fire_at: r.fireAt,
        })),
        { onConflict: "user_id,dedupe_key", ignoreDuplicates: false },
      );
      if (error) throw new Error(error.message);
    }

    return { ok: true, count: data.reminders.length };
  });

/** Sends an immediate push to every device registered by this user. */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: subs, error } = await context.supabase
      .from("push_subscriptions")
      .select("id, platform, endpoint, p256dh, auth")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (!subs || subs.length === 0) return { sent: 0, devices: 0 };

    const { deliverToSubscriptions } = await import("./push-delivery.server");
    const result = await deliverToSubscriptions(subs, {
      title: "Push reminders are on",
      body: "This is a test notification from OneLife.",
      url: "/",
      tag: "test",
    });

    if (result.expiredIds.length > 0) {
      await context.supabase.from("push_subscriptions").delete().in("id", result.expiredIds);
    }
    return { sent: result.sent, devices: subs.length };
  });
