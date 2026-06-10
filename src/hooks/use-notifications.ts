import { useEffect, useRef } from "react";
import { useAppData } from "@/lib/app-data";

export function useNotifications() {
  const { tasks } = useAppData();
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request permission if not granted
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    const intervalId = setInterval(() => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const now = new Date();
      // Only check tasks for exact times
      tasks
        .filter((t) => !t.done)
        .forEach((t) => {
          if (t.startDate) {
            const start = new Date(t.startDate);
            // If we are within 1 minute of the start date
            const diffMinutes = (start.getTime() - now.getTime()) / 60000;
            if (diffMinutes >= 0 && diffMinutes <= 1) {
              const key = `task-${t.id}-${t.startDate}`;
              if (!notified.current.has(key)) {
                new Notification("Task Starting", {
                  body: `It's time for: ${t.title}`,
                  icon: "/favicon.ico",
                });
                notified.current.add(key);
              }
            }
          }

          t.subtasks
            .filter((s) => !s.done)
            .forEach((s) => {
              if (s.startDate) {
                const start = new Date(s.startDate);
                const diffMinutes = (start.getTime() - now.getTime()) / 60000;
                if (diffMinutes >= 0 && diffMinutes <= 1) {
                  const key = `subtask-${s.id}-${s.startDate}`;
                  if (!notified.current.has(key)) {
                    new Notification("Subtask Starting", {
                      body: `It's time for: ${s.title} (Part of ${t.title})`,
                      icon: "/favicon.ico",
                    });
                    notified.current.add(key);
                  }
                }
              }
            });
        });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [tasks]);
}
