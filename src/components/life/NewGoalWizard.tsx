import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData, DEFAULT_SKILLS } from "@/lib/app-data";
import { TEMPLATES, type GoalTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

const STEPS = ["basics", "template", "milestones", "tasks", "subtasks", "done"] as const;
type Step = (typeof STEPS)[number];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface MilestoneDraft {
  title: string;
  date: string;
}
interface TaskDraft {
  title: string;
  due: string;
  priority: "low" | "medium" | "high";
  subtasks: { title: string; hoursPerWeek?: number; endDate?: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSkill?: string;
}

export function NewGoalWizard({ open, onOpenChange, defaultSkill }: Props) {
  const { skills, addGoal, addSubGoal, addTask, ensureDefaultMilestone } = useAppData();
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<Step>("basics");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState<string>(defaultSkill ?? skills[0]?.id ?? "life");
  const [targetDate, setTargetDate] = useState(addDays(new Date(), 90));
  const [template, setTemplate] = useState<GoalTemplate | null>(null);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [createdGoalId, setCreatedGoalId] = useState<string | null>(null);

  const stepIdx = STEPS.indexOf(step);
  const stepTemplates = useMemo(
    () =>
      TEMPLATES.filter((t) => {
        const lbl = (skills.find((s) => s.id === skill)?.label ?? "").toLowerCase();
        return t.skill === skill || t.category.toLowerCase() === lbl;
      }),
    [skill, skills],
  );

  const reset = () => {
    setStep("basics");
    setTitle("");
    setDescription("");
    setSkill(defaultSkill ?? skills[0]?.id ?? "life");
    setTargetDate(addDays(new Date(), 90));
    setTemplate(null);
    setMilestones([]);
    setTasks([]);
    setCreatedGoalId(null);
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const next = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const commitGoal = (): string => {
    if (createdGoalId) return createdGoalId;
    const id = addGoal({
      title: title.trim() || "Untitled goal",
      description:
        description.trim() ||
        (template ? `${template.description}\n\nWhy: ${template.rationale}` : ""),
      skill: skill || "life",
      startDate: today,
      targetDate,
      status: "not_started",
      currentActivity: "",
    });
    setCreatedGoalId(id);
    return id;
  };

  const handleBasicsNext = () => {
    if (!title.trim()) return;
    commitGoal();
    if (stepTemplates.length === 0) {
      // auto-skip template step
      setStep("milestones");
    } else {
      setStep("template");
    }
  };

  const pickTemplate = (t: GoalTemplate | null) => {
    setTemplate(t);
    if (t) {
      if (!title.trim()) setTitle(t.title);
      setTargetDate(addDays(new Date(today), t.durationDays));
      setMilestones(
        t.subGoals.map((sg) => ({
          title: sg.title,
          date: addDays(new Date(today), sg.offsetDays),
        })),
      );
      setTasks(
        t.tasks.map((task) => ({
          title: task.title,
          due: addDays(new Date(today), task.offsetDays),
          priority: task.priority,
          subtasks: [],
        })),
      );
    }
    setStep("milestones");
  };

  const saveMilestones = () => {
    const id = commitGoal();
    milestones
      .filter((m) => m.title.trim())
      .forEach((m) => addSubGoal(id, m.title.trim(), m.date || undefined));
    setMilestones([]); // clear so back/forward doesn't double-add
    setStep("tasks");
  };

  const goToSubtasks = () => {
    // ensure goal exists, but tasks are persisted on the final step so we can attach subtasks
    commitGoal();
    setStep("subtasks");
  };

  const saveAll = () => {
    const id = commitGoal();
    const subGoalId = ensureDefaultMilestone(id);
    // persist tasks + their subtasks now
    tasks
      .filter((t) => t.title.trim())
      .forEach((t) => {
        addTask({
          title: t.title.trim(),
          dueDate: t.due || undefined,
          priority: t.priority,
          subGoalId,
          subtasks: t.subtasks
            .filter((st) => st.title.trim())
            .map((st) => ({
              id: Math.random().toString(36).slice(2, 10),
              title: st.title.trim(),
              done: false,
              hoursPerWeek: st.hoursPerWeek,
              endDate: st.endDate,
            })),
        });
      });
    setStep("done");
  };

  const skipToDone = () => {
    if (title.trim()) commitGoal();
    setStep("done");
  };

  const finish = () => {
    handleOpenChange(false);
  };

  const totalSubtasks = tasks.reduce(
    (a, t) => a + t.subtasks.filter((s) => s.title.trim()).length,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
        <DialogHeader className="border-b px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> New goal
            </DialogTitle>
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1.5 w-5 rounded-full transition-colors",
                    i <= stepIdx ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
            {step !== "done" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skipToDone}
                className="text-xs text-muted-foreground"
              >
                Skip <X className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "basics" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Goal basics</h2>
                <p className="text-xs text-muted-foreground">A clear outcome you want to reach.</p>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Run a 5K under 25 minutes"
                />
              </div>
              <div>
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why does this matter?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Life area</Label>
                  <Select value={skill} onValueChange={setSkill}>
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
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === "template" && (
            <div className="space-y-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Start from a template?</h2>
                <p className="text-xs text-muted-foreground">
                  Pre-fill milestones and tasks, or skip to add your own.
                </p>
              </div>
              <div className="space-y-2">
                {stepTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t)}
                    className="block w-full rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{t.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {Math.round(t.durationDays / 7)}w
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                    <p className="mt-1 text-[11px] italic text-muted-foreground/80">
                      {t.rationale}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pickTemplate(null)}
                  className="block w-full rounded-lg border border-dashed bg-muted/30 p-3 text-left text-sm transition hover:bg-muted/60"
                >
                  Start blank <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === "milestones" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Add milestones</h2>
                <p className="text-xs text-muted-foreground">
                  Break the goal into checkpoints. Skip to add later.
                </p>
              </div>
              <div className="space-y-3">
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
                    <Input
                      type="date"
                      className="sm:w-44"
                      value={m.date}
                      onChange={(e) =>
                        setMilestones((cur) =>
                          cur.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
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
            </div>
          )}

          {step === "tasks" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Add starter tasks</h2>
                <p className="text-xs text-muted-foreground">
                  Concrete next actions. Skip to add later.
                </p>
              </div>
              <div className="space-y-3">
                {tasks.map((t, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center"
                  >
                    <Input
                      placeholder={`Task ${i + 1}`}
                      value={t.title}
                      onChange={(e) =>
                        setTasks((cur) =>
                          cur.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        className="w-full sm:w-40"
                        value={t.due}
                        onChange={(e) =>
                          setTasks((cur) =>
                            cur.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)),
                          )
                        }
                      />
                      <Select
                        value={t.priority}
                        onValueChange={(v) =>
                          setTasks((cur) =>
                            cur.map((x, j) =>
                              j === i ? { ...x, priority: v as TaskDraft["priority"] } : x,
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
                        onClick={() => setTasks((cur) => cur.filter((_, j) => j !== i))}
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
                    setTasks((cur) => [
                      ...cur,
                      {
                        title: "",
                        due: addDays(new Date(today), 7),
                        priority: "medium",
                        subtasks: [],
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add task
                </Button>
              </div>
            </div>
          )}

          {step === "subtasks" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Sub-tasks (optional)</h2>
                <p className="text-xs text-muted-foreground">
                  Break any task into smaller steps. Skip if not needed.
                </p>
              </div>
              {tasks.filter((t) => t.title.trim()).length === 0 ? (
                <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  No tasks yet — go back to add some first, or skip.
                </p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((t, ti) => {
                    if (!t.title.trim()) return null;
                    return (
                      <div key={ti} className="rounded-lg border bg-card/50 p-3">
                        <p className="text-sm font-semibold">{t.title}</p>
                        <div className="mt-2 space-y-1.5">
                          {t.subtasks.map((st, si) => (
                            <div key={si} className="flex gap-2">
                              <Input
                                placeholder={`Sub-task ${si + 1}`}
                                value={st.title}
                                onChange={(e) =>
                                  setTasks((cur) =>
                                    cur.map((x, j) =>
                                      j === ti
                                        ? {
                                            ...x,
                                            subtasks: x.subtasks.map((s, k) =>
                                              k === si ? { ...s, title: e.target.value } : s,
                                            ),
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setTasks((cur) =>
                                    cur.map((x, j) =>
                                      j === ti
                                        ? { ...x, subtasks: x.subtasks.filter((_, k) => k !== si) }
                                        : x,
                                    ),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setTasks((cur) =>
                                cur.map((x, j) =>
                                  j === ti ? { ...x, subtasks: [...x.subtasks, { title: "" }] } : x,
                                ),
                              )
                            }
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add sub-task
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-semibold">Goal created</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                1 goal · {milestones.filter((m) => m.title.trim()).length} milestones ·{" "}
                {tasks.filter((t) => t.title.trim()).length} tasks · {totalSubtasks} sub-tasks
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
          {step !== "basics" && step !== "done" ? (
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
          ) : (
            <span />
          )}

          {step === "basics" && (
            <Button size="sm" onClick={handleBasicsNext} disabled={!title.trim()}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          {step === "template" && (
            <Button size="sm" variant="outline" onClick={() => pickTemplate(null)}>
              Skip <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          {step === "milestones" && (
            <Button size="sm" onClick={saveMilestones}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          {step === "tasks" && (
            <Button size="sm" onClick={goToSubtasks}>
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          {step === "subtasks" && (
            <Button size="sm" onClick={saveAll}>
              Finish <Check className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          {step === "done" && (
            <Button size="sm" onClick={finish}>
              Done <Check className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
