import { useState } from "react";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, CalendarDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useAppData, type Task } from "@/lib/app-data";
import { downloadICS } from "@/lib/calendar-export";

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  low: "bg-slate-200 text-slate-700",
  medium: "bg-amber-200 text-amber-800",
  high: "bg-red-200 text-red-800",
};

function EditTaskDialog({ task }: { task: Task }) {
  const { updateTask, goals } = useAppData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    dueDate: task.dueDate ?? "",
    priority: task.priority,
    goalId: task.goalId ?? "none",
  });

  const save = () => {
    if (!form.title.trim()) return;
    updateTask(task.id, {
      title: form.title,
      dueDate: form.dueDate || undefined,
      priority: form.priority,
      goalId: form.goalId === "none" ? undefined : form.goalId,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Edit task">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
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
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubtasksPanel({ task }: { task: Task }) {
  const { addSubtask, updateSubtask, toggleSubtask, deleteSubtask } = useAppData();
  const [title, setTitle] = useState("");
  const [hpw, setHpw] = useState<string>("");
  const [endDate, setEndDate] = useState("");

  const add = () => {
    if (!title.trim()) return;
    addSubtask(task.id, {
      title: title.trim(),
      hoursPerWeek: hpw ? Math.max(0.1, Number(hpw)) : undefined,
      endDate: endDate || undefined,
    });
    setTitle("");
    setHpw("");
    setEndDate("");
  };

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sub-tasks</Label>
      <div className="mt-2 space-y-1">
        {task.subtasks.length === 0 && (
          <p className="text-xs italic text-muted-foreground">No sub-tasks yet.</p>
        )}
        {task.subtasks.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2 rounded border bg-background p-2">
            <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(task.id, s.id)} />
            <Input
              value={s.title}
              onChange={(e) => updateSubtask(task.id, s.id, { title: e.target.value })}
              className={`h-7 min-w-[140px] flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="h/wk"
                value={s.hoursPerWeek ?? ""}
                onChange={(e) =>
                  updateSubtask(task.id, s.id, {
                    hoursPerWeek: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="h-7 w-16 text-xs"
                title="Hours per week"
              />
              <Input
                type="date"
                value={s.endDate ?? ""}
                onChange={(e) => updateSubtask(task.id, s.id, { endDate: e.target.value || undefined })}
                className="h-7 w-36 text-xs"
                title="End date"
              />
            </div>
            <Button size="icon" variant="ghost" onClick={() => deleteSubtask(task.id, s.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Input
          placeholder="New sub-task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="h-8 min-w-[160px] flex-1 text-sm"
        />
        <Input
          type="number"
          step="0.5"
          min="0"
          placeholder="h/wk"
          value={hpw}
          onChange={(e) => setHpw(e.target.value)}
          className="h-8 w-20 text-sm"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-8 w-40 text-sm"
        />
        <Button size="sm" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
      </div>
    </div>
  );
}

export function Tasks() {
  const { tasks, goals, addTask, toggleTask, deleteTask } = useAppData();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [goalId, setGoalId] = useState<string>("none");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });

  const today = new Date().toISOString().slice(0, 10);

  const exportSchedule = () => {
    const map: Record<string, string> = {};
    for (const g of goals) map[g.id] = g.title;
    downloadICS(tasks, map);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Focus blocks are 20 min. Sub-tasks with hours/week schedule themselves until their end date.
        </p>
        <Button size="sm" variant="outline" onClick={exportSchedule} title="Download .ics for Google / Apple / Outlook">
          <Download className="mr-2 h-4 w-4" />
          Export schedule (.ics)
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-2 pt-6">
          <Input
            placeholder="New task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="min-w-[200px] flex-1"
          />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
          <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Goal (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No goal</SelectItem>
              {goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={submit}><Plus className="mr-2 h-4 w-4" />Add</Button>
        </CardContent>
      </Card>

      {sorted.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No tasks yet.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => {
            const overdue = !t.done && t.dueDate && t.dueDate < today;
            const goal = goals.find((g) => g.id === t.goalId);
            const isOpen = expanded.has(t.id);
            const toggleOpen = () => {
              const n = new Set(expanded);
              if (n.has(t.id)) n.delete(t.id); else n.add(t.id);
              setExpanded(n);
            };
            return (
              <Card key={t.id} className={overdue ? "border-red-300" : ""}>
                <CardContent className="flex items-center gap-3 py-3">
                  <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {t.dueDate && (
                        <span className={overdue ? "text-red-600 font-medium" : ""}>
                          Due {t.dueDate}{overdue ? " (overdue)" : ""}
                        </span>
                      )}
                      {goal && <Badge variant="outline">{goal.title}</Badge>}
                      {t.subtasks.length > 0 && (
                        <span>{t.subtasks.filter((s) => s.done).length}/{t.subtasks.length} sub-tasks</span>
                      )}
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_COLOR[t.priority]}`}>
                    {t.priority}
                  </span>
                  <Button size="icon" variant="ghost" onClick={toggleOpen} title="Sub-tasks">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <EditTaskDialog task={t} />
                  <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
                {isOpen && <SubtasksPanel task={t} />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
