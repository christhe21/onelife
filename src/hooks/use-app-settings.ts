import { useEffect, useRef } from "react";
import { useAppData } from "@/lib/app-data";
import {
  isNativeApp,
  getNativeNotificationPermission,
  nativeScheduleNotifications,
  nativeCancelScheduledNotifications,
  type ScheduledNotification,
} from "@/lib/native-bridge";

// AlarmManager handles at most a few dozen exact alarms comfortably; the
// nearest reminders matter most anyway.
const MAX_NATIVE_REMINDERS = 50;

const SCALE_PX: Record<string, string> = {
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
};

/** Applies the user's text scale to <html> and fires reminders for scheduled tasks. */
export function useAppSettingsEffects() {
  const { settings, tasks, goals } = useAppData();

  // Text scale
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.fontSize = SCALE_PX[settings.textScale ?? "base"];
  }, [settings.textScale]);

  // Theme mode
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let isDark = false;
    const mode = settings.themeMode ?? "system";

    if (mode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = mode === "dark";
    }

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }, [settings.themeMode]);

  // System theme changes listener
  useEffect(() => {
    if (typeof window === "undefined" || settings.themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.themeMode]);

  // Theme color
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = window.document.documentElement;
    root.setAttribute("data-theme", settings.themeColor ?? "monochrome");
  }, [settings.themeColor]);

  // Reminders — native path (Android shell). The WebView has no Notification
  // API and pauses JS timers in the background, so upcoming reminders are
  // handed to Kotlin, which schedules real alarms mirroring the same
  // lead-time logic as the web polling path below.
  useEffect(() => {
    if (typeof window === "undefined" || !isNativeApp()) return;
    if (!settings.notificationsEnabled || getNativeNotificationPermission() !== "granted") {
      nativeCancelScheduledNotifications();
      return;
    }

    const lead = Math.max(0, settings.reminderLeadMinutes ?? 10);
    const now = Date.now();
    const upcoming: ScheduledNotification[] = [];
    for (const t of tasks) {
      if (t.done || !t.startDate) continue;
      const start = new Date(t.startDate).getTime();
      if (Number.isNaN(start)) continue;
      const fireAt = start - lead * 60_000;
      if (fireAt <= now) continue;
      const goal = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId));
      upcoming.push({
        id: t.id,
        title: `Upcoming: ${t.title}`,
        body: goal ? `In ${lead} min · ${goal.title}` : "Starts soon",
        triggerAtMillis: fireAt,
      });
    }
    upcoming.sort((a, b) => a.triggerAtMillis - b.triggerAtMillis);
    nativeScheduleNotifications(upcoming.slice(0, MAX_NATIVE_REMINDERS));
  }, [settings.notificationsEnabled, settings.reminderLeadMinutes, tasks, goals]);

  // Reminders — web polling path (browsers). No-ops inside the Android shell
  // because the WebView has no Notification API.
  const firedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settings.notificationsEnabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const lead = Math.max(0, settings.reminderLeadMinutes ?? 10);

    const check = () => {
      const now = Date.now();
      for (const t of tasks) {
        if (t.done || !t.startDate) continue;
        const start = new Date(t.startDate).getTime();
        if (Number.isNaN(start)) continue;
        const fireAt = start - lead * 60_000;
        if (now >= fireAt && now < start + 60_000 && !firedRef.current.has(t.id)) {
          firedRef.current.add(t.id);
          const goal = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId));
          try {
            new Notification(`Upcoming: ${t.title}`, {
              body: goal
                ? `In ${Math.max(0, Math.round((start - now) / 60_000))} min · ${goal.title}`
                : `Starts soon`,
              tag: t.id,
            });
          } catch {
            /* ignore */
          }
        }
      }
    };

    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [settings.notificationsEnabled, settings.reminderLeadMinutes, tasks, goals]);
}
