import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  MoreHorizontal,
  Download,
  Calendar,
  Flag,
  Link2,
  ChevronDown,
  Repeat,
  Search,
} from "lucide-react";
import { NewTaskWizard } from "./NewTaskWizard";
import { SubtaskFormDialog } from "./SubtaskFormDialog";
import { AddToScheduleDialog } from "./AddToScheduleDialog";
import { DatePicker } from "@/components/ui/pickers/DatePicker";
import { useFrierenVocabulary } from "@/lib/frieren";
import type { Recurrence } from "@/lib/app-data";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { resolveRule, ruleToLegacy, type RecurrenceRule } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppData, type Task } from "@/lib/app-data";
import { downloadICS } from "@/lib/calendar-export";

const PRIORITY_BORDER: Record<Task["priority"], string> = {
  low: "border-l-slate-300",
  medium: "border-l-amber-400",
  high: "border-l-red-500",
};

function EditTaskDialog({ task, children }: { task: Task; children: React.ReactNode }) {
  const { updateTask, goals } = useAppData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    dueDate: task.dueDate ?? "",
    startDate: task.startDate ?? "",
    endDate: task.endDate ?? "",
    priority: task.priority,
    subGoalId: task.subGoalId ?? "none",
    progress: task.progress ?? 0,
    evidence: task.evidence ?? "",
    recurrence: task.recurrence ?? "none",
  });
  const [rule, setRule] = useState<RecurrenceRule | null>(() => resolveRule(task));

  const save = () => {
    if (!form.title.trim()) return;
    if (!form.dueDate) return;
    updateTask(task.id, {
      title: form.title,
      dueDate: form.dueDate || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      priority: form.priority,
      subGoalId: form.subGoalId === "none" ? undefined : form.subGoalId,
      progress: form.progress || undefined,
      evidence: form.evidence || undefined,
      recurrence: ruleToLegacy(rule) as Recurrence,
      recurrenceRule: rule ?? undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                Due <span className="text-red-500">*</span>
              </Label>
              <DatePicker value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}
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
              <Label>Started</Label>
              <DatePicker
                value={form.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })}
              />
            </div>
            <div>
              <Label>Completed</Label>
              <DatePicker value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
            </div>
          </div>
          <div>
            <Label>Linked milestone</Label>
            <Select
              value={form.subGoalId}
              onValueChange={(v) => setForm({ ...form, subGoalId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General / Daily</SelectItem>
                {goals.map((g) => {
                  return g.subGoals.map((sg) => (
                    <SelectItem key={sg.id} value={sg.id}>
                      {g.title} - {sg.title}
                    </SelectItem>
                  ));
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Repeats</Label>
            <RecurrenceEditor value={rule} onChange={setRule} referenceDate={form.dueDate} />
          </div>
          <div>
            <Label>Progress ({form.progress}%)</Label>
            <Input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Evidence / what's been done</Label>
            <Textarea
              rows={2}
              value={form.evidence}
              placeholder="Notes, links, artifacts so far"
              onChange={(e) => setForm({ ...form, evidence: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={!form.title.trim() || !form.dueDate}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubtasksPanel({ task }: { task: Task }) {
  const { addSubtask, toggleSubtask, deleteSubtask, goals } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [schedFor, setSchedFor] = useState<{ taskId: string; subId: string } | null>(null);

  const isDaily = !!resolveRule(task);
  const parentGoal =
    goals.find((g) => g.subGoals.some((sg) => sg.id === task.subGoalId)) ??
    goals.find((g) => g.id === task.goalId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const minDate =
    parentGoal?.startDate && parentGoal.startDate > todayStr ? parentGoal.startDate : todayStr;
  const maxDate = parentGoal?.targetDate;

  return (
    <div className="border-t bg-muted/30 px-3 py-2.5">
      <div className="space-y-1.5">
        {task.subtasks.length === 0 && (
          <p className="text-xs italic text-muted-foreground">No sub-tasks yet.</p>
        )}
        {task.subtasks.map((s) => (
          <div key={s.id} className="rounded border bg-background px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(task.id, s.id)} />
              {s.recurrence && s.recurrence !== "none" && (
                <Repeat className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}
                >
                  {s.title}
                </div>
                {(s.endDate || s.priority) && (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                    {s.endDate && (
                      <span className="inline-flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        {s.endDate}
                      </span>
                    )}
                    {s.priority && <span className="capitalize">{s.priority}</span>}
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setSchedFor({ taskId: task.id, subId: s.id })}
                title="Schedule on calendar"
              >
                <Calendar className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={`Delete sub-task ${s.title}`}
                onClick={() => deleteSubtask(task.id, s.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {isDaily ? (
        <p className="mt-2 text-[11px] italic text-muted-foreground">
          Daily tasks can&apos;t have sub-tasks.
        </p>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add subtask
        </Button>
      )}
      <SubtaskFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        minDate={minDate}
        maxDate={maxDate}
        onSubmit={(d) => {
          const scheduled = d.scheduledStart && d.scheduledEnd;
          addSubtask(task.id, {
            title: d.title,
            endDate: scheduled ? d.scheduledEnd! : d.endDate,
            startDate: scheduled ? d.scheduledStart! : undefined,
            priority: d.priority,
            description: d.description,
            recurrence: ruleToLegacy(d.recurrenceRule ?? null) as Recurrence,
            recurrenceRule: d.recurrenceRule,
          });
        }}
      />
      <AddToScheduleDialog
        open={!!schedFor}
        onOpenChange={(o) => !o && setSchedFor(null)}
        preselect={schedFor ?? undefined}
      />
    </div>
  );
}

function AddTaskBar() {
  const { addTask, goals } = useAppData();
  const firstMilestone = goals.flatMap((g) => g.subGoals)[0]?.id;
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [subGoalId, setSubGoalId] = useState<string>(firstMilestone ?? "");

  const submit = () => {
    if (!title.trim()) return;
    if (!subGoalId) return;
    addTask({
      title,
      dueDate: dueDate || undefined,
      priority,
      subGoalId,
    });
    setTitle("");
    setDueDate("");
    setPriority("medium");
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Add a task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="h-9 flex-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="h-9 shrink-0">
            <ChevronDown className="mr-1 h-3.5 w-3.5" />
            Details
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-2">
          <div>
            <Label className="text-xs">Due date</Label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
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
            <Label className="text-xs">Milestone</Label>
            <Select value={subGoalId} onValueChange={setSubGoalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a milestone" />
              </SelectTrigger>
              <SelectContent>
                {goals.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Create a goal first
                  </div>
                )}
                {goals.map((g) =>
                  g.subGoals.map((sg) => (
                    <SelectItem key={sg.id} value={sg.id}>
                      {g.title} — {sg.title}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
      <Button size="sm" onClick={submit} disabled={!subGoalId} className="h-9 shrink-0">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { tasks: _t, goals, toggleTask, deleteTask } = useAppData();
  void _t;
  const [open, setOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const canSchedule = task.subtasks.length === 0;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = !task.done && task.dueDate && task.dueDate < today;
  const goal =
    goals.find((g) => g.subGoals.some((sg) => sg.id === task.subGoalId)) ??
    goals.find((g) => g.id === task.goalId);
  const subDone = task.subtasks.filter((s) => s.done).length;
  const hasProgress = !task.done && (task.progress ?? 0) > 0 && (task.progress ?? 0) < 100;

  return (
    <Card className={`overflow-hidden border-l-[3px] ${PRIORITY_BORDER[task.priority]}`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Checkbox
            checked={task.done}
            onCheckedChange={() => toggleTask(task.id)}
            className="mt-1 shrink-0"
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="min-w-0 flex-1 text-left"
          >
            <div
              className={`truncate text-sm font-medium leading-snug flex items-center gap-1.5 ${task.done ? "line-through text-muted-foreground" : ""}`}
            >
              {task.recurrence && task.recurrence !== "none" && (
                <Repeat className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              {task.title}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 ${overdue ? "font-medium text-red-600" : ""}`}
                >
                  <Calendar className="h-3 w-3" />
                  {task.dueDate}
                  {overdue ? " · overdue" : ""}
                </span>
              )}
              {goal && (
                <span className="inline-flex items-center gap-1 truncate">
                  <Link2 className="h-3 w-3" />
                  {goal.title}
                </span>
              )}
              {task.subtasks.length > 0 && (
                <span>
                  {subDone}/{task.subtasks.length} sub
                </span>
              )}
              {hasProgress && <span>{task.progress}%</span>}
            </div>
            {hasProgress && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
          </button>
          {canSchedule && (
            <Button
              size="icon"
              variant="ghost"
              className="mt-0.5 h-8 w-8 shrink-0"
              title="Schedule on calendar"
              onClick={() => setSchedOpen(true)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`More actions for ${task.title}`}
                className="-mr-1 mt-0.5 h-8 w-8 shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              <EditTaskDialog task={task}>
                <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </EditTaskDialog>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                onClick={() => setOpen(true)}
              >
                <Flag className="h-3.5 w-3.5" /> Sub-tasks
              </button>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </PopoverContent>
          </Popover>
        </div>
        {open && <SubtasksPanel task={task} />}
      </CardContent>
      {canSchedule && (
        <AddToScheduleDialog
          open={schedOpen}
          onOpenChange={setSchedOpen}
          preselect={{ taskId: task.id }}
        />
      )}
    </Card>
  );
}

export function Tasks() {
  const { tasks, goals } = useAppData();
  const vocab = useFrierenVocabulary();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = t.title.toLowerCase().includes(q);
    const subMatch = t.subtasks.some((s) => s.title.toLowerCase().includes(q));
    const evidenceMatch = (t.evidence ?? "").toLowerCase().includes(q);

    // Check if the goal matches the search query
    const g = goals.find(
      (g) => g.subGoals?.some((sg) => sg.id === t.subGoalId) || g.id === t.goalId,
    );
    const goalMatch = g && g.title.toLowerCase().includes(q);

    return titleMatch || subMatch || evidenceMatch || goalMatch;
  });

  const sorted = [...filteredTasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });

  const exportSchedule = () => {
    const map: Record<string, string> = {};
    for (const g of goals) map[g.id] = g.title;
    downloadICS(tasks, map);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground max-w-[50%]">
          20-min focus blocks. Sub-{vocab.tasks.toLowerCase()} with h/wk auto-schedule until end
          date.
        </p>
        <div className="flex items-center gap-2 max-w-[50%] flex-1 justify-end">
          <div className="relative flex-1 min-w-[120px] max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${vocab.tasks.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs shrink-0"
            onClick={exportSchedule}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            .ics
          </Button>
        </div>
      </div>

      <Button className="w-full" onClick={() => setWizardOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Create {vocab.task.toLowerCase()}
      </Button>
      <NewTaskWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {vocab.isFrieren
              ? "The road was interrupted. It matters only that you return to it."
              : `No ${vocab.tasks.toLowerCase()} yet.`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
