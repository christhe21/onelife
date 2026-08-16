import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Download,
  Clock,
  Target,
  ListTodo,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useAppData, type Task, type SubTask } from "@/lib/app-data";
import { downloadICS } from "@/lib/calendar-export";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
import { NewTaskWizard } from "./NewTaskWizard";
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

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23
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
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function buzz(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no-op */
  }
}

/* ============== Drag to move (pointer based: works with mouse + touch) ============== */

type DragItem = { id: string; title: string; color: string };
type DropTarget = { day: string; time: string | null };

function useCalendarDrag(
  onDrop: (item: DragItem, target: DropTarget) => void,
  checkConflict?: (item: DragItem, target: DropTarget) => number,
) {
  const [item, setItem] = useState<DragItem | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [target, setTarget] = useState<DropTarget | null>(null);
  const [conflicts, setConflicts] = useState(0);
  const ref = useRef<{
    item: DragItem | null;
    active: boolean;
    touch: boolean;
    x: number;
    y: number;
    timer: number | null;
    target: DropTarget | null;
  }>({ item: null, active: false, touch: false, x: 0, y: 0, timer: null, target: null });
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const checkRef = useRef(checkConflict);
  checkRef.current = checkConflict;

  const resolve = (x: number, y: number): DropTarget | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const zone = el?.closest?.("[data-drop-date]") as HTMLElement | null;
    if (!zone) return null;
    const day = zone.getAttribute("data-drop-date") ?? "";
    if (zone.getAttribute("data-drop-time") !== "1") return { day, time: null };
    const rect = zone.getBoundingClientRect();
    const base = Number(zone.getAttribute("data-drop-base") ?? 0) * 60;
    const raw = base + ((y - rect.top) / HOUR_PX) * 60;
    const mins = Math.max(0, Math.min(23 * 60 + 45, Math.round(raw / 15) * 15));
    return {
      day,
      time: `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`,
    };
  };

  const reset = () => {
    const s = ref.current;
    if (s.timer) window.clearTimeout(s.timer);
    ref.current = {
      item: null,
      active: false,
      touch: false,
      x: 0,
      y: 0,
      timer: null,
      target: null,
    };
    document.body.classList.remove("calendar-dragging");
    setItem(null);
    setTarget(null);
    setConflicts(0);
  };

  useEffect(() => {
    const activate = () => {
      const s = ref.current;
      if (!s.item || s.active) return;
      s.active = true;
      window.getSelection()?.removeAllRanges();
      document.body.classList.add("calendar-dragging");
      setItem(s.item);
      buzz(15);
    };
    const move = (e: PointerEvent) => {
      const s = ref.current;
      if (!s.item) return;
      const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
      if (!s.active) {
        if (s.touch) {
          if (moved > 10) reset(); // let the page scroll
          return;
        }
        if (moved > 5) activate();
        else return;
      }
      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
      const t = resolve(e.clientX, e.clientY);
      s.target = t;
      setTarget(t);
      setConflicts(t && checkRef.current ? checkRef.current(s.item, t) : 0);
    };
    const up = () => {
      const s = ref.current;
      if (s.active && s.item && s.target) {
        onDropRef.current(s.item, s.target);
        buzz(20);
      }
      reset();
    };
    const onSelectStart = (e: Event) => {
      if (ref.current.active) e.preventDefault();
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("selectstart", onSelectStart);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("selectstart", onSelectStart);
      document.body.classList.remove("calendar-dragging");
    };
  }, []);

  const begin = (e: React.PointerEvent, dragItem: DragItem) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const touch = e.pointerType !== "mouse";
    const s = ref.current;
    if (s.timer) window.clearTimeout(s.timer);
    ref.current = {
      item: dragItem,
      active: false,
      touch,
      x: e.clientX,
      y: e.clientY,
      timer: touch
        ? window.setTimeout(() => {
            const cur = ref.current;
            if (!cur.item || cur.active) return;
            cur.active = true;
            window.getSelection()?.removeAllRanges();
            document.body.classList.add("calendar-dragging");
            setPos({ x: cur.x, y: cur.y });
            setItem(cur.item);
            buzz(15);
          }, 220)
        : null,
      target: null,
    };
    setPos({ x: e.clientX, y: e.clientY });
  };

  const dragging = item !== null;
  const conflicting = dragging && conflicts > 0;

  const ghost = dragging ? (
    <div
      className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 animate-scale-in rounded-md px-2 py-1 text-[11px] font-medium shadow-lg"
      style={{
        left: pos.x,
        top: pos.y,
        backgroundColor: conflicting
          ? "hsl(var(--destructive) / 0.18)"
          : `color-mix(in oklab, ${item!.color} 25%, hsl(var(--background)))`,
        border: `1px solid ${conflicting ? "hsl(var(--destructive))" : item!.color}`,
        color: conflicting
          ? "hsl(var(--destructive))"
          : `color-mix(in oklab, ${item!.color} 85%, currentColor)`,
      }}
    >
      {item!.title}
      {target?.time && <span className="ml-1 opacity-70 tabular-nums">→ {target.time}</span>}
      {conflicting && (
        <span className="ml-1 font-semibold">
          ⚠ {conflicts} conflict{conflicts > 1 ? "s" : ""}
        </span>
      )}
    </div>
  ) : null;

  return { begin, dragging, dragId: item?.id ?? null, target, ghost, conflicts, conflicting };
}

type CalDrag = ReturnType<typeof useCalendarDrag>;

/* ============== Long press to create ============== */

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
        buzz(25);
        fire();
      }, LONG_PRESS_MS);
      el.setAttribute("data-lp-timer", String(timer));
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      // cancel if the finger travels (scroll intent)
      if (e.currentTarget.hasAttribute("data-lp-timer") && (e.movementX || e.movementY)) {
        if (Math.abs(e.movementX) + Math.abs(e.movementY) > 8) stop(e.currentTarget);
      }
    },
  };
}

export function CalendarView({ onGoTasks }: { onGoTasks?: () => void }) {
  const { tasks, goals, skills, rescheduleTask, rescheduleSubtask, updateTask, updateSubtask } =
    useAppData();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>(isMobile ? "day" : "month");
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>(undefined);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const onEventClick = (e: Event) => {
    setSelectedEvent(e);
    setEventDetailsOpen(true);
  };

  const toggleCompletion = () => {
    if (!selectedEvent) return;

    const isDone = !selectedEvent.done;
    const baseId = selectedEvent.id.replace(/_\d+$/, "");
    if (baseId.startsWith("task:")) {
      updateTask(baseId.slice(5), { done: isDone });
    } else if (baseId.startsWith("sub:")) {
      const [tid, sid] = baseId.slice(4).split("|");
      if (tid && sid) updateSubtask(tid, sid, { done: isDone });
    }

    setSelectedEvent({ ...selectedEvent, done: isDone });
  };

  const applyMove = (payload: string, day: string, time: string | null) => {
    const base = payload.replace(/_\d+$/, "");
    if (base.startsWith("task:")) {
      rescheduleTask(base.slice(5), day, time ?? undefined);
    } else if (base.startsWith("sub:")) {
      const [tid, sid] = base.slice(4).split("|");
      if (tid && sid) rescheduleSubtask(tid, sid, day, time ?? undefined);
    }
  };

  const baseIdOf = (id: string) => id.replace(/_\d+$/, "");

  const findConflicts = (payload: string, day: string, time: string | null): Event[] => {
    const base = baseIdOf(payload);
    const src = events.find((e) => baseIdOf(e.id) === base);
    if (!src) return [];
    const dur = Math.max(15 * 60000, src.end.getTime() - src.start.getTime());
    const [y, m, d] = day.split("-").map(Number);
    const h = time ? Number(time.slice(0, 2)) : src.start.getHours();
    const mi = time ? Number(time.slice(3, 5)) : src.start.getMinutes();
    const ns = new Date(y, (m ?? 1) - 1, d, h, mi, 0, 0);
    const ne = new Date(ns.getTime() + dur);
    const sameDayEvents = [
      ...(eventsByDay.get(day) ?? []),
      ...(eventsByDay.get(ymd(new Date(ns.getTime() - 86400000))) ?? []),
    ];
    const seen = new Set<string>();
    return sameDayEvents.filter((e) => {
      if (baseIdOf(e.id) === base || e.done) return false;
      if (!(e.start < ne && e.end > ns)) return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  };

  const WORK_START = 9 * 60;
  const WORK_END = 21 * 60;

  const findNearestFreeSlot = (
    payload: string,
    day: string,
    time: string | null,
  ): { day: string; time: string } | null => {
    const base = baseIdOf(payload);
    const src = events.find((e) => baseIdOf(e.id) === base);
    if (!src) return null;
    const dur = Math.max(15 * 60000, src.end.getTime() - src.start.getTime());
    const durMin = Math.round(dur / 60000);
    const toHM = (min: number) =>
      `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

    const fits = (d: string, startMin: number) => {
      if (startMin < WORK_START || startMin + durMin > WORK_END) return false;
      return findConflicts(payload, d, toHM(startMin)).length === 0;
    };

    const dropMin = time
      ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
      : src.start.getHours() * 60 + src.start.getMinutes();
    const anchor = Math.round(dropMin / 15) * 15;

    for (let step = 1; step <= (WORK_END - WORK_START) / 15; step++) {
      const later = anchor + step * 15;
      if (fits(day, later)) return { day, time: toHM(later) };
      const earlier = anchor - step * 15;
      if (fits(day, earlier)) return { day, time: toHM(earlier) };
    }

    const [y, m, d] = day.split("-").map(Number);
    for (let ahead = 1; ahead <= 7; ahead++) {
      const next = new Date(y!, (m ?? 1) - 1, (d ?? 1) + ahead);
      const nd = ymd(next);
      for (let min = WORK_START; min + durMin <= WORK_END; min += 15) {
        if (fits(nd, min)) return { day: nd, time: toHM(min) };
      }
    }
    return null;
  };

  const [pendingMove, setPendingMove] = useState<{
    payload: string;
    title: string;
    day: string;
    time: string | null;
    conflicts: Event[];
    suggestion: { day: string; time: string } | null;
  } | null>(null);

  const drag = useCalendarDrag(
    (item, target) => {
      const conflicts = findConflicts(item.id, target.day, target.time);
      if (conflicts.length > 0) {
        setPendingMove({
          payload: item.id,
          title: item.title,
          day: target.day,
          time: target.time,
          conflicts,
          suggestion: findNearestFreeSlot(item.id, target.day, target.time),
        });
        return;
      }
      applyMove(item.id, target.day, target.time);
    },
    (item, target) => findConflicts(item.id, target.day, target.time).length,
  );

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];
    const skillColor = (subGoalId?: string) => {
      const g = goals.find((x) => x.subGoals.some((sg) => sg.id === subGoalId));
      const sk = skills.find((s) => s.id === g?.skill);
      return { color: sk?.color ?? "hsl(var(--muted-foreground))", goalTitle: g?.title };
    };
    for (const t of tasks) {
      if (t.startDate && t.subtasks.length === 0) {
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

  const dayStats = useMemo(() => {
    const m = new Map<string, { completed: number; total: number }>();
    for (const [k, evs] of eventsByDay) {
      let c = 0;
      for (const e of evs) if (e.done) c++;
      m.set(k, { completed: c, total: evs.length });
    }
    return m;
  }, [eventsByDay]);

  const streaks = useMemo(() => {
    const keys = [...dayStats.keys()].sort();
    const m = new Map<string, number>();
    let run = 0;
    let prev: string | null = null;
    for (const k of keys) {
      const s = dayStats.get(k)!;
      if (s.completed > 0) {
        // require contiguous calendar days
        if (prev) {
          const pd = new Date(prev);
          const cd = new Date(k);
          const diff = Math.round((cd.getTime() - pd.getTime()) / 86400000);
          if (diff !== 1) run = 0;
        }
        run++;
        m.set(k, run);
        prev = k;
      } else {
        run = 0;
        prev = k;
      }
    }
    return m;
  }, [dayStats]);

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

  const [taskWizardOpen, setTaskWizardOpen] = useState(false);
  const [taskWizardDate, setTaskWizardDate] = useState<Date | undefined>(undefined);

  const openAdd = (d?: Date) => {
    setDialogDate(d ? ymd(d) : undefined);
    setDialogOpen(true);
  };

  const openCreateTask = (d?: Date) => {
    setTaskWizardDate(d);
    setTaskWizardOpen(true);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="flex-1 flex flex-col border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between shrink-0 px-0 sm:px-0 pt-0 sm:pt-0">
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const goalsTitleById = goals.reduce(
                  (acc, g) => {
                    acc[g.id] = g.title;
                    g.subGoals.forEach((sg) => (acc[sg.id] = g.title));
                    return acc;
                  },
                  {} as Record<string, string>,
                );
                downloadICS(tasks, goalsTitleById);
              }}
              className="h-8"
            >
              <Download className="mr-1 h-3.5 w-3.5" /> Export .ics
            </Button>

            <Button size="sm" onClick={() => openCreateTask(cursor)} className="h-8">
              <Plus className="mr-1 h-3.5 w-3.5" /> Create Task
            </Button>
            <Button size="sm" variant="secondary" onClick={() => openAdd(cursor)} className="h-8">
              Schedule Existing
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {view === "month" && (
            <MonthGrid
              cursor={cursor}
              eventsByDay={eventsByDay}
              dayStats={dayStats}
              streaks={streaks}
              isMobile={isMobile}
              drag={drag}
              onPickDay={(d) => {
                setCursor(d);
                setView("day");
              }}
              onEventClick={onEventClick}
              onLongPressDay={openCreateTask}
            />
          )}
          {view === "week" && (
            <WeekGrid
              cursor={cursor}
              events={events}
              drag={drag}
              onPickDay={(d) => {
                setCursor(d);
                setView("day");
              }}
              onEventClick={onEventClick}
              onLongPressDay={openCreateTask}
            />
          )}
          {view === "day" && (
            <DayGrid
              cursor={cursor}
              events={events.filter((e) => sameDay(e.start, cursor))}
              drag={drag}
              onEventClick={onEventClick}
              onLongPressEmpty={openCreateTask}
            />
          )}
        </CardContent>
      </Card>
      {drag.ghost}

      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-md flex-col gap-6 overflow-x-hidden overflow-y-auto border-2 border-primary/20 p-6">
          <DialogHeader className="gap-2">
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: selectedEvent?.color }}
              />
              <div className="flex flex-col gap-1 text-left">
                <DialogTitle
                  className="text-xl leading-tight min-w-0 break-words cursor-pointer hover:underline"
                  onClick={() => {
                    if (onGoTasks && window.confirm("Navigate to tasks page to view details?")) {
                      setEventDetailsOpen(false);
                      onGoTasks();
                    }
                  }}
                >
                  {selectedEvent?.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedEvent && `${hm(selectedEvent.start)} - ${hm(selectedEvent.end)}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 rounded-lg bg-muted/30 p-4">
            {selectedEvent?.isSub && (
              <div className="flex items-start gap-3 text-sm">
                <ListTodo className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-semibold text-foreground/80 block">Parent Task</span>
                  <span className="break-words text-muted-foreground">
                    {selectedEvent.parentTitle}
                  </span>
                </div>
              </div>
            )}
            {selectedEvent?.goalTitle && (
              <div className="flex items-start gap-3 text-sm">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-semibold text-foreground/80 block">Goal</span>
                  <span className="break-words text-muted-foreground">
                    {selectedEvent.goalTitle}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              {selectedEvent?.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <span className="font-semibold text-foreground/80 mr-2">Status:</span>
                <span
                  className={cn(
                    "font-medium",
                    selectedEvent?.done ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {selectedEvent?.done ? "Completed" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto order-last sm:order-first"
              onClick={() => setEventDetailsOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => {
                if (selectedEvent) {
                  const baseId = selectedEvent.id.replace(/_\d+$/, "");
                  if (baseId.startsWith("task:")) {
                    updateTask(baseId.slice(5), { startDate: undefined, endDate: undefined });
                  } else if (baseId.startsWith("sub:")) {
                    const [tid, sid] = baseId.slice(4).split("|");
                    if (tid && sid)
                      updateSubtask(tid, sid, { startDate: undefined, endDate: undefined });
                  }
                  setEventDetailsOpen(false);
                }
              }}
            >
              Unschedule
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                if (selectedEvent) {
                  setEventDetailsOpen(false);
                  openAdd(selectedEvent.start);
                }
              }}
            >
              Reschedule
            </Button>
            <Button className="w-full sm:w-auto" onClick={toggleCompletion}>
              {selectedEvent?.done ? "Mark Pending" : "Mark Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingMove !== null} onOpenChange={(o) => !o && setPendingMove(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Scheduling conflict</DialogTitle>
            <DialogDescription>
              “{pendingMove?.title}” would overlap {pendingMove?.conflicts.length} existing item
              {(pendingMove?.conflicts.length ?? 0) > 1 ? "s" : ""} on{" "}
              {pendingMove
                ? new Date(`${pendingMove.day}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : ""}
              {pendingMove?.time ? ` at ${pendingMove.time}` : ""}.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {pendingMove?.conflicts.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {hm(c.start)} – {hm(c.end)}
                </span>
              </li>
            ))}
          </ul>
          {pendingMove?.suggestion && (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Nearest free slot: </span>
              <span className="font-medium">
                {new Date(`${pendingMove.suggestion.day}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {pendingMove.suggestion.time}
                {(() => {
                  const src = events.find((e) => baseIdOf(e.id) === baseIdOf(pendingMove.payload));
                  if (!src) return null;
                  const dur = Math.max(15 * 60000, src.end.getTime() - src.start.getTime());
                  const [sh, sm] = pendingMove.suggestion!.time.split(":").map(Number);
                  const endMin = (sh ?? 0) * 60 + (sm ?? 0) + Math.round(dur / 60000);
                  return ` – ${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
                })()}
              </span>
            </p>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setPendingMove(null)}
            >
              Keep original time
            </Button>
            {pendingMove?.suggestion && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  if (pendingMove?.suggestion)
                    applyMove(
                      pendingMove.payload,
                      pendingMove.suggestion.day,
                      pendingMove.suggestion.time,
                    );
                  setPendingMove(null);
                }}
              >
                Use nearest free slot
              </Button>
            )}

            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => {
                if (pendingMove) applyMove(pendingMove.payload, pendingMove.day, pendingMove.time);
                setPendingMove(null);
              }}
            >
              Move anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddToScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={dialogDate}
      />
      <NewTaskWizard
        open={taskWizardOpen}
        onOpenChange={setTaskWizardOpen}
        defaultDate={taskWizardDate}
      />
    </div>
  );
}

/* ============== Month ============== */

function DayBadge({ day, ratio, isToday }: { day: number; ratio: number; isToday: boolean }) {
  const size = 22;
  const r = 9;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, ratio));
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {ratio > 0 && (
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ratio >= 1 ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            strokeWidth="2"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      <span
        className={cn(
          "relative z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
          isToday && "bg-primary text-primary-foreground",
        )}
      >
        {day}
      </span>
    </span>
  );
}

function MonthGrid({
  cursor,
  eventsByDay,
  dayStats,
  streaks,
  isMobile,
  drag,
  onPickDay,
  onEventClick,
  onLongPressDay,
}: {
  cursor: Date;
  eventsByDay: Map<string, Event[]>;
  dayStats: Map<string, { completed: number; total: number }>;
  streaks: Map<string, number>;
  isMobile: boolean;
  drag: CalDrag;
  onPickDay: (d: Date) => void;
  onEventClick: (e: Event) => void;
  onLongPressDay: (d: Date) => void;
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

  const heatBg = (completed: number) => {
    if (completed <= 0) return undefined;
    const pct = Math.min(45, 8 + completed * 10);
    return `color-mix(in oklab, hsl(var(--primary)) ${pct}%, transparent)`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-end gap-3 px-3 py-1.5 text-[10px] text-muted-foreground shrink-0 border-b border-border/40">
        <span className="inline-flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ background: "color-mix(in oklab, hsl(var(--primary)) 35%, transparent)" }}
          />
          Heat
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border-2 border-primary" />
          Progress
        </span>
        <span className="inline-flex items-center gap-1">🔥 Streak</span>
        <span className="hidden sm:inline">· Click day to add · Drag chips to reschedule</span>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {weekdays.map((d, i) => (
          <div key={i} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto">
        {cells.map((d, i) => {
          const key = ymd(d);
          const dayEvents = eventsByDay.get(key) ?? [];
          const stats = dayStats.get(key);
          const ratio = stats && stats.total > 0 ? stats.completed / stats.total : 0;
          const streak = streaks.get(key) ?? 0;
          const isOtherMonth = d.getMonth() !== month;
          const isToday = sameDay(d, today);
          const isDragOver = drag.dragging && drag.target?.day === key;
          return (
            <div
              key={i}
              data-drop-date={key}
              onClick={() => {
                if (!drag.dragging) onPickDay(d);
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-1 border-b border-r p-1.5 text-left transition hover:bg-muted/40",
                isMobile ? "min-h-[56px]" : "min-h-[120px] h-full",
                (i + 1) % 7 === 0 && "border-r-0",
                isOtherMonth && "text-muted-foreground",
                isDragOver && "ring-2 ring-inset ring-primary bg-primary/10",
              )}
              style={{ backgroundColor: heatBg(stats?.completed ?? 0) }}
            >
              <div className="flex items-start justify-between">
                <button
                  type="button"
                  {...longPressHandlers(() => onLongPressDay(d), "animate-long-press")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickDay(d);
                  }}
                  className="rounded-full transition-all duration-300 pointer-events-auto select-none outline-none"
                  aria-label={`Open ${key}`}
                >
                  <DayBadge day={d.getDate()} ratio={ratio} isToday={isToday} />
                </button>

                {streak >= 2 && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-500"
                    title={`${streak}-day streak`}
                  >
                    🔥{!isMobile && <span className="tabular-nums">{streak}</span>}
                  </span>
                )}
              </div>
              {isMobile ? (
                dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        draggable={false}
                        onPointerDown={(ev) =>
                          drag.begin(ev, { id: e.id, title: e.title, color: e.color })
                        }
                        className={cn(
                          "h-2 w-2 cursor-grab touch-none rounded-full active:cursor-grabbing",
                          drag.dragId === e.id && "opacity-40",
                        )}
                        style={{ backgroundColor: e.color, touchAction: "none" }}
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
                <div className="flex flex-col gap-1 mt-1 overflow-y-auto pr-1 no-scrollbar flex-1">
                  {dayEvents.map((e) => (
                    <span
                      key={e.id}
                      draggable={false}
                      onPointerDown={(ev) =>
                        drag.begin(ev, { id: e.id, title: e.title, color: e.color })
                      }
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (!drag.dragging) onEventClick(e);
                      }}
                      className={cn(
                        "cursor-grab touch-none truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight active:cursor-grabbing transition-all hover:scale-[1.02] hover:shadow-sm shrink-0",
                        e.done && "line-through opacity-60",
                        drag.dragId === e.id && "opacity-40",
                      )}
                      style={{
                        backgroundColor: `color-mix(in oklab, ${e.color} 15%, transparent)`,
                        color: `color-mix(in oklab, ${e.color} 80%, currentColor)`,
                        border: `1px solid color-mix(in oklab, ${e.color} 40%, transparent)`,
                        borderLeft: `3px solid ${e.color}`,
                        touchAction: "none",
                      }}
                      title={`${hm(e.start)} ${e.title} — drag to reschedule`}
                    >
                      {hm(e.start)} {e.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
  drag,
  onPickDay,
  onEventClick,
  onLongPressDay,
}: {
  cursor: Date;
  events: Event[];
  drag: CalDrag;
  onPickDay: (d: Date) => void;
  onEventClick: (e: Event) => void;
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
                {...longPressHandlers(() => onLongPressDay(d), "animate-long-press-block")}
                onClick={() => onPickDay(d)}
                className={cn(
                  "py-2 transition-all duration-300 hover:bg-muted/40 select-none",
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
                  className="border-t pl-2 pt-0.5 text-[10px] tabular-nums text-muted-foreground"
                  style={{ height: HOUR_PX }}
                >
                  {`${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`}
                </div>
              ))}
            </div>
            {days.map((d, i) => {
              const dayEvents = events.filter((e) => sameDay(e.start, d));
              const isCurrentDay = sameDay(d, new Date());
              const key = ymd(d);
              return (
                <div
                  key={i}
                  data-drop-date={key}
                  data-drop-time="1"
                  data-drop-base={baseHour}
                  className={cn(
                    "relative border-l",
                    drag.dragging && drag.target?.day === key && "bg-primary/10",
                  )}
                >
                  {isCurrentDay && showNow && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
                      style={{ top: nowTop - 1 }}
                    >
                      <div className="h-px flex-1 bg-primary" />
                      <span className="mr-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
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
                        draggable={false}
                        onPointerDown={(ev) =>
                          drag.begin(ev, { id: e.id, title: e.title, color: e.color })
                        }
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (!drag.dragging) onEventClick(e);
                        }}
                        title={`${hm(e.start)}–${hm(e.end)} ${e.title} — drag to reschedule`}
                        className={cn(
                          "absolute inset-x-1 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-1 text-[10px] shadow-sm active:cursor-grabbing flex flex-col transition-all hover:scale-[1.02] hover:shadow-md hover:z-10",
                          e.done && "opacity-60 line-through",
                          drag.dragId === e.id && "opacity-40",
                        )}
                        style={{
                          top,
                          height,
                          backgroundColor: `color-mix(in oklab, ${e.color} 15%, transparent)`,
                          border: `1px solid color-mix(in oklab, ${e.color} 40%, transparent)`,
                          borderLeft: `4px solid ${e.color}`,
                          touchAction: "none",
                        }}
                      >
                        <div
                          className="break-words font-medium leading-tight mb-0.5 line-clamp-2"
                          style={{ color: `color-mix(in oklab, ${e.color} 80%, currentColor)` }}
                        >
                          {e.title}
                        </div>
                        <div
                          className="truncate opacity-80 mt-auto"
                          style={{ color: `color-mix(in oklab, ${e.color} 80%, currentColor)` }}
                        >
                          {hm(e.start)}–{hm(e.end)}
                        </div>
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

function DayGrid({
  cursor,
  events,
  drag,
  onEventClick,
  onLongPressEmpty,
}: {
  cursor: Date;
  events: Event[];
  drag: CalDrag;
  onEventClick: (e: Event) => void;
  onLongPressEmpty: (d: Date) => void;
}) {
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
    <div className="relative max-h-[70vh] overflow-y-auto overflow-x-hidden">
      <div
        className={cn(
          "relative",
          drag.dragging && drag.target?.day === ymd(cursor) && "bg-primary/5",
        )}
        data-drop-date={ymd(cursor)}
        data-drop-time="1"
        data-drop-base={baseHour}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            className="relative flex border-t border-border/60"
            style={{ height: HOUR_PX }}
          >
            <span className="w-12 shrink-0 pl-2 pt-0.5 text-[10px] tabular-nums text-muted-foreground">
              {`${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`}
            </span>

            <div
              className="flex-1 transition-colors duration-300 select-none cursor-pointer"
              {...longPressHandlers(() => {
                const d = new Date(cursor);
                d.setHours(h, 0, 0, 0);
                onLongPressEmpty(d);
              }, "animate-long-press-block")}
            />
          </div>
        ))}
        {drag.dragging && drag.target?.day === ymd(cursor) && drag.target.time && (
          <div
            className="pointer-events-none absolute left-12 right-2 z-40 h-0.5 bg-primary"
            style={{
              top:
                (Number(drag.target.time.slice(0, 2)) +
                  Number(drag.target.time.slice(3)) / 60 -
                  baseHour) *
                HOUR_PX,
            }}
          />
        )}
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
            {events.map((e, index) => {
              const startH = e.start.getHours() + e.start.getMinutes() / 60;
              const endH = Math.max(startH + 0.25, e.end.getHours() + e.end.getMinutes() / 60);
              const top = (startH - baseHour) * HOUR_PX;
              const height = Math.max(28, (endH - startH) * HOUR_PX - 4);

              // Calculate overlap offset and z-index
              const overlappingBefore = events.slice(0, index).filter((prevEvent) => {
                const prevStartH = prevEvent.start.getHours() + prevEvent.start.getMinutes() / 60;
                const prevEndH = Math.max(
                  prevStartH + 0.25,
                  prevEvent.end.getHours() + prevEvent.end.getMinutes() / 60,
                );
                return prevStartH < endH && prevEndH > startH;
              });
              const overlapIndex = overlappingBefore.length;
              const zIndex = 20 - overlapIndex;
              const leftOffset = 4 + overlapIndex * 16;

              return (
                <div
                  key={e.id}
                  draggable={false}
                  onPointerDown={(ev) =>
                    drag.begin(ev, { id: e.id, title: e.title, color: e.color })
                  }
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (!drag.dragging) onEventClick(e);
                  }}
                  className={cn(
                    "pointer-events-auto absolute right-1 touch-none rounded-md px-2 py-1 text-xs shadow-sm flex flex-col overflow-hidden transition-all hover:scale-[1.01] hover:shadow-md hover:z-30 cursor-grab active:cursor-grabbing",
                    e.done && "opacity-60 line-through",
                    drag.dragId === e.id && "opacity-40",
                  )}
                  style={{
                    top,
                    height,
                    left: `${leftOffset}px`,
                    zIndex,
                    backgroundColor: `color-mix(in oklab, ${e.color} 15%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${e.color} 40%, transparent)`,
                    borderLeft: `4px solid ${e.color}`,
                    backdropFilter: "blur(4px)",
                    touchAction: "none",
                  }}
                >
                  <div className="flex items-start gap-1.5 mb-1 shrink-0">
                    {e.isSub && (
                      <Badge
                        variant="outline"
                        className="px-1 py-0 text-[9px] mt-0.5 shrink-0 bg-background/50 backdrop-blur-sm"
                        style={{
                          borderColor: `color-mix(in oklab, ${e.color} 50%, transparent)`,
                          color: `color-mix(in oklab, ${e.color} 80%, currentColor)`,
                        }}
                      >
                        sub
                      </Badge>
                    )}
                    <span
                      className="min-w-0 flex-1 break-words font-medium leading-tight line-clamp-2"
                      style={{ color: `color-mix(in oklab, ${e.color} 90%, currentColor)` }}
                    >
                      {e.title}
                    </span>
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
            <span className="ml-1 rounded bg-primary px-1 py-px text-[9px] font-semibold leading-none text-primary-foreground tabular-nums relative">
              {nowLabel}
              <span className="absolute -right-1 -top-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </span>
            <div className="ml-1 h-px flex-1 bg-primary shadow-[0_0_4px_hsl(var(--primary))]" />
            <span className="mr-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          </div>
        )}
      </div>
    </div>
  );
}
