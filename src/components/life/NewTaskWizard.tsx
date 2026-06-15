import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData, type Task } from "@/lib/app-data";
import { cn } from "@/lib/utils";
import { SubtaskFormDialog, type SubtaskDraft } from "./SubtaskFormDialog";


const STEPS = ["basics", "priority", "schedule", "link", "subtasks", "done"] as const;
type Step = (typeof STEPS)[number];

interface SubDraft {
  title: string;
  hoursPerWeek?: number;
  endDate?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function NewTaskWizard({ open, onOpenChange }: Props) {
  const { goals, addTask } = useAppData();

  const [step, setStep] = useState<Step>("basics");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [isDaily, setIsDaily] = useState(false);
  const [dueDate, setDueDate] = useState<string>(addDaysIso(1));
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [endDate, setEndDate] = useState<string>(addDaysIso(30));
  const [goalId, setGoalId] = useState<string>("");
  const [subGoalId, setSubGoalId] = useState<string>("");
  const [subs, setSubs] = useState<SubDraft[]>([]);

  const stepIdx = STEPS.indexOf(step);
  const selectedGoal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);

  const reset = () => {
    setStep("basics");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setIsDaily(false);
    setDueDate(addDaysIso(1));
    setStartDate(todayIso());
    setEndDate(addDaysIso(30));
    setGoalId("");
    setSubGoalId("");
    setSubs([]);
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const next = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const canNext =
    (step === "basics" && title.trim().length > 0) ||
    step === "priority" ||
    step === "schedule" ||
    (step === "link" && goalId && (isDaily || subGoalId)) ||
    step === "subtasks" ||
    step === "done";

  const save = () => {
    addTask({
      title: title.trim(),
      priority,
      evidence: description.trim() || undefined,
      recurrence: isDaily ? "daily" : "none",
      dueDate: isDaily ? undefined : dueDate || undefined,
      startDate: isDaily ? startDate || undefined : undefined,
      endDate: isDaily ? endDate || undefined : undefined,
      subGoalId: isDaily ? undefined : subGoalId || undefined,
      goalId: isDaily ? goalId || undefined : undefined,
      subtasks: subs
        .filter((s) => s.title.trim())
        .map((s) => ({
          id: Math.random().toString(36).slice(2, 10),
          title: s.title.trim(),
          done: false,
          hoursPerWeek: s.hoursPerWeek,
          endDate: s.endDate,
        })),
    });
    setStep("done");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-primary" /> New task
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="text-xs text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "basics" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Task basics</h2>
                <p className="text-xs text-muted-foreground">What needs to get done?</p>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Draft case study outline"
                />
              </div>
              <div>
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes, context, links"
                />
              </div>
            </div>
          )}

          {step === "priority" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Priority</h2>
                <p className="text-xs text-muted-foreground">How urgent is this?</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      priority === p
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40",
                    )}
                  >
                    <div className="text-sm font-semibold capitalize">{p}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {p === "low" ? "Nice to have" : p === "medium" ? "Should do" : "Must do"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "schedule" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Schedule</h2>
                <p className="text-xs text-muted-foreground">
                  One-off due date or a daily recurring task.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-card/50 p-3">
                <div>
                  <div className="text-sm font-medium">Daily task</div>
                  <div className="text-[11px] text-muted-foreground">
                    Recurs every day between start and end.
                  </div>
                </div>
                <Switch checked={isDaily} onCheckedChange={setIsDaily} />
              </div>

              {!isDaily ? (
                <div>
                  <Label className="text-xs">Due date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Start date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "link" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Link to a goal</h2>
                <p className="text-xs text-muted-foreground">
                  {isDaily
                    ? "Daily tasks live directly under a goal."
                    : "Pick a goal, then a milestone."}
                </p>
              </div>
              {goals.length === 0 ? (
                <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Create a goal first to link tasks.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Goal</Label>
                    <Select
                      value={goalId}
                      onValueChange={(v) => {
                        setGoalId(v);
                        setSubGoalId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {goals.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isDaily && selectedGoal && (
                    <div>
                      <Label className="text-xs">Milestone</Label>
                      <Select value={subGoalId} onValueChange={setSubGoalId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a milestone" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedGoal.subGoals.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              No milestones — add one in Goals first.
                            </div>
                          )}
                          {selectedGoal.subGoals.map((sg) => (
                            <SelectItem key={sg.id} value={sg.id}>
                              {sg.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "subtasks" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Sub-tasks (optional)</h2>
                <p className="text-xs text-muted-foreground">Break this down further.</p>
              </div>
              <div className="space-y-2">
                {subs.map((s, i) => (
                  <div key={i} className="rounded-lg border bg-card/50 p-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Sub-task ${i + 1}`}
                        value={s.title}
                        onChange={(e) =>
                          setSubs((cur) =>
                            cur.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSubs((cur) => cur.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="h/wk"
                        value={s.hoursPerWeek ?? ""}
                        onChange={(e) =>
                          setSubs((cur) =>
                            cur.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    hoursPerWeek: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                        className="w-24"
                      />
                      <Input
                        type="date"
                        value={s.endDate ?? ""}
                        onChange={(e) =>
                          setSubs((cur) =>
                            cur.map((x, j) =>
                              j === i ? { ...x, endDate: e.target.value || undefined } : x,
                            ),
                          )
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubs((cur) => [...cur, { title: "" }])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add sub-task
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold">Task created</h2>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3">
          {step !== "done" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={back}
                disabled={stepIdx === 0}
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
              {step === "subtasks" ? (
                <Button size="sm" onClick={save}>
                  Create task <Check className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={next} disabled={!canNext}>
                  Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset();
                }}
              >
                Create another
              </Button>
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
