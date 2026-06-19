import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, Store } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SkillProgress } from "@/components/life/SkillProgress";
import { NewGoalButton } from "@/components/life/NewGoalButton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { progressFor, useAppData, type GoalStatus, type SkillId, type Goal } from "@/lib/app-data";
import { useFrierenVocabulary } from "@/lib/frieren";


const STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

interface GoalDialogProps {
  goal?: Goal;
  trigger: React.ReactNode;
}

function GoalDialog({ goal, trigger }: GoalDialogProps) {
  const { addGoal, updateGoal, skills } = useAppData();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!goal;

  const [form, setForm] = useState({
    title: goal?.title ?? "",
    description: goal?.description ?? "",
    skill: (goal?.skill ?? "life") as SkillId,
    startDate: goal?.startDate ?? today,
    targetDate: goal?.targetDate ?? today,
    status: (goal?.status ?? "not_started") as GoalStatus,
    currentActivity: goal?.currentActivity ?? "",
    manualProgress: goal?.manualProgress ?? 0,
  });

  const submit = () => {
    if (!form.title.trim()) return;
    if (isEdit) {
      updateGoal(goal!.id, form);
    } else {
      addGoal(form);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "Create a goal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
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
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as GoalStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
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
          <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
            Progress is auto-calculated from linked tasks (or milestones if no tasks). No manual
            input needed.
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>{isEdit ? "Save changes" : "Create"}</Button>
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
  const daysLeft = Math.ceil((end - now) / 86400000);
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));
  const overdue = daysLeft < 0;
  const dueSoon = daysLeft >= 0 && daysLeft <= 7;

  // Status drives the primary fill color
  const trackColor =
    goal.status === "not_started"
      ? "linear-gradient(90deg, oklch(0.78 0.01 250), oklch(0.85 0.01 250))"
      : goal.status === "completed"
        ? "linear-gradient(90deg, oklch(0.6 0.14 150), oklch(0.72 0.14 150))"
        : "linear-gradient(90deg, oklch(0.7 0.18 150), oklch(0.82 0.16 150))";
  const showGlow = goal.status !== "not_started";

  const [openSubId, setOpenSubId] = useState<string | null>(null);
  // auto-dismiss after 3.5s
  useEffect(() => {
    if (!openSubId) return;
    const id = setTimeout(() => setOpenSubId(null), 3500);
    return () => clearTimeout(id);
  }, [openSubId]);
  // outside click dismiss
  const trackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!openSubId) return;
    const onDown = (e: MouseEvent) => {
      if (trackRef.current && !trackRef.current.contains(e.target as Node)) setOpenSubId(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openSubId]);

  const fillPct = goal.status === "completed" ? 100 : nowPct;

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Timeline</span>
        <span
          className={
            overdue && goal.status !== "completed"
              ? "rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive"
              : dueSoon && goal.status !== "completed"
                ? "rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400"
                : "rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground"
          }
        >
          {goal.status === "completed"
            ? "Completed"
            : overdue
              ? `${Math.abs(daysLeft)}d overdue`
              : daysLeft === 0
                ? "Due today"
                : `${daysLeft}d left · ${Math.round(nowPct)}% elapsed`}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-4 overflow-visible rounded-full bg-muted/60 ring-1 ring-inset ring-border/50"
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${fillPct}%`,
            background: trackColor,
            boxShadow: showGlow ? "0 0 10px -2px currentColor" : "none",
          }}
        />

        {/* milestone dots */}
        {(goal.subGoals ?? []).map((s) => {
          if (!s.targetDate) return null;
          const t = new Date(s.targetDate).getTime();
          const pct = Math.min(100, Math.max(0, ((t - start) / span) * 100));
          const isOpen = openSubId === s.id;
          return (
            <div
              key={s.id}
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pct}%` }}
            >
              <Popover
                open={isOpen}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenSubId(s.id);
                  } else {
                    if (openSubId === s.id) setOpenSubId(null);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSubId((cur) => (cur === s.id ? null : s.id));
                    }}
                    className="block h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm transition-transform hover:scale-125"
                    style={{
                      backgroundColor: s.done ? "oklch(0.65 0.15 160)" : "oklch(0.75 0.02 250)",
                    }}
                    aria-label={`${s.title} – ${s.targetDate}`}
                  />
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="center"
                  sideOffset={4}
                  className="w-44 px-2.5 py-1.5 text-[11px] shadow-md pointer-events-none"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="font-medium leading-tight">{s.title}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {s.targetDate} · {s.done ? "Done" : "Open"}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          );
        })}

        {/* today marker */}
        <div
          className="absolute -top-1 z-20 flex h-6 -translate-x-1/2 flex-col items-center"
          style={{ left: `${nowPct}%` }}
          title="Today"
        >
          <div className="h-6 w-0.5 rounded-full bg-foreground" />
          <div className="absolute -top-1 h-2 w-2 rounded-full bg-foreground ring-2 ring-background" />
        </div>
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-foreground/70">
        <span>{goal.startDate}</span>
        <span className="tabular-nums text-muted-foreground">{totalDays}d span</span>
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
    skills,
    tasks,
  } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subDate, setSubDate] = useState("");
  const meta = skills.find((s) => s.id === goal.skill) ??
    skills[0] ?? { label: goal.skill, color: "#10b981" };
  const pct = progressFor(goal, tasks);
  const subGoals = goal.subGoals ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            <CardTitle className="min-w-0 truncate text-sm font-semibold sm:text-base">
              {goal.title}
            </CardTitle>
          </button>
          <div className="flex shrink-0 items-center gap-0.5">
            <GoalDialog
              goal={goal}
              trigger={
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit goal">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete goal">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove &quot;{goal.title}&quot; along with its milestones,
                    tasks and scheduled blocks. This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteGoal(goal.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete goal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {meta.label}
          </Badge>
          <Select
            value={goal.status}
            onValueChange={(v) => updateGoal(goal.id, { status: v as GoalStatus })}
          >
            <SelectTrigger className="h-6 w-auto min-w-0 px-2 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {subGoals.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {subGoals.filter((s) => s.done).length}/{subGoals.length} milestones
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
        <Timeline goal={goal} />
        {expanded && (
          <div className="mt-4 space-y-4">
            {goal.description && (
              <div>
                <Label className="text-xs">Description</Label>
                <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
              </div>
            )}
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
                    <span
                      className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {s.title}
                    </span>
                    {s.targetDate && (
                      <span className="text-xs text-muted-foreground">{s.targetDate}</span>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" title="Delete milestone">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this milestone?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{s.title}&quot; will be removed from this goal. This can&apos;t be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSubGoal(goal.id, s.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete milestone
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                  min={goal.startDate}
                  max={goal.targetDate}
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={
                    !subTitle.trim() ||
                    (!!subDate && (subDate > goal.targetDate || subDate < goal.startDate))
                  }
                  onClick={() => {
                    if (!subTitle.trim()) return;
                    if (subDate && (subDate > goal.targetDate || subDate < goal.startDate)) return;
                    addSubGoal(goal.id, subTitle, subDate || undefined);
                    setSubTitle("");
                    setSubDate("");
                  }}
                >
                  Add
                </Button>
              </div>
              {subDate && (subDate > goal.targetDate || subDate < goal.startDate) && (
                <p className="mt-1 text-[11px] text-destructive">
                  Date must be between {goal.startDate} and {goal.targetDate}.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Goals({ onGoMarketplace }: { onGoMarketplace?: () => void }) {
  const { goals, skills } = useAppData();
  const vocab = useFrierenVocabulary();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SkillId | "all">("all");
  const filtered = filter === "all" ? goals : goals.filter((g) => g.skill === filter);


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Filter:</Label>
          <Select value={filter} onValueChange={(v) => setFilter(v as SkillId | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {vocab.skills.toLowerCase()}</SelectItem>
              {skills.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onGoMarketplace) onGoMarketplace();
              else navigate({ to: "/" });
            }}
          >
            <Store className="h-4 w-4 mr-2" />
            Marketplace
          </Button>
          <NewGoalButton label={`New ${vocab.goal.toLowerCase()}`} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {vocab.isFrieren
              ? `Even the longest journey begins with a single step northward.`
              : `No ${vocab.goals.toLowerCase()} yet. Create your first one.`}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}
