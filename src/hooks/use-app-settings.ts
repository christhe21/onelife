import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAppData } from "@/lib/app-data";
import { useAuth } from "@/hooks/use-auth";
import { syncReminders } from "@/lib/push.functions";
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
  const { isAuthenticated } = useAuth();
  const pushSync = useServerFn(syncReminders);

  // Server-side push reminders — mirrors upcoming scheduled work into the
  // reminder queue so the cron sender can deliver it while the app is closed.
  const lastSyncRef = useRef<string>("");
  useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated) return;
    if (!settings.notificationsEnabled) return;
    if (!window.localStorage.getItem("onelife.push.endpoint")) return;

    const lead = Math.max(0, settings.reminderLeadMinutes ?? 10);
    const now = Date.now();
    const reminders: {
      dedupeKey: string;
      title: string;
      body: string;
      url: string;
      fireAt: string;
    }[] = [];

    const push = (id: string, title: string, startDate: string, context?: string) => {
      const start = new Date(startDate).getTime();
      if (Number.isNaN(start)) return;
      const fireAt = start - lead * 60_000;
      if (fireAt <= now) return;
      reminders.push({
        dedupeKey: `${id}:${startDate}`,
        title: `Upcoming: ${title}`,
        body: context ? `In ${lead} min · ${context}` : `Starts in ${lead} min`,
        url: "/",
        fireAt: new Date(fireAt).toISOString(),
      });
    };

    for (const t of tasks) {
      const goal = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId));
      if (!t.done && t.startDate && t.subtasks.length === 0) {
        push(`task:${t.id}`, t.title, t.startDate, goal?.title);
      }
      for (const s of t.subtasks) {
        if (!s.done && s.startDate) push(`subtask:${s.id}`, s.title, s.startDate, t.title);
      }
    }

    reminders.sort((a, b) => a.fireAt.localeCompare(b.fireAt));
    const trimmed = reminders.slice(0, 200);
    const signature = JSON.stringify(trimmed);
    if (signature === lastSyncRef.current) return;
    lastSyncRef.current = signature;

    const timer = window.setTimeout(() => {
      void pushSync({ data: { reminders: trimmed } }).catch((e) =>
        console.error("reminder sync failed", e),
      );
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [
    isAuthenticated,
    pushSync,
    settings.notificationsEnabled,
    settings.reminderLeadMinutes,
    tasks,
    goals,
  ]);

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
    const color = settings.themeColor ?? "monochrome";
    root.setAttribute("data-theme", color === "sage" ? "monochrome" : color);
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

      // Single reminder owner for browsers: fires once per scheduled item, at
      // the user's configured lead time.
      const fire = (key: string, startDate: string, title: string, context?: string) => {
        const start = new Date(startDate).getTime();
        if (Number.isNaN(start)) return;
        const fireAt = start - lead * 60_000;
        if (now < fireAt || now >= start + 60_000) return;
        if (firedRef.current.has(key)) return;
        firedRef.current.add(key);
        try {
          new Notification(`Upcoming: ${title}`, {
            body: context
              ? `In ${Math.max(0, Math.round((start - now) / 60_000))} min · ${context}`
              : `Starts soon`,
            tag: key,
          });
        } catch {
          /* ignore */
        }
      };

      for (const t of tasks) {
        const goal = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId));
        // Parents with subtasks are never scheduled themselves — the subtasks are.
        if (!t.done && t.startDate && t.subtasks.length === 0) {
          fire(`task:${t.id}`, t.startDate, t.title, goal?.title);
        }
        for (const s of t.subtasks) {
          if (s.done || !s.startDate) continue;
          fire(`subtask:${s.id}`, s.startDate, s.title, t.title);
        }
      }
    };

    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [settings.notificationsEnabled, settings.reminderLeadMinutes, tasks, goals]);
}
