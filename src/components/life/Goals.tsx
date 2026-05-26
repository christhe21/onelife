import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  SKILLS,
  progressFor,
  skillMeta,
  useAppData,
  type GoalStatus,
  type SkillId,
  type Goal,
} from "@/lib/app-data";

const STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function NewGoalDialog() {
  const { addGoal } = useAppData();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    description: "",
    skill: "life" as SkillId,
    startDate: today,
    targetDate: today,
    status: "not_started" as GoalStatus,
    currentActivity: "",
  });

  const submit = () => {
    if (!form.title.trim()) return;
    addGoal(form);
    setOpen(false);
    setForm({ ...form, title: "", description: "", currentActivity: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> New goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Skill</Label>
              <Select
                value={form.skill}
                onValueChange={(v) => setForm({ ...form, skill: v as SkillId })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKILLS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as GoalStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Target date</Label>
              <Input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>What are you doing right now?</Label>
            <Textarea
              placeholder="e.g. Drafting outline this week"
              value={form.currentActivity}
              onChange={(e) => setForm({ ...form, currentActivity: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Timeline({ goal }: { goal: Goal }) {
  const start = new Date(goal.startDate).getTime();
  const end = new Date(goal.targetDate).getTime();
  const now = Date.now();
  const span = Math.max(end - start, 1);
  const nowPct = Math.min(100, Math.max(0, ((now - start) / span) * 100));

  return (
    <div className="mt-2">
      <div className="relative h-6 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/20"
          style={{ width: `${nowPct}%` }}
        />
        {goal.subGoals.map((s) => {
          if (!s.targetDate) return null;
          const t = new Date(s.targetDate).getTime();
          const pct = Math.min(100, Math.max(0, ((t - start) / span) * 100));
          return (
            <div
              key={s.id}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
              style={{
                left: `${pct}%`,
                backgroundColor: s.done ? "#10b981" : "#94a3b8",
              }}
              title={`${s.title} – ${s.targetDate}`}
            />
          );
        })}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground"
          style={{ left: `${nowPct}%` }}
          title="Today"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{goal.startDate}</span>
        <span>{goal.targetDate}</span>
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const {
    updateGoal,
    deleteGoal,
    addSubGoal,
    toggleSubGoal,
    deleteSubGoal,
    addTask,
  } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subDate, setSubDate] = useState("");
  const [quickTask, setQuickTask] = useState("");
  const meta = skillMeta(goal.skill);
  const pct = progressFor(goal);
  const subGoals = goal.subGoals ?? [];


  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {goal.title}
            </CardTitle>
            {goal.description && (
              <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => deleteGoal(goal.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{meta.label}</Badge>
          <Select
            value={goal.status}
            onValueChange={(v) => updateGoal(goal.id, { status: v as GoalStatus })}
          >
            <SelectTrigger className="h-7 w-auto text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{pct}% complete</span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={pct} />
        <Timeline goal={goal} />
        {expanded && (
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs">Current activity</Label>
              <Textarea
                value={goal.currentActivity ?? ""}
                onChange={(e) => updateGoal(goal.id, { currentActivity: e.target.value })}
                placeholder="What are you doing right now?"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs">Sub-goals / milestones</Label>
              <div className="mt-2 space-y-1">
                {subGoals.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-md border p-2">
                    <Checkbox
                      checked={s.done}
                      onCheckedChange={() => toggleSubGoal(goal.id, s.id)}
                    />
                    <span className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>
                      {s.title}
                    </span>
                    {s.targetDate && (
                      <span className="text-xs text-muted-foreground">{s.targetDate}</span>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => deleteSubGoal(goal.id, s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {subGoals.length === 0 && (
                  <p className="text-xs text-muted-foreground">No milestones yet.</p>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Milestone title"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                />
                <Input
                  type="date"
                  className="w-40"
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!subTitle.trim()) return;
                    addSubGoal(goal.id, subTitle, subDate || undefined);
                    setSubTitle("");
                    setSubDate("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Quick-add task linked to this goal</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Task title"
                  value={quickTask}
                  onChange={(e) => setQuickTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quickTask.trim()) {
                      addTask({ title: quickTask, priority: "medium", goalId: goal.id });
                      setQuickTask("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (!quickTask.trim()) return;
                    addTask({ title: quickTask, priority: "medium", goalId: goal.id });
                    setQuickTask("");
                  }}
                >
                  Add task
                </Button>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Goals() {
  const { goals } = useAppData();
  const [filter, setFilter] = useState<SkillId | "all">("all");
  const filtered = filter === "all" ? goals : goals.filter((g) => g.skill === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Filter:</Label>
          <Select value={filter} onValueChange={(v) => setFilter(v as SkillId | "all")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              {SKILLS.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NewGoalDialog />
      </div>
      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No goals yet. Create your first one.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  );
}
