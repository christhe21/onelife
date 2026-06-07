import { useMemo, useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data";
import { TEMPLATES, CATEGORIES, type Category, type GoalTemplate } from "@/lib/templates";

interface Props {
  trigger: React.ReactNode;
  /** Pre-select a template (skips to step 3 confirm) */
  initialTemplate?: GoalTemplate;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function OnboardingWizard({ trigger, initialTemplate }: Props) {
  const { addGoal, addSubGoal, addTask, addSkill, skills } = useAppData();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(initialTemplate ? 3 : 1);
  const [category, setCategory] = useState<Category | null>(initialTemplate?.category ?? null);
  const [picked, setPicked] = useState<GoalTemplate | null>(initialTemplate ?? null);
  const [title, setTitle] = useState(initialTemplate?.title ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);

  const filtered = useMemo(
    () => (category ? TEMPLATES.filter((t) => t.category === category) : []),
    [category],
  );

  const reset = () => {
    setStep(1);
    setCategory(null);
    setPicked(null);
    setTitle("");
    setStartDate(today);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setTimeout(reset, 200);
  };

  const finish = () => {
    if (!picked) return;
    // ensure skill exists
    if (!skills.some((s) => s.id === picked.skill)) {
      addSkill({ id: picked.skill, label: picked.skillLabel, color: picked.skillColor });
    }
    const base = new Date(startDate);
    const goalId = addGoal({
      title: title.trim() || picked.title,
      description: `${picked.description}\n\nWhy: ${picked.rationale}`,
      skill: picked.skill,
      startDate,
      targetDate: addDays(base, picked.durationDays),
      status: "not_started",
      currentActivity: "",
    });
    picked.subGoals.forEach((sg) => addSubGoal(goalId, sg.title, addDays(base, sg.offsetDays)));
    picked.tasks.forEach((t) =>
      addTask({
        title: t.title,
        priority: t.priority,
        dueDate: addDays(base, t.offsetDays),
        goalId,
      }),
    );
    setOpen(false);
    setTimeout(reset, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Add your first goal
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick a life area. We&apos;ll suggest a science-backed template you can tweak.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setStep(2);
                  }}
                  className="rounded-lg border bg-card p-3 text-left text-sm font-medium transition hover:border-primary hover:bg-primary/5"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && category && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick a template for <strong>{category}</strong>, or start blank.
            </p>
            <div className="space-y-2">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setPicked(t);
                    setTitle(t.title);
                    setStep(3);
                  }}
                  className="block w-full rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{t.title}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {Math.round(t.durationDays / 7)}w
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  <p className="mt-1 text-[11px] italic text-muted-foreground/80">{t.rationale}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && picked && (
          <div className="space-y-3">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  {picked.category} template
                </p>
                <p className="mt-1 text-sm font-medium">{picked.title}</p>
                <p className="mt-1 text-xs italic text-muted-foreground">{picked.rationale}</p>
              </CardContent>
            </Card>
            <div>
              <Label className="text-xs">Goal title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <p className="font-medium">You&apos;ll get:</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                <li>· {picked.subGoals.length} milestones</li>
                <li>· {picked.tasks.length} starter tasks</li>
                <li>· Target date: {addDays(new Date(startDate), picked.durationDays)}</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1) as 1 | 2 | 3)}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step === 3 ? (
            <Button onClick={finish} size="sm">
              <Check className="mr-1 h-3.5 w-3.5" /> Create goal
            </Button>
          ) : step === 2 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // start blank in chosen category
                const skill = skills.find((s) => s.label.toLowerCase() === category!.toLowerCase());
                const id = addGoal({
                  title: `My ${category} goal`,
                  description: "",
                  skill: skill?.id ?? "life",
                  startDate: today,
                  targetDate: addDays(new Date(today), 90),
                  status: "not_started",
                  currentActivity: "",
                });
                void id;
                setOpen(false);
                setTimeout(reset, 200);
              }}
            >
              Start blank <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
