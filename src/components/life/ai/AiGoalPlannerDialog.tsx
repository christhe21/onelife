import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/pickers/DatePicker";
import { useAppData } from "@/lib/app-data";
import { generateGoalPlan, type AiGoalPlan } from "@/lib/ai-plan.functions";
import { AiPlanReview } from "./AiPlanReview";
import { commitAiPlan } from "./plan-commit";
import { AiInterview } from "./AiInterview";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSkill?: string;
}

export function AiGoalPlannerDialog({ open, onOpenChange, defaultSkill }: Props) {
  const { skills, addGoal, addSubGoal, addTask, ensureDefaultMilestone } = useAppData();
  const plan = useServerFn(generateGoalPlan);
  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<"describe" | "interview">("describe");
  const [brief, setBrief] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [hours, setHours] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiGoalPlan | null>(null);

  const reset = () => {
    setMode("describe");
    setBrief("");
    setTargetDate("");
    setHours("");
    setDraft(null);
    setError(null);
    setBusy(false);
  };

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const build = async () => {
    if (!brief.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await plan({
        data: {
          brief: brief.trim(),
          today,
          skills: skills.map((s) => ({ id: s.id, label: s.label })),
          preferredSkill: defaultSkill,
          targetDate: targetDate || undefined,
          hoursPerWeek: hours ? Number(hours) : undefined,
        },
      });
      setDraft(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Plan a goal with AI
          </DialogTitle>
        </DialogHeader>

        {draft ? (
          <AiPlanReview
            plan={draft}
            onChange={setDraft}
            busy={busy}
            onRegenerate={() => void build()}
            onConfirm={() => {
              commitAiPlan({ addGoal, addSubGoal, addTask, ensureDefaultMilestone }, draft);
              toast.success("Goal created from your AI plan");
              close(false);
            }}
          />
        ) : mode === "interview" ? (
          <AiInterview
            preferredSkill={defaultSkill}
            onCancel={() => setMode("describe")}
            onDone={() => {
              toast.success("Goal created from your AI plan");
              close(false);
            }}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">What do you want to achieve?</Label>
              <Textarea
                autoFocus
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="e.g. Get job-ready in data structures & algorithms so I can clear interviews"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Target date (optional)</Label>
                <DatePicker min={today} value={targetDate} onChange={setTargetDate} />
              </div>
              <div>
                <Label className="text-xs">Hours per week (optional)</Label>
                <Input
                  type="number"
                  min={1}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="6"
                />
              </div>
            </div>
            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="ghost" size="sm" onClick={() => setMode("interview")}>
                Not sure? Let AI interview me
              </Button>
              <Button size="sm" onClick={() => void build()} disabled={busy || !brief.trim()}>
                {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                Build my plan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
