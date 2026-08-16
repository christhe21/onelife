import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getPushConfig,
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "@/lib/push.functions";
import {
  isNativeApp,
  getNativePushToken,
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
} from "@/lib/native-bridge";
import { useAuth } from "@/hooks/use-auth";

const SW_URL = "/sw-push.js";
const ENDPOINT_KEY = "onelife.push.endpoint";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface PushState {
  /** The runtime can receive server-sent push at all. */
  supported: boolean;
  /** This device is registered for push in the backend. */
  registered: boolean;
  busy: boolean;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  test: () => Promise<{ sent: number; devices: number } | null>;
}

/**
 * Registers this device (browser or Android shell) for server-sent push
 * reminders. Requires a signed-in user — reminders are queued per account.
 */
export function usePushReminders(): PushState {
  const { isAuthenticated } = useAuth();
  const config = useServerFn(getPushConfig);
  const save = useServerFn(savePushSubscription);
  const remove = useServerFn(removePushSubscription);
  const test = useServerFn(sendTestPush);

  const [supported, setSupported] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(
      isNativeApp() || ("serviceWorker" in navigator && "PushManager" in window),
    );
    setRegistered(Boolean(window.localStorage.getItem(ENDPOINT_KEY)));
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    setBusy(true);
    try {
      if (isNativeApp()) {
        if (getNativeNotificationPermission() !== "granted") {
          const p = await requestNativeNotificationPermission();
          if (p !== "granted") return false;
        }
        const token = await getNativePushToken();
        if (!token) return false;
        await save({ data: { platform: "android", endpoint: token, userAgent: "android-shell" } });
        window.localStorage.setItem(ENDPOINT_KEY, token);
        setRegistered(true);
        return true;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const { vapidPublicKey } = await config();
      if (!vapidPublicKey) return false;

      const reg = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }));

      await save({
        data: {
          platform: "web",
          endpoint: sub.endpoint,
          p256dh: bufferToBase64Url(sub.getKey("p256dh")),
          auth: bufferToBase64Url(sub.getKey("auth")),
          userAgent: navigator.userAgent.slice(0, 300),
        },
      });
      window.localStorage.setItem(ENDPOINT_KEY, sub.endpoint);
      setRegistered(true);
      return true;
    } catch (e) {
      console.error("push enable failed", e);
      return false;
    } finally {
      setBusy(false);
    }
  }, [config, isAuthenticated, save]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const endpoint = window.localStorage.getItem(ENDPOINT_KEY);
      if (!isNativeApp() && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration(SW_URL);
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
      }
      if (endpoint && isAuthenticated) {
        await remove({ data: { endpoint } });
      }
      window.localStorage.removeItem(ENDPOINT_KEY);
      setRegistered(false);
    } catch (e) {
      console.error("push disable failed", e);
    } finally {
      setBusy(false);
    }
  }, [isAuthenticated, remove]);

  const runTest = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      return await test({ data: undefined });
    } catch (e) {
      console.error("test push failed", e);
      return null;
    }
  }, [isAuthenticated, test]);

  return { supported, registered, busy, enable, disable, test: runTest };
}
