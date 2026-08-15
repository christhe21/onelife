// Shared fan-out: delivers one notification payload to a set of registered
// devices (web push + FCM) and reports which subscriptions are dead.

import { readVapidKeys, sendWebPush } from "./webpush.server";
import { sendFcm } from "./fcm.server";

export interface SubscriptionRow {
  id: string;
  platform: string;
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface DeliveryResult {
  sent: number;
  failed: number;
  expiredIds: string[];
}

export async function deliverToSubscriptions(
  subs: SubscriptionRow[],
  payload: NotificationPayload,
): Promise<DeliveryResult> {
  const vapid = readVapidKeys();
  const expiredIds: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        if (sub.platform === "android") {
          const res = await sendFcm(sub.endpoint, payload);
          if (res.ok) sent++;
          else failed++;
          if (res.expired) expiredIds.push(sub.id);
          return;
        }
        if (!vapid || !sub.p256dh || !sub.auth) {
          failed++;
          return;
        }
        const res = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapid,
        );
        if (res.ok) sent++;
        else failed++;
        if (res.expired) expiredIds.push(sub.id);
      } catch (e) {
        console.error("push delivery failed", e);
        failed++;
      }
    }),
  );

  return { sent, failed, expiredIds };
}
