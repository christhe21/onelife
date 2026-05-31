import { useMemo, useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, DEFAULT_SKILLS } from "@/lib/app-data";
import { TEMPLATES, CATEGORIES, type Category, type GoalTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

const STEPS = [
  "welcome",
  "name",
  "areas",
  "template",
  "goal",
  "milestones",
  "tasks",
  "done",
] as const;
type Step = (typeof STEPS)[number];

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

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Onboarding() {
  const { addSkill, addGoal, addSubGoal, addTask, updateSettings, skills } = useAppData();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [areas, setAreas] = useState<Set<string>>(
    new Set(["Career", "Health"]),
  );
  const [template, setTemplate] = useState<GoalTemplate | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalSkill, setGoalSkill] = useState<string>("life");
  const [targetDate, setTargetDate] = useState(addDays(new Date(), 90));
  const [createdGoalId, setCreatedGoalId] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<{ title: string; date: string }[]>([]);
  const [tasksDraft, setTasksDraft] = useState<{ title: string; due: string; priority: "low" | "medium" | "high" }[]>([]);

  const stepIdx = STEPS.indexOf(step);

  const filteredTemplates = useMemo(
    () => TEMPLATES.filter((t) => areas.has(t.category)),
    [areas],
  );

  const next = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const finish = () => {
    if (name.trim()) updateSettings({ userName: name.trim() });
    updateSettings({ onboardedAt: new Date().toISOString() });
  };

  const handleAreasNext = () => {
    // Ensure selected areas have skill entries
    for (const a of areas) {
      const m = AREA_TO_SKILL[a];
      if (!m) continue;
      if (!skills.some((s) => s.id === m.id)) {
        addSkill({ id: m.id, label: AREA_LABELS[a as keyof typeof AREA_LABELS], color: m.color });
      }
    }
    next();
  };

  const pickTemplate = (t: GoalTemplate | null) => {
    setTemplate(t);
    if (t) {
      setGoalTitle(t.title);
      setGoalSkill(t.skill);
      setTargetDate(addDays(new Date(today), t.durationDays));
      setMilestones(t.subGoals.map((sg) => ({ title: sg.title, date: addDays(new Date(today), sg.offsetDays) })));
      setTasksDraft(t.tasks.map((task) => ({ title: task.title, due: addDays(new Date(today), task.offsetDays), priority: task.priority })));
    } else {
      setMilestones([]);
      setTasksDraft([]);
    }
    setStep("goal");
  };

  const createGoal = () => {
    const title = goalTitle.trim() || "My first goal";
    const id = addGoal({
      title,
      description: template ? `${template.description}\n\nWhy: ${template.rationale}` : "",
      skill: goalSkill || "life",
      startDate: today,
      targetDate,
      status: "not_started",
      currentActivity: "",
    });
    setCreatedGoalId(id);
    next();
  };

  const saveMilestones = () => {
    if (!createdGoalId) return next();
    milestones.filter((m) => m.title.trim()).forEach((m) => addSubGoal(createdGoalId, m.title.trim(), m.date || undefined));
    next();
  };

  const saveTasks = () => {
    if (!createdGoalId) return next();
    tasksDraft.filter((t) => t.title.trim()).forEach((t) =>
      addTask({ title: t.title.trim(), dueDate: t.due || undefined, priority: t.priority, goalId: createdGoalId }),
    );
    next();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-semibold">Life Manager</span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i <= stepIdx ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={finish} className="text-xs text-muted-foreground">
          Skip setup <X className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-lg items-center justify-center p-6">
          <div className="w-full">
          {step === "welcome" && (
            <div className="relative text-center">
              {/* decorative background blobs */}
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-2xl" />
              </div>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-2xl shadow-primary/30 ring-1 ring-white/20">
                <Sparkles className="h-9 w-9" />
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight">
                Welcome to <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">Life Manager</span>
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
                Let&apos;s set up your dashboard in a few easy steps — like setting up a new phone. You can change anything later.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  onClick={next}
                  className="h-12 w-full max-w-xs rounded-full text-base shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
                >
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Takes about 2 minutes</span>
              </div>
            </div>
          )}

          {step === "name" && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold">What should we call you?</h1>
              <p className="text-sm text-muted-foreground">
                We&apos;ll use this for your greeting and at the center of your mind map.
              </p>
              <Input
                autoFocus
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base"
              />
            </div>
          )}

          {step === "areas" && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold">Which life areas matter to you?</h1>
              <p className="text-sm text-muted-foreground">
                Pick a few. We&apos;ll color-code your goals by area.
              </p>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map((a) => {
                  const on = areas.has(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAreas((prev) => {
                          const n = new Set(prev);
                          if (n.has(a)) n.delete(a);
                          else n.add(a);
                          return n;
                        });
                      }}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                        on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                      )}
                    >
                      {AREA_LABELS[a]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "template" && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold">Start from a science-backed template?</h1>
              <p className="text-sm text-muted-foreground">
                Pick one to pre-fill milestones and starter tasks, or skip to start blank.
              </p>
              <div className="grid gap-2">
                {filteredTemplates.length === 0 && (
                  <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                    No templates for the areas you selected yet. You can start blank.
                  </p>
                )}
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t)}
                    className="rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{t.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{t.category} · {Math.round(t.durationDays / 7)}w</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                    <p className="mt-1 text-[11px] italic text-muted-foreground/80">{t.rationale}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pickTemplate(null)}
                  className="rounded-lg border border-dashed bg-muted/30 p-3 text-left text-sm transition hover:bg-muted/60"
                >
                  Start blank <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === "goal" && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold">Your first goal</h1>
              <p className="text-sm text-muted-foreground">A clear, specific outcome you want to reach.</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Goal title</Label>
                  <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g. Run a 5K under 25 minutes" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Life area</Label>
                    <Select value={goalSkill} onValueChange={setGoalSkill}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(skills.length ? skills : DEFAULT_SKILLS).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Target date</Label>
                    <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "milestones" && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold">Add milestones (sub-goals)</h1>
              <p className="text-sm text-muted-foreground">Break the goal into checkpoints. Skip if you&apos;d rather add them later.</p>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center">
                    <Input
                      placeholder={`Milestone ${i + 1}`}
                      value={m.title}
                      onChange={(e) => setMilestones((cur) => cur.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    />
                    <Input
                      type="date"
                      className="sm:w-44"
                      value={m.date}
                      onChange={(e) => setMilestones((cur) => cur.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                    />
                    <Button variant="ghost" size="icon" className="self-end sm:self-auto" onClick={() => setMilestones((cur) => cur.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setMilestones((cur) => [...cur, { title: "", date: targetDate }])}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add milestone
                </Button>
              </div>
            </div>
          )}

          {step === "tasks" && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold">Add starter tasks</h1>
              <p className="text-sm text-muted-foreground">Concrete next actions you can do this week.</p>
              <div className="space-y-3">
                {tasksDraft.map((t, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center">
                    <Input
                      placeholder={`Task ${i + 1}`}
                      value={t.title}
                      onChange={(e) => setTasksDraft((cur) => cur.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        className="w-full sm:w-40"
                        value={t.due}
                        onChange={(e) => setTasksDraft((cur) => cur.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)))}
                      />
                      <Select value={t.priority} onValueChange={(v) => setTasksDraft((cur) => cur.map((x, j) => (j === i ? { ...x, priority: v as "low"|"medium"|"high" } : x)))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => setTasksDraft((cur) => cur.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setTasksDraft((cur) => [...cur, { title: "", due: addDays(new Date(today), 7), priority: "medium" }])}>
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
              <h1 className="font-display text-3xl font-semibold">You&apos;re all set{name ? `, ${name}` : ""}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {createdGoalId
                  ? `1 goal · ${milestones.filter((m) => m.title.trim()).length} milestones · ${tasksDraft.filter((t) => t.title.trim()).length} tasks`
                  : "You can add goals anytime from the dashboard."}
              </p>
              <Button className="mt-6" size="lg" onClick={finish}>
                Enter dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {step !== "welcome" && step !== "done" && (
        <div className="flex items-center justify-between border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={back}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
          </Button>
          {step === "areas" ? (
            <Button size="sm" onClick={handleAreasNext} disabled={areas.size === 0}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : step === "goal" ? (
            <Button size="sm" onClick={createGoal} disabled={!goalTitle.trim()}>
              Create goal <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : step === "milestones" ? (
            <Button size="sm" onClick={saveMilestones}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : step === "tasks" ? (
            <Button size="sm" onClick={saveTasks}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={next} disabled={step === "name" && !name.trim()}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
