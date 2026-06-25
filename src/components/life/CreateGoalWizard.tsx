import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronRight, ArrowLeft, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAppData, autoScheduleTasks, type Recurrence, type Task } from "@/lib/app-data";

type Priority = "low" | "medium" | "high";

interface DraftSubtask {
  key: string;
  title: string;
  description?: string;
  plannedHours?: number;
  priority?: Priority;
  recurrence: Recurrence;
  startDate?: string; // yyyy-mm-dd
  startTime?: string; // HH:MM
  durationHours?: number;
  autoPlace: boolean;
}

interface DraftTask {
  key: string;
  title: string;
  description?: string;
  priority: Priority;
  subGoalKey?: string;
  plannedHours?: number;
  recurrence: Recurrence;
  startDate?: string;
  startTime?: string;
  durationHours?: number;
  dueDate?: string;
  autoPlace: boolean;
  subtasks: DraftSubtask[];
  expanded: boolean;
}

interface DraftSubGoal {
  key: string;
  title: string;
  targetDate?: string;
  description?: string;
}

const RECURRENCE_PRESETS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function combine(date?: string, time?: string, durationHours?: number) {
  if (!date) return { startDate: undefined, endDate: undefined };
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "09:00";
  const start = new Date(`${date}T${t}:00`);
  const dur = Math.max(0.25, durationHours ?? 1);
  const end = new Date(start.getTime() + dur * 3_600_000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function CreateGoalWizard() {
  const navigate = useNavigate();
  const { skills, tasks: existingTasks, addGoal, updateGoal, addTask } = useAppData();

  // Goal fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState<string>(skills[0]?.id ?? "life");
  const [startDate, setStartDate] = useState(today());
  const [targetDate, setTargetDate] = useState(plusDays(today(), 30));
  const [plannedHours, setPlannedHours] = useState<number | undefined>(undefined);

  // Sub-goals
  const [subGoals, setSubGoals] = useState<DraftSubGoal[]>([
    { key: newKey(), title: "General" },
  ]);

  // Tasks
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);

  const addSub = () =>
    setSubGoals((s) => [...s, { key: newKey(), title: `Milestone ${s.length + 1}` }]);
  const updateSub = (key: string, patch: Partial<DraftSubGoal>) =>
    setSubGoals((s) => s.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const removeSub = (key: string) => {
    setSubGoals((s) => s.filter((x) => x.key !== key));
    setDraftTasks((ts) =>
      ts.map((t) => (t.subGoalKey === key ? { ...t, subGoalKey: undefined } : t)),
    );
  };

  const addTaskRow = () =>
    setDraftTasks((ts) => [
      ...ts,
      {
        key: newKey(),
        title: "",
        priority: "medium",
        recurrence: "none",
        subGoalKey: subGoals[0]?.key,
        autoPlace: false,
        subtasks: [],
        expanded: true,
      },
    ]);
  const updateTaskRow = (key: string, patch: Partial<DraftTask>) =>
    setDraftTasks((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const removeTaskRow = (key: string) =>
    setDraftTasks((ts) => ts.filter((t) => t.key !== key));

  const addSubtaskTo = (taskKey: string) =>
    updateTaskRow(taskKey, {
      subtasks: [
        ...(draftTasks.find((t) => t.key === taskKey)?.subtasks ?? []),
        {
          key: newKey(),
          title: "",
          recurrence: "none",
          autoPlace: false,
        },
      ],
    });
  const updateSubtaskOf = (taskKey: string, subKey: string, patch: Partial<DraftSubtask>) => {
    const t = draftTasks.find((x) => x.key === taskKey);
    if (!t) return;
    updateTaskRow(taskKey, {
      subtasks: t.subtasks.map((s) => (s.key === subKey ? { ...s, ...patch } : s)),
    });
  };
  const removeSubtaskOf = (taskKey: string, subKey: string) => {
    const t = draftTasks.find((x) => x.key === taskKey);
    if (!t) return;
    updateTaskRow(taskKey, { subtasks: t.subtasks.filter((s) => s.key !== subKey) });
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Goal needs a title");
      return;
    }
    if (!startDate || !targetDate || targetDate < startDate) {
      toast.error("Check the goal start/target dates");
      return;
    }

    // 1. Create the goal
    const goalId = addGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      skill,
      startDate,
      targetDate,
      status: "not_started",
      plannedHours,
    });

    // 2. Replace default subGoals with the authored ones (preserve real ids per draft)
    const subGoalIdByKey = new Map<string, string>();
    const realSubGoals = subGoals
      .filter((s) => s.title.trim())
      .map((s) => {
        const id = newKey();
        subGoalIdByKey.set(s.key, id);
        return {
          id,
          title: s.title.trim(),
          targetDate: s.targetDate,
          done: false,
        };
      });
    if (realSubGoals.length > 0) {
      updateGoal(goalId, { subGoals: realSubGoals });
    }

    // 3. Build tasks (compute schedule per draft, run auto-place where requested)
    const busy = existingTasks.flatMap((t) => [
      { startDate: t.startDate, endDate: t.endDate },
      ...t.subtasks.map((s) => ({ startDate: s.startDate, endDate: s.endDate })),
    ]);

    for (const dt of draftTasks) {
      if (!dt.title.trim()) continue;

      const hasSubs = dt.subtasks.length > 0;

      // Build raw subtasks first
      let subtasks = dt.subtasks
        .filter((s) => s.title.trim())
        .map((s) => {
          const { startDate: sStart, endDate: sEnd } = combine(
            s.startDate,
            s.startTime,
            s.durationHours ?? s.plannedHours,
          );
          return {
            id: newKey(),
            title: s.title.trim(),
            description: s.description,
            done: false,
            plannedHours: s.plannedHours,
            recurrence: s.recurrence,
            priority: s.priority,
            startDate: sStart,
            endDate: sEnd,
          };
        });

      // Task-level schedule (only used when no subtasks)
      let tStart: string | undefined;
      let tEnd: string | undefined;
      if (!hasSubs) {
        const c = combine(dt.startDate, dt.startTime, dt.durationHours ?? dt.plannedHours);
        tStart = c.startDate;
        tEnd = c.endDate;
      }

      // Auto-place tasks/subtasks that the user opted in for
      const taskShell: Task = {
        id: newKey(),
        title: dt.title.trim(),
        priority: dt.priority,
        done: false,
        subGoalId: dt.subGoalKey ? subGoalIdByKey.get(dt.subGoalKey) : undefined,
        goalId,
        subtasks,
        plannedHours: dt.plannedHours,
        recurrence: dt.recurrence,
        startDate: tStart,
        endDate: tEnd,
        dueDate: dt.dueDate,
      } as Task;

      let toSchedule: Task[] = [taskShell];
      const needsAuto =
        (!hasSubs && dt.autoPlace && !tStart) ||
        (hasSubs && dt.subtasks.some((s) => s.autoPlace && !s.startDate));

      if (needsAuto) {
        // Mask out already-scheduled subs to not re-place them
        const masked: Task = {
          ...taskShell,
          startDate: dt.autoPlace ? undefined : taskShell.startDate,
          endDate: dt.autoPlace ? undefined : taskShell.endDate,
          subtasks: taskShell.subtasks.map((s) => {
            const ds = dt.subtasks.find(
              (x) => x.title.trim() === s.title && x.key && s.title,
            );
            if (ds?.autoPlace && !ds.startDate) {
              return { ...s, startDate: undefined, endDate: undefined };
            }
            return s;
          }),
        };
        toSchedule = autoScheduleTasks([masked], startDate, targetDate, busy);
      }

      const finalTask = toSchedule[0];
      // Track new busy blocks for subsequent items
      if (finalTask.startDate && finalTask.endDate) {
        busy.push({ startDate: finalTask.startDate, endDate: finalTask.endDate });
      }
      finalTask.subtasks.forEach((s) => {
        if (s.startDate && s.endDate) busy.push({ startDate: s.startDate, endDate: s.endDate });
      });

      addTask({
        title: finalTask.title,
        priority: finalTask.priority,
        subGoalId: finalTask.subGoalId,
        goalId: finalTask.goalId,
        plannedHours: finalTask.plannedHours,
        recurrence: finalTask.recurrence,
        startDate: finalTask.startDate,
        endDate: finalTask.endDate,
        dueDate: finalTask.dueDate,
        subtasks: finalTask.subtasks,
      });
    }

    toast.success("Goal created");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-32">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Create a Goal</h1>
          <p className="text-sm text-muted-foreground">
            Define the goal, milestones, tasks, and how they should be scheduled.
          </p>
        </div>
      </div>

      {/* Section: Goal */}
      <Card>
        <CardHeader>
          <CardTitle>Goal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run a half marathon" />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal? What does success look like?"
              rows={3}
            />
          </div>
          <div>
            <Label>Skill</Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {skills.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Planned hours (optional)</Label>
            <Input
              type="number"
              min={0}
              value={plannedHours ?? ""}
              onChange={(e) =>
                setPlannedHours(e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Target date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Section: Sub-goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Milestones / Sub-goals</CardTitle>
          <Button size="sm" variant="outline" onClick={addSub} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {subGoals.length === 0 && (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          )}
          {subGoals.map((s) => (
            <div key={s.key} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_180px_auto]">
              <Input
                value={s.title}
                onChange={(e) => updateSub(s.key, { title: e.target.value })}
                placeholder="Milestone title"
              />
              <Input
                type="date"
                value={s.targetDate ?? ""}
                onChange={(e) => updateSub(s.key, { targetDate: e.target.value || undefined })}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSub(s.key)}
                aria-label="Remove milestone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section: Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Tasks</CardTitle>
          <Button size="sm" variant="outline" onClick={addTaskRow} className="gap-1">
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draftTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
          {draftTasks.map((t) => (
            <div key={t.key} className="rounded-lg border bg-card/50">
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => updateTaskRow(t.key, { expanded: !t.expanded })}
                  aria-label="Toggle task details"
                  className="text-muted-foreground"
                >
                  {t.expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Input
                  value={t.title}
                  onChange={(e) => updateTaskRow(t.key, { title: e.target.value })}
                  placeholder="Task title"
                  className="flex-1"
                />
                {t.subtasks.length > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    {t.subtasks.length} sub
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTaskRow(t.key)}
                  aria-label="Remove task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {t.expanded && (
                <div className="space-y-4 border-t p-3">
                  <Textarea
                    value={t.description ?? ""}
                    onChange={(e) => updateTaskRow(t.key, { description: e.target.value })}
                    placeholder="Notes (optional)"
                    rows={2}
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label>Milestone</Label>
                      <Select
                        value={t.subGoalKey ?? "__none"}
                        onValueChange={(v) =>
                          updateTaskRow(t.key, {
                            subGoalKey: v === "__none" ? undefined : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">— None —</SelectItem>
                          {subGoals.map((s) => (
                            <SelectItem key={s.key} value={s.key}>
                              {s.title || "Untitled"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={t.priority}
                        onValueChange={(v) => updateTaskRow(t.key, { priority: v as Priority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Planned hours</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.25"
                        value={t.plannedHours ?? ""}
                        onChange={(e) =>
                          updateTaskRow(t.key, {
                            plannedHours: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  {t.subtasks.length === 0 && (
                    <SchedulePresetPicker
                      label="Schedule"
                      recurrence={t.recurrence}
                      startDate={t.startDate}
                      startTime={t.startTime}
                      durationHours={t.durationHours ?? t.plannedHours}
                      dueDate={t.dueDate}
                      autoPlace={t.autoPlace}
                      onChange={(patch) => updateTaskRow(t.key, patch)}
                    />
                  )}

                  <div className="space-y-2 rounded-md border border-dashed p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Subtasks</span>
                      <Button size="sm" variant="ghost" onClick={() => addSubtaskTo(t.key)} className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add subtask
                      </Button>
                    </div>
                    {t.subtasks.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        If a task has subtasks, only subtasks are scheduled. The task auto-completes when all subtasks are done.
                      </p>
                    )}
                    {t.subtasks.map((s) => (
                      <div key={s.key} className="space-y-2 rounded border bg-background p-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={s.title}
                            onChange={(e) => updateSubtaskOf(t.key, s.key, { title: e.target.value })}
                            placeholder="Subtask title"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min={0}
                            step="0.25"
                            placeholder="hrs"
                            value={s.plannedHours ?? ""}
                            onChange={(e) =>
                              updateSubtaskOf(t.key, s.key, {
                                plannedHours: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubtaskOf(t.key, s.key)}
                            aria-label="Remove subtask"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <SchedulePresetPicker
                          label="Schedule subtask"
                          recurrence={s.recurrence}
                          startDate={s.startDate}
                          startTime={s.startTime}
                          durationHours={s.durationHours ?? s.plannedHours}
                          autoPlace={s.autoPlace}
                          onChange={(patch) => updateSubtaskOf(t.key, s.key, patch)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate({ to: "/" })}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Goal
          </Button>
        </div>
      </div>
    </div>
  );
}

function SchedulePresetPicker({
  label,
  recurrence,
  startDate,
  startTime,
  durationHours,
  dueDate,
  autoPlace,
  onChange,
}: {
  label: string;
  recurrence: Recurrence;
  startDate?: string;
  startTime?: string;
  durationHours?: number;
  dueDate?: string;
  autoPlace: boolean;
  onChange: (patch: {
    recurrence?: Recurrence;
    startDate?: string;
    startTime?: string;
    durationHours?: number;
    dueDate?: string;
    autoPlace?: boolean;
  }) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">Repeats</Label>
          <Select value={recurrence} onValueChange={(v) => onChange({ recurrence: v as Recurrence })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Start date</Label>
          <Input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => onChange({ startDate: e.target.value || undefined })}
            disabled={autoPlace}
          />
        </div>
        <div>
          <Label className="text-xs">Start time</Label>
          <Input
            type="time"
            value={startTime ?? ""}
            onChange={(e) => onChange({ startTime: e.target.value || undefined })}
            disabled={autoPlace}
          />
        </div>
        <div>
          <Label className="text-xs">Duration (hrs)</Label>
          <Input
            type="number"
            min={0}
            step="0.25"
            value={durationHours ?? ""}
            onChange={(e) =>
              onChange({ durationHours: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        {dueDate !== undefined && (
          <div>
            <Label className="text-xs">Due date</Label>
            <Input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => onChange({ dueDate: e.target.value || undefined })}
            />
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={autoPlace}
          onCheckedChange={(v) => onChange({ autoPlace: !!v })}
        />
        Auto-place in next free slot (9 AM–9 PM, no overlap)
      </label>
    </div>
  );
}
