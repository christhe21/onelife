import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useAppData, type Task } from "@/lib/app-data";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 18 }, (_, i) => 6 + i); // 6..23

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseHour(iso?: string): number | null {
  if (!iso) return null;
  // dueDate is YYYY-MM-DD only; startDate may include time
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours();
}

interface Props {
  onGoTasks?: () => void;
  onGoGoals?: () => void;
}

export function Today({ onGoTasks, onGoGoals }: Props) {
  const { tasks, goals, skills, settings, toggleTask, updateTask } = useAppData();
  const today = todayISO();
  const name = settings.userName?.trim();

  const { dueToday, overdue, scheduled, unscheduled } = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const due = open.filter((t) => t.dueDate === today);
    const over = open.filter((t) => t.dueDate && t.dueDate < today);
    const sched: { task: Task; hour: number }[] = [];
    const unsched: Task[] = [];
    for (const t of [...due, ...over]) {
      const h = parseHour(t.startDate);
      const onToday = t.startDate?.slice(0, 10) === today;
      if (onToday && h !== null) sched.push({ task: t, hour: h });
      else unsched.push(t);
    }
    return { dueToday: due, overdue: over, scheduled: sched, unscheduled: unsched };
  }, [tasks, today]);

  const goalOf = (id?: string) => goals.find((g) => g.id === id);
  const skillOf = (g?: { skill: string }) => skills.find((s) => s.id === g?.skill);

  const dropToHour = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    const start = new Date();
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);
    updateTask(id, { startDate: start.toISOString(), endDate: end.toISOString() });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/task-id", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const allEmpty = dueToday.length === 0 && overdue.length === 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">
            {greeting}{name ? `, ${name}` : ""}
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="gap-1"><CalendarCheck className="h-3 w-3" />{dueToday.length} due today</Badge>
          {overdue.length > 0 && (
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{overdue.length} overdue</Badge>
          )}
          <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{scheduled.length} scheduled</Badge>
        </div>
      </div>

      {allEmpty ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing due today. Pick something from your goals to focus on.
            </p>
            {onGoGoals && (
              <Button className="mt-4" onClick={onGoGoals} size="sm">
                Go to goals <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Section A: list */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Focus list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overdue.length > 0 && (
                <TaskGroup title="Overdue" tone="danger" items={overdue} goalOf={goalOf} skillOf={skillOf} onToggle={toggleTask} onDragStart={onDragStart} />
              )}
              {dueToday.length > 0 && (
                <TaskGroup title="Due today" items={dueToday} goalOf={goalOf} skillOf={skillOf} onToggle={toggleTask} onDragStart={onDragStart} />
              )}
              {onGoTasks && (
                <Button variant="ghost" size="sm" onClick={onGoTasks} className="w-full">
                  Open full task list <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Section B: schedule */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
              <p className="text-[11px] text-muted-foreground">Drag tasks from the focus list onto an hour.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto divide-y">
                {HOURS.map((h) => {
                  const items = scheduled.filter((s) => s.hour === h);
                  return (
                    <div
                      key={h}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => dropToHour(e, h)}
                      className="flex min-h-[44px] gap-2 px-3 py-1.5 transition hover:bg-muted/40"
                    >
                      <span className="w-14 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                        {h.toString().padStart(2, "0")}:00
                      </span>
                      <div className="flex flex-1 flex-wrap gap-1.5">
                        {items.length === 0 ? (
                          <span className="text-[11px] italic text-muted-foreground/60">—</span>
                        ) : (
                          items.map(({ task: t }) => {
                            const g = goalOf(t.goalId);
                            const sk = skillOf(g);
                            return (
                              <div
                                key={t.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, t.id)}
                                className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs shadow-sm"
                                style={{ borderLeft: `3px solid ${sk?.color ?? "#888"}` }}
                              >
                                <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} className="h-3.5 w-3.5" />
                                <span className={cn(t.done && "line-through opacity-60")}>{t.title}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
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
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const byGoal = new Map<string, Task[]>();
  for (const t of items) {
    const key = t.goalId ?? "__none__";
    if (!byGoal.has(key)) byGoal.set(key, []);
    byGoal.get(key)!.push(t);
  }
  return (
    <div>
      <p className={cn(
        "mb-2 text-xs font-semibold uppercase tracking-wider",
        tone === "danger" ? "text-destructive" : "text-muted-foreground",
      )}>{title}</p>
      <div className="space-y-3">
        {Array.from(byGoal.entries()).map(([key, ts]) => {
          const g = key === "__none__" ? undefined : goalOf(key);
          const sk = skillOf(g);
          return (
            <div key={key}>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sk?.color ?? "#888" }} />
                {g?.title ?? "No goal"}
              </div>
              <ul className="space-y-1">
                {ts.map((t) => (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, t.id)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm"
                  >
                    <Checkbox checked={t.done} onCheckedChange={() => onToggle(t.id)} />
                    <span className={cn("min-w-0 flex-1 truncate", t.done && "line-through opacity-60")}>{t.title}</span>
                    {t.priority === "high" && <Badge variant="destructive" className="text-[10px] shrink-0">!</Badge>}
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
