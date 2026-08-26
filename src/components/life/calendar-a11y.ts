import type React from "react";

/** Minimal shape a calendar chip needs for keyboard support. */
export type ChipEvent = { id: string; title: string; start: Date; done?: boolean };

/** Move an event by a number of minutes relative to its current start. */
export type EventNudge = (e: ChipEvent, deltaMinutes: number) => void;

const DAY = 24 * 60;
const STEP = 30;

function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Keyboard-equivalent behaviour for pointer-dragged calendar chips:
 * Enter/Space opens the event, arrows reschedule (±1 day, ±30 minutes).
 */
export function chipKeyboardProps(
  e: ChipEvent,
  onOpen: (e: never) => void,
  onNudge?: EventNudge,
): {
  role: "button";
  tabIndex: 0;
  "aria-label": string;
  onKeyDown: (ev: React.KeyboardEvent) => void;
} {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": `${e.title}, ${timeLabel(e.start)}${e.done ? ", done" : ""}. Press Enter to open${
      onNudge ? "; arrow keys reschedule" : ""
    }.`,
    onKeyDown: (ev: React.KeyboardEvent) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        ev.stopPropagation();
        onOpen(e as never);
        return;
      }
      if (!onNudge) return;
      const delta =
        ev.key === "ArrowRight"
          ? DAY
          : ev.key === "ArrowLeft"
            ? -DAY
            : ev.key === "ArrowDown"
              ? STEP
              : ev.key === "ArrowUp"
                ? -STEP
                : 0;
      if (!delta) return;
      ev.preventDefault();
      ev.stopPropagation();
      onNudge(e, delta);
    },
  };
}

export const CHIP_FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";
