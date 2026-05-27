import { useState } from "react";
import {
  Plus, Trash2, Pencil, MoreHorizontal, Download, Calendar, Flag, Link2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
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
    goalId: task.goalId ?? "none",
    progress: task.progress ?? 0,
    evidence: task.evidence ?? "",
  });

  const save = () => {
    if (!form.title.trim()) return;
    updateTask(task.id, {
      title: form.title,
      dueDate: form.dueDate || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      priority: form.priority,
      goalId: form.goalId === "none" ? undefined : form.goalId,
      progress: form.progress || undefined,
      evidence: form.evidence || undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Started</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label>Completed</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Linked goal</Label>
            <Select value={form.goalId} onValueChange={(v) => setForm({ ...form, goalId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Progress ({form.progress}%)</Label>
            <Input
              type="range" min={0} max={100}
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
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubtasksPanel({ task }: { task: Task }) {
  const { addSubtask, updateSubtask, toggleSubtask, deleteSubtask } = useAppData();
  const [title, setTitle] = useState("");
  const [schedFor, setSchedFor] = useState<Set<string>>(new Set());

  const toggleSched = (id: string) => {
    const n = new Set(schedFor);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSchedFor(n);
  };

  const add = () => {
    if (!title.trim()) return;
    addSubtask(task.id, { title: title.trim() });
    setTitle("");
  };

  return (
    <div className="border-t bg-muted/30 px-3 py-2.5">
      <div className="space-y-1">
        {task.subtasks.length === 0 && (
          <p className="text-xs italic text-muted-foreground">No sub-tasks yet.</p>
        )}
        {task.subtasks.map((s) => {
          const open = schedFor.has(s.id) || s.hoursPerWeek != null || s.endDate != null;
          return (
            <div key={s.id} className="rounded border bg-background px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(task.id, s.id)} />
                <Input
                  value={s.title}
                  onChange={(e) => updateSubtask(task.id, s.id, { title: e.target.value })}
                  className={`h-7 flex-1 border-0 px-1 text-sm focus-visible:ring-1 ${s.done ? "line-through text-muted-foreground" : ""}`}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => toggleSched(s.id)}
                  title="Schedule"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteSubtask(task.id, s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {open && (
                <div className="mt-1.5 flex items-center gap-2 pl-7">
                  <Input
                    type="number" step="0.5" min="0" placeholder="h/wk"
                    value={s.hoursPerWeek ?? ""}
                    onChange={(e) =>
                      updateSubtask(task.id, s.id, {
                        hoursPerWeek: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="h-7 w-20 text-xs"
                  />
                  <Input
                    type="date"
                    value={s.endDate ?? ""}
                    onChange={(e) => updateSubtask(task.id, s.id, { endDate: e.target.value || undefined })}
                    className="h-7 flex-1 text-xs"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          placeholder="Add sub-task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="h-8 flex-1 text-sm"
        />
        <Button size="sm" onClick={add}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function AddTaskBar() {
  const { addTask, goals } = useAppData();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [goalId, setGoalId] = useState<string>("none");

  const submit = () => {
    if (!title.trim()) return;
    addTask({
      title,
      dueDate: dueDate || undefined,
      priority,
      goalId: goalId === "none" ? undefined : goalId,
    });
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setGoalId("none");
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
            <ChevronDown className="mr-1 h-3.5 w-3.5" />Details
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-2">
          <div>
            <Label className="text-xs">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Goal</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
      <Button size="sm" onClick={submit} className="h-9 shrink-0">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { tasks: _t, goals, toggleTask, deleteTask } = useAppData();
  void _t;
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = !task.done && task.dueDate && task.dueDate < today;
  const goal = goals.find((g) => g.id === task.goalId);
  const subDone = task.subtasks.filter((s) => s.done).length;
  const hasProgress = !task.done && (task.progress ?? 0) > 0 && (task.progress ?? 0) < 100;

  return (
    <Card className={`overflow-hidden border-l-4 ${PRIORITY_BORDER[task.priority]}`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <Checkbox
            checked={task.done}
            onCheckedChange={() => toggleTask(task.id)}
            className="mt-0.5"
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="min-w-0 flex-1 text-left"
          >
            <div className={`truncate text-sm font-medium ${task.done ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              {task.dueDate && (
                <span className={overdue ? "font-medium text-red-600" : ""}>
                  <Calendar className="mr-0.5 inline h-3 w-3" />
                  {task.dueDate}{overdue ? " · overdue" : ""}
                </span>
              )}
              {goal && (
                <span className="truncate">
                  <Link2 className="mr-0.5 inline h-3 w-3" />{goal.title}
                </span>
              )}
              {task.subtasks.length > 0 && (
                <span>{subDone}/{task.subtasks.length} sub</span>
              )}
              {hasProgress && <span>{task.progress}%</span>}
            </div>
            {hasProgress && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="-mr-1 h-7 w-7 shrink-0">
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
    </Card>
  );
}

export function Tasks() {
  const { tasks, goals } = useAppData();

  const sorted = [...tasks].sort((a, b) => {
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          20-min focus blocks. Sub-tasks with h/wk auto-schedule until end date.
        </p>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={exportSchedule}>
          <Download className="mr-1 h-3.5 w-3.5" />.ics
        </Button>
      </div>

      <AddTaskBar />

      {sorted.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          No tasks yet.
        </CardContent></Card>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
