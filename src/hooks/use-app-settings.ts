import { useEffect, useRef } from "react";
import { useAppData } from "@/lib/app-data";

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

  // Reminders
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
          const goal = goals.find((g) => g.id === t.goalId);
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
