import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WEEK_HOUR_PX, WEEK_MIN_COL_PX } from "@/components/life/calendar-week-layout";

type EventChip = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  done: boolean;
  isSub: boolean;
};

type DragItem = { id: string; title: string; color: string };

type CalDrag = {
  begin: (e: React.PointerEvent, item: DragItem) => void;
  dragging: boolean;
  dragId: string | null;
  target: { day: string; time: string | null } | null;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_COL_PX = 56;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}
function addDaysLocal(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return ymd(a) === ymd(b);
}
function hm(d: Date) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

const LONG_PRESS_MS = 1200;

function longPressHandlers(fire: () => void, cls: string) {
  const stop = (el: HTMLElement) => {
    el.classList.remove(cls);
    const t = el.getAttribute("data-lp-timer");
    if (t) window.clearTimeout(parseInt(t));
    el.removeAttribute("data-lp-timer");
  };
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      stop(el);
      el.classList.add(cls);
      const timer = window.setTimeout(() => {
        el.classList.remove(cls);
        el.removeAttribute("data-lp-timer");
        try {
          navigator.vibrate?.(25);
        } catch {
          /* no-op */
        }
        fire();
      }, LONG_PRESS_MS);
      el.setAttribute("data-lp-timer", String(timer));
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasAttribute("data-lp-timer") && (e.movementX || e.movementY)) {
        if (Math.abs(e.movementX) + Math.abs(e.movementY) > 8) stop(e.currentTarget);
      }
    },
  };
}

export function WeekGrid({
  cursor,
  events,
  drag,
  onPickDay,
  onEventClick,
  onLongPressDay,
}: {
  cursor: Date;
  events: EventChip[];
  drag: CalDrag;
  onPickDay: (d: Date) => void;
  onEventClick: (e: EventChip) => void;
  onLongPressDay: (d: Date) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDaysLocal(start, i));
  const baseHour = HOURS[0];
  const today = startOfDay(new Date());

  const [nowH, setNowH] = useState(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date();
      setNowH(d.getHours() + d.getMinutes() / 60);
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const lastHour = HOURS[HOURS.length - 1] + 1;
  const showNow = nowH >= baseHour && nowH <= lastHour;
  const nowTop = (nowH - baseHour) * WEEK_HOUR_PX;
  const nowLabel = `${String(Math.floor(nowH)).padStart(2, "0")}:${String(Math.round((nowH % 1) * 60)).padStart(2, "0")}`;

  return (
    <div className="max-h-[70vh] overflow-auto [scrollbar-gutter:stable]">
      <div
        className="grid"
        style={{
          minWidth: TIME_COL_PX + 7 * WEEK_MIN_COL_PX,
          gridTemplateColumns: `${TIME_COL_PX}px repeat(7, minmax(${WEEK_MIN_COL_PX}px, 1fr))`,
        }}
      >
        <div className="sticky top-0 left-0 z-40 border-b border-r bg-background" />
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          return (
            <button
              key={`head-${i}`}
              {...longPressHandlers(() => onLongPressDay(d), "animate-long-press-block")}
              onClick={() => onPickDay(d)}
              className={cn(
                "sticky top-0 z-20 border-b border-l py-2 text-center text-[11px] transition-all duration-300 hover:bg-muted/40 select-none bg-background",
                isToday && "bg-primary/10 text-primary font-semibold",
              )}
            >
              <div className="uppercase tracking-wider text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="text-sm">{d.getDate()}</div>
            </button>
          );
        })}

        <div className="relative sticky left-0 z-30 bg-background shadow-[4px_0_8px_-4px_hsl(var(--foreground)/0.18)]">
          {showNow && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-30 flex items-center justify-end pr-1"
              style={{ top: nowTop - 6 }}
              aria-label={`Now ${nowLabel}`}
            >
              <span className="rounded bg-primary px-1 py-px text-[9px] font-semibold leading-none text-primary-foreground tabular-nums relative">
                {nowLabel}
                <span className="absolute -left-1 -top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </span>
            </div>
          )}
          {HOURS.map((h) => (
            <div
              key={h}
              className="border-t border-r pl-1 pt-0.5 text-[10px] leading-tight tabular-nums text-muted-foreground"
              style={{ height: WEEK_HOUR_PX }}
            >
              {`${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`}
            </div>
          ))}
        </div>

        {days.map((d, i) => {
          const dayEvents = events.filter((e) => sameDay(e.start, d));
          const isToday = sameDay(d, today);
          const key = ymd(d);
          return (
            <div
              key={`col-${i}`}
              data-drop-date={key}
              data-drop-time="1"
              data-drop-base={baseHour}
              data-drop-hour-px={WEEK_HOUR_PX}
              className={cn(
                "relative border-l",
                isToday && "bg-primary/5",
                drag.dragging && drag.target?.day === key && "bg-primary/10",
              )}
            >
              {isToday && showNow && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                  style={{ top: nowTop - 1 }}
                >
                  <div className="h-px flex-1 bg-primary" />
                  <span className="mr-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                </div>
              )}
              {HOURS.map((h) => (
                <div key={h} className="border-t border-border/60" style={{ height: WEEK_HOUR_PX }} />
              ))}
              {dayEvents.map((e) => {
                const startH = e.start.getHours() + e.start.getMinutes() / 60;
                const endH = Math.max(startH + 0.25, e.end.getHours() + e.end.getMinutes() / 60);
                const top = (startH - baseHour) * WEEK_HOUR_PX;
                const height = Math.max(40, (endH - startH) * WEEK_HOUR_PX - 2);
                return (
                  <div
                    key={e.id}
                    draggable={false}
                    onPointerDown={(ev) => drag.begin(ev, { id: e.id, title: e.title, color: e.color })}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (!drag.dragging) onEventClick(e);
                    }}
                    title={`${hm(e.start)}–${hm(e.end)} ${e.title} — drag to reschedule`}
                    className={cn(
                      "absolute inset-x-0.5 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-0 text-[12px] leading-none shadow-sm active:cursor-grabbing flex items-center hover:z-10",
                      e.done && "opacity-60 line-through",
                      drag.dragId === e.id && "opacity-40",
                    )}
                    style={{
                      top,
                      height,
                      backgroundColor: `color-mix(in oklab, ${e.color} 18%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${e.color} 40%, transparent)`,
                      borderLeft: `4px solid ${e.color}`,
                      touchAction: "none",
                    }}
                  >
                    <div
                      className="min-w-0 flex-1 truncate font-medium"
                      style={{ color: `color-mix(in oklab, ${e.color} 90%, currentColor)` }}
                    >
                      {e.title}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
