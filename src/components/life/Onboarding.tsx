import { useEffect, useMemo, useState } from "react";
import { APP_NAME } from "@/lib/site";
import { BrandMark } from "@/components/marketing/BrandMark";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  X,
  Target,
  Flag,
  ListChecks,
  Compass,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData, DEFAULT_SKILLS } from "@/lib/app-data";
import { TEMPLATES, CATEGORIES, type Category, type GoalTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/pickers/DatePicker";
import { AiInterview } from "@/components/life/ai/AiInterview";


const STEPS = ["welcome", "areas", "start", "shape", "done"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  welcome: "Welcome",
  areas: "Life areas",
  start: "Starting point",
  shape: "Your goal",
  done: "Done",
};

const AREA_LABELS: Record<Category | "Creative" | "Financial" | "Social" | "Learning", string> = {
  Career: "Career",
  Health: "Health",
  Travel: "Travel",
  Faith: "Faith",
  Music: "Music",
  Creative: "Creative",
  Financial: "Financial",
  Social: "Social",
  Learning: "Learning",
};

const AREA_OPTIONS = [
  ...CATEGORIES,
  "Creative",
  "Financial",
  "Social",
  "Learning",
] as (keyof typeof AREA_LABELS)[];

const AREA_TO_SKILL: Record<string, { id: string; color: string }> = {
  Career: { id: "career", color: "#6366f1" },
  Health: { id: "health", color: "#ef4444" },
  Travel: { id: "travel", color: "#0ea5e9" },
  Faith: { id: "faith", color: "#8b5cf6" },
  Music: { id: "music", color: "#f97316" },
  Creative: { id: "creative", color: "#a855f7" },
  Financial: { id: "financial", color: "#eab308" },
  Social: { id: "social", color: "#ec4899" },
  Learning: { id: "learning", color: "#14b8a6" },
};

const DEFAULT_AREAS = ["Career", "Health"];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function GoalContextChip({ title }: { title: string }) {
  if (!title.trim()) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs">
      <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="text-muted-foreground">Adding to</span>
      <span className="truncate font-semibold text-foreground">{title}</span>
    </div>
  );
}

export function Onboarding({ onFinish }: { onFinish?: () => void } = {}) {
  const { addSkill, addGoal, addSubGoal, addTask, updateSettings, skills, ensureDefaultMilestone } =
    useAppData();
  const [step, setStep] = useState<Step>("welcome");
  const [aiMode, setAiMode] = useState(false);

  const [name, setName] = useState("");
  const [areas, setAreas] = useState<Set<string>>(new Set(DEFAULT_AREAS));
  const [template, setTemplate] = useState<GoalTemplate | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalSkill, setGoalSkill] = useState<string>("life");
  const [targetDate, setTargetDate] = useState(addDays(new Date(), 90));
  const [created, setCreated] = useState<{ milestones: number; tasks: number } | null>(null);
  const [milestones, setMilestones] = useState<{ title: string; date: string }[]>([]);
  const [tasksDraft, setTasksDraft] = useState<
    { title: string; due: string; priority: "low" | "medium" | "high" }[]
  >([]);

  const stepIdx = STEPS.indexOf(step);
  const displayGoalTitle = goalTitle.trim() || "My first goal";

  useEffect(() => {
    const previous = document.title;
    document.title = `Welcome — ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const picked = TEMPLATES.filter((t) => areas.has(t.category));
    return picked.length ? picked : TEMPLATES;
  }, [areas]);

  const next = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const finish = () => {
    if (name.trim()) updateSettings({ userName: name.trim() });
    updateSettings({ onboardedAt: new Date().toISOString() });
    onFinish?.();
  };

  const ensureSkills = (list: Iterable<string>) => {
    for (const a of list) {
      const m = AREA_TO_SKILL[a];
      if (!m) continue;
      if (!skills.some((s) => s.id === m.id)) {
        addSkill({ id: m.id, label: AREA_LABELS[a as keyof typeof AREA_LABELS], color: m.color });
      }
    }
  };

  const goToStart = (useDefaults?: boolean) => {
    const chosen = useDefaults || areas.size === 0 ? new Set(DEFAULT_AREAS) : areas;
    setAreas(chosen);
    ensureSkills(chosen);
    setStep("start");
  };

  const applyTemplate = (t: GoalTemplate | null) => {
    setTemplate(t);
    if (t) {
      setGoalTitle(t.title);
      setGoalSkill(t.skill);
      setTargetDate(addDays(new Date(today), t.durationDays));
      setMilestones(
        t.subGoals.map((sg) => ({ title: sg.title, date: addDays(new Date(today), sg.offsetDays) })),
      );
      setTasksDraft(
        t.tasks.map((task) => ({
          title: task.title,
          due: addDays(new Date(today), task.offsetDays),
          priority: task.priority,
        })),
      );
    } else {
      setGoalTitle("");
      setMilestones([]);
      setTasksDraft([]);
    }
    setStep("shape");
  };

  /** Create the goal, its milestones and starter tasks in one go. */
  const commit = (opts?: { silentTitle?: string }) => {
    const title = opts?.silentTitle ?? (goalTitle.trim() || "My first goal");
    const goalId = addGoal({
      title,
      description: template ? `${template.description}\n\nWhy: ${template.rationale}` : "",
      skill: goalSkill || "life",
      startDate: today,
      targetDate,
      status: "not_started",
      currentActivity: "",
    });
    const cleanMilestones = milestones.filter((m) => m.title.trim());
    cleanMilestones.forEach((m) => addSubGoal(goalId, m.title.trim(), m.date || undefined));
    const cleanTasks = tasksDraft.filter((t) => t.title.trim());
    if (cleanTasks.length) {
      const subGoalId = ensureDefaultMilestone(goalId);
      cleanTasks.forEach((t) =>
        addTask({
          title: t.title.trim(),
          dueDate: t.due || undefined,
          priority: t.priority,
          subGoalId,
        }),
      );
    }
    setCreated({ milestones: cleanMilestones.length, tasks: cleanTasks.length });
    setStep("done");
  };

  /** "Just explore" — seed a small, realistic goal so the dashboard is never empty. */
  const exploreWithSample = () => {
    const sample = filteredTemplates[0] ?? TEMPLATES[0];
    if (!sample) {
      setCreated(null);
      setStep("done");
      return;
    }
    setTemplate(sample);
    setGoalSkill(sample.skill);
    setTargetDate(addDays(new Date(today), sample.durationDays));
    const ms = sample.subGoals
      .slice(0, 3)
      .map((sg) => ({ title: sg.title, date: addDays(new Date(today), sg.offsetDays) }));
    const ts = sample.tasks.slice(0, 3).map((t) => ({
      title: t.title,
      due: addDays(new Date(today), t.offsetDays),
      priority: t.priority,
    }));
    const goalId = addGoal({
      title: sample.title,
      description: `${sample.description}\n\nSample goal added while exploring — edit or delete it any time.`,
      skill: sample.skill,
      startDate: today,
      targetDate: addDays(new Date(today), sample.durationDays),
      status: "not_started",
      currentActivity: "",
    });
    ms.forEach((m) => addSubGoal(goalId, m.title, m.date));
    if (ts.length) {
      const subGoalId = ensureDefaultMilestone(goalId);
      ts.forEach((t) =>
        addTask({ title: t.title, dueDate: t.due, priority: t.priority, subGoalId }),
      );
    }
    setGoalTitle(sample.title);
    setCreated({ milestones: ms.length, tasks: ts.length });
    setStep("done");
  };

  const canContinue = step !== "shape" || goalTitle.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const el = e.target as HTMLElement;
    if (el.tagName === "TEXTAREA" || el.tagName === "BUTTON") return;
    if (step === "welcome") {
      e.preventDefault();
      next();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary/5 via-background to-background"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <BrandMark className="h-8 w-8 rounded-lg" />
          <span className="hidden truncate font-display text-sm font-semibold sm:block">
            {APP_NAME}
          </span>
        </div>
        <div className="min-w-0 flex-1 px-1">
          <ol className="mx-auto flex max-w-md items-center gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex-1">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    i <= stepIdx ? "bg-primary" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "mt-1 hidden text-center text-[10px] uppercase tracking-wider sm:block",
                    i === stepIdx ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {STEP_LABELS[s]}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden">
            {STEP_LABELS[step]} · {stepIdx + 1}/{STEPS.length}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={finish}
          aria-label="Skip setup"
          className="h-11 shrink-0 gap-1.5 rounded-full px-3.5 text-sm font-medium sm:px-4"
        >
          <span className="hidden sm:inline">Skip setup</span>
          <span className="sm:hidden">Skip</span>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center p-5 sm:p-6">
          <div className="w-full py-2">
            {step === "welcome" && (
              <div className="relative text-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                  <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
                  <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
                </div>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl shadow-2xl shadow-primary/20">
                  <BrandMark className="h-20 w-20 rounded-3xl" alt="" />
                </div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome to {APP_NAME}
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground">
                  One clear goal, broken into milestones, turned into tasks you can actually do.
                  Setup takes about a minute.
                </p>
                <div className="mx-auto mt-7 max-w-xs text-left">
                  <Label className="text-xs" htmlFor="onboarding-name">
                    What should we call you? <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="onboarding-name"
                    autoFocus
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 text-base"
                  />
                </div>
                <div className="mt-6 flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    onClick={next}
                    className="h-12 w-full max-w-xs rounded-full text-base shadow-lg shadow-primary/20"
                  >
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "areas" && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-semibold">
                  Which life areas matter to you?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Pick a few — goals get color-coded by area. You can change these later in Settings.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AREA_OPTIONS.map((a) => {
                    const on = areas.has(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setAreas((prev) => {
                            const n = new Set(prev);
                            if (n.has(a)) n.delete(a);
                            else n.add(a);
                            return n;
                          })
                        }
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-card hover:bg-muted",
                        )}
                      >
                        {AREA_LABELS[a]}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => goToStart(true)}
                  className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Skip — use Career and Health
                </button>
              </div>
            )}

            {step === "start" && aiMode && (
              <AiInterview
                preferredSkill={Array.from(areas)[0]}
                onCancel={() => setAiMode(false)}
                onDone={() => {
                  setAiMode(false);
                  setCreated(null);
                  setStep("done");
                }}
              />
            )}

            {step === "start" && !aiMode && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-semibold">Choose a starting point</h1>
                <p className="text-sm text-muted-foreground">
                  Let AI interview you, start from a proven plan, write your own, or look around
                  with sample data.
                </p>

                <button
                  type="button"
                  onClick={() => setAiMode(true)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-left transition hover:border-primary hover:bg-primary/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Plan with AI</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Answer a few questions and get a goal with milestones and tasks.
                    </p>
                  </div>
                </button>



                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => applyTemplate(null)}
                    className="flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PenLine className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Blank goal</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Write your own goal, milestones and tasks.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={exploreWithSample}
                    className="flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Just explore</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Adds a sample goal so nothing is empty. Delete it any time.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Or start from a template
                  </p>
                  <div className="mt-2 grid gap-2">
                    {filteredTemplates.slice(0, 6).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{t.title}</span>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {t.category} · {Math.round(t.durationDays / 7)}w
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "shape" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="font-display text-2xl font-semibold">
                    {template ? "Confirm your goal" : "Shape your first goal"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Goal, checkpoints and a few starter tasks — all on one screen.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border bg-card p-4">
                  <div>
                    <Label className="text-xs">Goal title</Label>
                    <Input
                      autoFocus
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g. Run a 5K under 25 minutes"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Life area</Label>
                      <Select value={goalSkill} onValueChange={setGoalSkill}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(skills.length ? skills : DEFAULT_SKILLS).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Target date</Label>
                      <DatePicker value={targetDate} onChange={setTargetDate} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Milestones</h2>
                    <span className="text-xs text-muted-foreground">optional</span>
                  </div>
                  <GoalContextChip title={displayGoalTitle} />
                  {milestones.map((m, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center"
                    >
                      <Input
                        placeholder={`Milestone ${i + 1}`}
                        value={m.title}
                        onChange={(e) =>
                          setMilestones((cur) =>
                            cur.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                          )
                        }
                      />
                      <div className="sm:w-44">
                        <DatePicker
                          value={m.date}
                          onChange={(v) =>
                            setMilestones((cur) =>
                              cur.map((x, j) => (j === i ? { ...x, date: v } : x)),
                            )
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove milestone ${i + 1}`}
                        className="self-end sm:self-auto"
                        onClick={() => setMilestones((cur) => cur.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMilestones((cur) => [...cur, { title: "", date: targetDate }])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add milestone
                  </Button>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Starter tasks</h2>
                    <span className="text-xs text-muted-foreground">optional</span>
                  </div>
                  {tasksDraft.map((t, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center"
                    >
                      <Input
                        placeholder={`Task ${i + 1}`}
                        value={t.title}
                        onChange={(e) =>
                          setTasksDraft((cur) =>
                            cur.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                          )
                        }
                      />
                      <div className="flex gap-2">
                        <div className="w-full sm:w-40">
                          <DatePicker
                            value={t.due}
                            onChange={(v) =>
                              setTasksDraft((cur) =>
                                cur.map((x, j) => (j === i ? { ...x, due: v } : x)),
                              )
                            }
                          />
                        </div>
                        <Select
                          value={t.priority}
                          onValueChange={(v) =>
                            setTasksDraft((cur) =>
                              cur.map((x, j) =>
                                j === i ? { ...x, priority: v as "low" | "medium" | "high" } : x,
                              ),
                            )
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove task ${i + 1}`}
                          onClick={() => setTasksDraft((cur) => cur.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTasksDraft((cur) => [
                        ...cur,
                        { title: "", due: addDays(new Date(today), 7), priority: "medium" },
                      ])
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add task
                  </Button>
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <Check className="h-7 w-7" />
                </div>
                <h1 className="font-display text-3xl font-semibold">
                  You're all set{name.trim() ? `, ${name.trim()}` : ""}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {created
                    ? `1 goal · ${created.milestones} milestones · ${created.tasks} tasks`
                    : "You can add goals anytime from the dashboard."}
                </p>
                <div className="mx-auto mt-6 flex max-w-sm items-start gap-2.5 rounded-2xl border bg-card p-4 text-left">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Next: a short tour of the dashboard, calendar and overview — you can skip it and
                    replay it later from Settings.
                  </p>
                </div>
                <Button className="mt-6 h-12 rounded-full px-7" size="lg" onClick={finish}>
                  Enter dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer nav */}
      {step !== "welcome" && step !== "done" && (
        <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t bg-card/80 px-4 py-3 backdrop-blur sm:px-8 sm:py-4">
          <Button variant="ghost" onClick={back} className="h-11 px-4 sm:px-5">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {step === "areas" && (
            <Button
              onClick={() => goToStart()}
              className="h-11 min-w-[140px] rounded-full px-6 text-base sm:h-12 sm:min-w-[180px]"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === "shape" && (
            <Button
              onClick={() => commit()}
              disabled={!canContinue}
              className="h-11 min-w-[140px] rounded-full px-6 text-base sm:h-12 sm:min-w-[180px]"
            >
              Create goal <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === "start" && !aiMode && (
            <Button
              variant="outline"
              onClick={() => applyTemplate(null)}
              className="h-11 rounded-full px-6"
            >
              Start blank <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

        </div>
      )}
    </div>
  );
}
