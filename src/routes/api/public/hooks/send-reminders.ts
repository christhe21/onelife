import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint: delivers every reminder whose fire time has arrived.
 * Called once a minute by pg_cron with the project's publishable apikey.
 */
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
        if (!apikey || !expected || apikey !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { deliverToSubscriptions } = await import("@/lib/push-delivery.server");

        const nowIso = new Date().toISOString();
        const { data: due, error } = await supabaseAdmin
          .from("reminder_queue")
          .select("id, user_id, title, body, url, fire_at")
          .is("sent_at", null)
          .lte("fire_at", nowIso)
          // Ignore reminders more than an hour stale (device was offline).
          .gte("fire_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order("fire_at", { ascending: true })
          .limit(200);

        if (error) {
          console.error("reminder fetch failed", error);
          return Response.json({ error: "fetch failed" }, { status: 500 });
        }
        if (!due || due.length === 0) return Response.json({ processed: 0, sent: 0 });

        const userIds = [...new Set(due.map((r) => r.user_id))];
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, user_id, platform, endpoint, p256dh, auth")
          .in("user_id", userIds);

        const byUser = new Map<string, typeof subs>();
        for (const s of subs ?? []) {
          const list = byUser.get(s.user_id) ?? [];
          list.push(s);
          byUser.set(s.user_id, list);
        }

        let sent = 0;
        const expired = new Set<string>();
        const deliveredIds: string[] = [];

        for (const reminder of due) {
          const targets = byUser.get(reminder.user_id) ?? [];
          if (targets.length > 0) {
            const result = await deliverToSubscriptions(targets, {
              title: reminder.title,
              body: reminder.body ?? "",
              url: reminder.url ?? "/",
              tag: reminder.id,
            });
            sent += result.sent;
            result.expiredIds.forEach((id) => expired.add(id));
          }
          deliveredIds.push(reminder.id);
        }

        if (deliveredIds.length > 0) {
          await supabaseAdmin
            .from("reminder_queue")
            .update({ sent_at: new Date().toISOString() })
            .in("id", deliveredIds);
        }
        if (expired.size > 0) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .in("id", [...expired]);
        }

        return Response.json({ processed: due.length, sent });
      },
    },
  },
});
