import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useAppData, type Task, type SubTask } from "@/lib/app-data";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 18 }, (_, i) => 6 + i); // 6..23
const HOUR_PX = 56;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoToHM(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function hmToTodayISO(hm: string, dateYMD?: string): string {
  const [h, m] = hm.split(":").map(Number);
  const d = dateYMD ? new Date(`${dateYMD}T00:00:00`) : new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

function formatHours(h: number): string {
  if (h <= 0) return "0h";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return `${mm}m`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}

function parseHour(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() + d.getMinutes() / 60;
}

function diffHours(start?: string, end?: string): number {
  if (!start || !end) return 1;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!isFinite(s) || !isFinite(e) || e <= s) return 1;
  return (e - s) / 3_600_000;
}

interface Props {
  onGoTasks?: () => void;
  onGoGoals?: () => void;
}

type ScheduledItem =
  | { kind: "task"; task: Task; start: number; durH: number }
  | { kind: "subtask"; task: Task; sub: SubTask; start: number; durH: number };

export function Today({ onGoTasks, onGoGoals }: Props) {
  const { tasks, goals, skills, settings, toggleTask, updateTask, toggleSubtask, updateSubtask } =
    useAppData();
  const today = todayISO();
  const name = settings.userName?.trim();
  const [schedOpen, setSchedOpen] = useState(false);

  const { dueToday, overdue, scheduled, unscheduled } = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const due = open.filter((t) => t.dueDate === today);
    const over = open.filter((t) => t.dueDate && t.dueDate < today);

    const sched: ScheduledItem[] = [];
    const unsched: Task[] = [];

    // Tasks scheduled today
    for (const t of tasks) {
      if (t.startDate?.slice(0, 10) === today) {
        const start = parseHour(t.startDate);
        if (start !== null) {
          sched.push({ kind: "task", task: t, start, durH: diffHours(t.startDate, t.endDate) });
        }
      }
    }
    // Subtasks scheduled today
    for (const t of tasks) {
      for (const s of t.subtasks) {
        if (s.startDate?.slice(0, 10) === today) {
          const start = parseHour(s.startDate);
          if (start !== null) {
            sched.push({
              kind: "subtask",
              task: t,
              sub: s,
              start,
              durH: diffHours(s.startDate, s.endDate),
            });
          }
        }
      }
    }
    // Unscheduled = due/overdue that have no scheduled entry today
    const scheduledTaskIds = new Set(
      sched.filter((x) => x.kind === "task").map((x) => x.task.id),
    );
    for (const t of [...due, ...over]) {
      if (!scheduledTaskIds.has(t.id)) unsched.push(t);
    }
    return { dueToday: due, overdue: over, scheduled: sched, unscheduled: unsched };
  }, [tasks, today]);

  const goalOf = (id?: string) => goals.find((g) => g.id === id);
  const skillOf = (g?: { skill: string }) => skills.find((s) => s.id === g?.skill);

  const onDragStart = (e: React.DragEvent, payload: string) => {
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  const dropToHour = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain");
    if (!payload) return;
    const start = new Date();
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);
    if (payload.startsWith("task:")) {
      updateTask(payload.slice(5), { startDate: start.toISOString(), endDate: end.toISOString() });
    } else if (payload.startsWith("sub:")) {
      const [tid, sid] = payload.slice(4).split("|");
      updateSubtask(tid, sid, { startDate: start.toISOString(), endDate: end.toISOString() });
    }
  };

  const allEmpty = dueToday.length === 0 && overdue.length === 0 && scheduled.length === 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const focusListNode = (
    <FocusList
      overdue={overdue}
      dueToday={dueToday}
      unscheduled={unscheduled}
      goalOf={goalOf}
      skillOf={skillOf}
      onToggle={toggleTask}
      onDragStart={onDragStart}
      onGoTasks={onGoTasks}
    />
  );

  const scheduleNode = (
    <Schedule
      items={scheduled}
      goalOf={goalOf}
      skillOf={skillOf}
      onDrop={dropToHour}
      onDragStart={onDragStart}
      onToggleTask={toggleTask}
      onToggleSubtask={toggleSubtask}
      onAdd={() => setSchedOpen(true)}
      onUnschedule={(p) => {
        if (p.kind === "task") updateTask(p.task.id, { startDate: undefined, endDate: undefined });
        else updateSubtask(p.task.id, p.sub.id, { startDate: undefined, endDate: undefined });
      }}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">
            {greeting}
            {name ? `, ${name}` : ""}
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="gap-1">
            <CalendarCheck className="h-3 w-3" />
            {dueToday.length} due
          </Badge>
          {overdue.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdue.length} overdue
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {scheduled.length} scheduled
          </Badge>
        </div>
      </div>

      {allEmpty ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing planned yet. Schedule something to focus on today.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => setSchedOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add to schedule
              </Button>
              {onGoGoals && (
                <Button size="sm" variant="outline" onClick={onGoGoals}>
                  Go to goals <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: tabs */}
          <div className="lg:hidden">
            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">
                  Schedule
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold">
                    {scheduled.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="focus">
                  Focus
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold">
                    {dueToday.length + overdue.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="schedule" className="mt-3">
                {scheduleNode}
              </TabsContent>
              <TabsContent value="focus" className="mt-3">
                {focusListNode}
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop: side-by-side */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-5">
            <div className="lg:col-span-2">{focusListNode}</div>
            <div className="lg:col-span-3">{scheduleNode}</div>
          </div>
        </>
      )}

      <AddToScheduleDialog open={schedOpen} onOpenChange={setSchedOpen} />
    </div>
  );
}

/* ------------ Focus list ------------ */

function FocusList({
  overdue,
  dueToday,
  unscheduled,
  goalOf,
  skillOf,
  onToggle,
  onDragStart,
  onGoTasks,
}: {
  overdue: Task[];
  dueToday: Task[];
  unscheduled: Task[];
  goalOf: (id?: string) => { title: string; skill: string } | undefined;
  skillOf: (g?: { skill: string }) => { color: string; label: string } | undefined;
  onToggle: (id: string) => void;
  onDragStart: (e: React.DragEvent, payload: string) => void;
  onGoTasks?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Focus list</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overdue.length > 0 && (
          <TaskGroup
            title="Overdue"
            tone="danger"
            items={overdue}
            goalOf={goalOf}
            skillOf={skillOf}
            onToggle={onToggle}
            onDragStart={onDragStart}
          />
        )}
        {dueToday.length > 0 && (
          <TaskGroup
            title="Due today"
            items={dueToday}
            goalOf={goalOf}
            skillOf={skillOf}
            onToggle={onToggle}
            onDragStart={onDragStart}
          />
        )}
        {overdue.length === 0 && dueToday.length === 0 && (
          <p className="text-xs text-muted-foreground">Nothing due today.</p>
        )}
        {onGoTasks && (
          <Button variant="ghost" size="sm" onClick={onGoTasks} className="w-full">
            Open full task list <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TaskGroup({
  title,
  tone,
  items,
  goalOf,
  skillOf,
  onToggle,
  onDragStart,
}: {
  title: string;
  tone?: "danger";
  items: Task[];
  goalOf: (id?: string) => { title: string; skill: string } | undefined;
  skillOf: (g?: { skill: string }) => { color: string; label: string } | undefined;
  onToggle: (id: string) => void;
  onDragStart: (e: React.DragEvent, payload: string) => void;
}) {
  const byGoal = new Map<string, Task[]>();
  for (const t of items) {
    const key = t.goalId ?? "__none__";
    if (!byGoal.has(key)) byGoal.set(key, []);
    byGoal.get(key)!.push(t);
  }
  return (
    <div>
      <p
        className={cn(
          "mb-2 text-xs font-semibold uppercase tracking-wider",
          tone === "danger" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      <div className="space-y-3">
        {Array.from(byGoal.entries()).map(([key, ts]) => {
          const g = key === "__none__" ? undefined : goalOf(key);
          const sk = skillOf(g);
          return (
            <div key={key}>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: sk?.color ?? "#888" }}
                />
                {g?.title ?? "No goal"}
              </div>
              <ul className="space-y-1">
                {ts.map((t) => (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, `task:${t.id}`)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm"
                  >
                    <Checkbox checked={t.done} onCheckedChange={() => onToggle(t.id)} />
                    <span
                      className={cn("min-w-0 flex-1 truncate", t.done && "line-through opacity-60")}
                    >
                      {t.title}
                    </span>
                    {t.priority === "high" && (
                      <Badge variant="destructive" className="shrink-0 text-[10px]">
                        !
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------ Schedule ------------ */

function Schedule({
  items,
  goalOf,
  skillOf,
  onDrop,
  onDragStart,
  onToggleTask,
  onToggleSubtask,
  onAdd,
  onUnschedule,
}: {
  items: ScheduledItem[];
  goalOf: (id?: string) => { title: string; skill: string } | undefined;
  skillOf: (g?: { skill: string }) => { color: string; label: string } | undefined;
  onDrop: (e: React.DragEvent, hour: number) => void;
  onDragStart: (e: React.DragEvent, payload: string) => void;
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subId: string) => void;
  onAdd: () => void;
  onUnschedule: (p: ScheduledItem) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Tap + to add, or drag focus items onto an hour.
          </p>
        </div>
        <Button size="sm" onClick={onAdd} className="shrink-0">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative max-h-[65vh] overflow-y-auto">
          <ScheduleGrid
            items={items}
            goalOf={goalOf}
            skillOf={skillOf}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onToggleTask={onToggleTask}
            onToggleSubtask={onToggleSubtask}
            onUnschedule={onUnschedule}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleGrid({
  items,
  goalOf,
  skillOf,
  onDrop,
  onDragStart,
  onToggleTask,
  onToggleSubtask,
  onUnschedule,
}: {
  items: ScheduledItem[];
  goalOf: (id?: string) => { title: string; skill: string } | undefined;
  skillOf: (g?: { skill: string }) => { color: string; label: string } | undefined;
  onDrop: (e: React.DragEvent, hour: number) => void;
  onDragStart: (e: React.DragEvent, payload: string) => void;
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subId: string) => void;
  onUnschedule: (p: ScheduledItem) => void;
}) {
  // Tick every 60s so the "now" line stays in sync
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
  const baseHour = HOURS[0];
  const lastHour = HOURS[HOURS.length - 1] + 1;
  const showNow = nowH >= baseHour && nowH <= lastHour;
  const nowTop = (nowH - baseHour) * HOUR_PX;
  const nowLabel = `${String(Math.floor(nowH)).padStart(2, "0")}:${String(Math.round((nowH % 1) * 60)).padStart(2, "0")}`;

  return (
    <div className="relative">
      {HOURS.map((h) => (
        <div
          key={h}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, h)}
          className="relative flex border-t border-border/60 transition hover:bg-muted/30"
          style={{ height: HOUR_PX }}
        >
          <span className="relative z-20 w-14 shrink-0 bg-background pl-2 pt-1 text-[10px] font-medium tabular-nums text-muted-foreground">
            {h.toString().padStart(2, "0")}:00
          </span>
          <div className="flex-1" />
        </div>
      ))}
      {/* Positioned blocks */}
      <div className="pointer-events-none absolute inset-0 pl-14 pr-2">{renderBlocks()}</div>
      {/* Current-time indicator */}
      {showNow && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
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
  );

  function renderBlocks() {
    return items.map((it, idx) => {
                const baseHour = HOURS[0];
                const top = (it.start - baseHour) * HOUR_PX;
                const height = Math.max(18, it.durH * HOUR_PX - 2);
                const compact = height < 36;
                const g = goalOf(it.task.goalId);
                const sk = skillOf(g);
                const isSub = it.kind === "subtask";
                const title = isSub ? it.sub.title : it.task.title;
                const done = isSub ? it.sub.done : it.task.done;
                const payload = isSub ? `sub:${it.task.id}|${it.sub.id}` : `task:${it.task.id}`;
                const planned = isSub ? it.sub.plannedHours : it.task.plannedHours;
                const spent = isSub ? it.sub.spentHours : it.task.spentHours;
                const remaining =
                  planned != null ? Math.max(0, planned - (spent ?? 0)) : null;
                return (
                  <div
                    key={`${it.kind}-${idx}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, payload)}
                    className={cn(
                      "pointer-events-auto absolute left-1 right-1 flex flex-col overflow-hidden rounded-md border bg-card shadow-sm",
                      compact ? "gap-0 px-2 py-0.5 text-[11px]" : "gap-0.5 px-2 py-1 text-xs",
                    )}
                    style={{
                      top,
                      height,
                      borderLeft: `3px solid ${sk?.color ?? "#888"}`,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Checkbox
                        checked={done}
                        onCheckedChange={() =>
                          isSub ? onToggleSubtask(it.task.id, it.sub.id) : onToggleTask(it.task.id)
                        }
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate font-medium leading-tight",
                          done && "line-through opacity-60",
                        )}
                      >
                        {title}
                      </span>
                      <button
                        onClick={() => onUnschedule(it)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Remove from schedule"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {!compact && (
                      <div className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                        {isSub && <span className="rounded bg-muted px-1">sub</span>}
                        <span className="shrink-0">
                          {isoToHM(isSub ? it.sub.startDate : it.task.startDate)}
                          {(isSub ? it.sub.endDate : it.task.endDate)
                            ? ` – ${isoToHM(isSub ? it.sub.endDate : it.task.endDate)}`
                            : ""}
                        </span>
                        {remaining != null && (
                          <span className="shrink-0">· {formatHours(remaining)} left</span>
                        )}
                        {g && <span className="min-w-0 truncate">· {g.title}</span>}
                      </div>
                    )}
                  </div>
                );
              });
  }
}


/* ------------ Add-to-schedule dialog ------------ */

interface FlatItem {
  kind: "task" | "subtask";
  taskId: string;
  subId?: string;
  title: string;
  goalTitle?: string;
  skillColor?: string;
  plannedHours?: number;
  spentHours?: number;
}

export function AddToScheduleDialog({
  open,
  onOpenChange,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: string;
}) {
  const { tasks, goals, skills, updateTask, updateSubtask } = useAppData();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FlatItem | null>(null);
  const now = new Date();
  const defaultStart = `${String(now.getHours()).padStart(2, "0")}:00`;
  const defaultEnd = `${String((now.getHours() + 1) % 24).padStart(2, "0")}:00`;
  const [from, setFrom] = useState(defaultStart);
  const [till, setTill] = useState(defaultEnd);
  const [plannedHoursStr, setPlannedHoursStr] = useState("");

  const flat: FlatItem[] = useMemo(() => {
    const out: FlatItem[] = [];
    for (const t of tasks) {
      const g = goals.find((x) => x.id === t.goalId);
      const sk = skills.find((s) => s.id === g?.skill);
      out.push({
        kind: "task",
        taskId: t.id,
        title: t.title,
        goalTitle: g?.title,
        skillColor: sk?.color,
        plannedHours: t.plannedHours,
        spentHours: t.spentHours,
      });
      for (const s of t.subtasks) {
        out.push({
          kind: "subtask",
          taskId: t.id,
          subId: s.id,
          title: s.title,
          goalTitle: t.title,
          skillColor: sk?.color,
          plannedHours: s.plannedHours,
          spentHours: s.spentHours,
        });
      }
    }
    return out;
  }, [tasks, goals, skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? flat.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            (i.goalTitle ?? "").toLowerCase().includes(q),
        )
      : flat;
    return base.slice(0, 60);
  }, [flat, query]);

  const reset = () => {
    setQuery("");
    setSelected(null);
    setFrom(defaultStart);
    setTill(defaultEnd);
    setPlannedHoursStr("");
  };

  // Duration in hours from the time pickers
  const durationH = useMemo(() => {
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = till.split(":").map(Number);
    return Math.max(0, (th * 60 + tm - fh * 60 - fm) / 60);
  }, [from, till]);

  // Sync planned hours field when a new item is selected
  const onPick = (i: FlatItem) => {
    setSelected(i);
    setPlannedHoursStr(i.plannedHours != null ? String(i.plannedHours) : "");
  };

  const submit = () => {
    if (!selected) return;
    const startIso = hmToTodayISO(from, defaultDate);
    const endIso = hmToTodayISO(till, defaultDate);
    const parsedPlanned = plannedHoursStr.trim() === "" ? undefined : Number(plannedHoursStr);
    const patch: { startDate: string; endDate: string; plannedHours?: number } = {
      startDate: startIso,
      endDate: endIso,
    };
    if (parsedPlanned != null && isFinite(parsedPlanned) && parsedPlanned >= 0) {
      patch.plannedHours = parsedPlanned;
    }
    if (selected.kind === "task") {
      updateTask(selected.taskId, patch);
    } else if (selected.subId) {
      updateSubtask(selected.taskId, selected.subId, patch);
    }
    onOpenChange(false);
    reset();
  };

  const remaining =
    selected?.plannedHours != null
      ? Math.max(0, selected.plannedHours - (selected.spentHours ?? 0))
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-md flex-col gap-3 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base sm:text-lg">Add to schedule</DialogTitle>
          <DialogDescription className="text-xs">
            Search a task or subtask, then pick a time window.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Search tasks & subtasks…"
              className="pl-8 text-base"
            />
          </div>

          {selected ? (
            <div className="flex min-w-0 items-start gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-sm">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: selected.skillColor ?? "#888" }}
              />
              {selected.kind === "subtask" && (
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">sub</Badge>
              )}
              <span className="min-w-0 flex-1 break-words leading-snug">{selected.title}</span>

              {remaining != null && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatHours(remaining)} / {formatHours(selected.plannedHours!)} left
                </span>
              )}
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="max-h-56 min-w-0 overflow-y-auto rounded-md border">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No matches. Try another search.
                </p>
              ) : (
                <ul className="divide-y">
                  {filtered.map((i) => (
                    <li key={`${i.kind}-${i.taskId}-${i.subId ?? ""}`} className="min-w-0">
                      <button
                        onClick={() => onPick(i)}
                        className="flex w-full min-w-0 items-start gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted/60"
                      >
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: i.skillColor ?? "#888" }}
                        />
                        {i.kind === "subtask" && (
                          <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">sub</Badge>
                        )}
                        <span className="min-w-0 flex-1 break-words leading-snug">
                          {i.title}
                          {i.goalTitle && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              · {i.goalTitle}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}

                </ul>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <label className="min-w-0 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">From</span>
              <Input
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="text-base"
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Till</span>
              <Input
                type="time"
                value={till}
                onChange={(e) => setTill(e.target.value)}
                className="text-base"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Estimated hours (total)
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.25}
                value={plannedHoursStr}
                onChange={(e) => setPlannedHoursStr(e.target.value)}
                placeholder="e.g. 4"
                className="text-base"
              />
            </label>
            <div className="rounded-md bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
              This block: <span className="font-medium text-foreground">{formatHours(durationH)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!selected || from >= till}
            className="w-full sm:w-auto"
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
