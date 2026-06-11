import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { useAppData, type Task, type SubTask } from "@/lib/app-data";

import { addDays, addWeeks, addMonths, addYears } from "date-fns";

function getProjectedEvents(
  baseEvent: Event,
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly" | undefined,
  horizonDays: number = 365,
): Event[] {
  if (!recurrence || recurrence === "none") return [baseEvent];
  const events: Event[] = [];
  let currentStart = new Date(baseEvent.start);
  let currentEnd = new Date(baseEvent.end);
  const endLimit = addDays(new Date(), horizonDays); // Don't project infinitely

  let i = 0;
  while (currentStart <= endLimit && i < 365) {
    events.push({
      ...baseEvent,
      id: `${baseEvent.id}_${i}`,
      start: new Date(currentStart),
      end: new Date(currentEnd),
    });
    if (recurrence === "daily") {
      currentStart = addDays(currentStart, 1);
      currentEnd = addDays(currentEnd, 1);
    } else if (recurrence === "weekly") {
      currentStart = addWeeks(currentStart, 1);
      currentEnd = addWeeks(currentEnd, 1);
    } else if (recurrence === "monthly") {
      currentStart = addMonths(currentStart, 1);
      currentEnd = addMonths(currentEnd, 1);
    } else if (recurrence === "yearly") {
      currentStart = addYears(currentStart, 1);
      currentEnd = addYears(currentEnd, 1);
    }
    i++;
  }
  return events;
}

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AddToScheduleDialog } from "@/components/life/AddToScheduleDialog";

type ViewMode = "month" | "week" | "day";

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  goalTitle?: string;
  isSub: boolean;
  parentTitle?: string;
  done: boolean;
}

const HOURS = Array.from({ length: 18 }, (_, i) => 6 + i); // 6..23
const HOUR_PX = 48;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  // Monday as start
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
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
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CalendarView() {
  const { tasks, goals, skills, rescheduleTask, rescheduleSubtask } = useAppData();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>(isMobile ? "day" : "month");
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>(undefined);

  const onDropDay = (d: Date, payload: string) => {
    const newYmd = ymd(d);
    const base = payload.replace(/_\d+$/, "");
    if (base.startsWith("task:")) {
      rescheduleTask(base.slice(5), newYmd);
    } else if (base.startsWith("sub:")) {
      const [tid, sid] = base.slice(4).split("|");
      if (tid && sid) rescheduleSubtask(tid, sid, newYmd);
    }
  };

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];
    const skillColor = (subGoalId?: string) => {
      const g = goals.find((x) => x.subGoals.some((sg) => sg.id === subGoalId));
      const sk = skills.find((s) => s.id === g?.skill);
      return { color: sk?.color ?? "hsl(var(--muted-foreground))", goalTitle: g?.title };
    };
    for (const t of tasks) {
      if (t.startDate) {
        const start = new Date(t.startDate);
        const end = t.endDate ? new Date(t.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
        if (!Number.isNaN(start.getTime())) {
          const sk = skillColor(t.subGoalId);
          const baseEvent: Event = {
            id: `task:${t.id}`,
            title: t.title,
            start,
            end,
            color: sk.color,
            goalTitle: sk.goalTitle,
            isSub: false,
            done: t.done,
          };
          out.push(...getProjectedEvents(baseEvent, t.recurrence, 365));
        }
      }
      for (const s of t.subtasks) {
        if (!s.startDate) continue;
        const start = new Date(s.startDate);
        const end = s.endDate ? new Date(s.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
        if (Number.isNaN(start.getTime())) continue;
        const sk = skillColor(t.subGoalId);
        const baseEvent: Event = {
          id: `sub:${t.id}|${s.id}`,
          title: s.title,
          start,
          end,
          color: sk.color,
          goalTitle: sk.goalTitle,
          isSub: true,
          parentTitle: t.title,
          done: s.done,
        };
        out.push(...getProjectedEvents(baseEvent, s.recurrence, 365));
      }
    }
    return out.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks, goals, skills]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of events) {
      const k = ymd(e.start);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [events]);

  const goPrev = () => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else setCursor(addDays(cursor, -1));
  };
  const goNext = () => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else setCursor(addDays(cursor, 1));
  };
  const goToday = () => setCursor(startOfDay(new Date()));

  const headerLabel = useMemo(() => {
    if (view === "month") {
      return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    if (view === "week") {
      const s = startOfWeek(cursor);
      const e = addDays(s, 6);
      const sameMonth = s.getMonth() === e.getMonth();
      return sameMonth
        ? `${s.toLocaleDateString(undefined, { month: "short" })} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`
        : `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${e.getFullYear()}`;
    }
    return cursor.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [view, cursor]);

  const openAdd = (d?: Date) => {
    setDialogDate(d ? ymd(d) : undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <CardTitle className="text-base sm:text-lg">{headerLabel}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border bg-background">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-r-none"
                onClick={goPrev}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-none border-x"
                onClick={goToday}
              >
                Today
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-l-none"
                onClick={goNext}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="month" className="text-xs">
                  Month
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs">
                  Week
                </TabsTrigger>
                <TabsTrigger value="day" className="text-xs">
                  Day
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" onClick={() => openAdd(cursor)} className="h-8">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {view === "month" && (
            <MonthGrid
              cursor={cursor}
              eventsByDay={eventsByDay}
              isMobile={isMobile}
              onPickDay={(d) => {
                setCursor(d);
                setView("day");
              }}
              onAddOnDay={(d) => openAdd(d)}
            />
          )}
          {view === "week" && (
            <WeekGrid cursor={cursor} events={events} onAddOnDay={(d) => openAdd(d)} />
          )}
          {view === "day" && (
            <DayGrid cursor={cursor} events={events.filter((e) => sameDay(e.start, cursor))} />
          )}
        </CardContent>
      </Card>

      <AddToScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={dialogDate}
      />
    </div>
  );
}

/* ============== Month ============== */

function MonthGrid({
  cursor,
  eventsByDay,
  isMobile,
  onPickDay,
  onAddOnDay,
}: {
  cursor: Date;
  eventsByDay: Map<string, Event[]>;
  isMobile: boolean;
  onPickDay: (d: Date) => void;
  onAddOnDay: (d: Date) => void;
}) {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  const month = cursor.getMonth();
  const today = startOfDay(new Date());

  const weekdays = isMobile
    ? ["M", "T", "W", "T", "F", "S", "S"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {weekdays.map((d, i) => (
          <div key={i} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = ymd(d);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isOtherMonth = d.getMonth() !== month;
          const isToday = sameDay(d, today);
          return (
            <button
              key={i}
              onClick={() => onPickDay(d)}
              onDoubleClick={() => onAddOnDay(d)}
              className={cn(
                "group relative flex flex-col gap-1 border-b border-r p-1.5 text-left transition hover:bg-muted/40",
                isMobile ? "min-h-[56px]" : "min-h-[96px]",
                (i + 1) % 7 === 0 && "border-r-0",
                isOtherMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center self-start rounded-full px-1 text-[11px] font-semibold tabular-nums",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {d.getDate()}
              </span>
              {isMobile ? (
                dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: e.color }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{dayEvents.length - 4}
                      </span>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                        e.done && "line-through opacity-60",
                      )}
                      style={{
                        backgroundColor: `color-mix(in oklab, ${e.color} 18%, transparent)`,
                        color: e.color,
                        borderLeft: `2px solid ${e.color}`,
                      }}
                      title={`${hm(e.start)} ${e.title}`}
                    >
                      {hm(e.start)} {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============== Week ============== */

function WeekGrid({
  cursor,
  events,
  onAddOnDay,
}: {
  cursor: Date;
  events: Event[];
  onAddOnDay: (d: Date) => void;
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
  const nowTop = (nowH - baseHour) * HOUR_PX;
  const nowLabel = `${String(Math.floor(nowH)).padStart(2, "0")}:${String(Math.round((nowH % 1) * 60)).padStart(2, "0")}`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[48px_repeat(7,_1fr)] border-b text-center text-[11px]">
          <div />
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <button
                key={i}
                onClick={() => onAddOnDay(d)}
                className={cn(
                  "py-2 transition hover:bg-muted/40",
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
        </div>
        <div className="relative max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-[48px_repeat(7,_1fr)]">
            <div className="relative">
              {showNow && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-30 flex items-center justify-end pr-1"
                  style={{ top: nowTop - 6 }}
                  aria-label={`Now ${nowLabel}`}
                >
                  <span className="rounded bg-destructive px-1 py-px text-[9px] font-semibold leading-none text-destructive-foreground tabular-nums">
                    {nowLabel}
                  </span>
                </div>
              )}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-t pl-2 pt-0.5 text-[10px] tabular-nums text-muted-foreground"
                  style={{ height: HOUR_PX }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {days.map((d, i) => {
              const dayEvents = events.filter((e) => sameDay(e.start, d));
              const isCurrentDay = sameDay(d, new Date());
              return (
                <div key={i} className="relative border-l">
                  {isCurrentDay && showNow && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
                      style={{ top: nowTop - 1 }}
                    >
                      <div className="h-px flex-1 bg-destructive" />
                      <span className="mr-1 h-2 w-2 rounded-full bg-destructive" />
                    </div>
                  )}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="border-t border-border/60"
                      style={{ height: HOUR_PX }}
                    />
                  ))}
                  {dayEvents.map((e) => {
                    const startH = e.start.getHours() + e.start.getMinutes() / 60;
                    const endH = Math.max(
                      startH + 0.25,
                      e.end.getHours() + e.end.getMinutes() / 60,
                    );
                    const top = (startH - baseHour) * HOUR_PX;
                    const height = Math.max(20, (endH - startH) * HOUR_PX - 2);
                    return (
                      <div
                        key={e.id}
                        title={`${hm(e.start)}–${hm(e.end)} ${e.title}`}
                        className={cn(
                          "absolute inset-x-1 overflow-hidden rounded-md border bg-card px-1.5 py-1 text-[10px] shadow-sm",
                          e.done && "opacity-60 line-through",
                        )}
                        style={{
                          top,
                          height,
                          borderLeft: `3px solid ${e.color}`,
                        }}
                      >
                        <div className="truncate font-medium">{e.title}</div>
                        <div className="truncate text-muted-foreground">{hm(e.start)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== Day ============== */

function DayGrid({ cursor, events }: { cursor: Date; events: Event[] }) {
  const baseHour = HOURS[0];
  const isToday = sameDay(cursor, startOfDay(new Date()));

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
  const showNow = isToday && nowH >= baseHour && nowH <= lastHour;
  const nowTop = (nowH - baseHour) * HOUR_PX;
  const nowLabel = `${String(Math.floor(nowH)).padStart(2, "0")}:${String(Math.round((nowH % 1) * 60)).padStart(2, "0")}`;

  return (
    <div className="relative max-h-[70vh] overflow-y-auto">
      <div className="relative">
        {HOURS.map((h) => (
          <div
            key={h}
            className="relative flex border-t border-border/60"
            style={{ height: HOUR_PX }}
          >
            <span className="w-12 shrink-0 pl-2 pt-0.5 text-[10px] tabular-nums text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </span>
            <div className="flex-1" />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 pl-12 pr-2">
          <div className="relative h-full w-full">
            {events.length === 0 && (
              <div className="pointer-events-auto absolute inset-x-2 top-4 rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
                Nothing scheduled for{" "}
                {isToday
                  ? "today"
                  : cursor.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                .
              </div>
            )}
            {events.map((e) => {
              const startH = e.start.getHours() + e.start.getMinutes() / 60;
              const endH = Math.max(startH + 0.25, e.end.getHours() + e.end.getMinutes() / 60);
              const top = (startH - baseHour) * HOUR_PX;
              const height = Math.max(28, (endH - startH) * HOUR_PX - 4);
              return (
                <div
                  key={e.id}
                  className={cn(
                    "pointer-events-auto absolute left-1 right-1 rounded-md border bg-card px-2 py-1 text-xs shadow-sm",
                    e.done && "opacity-60 line-through",
                  )}
                  style={{ top, height, borderLeft: `3px solid ${e.color}` }}
                >
                  <div className="flex items-center gap-1.5">
                    {e.isSub && (
                      <Badge variant="outline" className="px-1 py-0 text-[9px]">
                        sub
                      </Badge>
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{e.title}</span>
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {hm(e.start)}–{hm(e.end)}
                    {e.goalTitle ? ` · ${e.goalTitle}` : ""}
                    {e.parentTitle ? ` · ${e.parentTitle}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {showNow && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
            style={{ top: nowTop - 1 }}
            aria-label={`Now ${nowLabel}`}
          >
            <span className="ml-1 rounded bg-destructive px-1 py-px text-[9px] font-semibold leading-none text-destructive-foreground tabular-nums">
              {nowLabel}
            </span>
            <div className="ml-1 h-px flex-1 bg-destructive" />
            <span className="mr-1 h-2 w-2 rounded-full bg-destructive" />
          </div>
        )}
      </div>
    </div>
  );
}
