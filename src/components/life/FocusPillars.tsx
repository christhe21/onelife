import { useEffect, useMemo, useState } from "react";
import { Check, HeartPulse, Plus, Target, Wrench } from "lucide-react";
import { useAppData, progressFor } from "@/lib/app-data";
import { daysLeftInMonth, MAX_FOCUS_PILLARS, type FocusPillar } from "@/lib/focus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function FocusPillars() {
  const { focus, goals, skills, tasks, setFocusPillars, confirmFocusMonth } = useAppData();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FocusPillar[]>(focus.current.pillars);

  useEffect(() => {
    setDraft(focus.current.pillars);
    if (!focus.current.reviewed) setOpen(true);
  }, [focus.current.month, focus.current.reviewed, focus.current.pillars]);

  const options = useMemo(() => [
    ...skills.filter((s) => s.id !== "health").map((s) => ({ type: "skill" as const, id: s.id, label: s.label, detail: `${goals.filter((g) => g.skill === s.id && g.status !== "completed").length} active goals` })),
    ...goals.filter((g) => g.skill !== "health" && g.status !== "completed").map((g) => ({ type: "goal" as const, id: g.id, label: g.title, detail: skills.find((s) => s.id === g.skill)?.label ?? "Goal" })),
  ], [goals, skills]);

  const resolve = (pillar: FocusPillar) => {
    if (pillar.type === "skill") {
      const skill = skills.find((s) => s.id === pillar.id);
      const skillGoals = goals.filter((g) => g.skill === pillar.id);
      const progress = skillGoals.length
        ? Math.round(skillGoals.reduce((sum, goal) => sum + progressFor(goal, tasks), 0) / skillGoals.length)
        : 0;
      return { label: skill?.label ?? "Unavailable skill", type: "Skill", progress };
    }
    const goal = goals.find((g) => g.id === pillar.id);
    return { label: goal?.title ?? "Unavailable goal", type: "Goal", progress: goal ? progressFor(goal, tasks) : 0 };
  };

  const toggle = (pillar: FocusPillar) => {
    const exists = draft.some((x) => x.type === pillar.type && x.id === pillar.id);
    if (exists) setDraft(draft.filter((x) => x.type !== pillar.type || x.id !== pillar.id));
    else if (draft.length < MAX_FOCUS_PILLARS) setDraft([...draft, pillar]);
  };

  return (
    <section aria-labelledby="focus-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">This month&apos;s focus</p>
          <h2 id="focus-heading" className="font-display text-xl font-semibold">Three things that deserve your energy</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{daysLeftInMonth()} days remaining</span>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Review focus</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: MAX_FOCUS_PILLARS }, (_, index) => {
          const pillar = focus.current.pillars[index];
          if (!pillar) return (
            <Button key={index} variant="outline" className="h-36 flex-col border-dashed" onClick={() => setOpen(true)}>
              <Plus className="h-5 w-5" /><span>Choose focus {index + 1}</span>
            </Button>
          );
          const item = resolve(pillar);
          return (
            <Button key={`${pillar.type}:${pillar.id}`} variant="outline" className="h-36 items-stretch justify-start p-5 text-left" onClick={() => setOpen(true)}>
              <span className="flex w-full flex-col">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {pillar.type === "skill" ? <Wrench className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}{item.type}
                </span>
                <span className="mt-3 line-clamp-2 whitespace-normal font-display text-lg font-semibold text-foreground">{item.label}</span>
                <span className="mt-auto space-y-1">
                  <span className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{item.progress}%</span></span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-primary" style={{ width: `${item.progress}%` }} /></span>
                </span>
              </span>
            </Button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><HeartPulse className="h-3.5 w-3.5" />Health stays active without using a focus slot.</div>

      <Dialog open={open} onOpenChange={(value) => { if (!value && !focus.current.reviewed) confirmFocusMonth(); setOpen(value); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Choose this month&apos;s focus</DialogTitle>
            <DialogDescription>Pick up to three skills or goals. Only these and Health can be added to your calendar.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {(["skill", "goal"] as const).map((type) => (
              <div key={type} className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">{type === "skill" ? "Skills" : "Goals"}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {options.filter((option) => option.type === type).map((option) => {
                    const selected = draft.some((x) => x.type === option.type && x.id === option.id);
                    return <Button key={`${option.type}:${option.id}`} variant="outline" className={cn("h-auto min-h-16 justify-between p-3 text-left", selected && "border-primary bg-primary/5")} disabled={!selected && draft.length >= MAX_FOCUS_PILLARS} onClick={() => toggle(option)}>
                      <span className="min-w-0"><span className="block truncate font-medium">{option.label}</span><span className="block text-xs text-muted-foreground">{option.detail}</span></span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </Button>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <span className="mr-auto self-center text-xs text-muted-foreground">{draft.length} of {MAX_FOCUS_PILLARS} selected</span>
            <Button onClick={() => { setFocusPillars(draft); setOpen(false); }}>Save focus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}