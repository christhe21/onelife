// Bridge to the Android WebView shell (android/ directory).
//
// The Kotlin app injects a `window.AndroidBridge` object via
// addJavascriptInterface(). When it is absent (normal browsers, tests, SSR)
// every helper here is a no-op / returns null, so web behavior is unchanged.
//
// Android WebView has no `Notification` API and can't download blob: URLs via
// anchor clicks, so file saving and reminders are routed through this bridge.

export interface AndroidBridgeApi {
  /** Opens a native "Save as" dialog (Storage Access Framework). */
  saveFile(filename: string, mimeType: string, content: string): void;
  /** Returns "granted" | "denied" | "default" for POST_NOTIFICATIONS. */
  getNotificationPermission(): string;
  /**
   * Triggers the Android 13+ runtime permission prompt. The result is
   * delivered by the shell calling `window.__onNativeNotificationPermission`.
   */
  requestNotificationPermission(): void;
  /** Shows a notification immediately. */
  showNotification(title: string, body: string): void;
  /**
   * Replaces all scheduled reminder alarms. Payload is a JSON array of
   * { id: string, title: string, body: string, triggerAtMillis: number }.
   * Alarms fire even while the WebView is backgrounded (its JS timers pause).
   */
  scheduleNotifications(payloadJson: string): void;
  /** Cancels every alarm previously set via scheduleNotifications. */
  cancelScheduledNotifications(): void;
  /**
   * Requests the FCM device token. The shell answers by calling
   * `window.__onNativePushToken(token)` (empty string on failure).
   */
  requestPushToken?(): void;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  triggerAtMillis: number;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeApi;
    __onNativeNotificationPermission?: (result: string) => void;
    __onNativePushToken?: (token: string) => void;
  }
}

function bridge(): AndroidBridgeApi | null {
  if (typeof window === "undefined") return null;
  return window.AndroidBridge ?? null;
}

/** True when running inside the Android shell app. */
export function isNativeApp(): boolean {
  return bridge() !== null;
}

/**
 * Saves a file through the native "Save as" dialog.
 * Returns false when there is no bridge — caller should fall back to the
 * regular anchor-download path.
 */
export function nativeSaveFile(filename: string, mimeType: string, content: string): boolean {
  const b = bridge();
  if (!b) return false;
  try {
    b.saveFile(filename, mimeType, content);
    return true;
  } catch {
    return false;
  }
}

/** Native notification permission, or null when not running in the shell. */
export function getNativeNotificationPermission(): NotificationPermission | null {
  const b = bridge();
  if (!b) return null;
  try {
    const p = b.getNotificationPermission();
    return p === "granted" || p === "denied" ? p : "default";
  } catch {
    return null;
  }
}

/** Asks for native notification permission; resolves with the outcome. */
export function requestNativeNotificationPermission(): Promise<NotificationPermission> {
  const b = bridge();
  if (!b) return Promise.resolve("denied");
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: string) => {
      if (settled) return;
      settled = true;
      delete window.__onNativeNotificationPermission;
      resolve(result === "granted" ? "granted" : "denied");
    };
    window.__onNativeNotificationPermission = settle;
    try {
      b.requestNotificationPermission();
    } catch {
      settle("denied");
    }
    // Safety net in case the native side never calls back (e.g. dialog dismissed).
    window.setTimeout(() => settle(getNativeNotificationPermission() ?? "denied"), 20_000);
  });
}

/** Shows an immediate native notification. Returns false without a bridge. */
export function nativeShowNotification(title: string, body: string): boolean {
  const b = bridge();
  if (!b) return false;
  try {
    b.showNotification(title, body);
    return true;
  } catch {
    return false;
  }
}

/** Replaces all scheduled native reminders. */
export function nativeScheduleNotifications(items: ScheduledNotification[]): void {
  const b = bridge();
  if (!b) return;
  try {
    b.scheduleNotifications(JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

/** Cancels all scheduled native reminders. */
export function nativeCancelScheduledNotifications(): void {
  const b = bridge();
  if (!b) return;
  try {
    b.cancelScheduledNotifications();
  } catch {
    /* ignore */
  }
}

/**
 * Resolves with the Android FCM device token, or null when the shell is older
 * than the push build / Firebase is not configured.
 */
export function getNativePushToken(): Promise<string | null> {
  const b = bridge();
  if (!b || typeof b.requestPushToken !== "function") return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const settle = (token: string | null) => {
      if (settled) return;
      settled = true;
      delete window.__onNativePushToken;
      resolve(token && token.length > 0 ? token : null);
    };
    window.__onNativePushToken = settle;
    try {
      b.requestPushToken?.();
    } catch {
      settle(null);
    }
    window.setTimeout(() => settle(null), 15_000);
  });
}
