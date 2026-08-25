import { Check, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/pickers/DatePicker";
import type { AiGoalPlan } from "@/lib/ai-plan.functions";

interface Props {
  plan: AiGoalPlan;
  onChange: (plan: AiGoalPlan) => void;
  onConfirm: () => void;
  onRegenerate?: () => void;
  busy?: boolean;
  confirmLabel?: string;
}

export function AiPlanReview({
  plan,
  onChange,
  onConfirm,
  onRegenerate,
  busy,
  confirmLabel = "Create it",
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const set = (patch: Partial<AiGoalPlan>) => onChange({ ...plan, ...patch });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card/60 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Your proposed plan</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            nothing is saved yet
          </Badge>
        </div>
        <Label className="text-xs">Goal</Label>
        <Input value={plan.title} onChange={(e) => set({ title: e.target.value })} />
        <Label className="mt-2 block text-xs">Why it matters</Label>
        <Textarea
          rows={2}
          value={plan.description}
          onChange={(e) => set({ description: e.target.value })}
        />
        <Label className="mt-2 block text-xs">Target date</Label>
        <DatePicker
          min={today}
          value={plan.targetDate}
          onChange={(v) => set({ targetDate: v })}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Milestones ({plan.milestones.length})
        </p>
        <div className="space-y-2">
          {plan.milestones.map((m, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border bg-card/50 p-2 sm:flex-row">
              <Input
                value={m.title}
                onChange={(e) =>
                  set({
                    milestones: plan.milestones.map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x,
                    ),
                  })
                }
              />
              <div className="sm:w-44">
                <DatePicker
                  min={today}
                  max={plan.targetDate}
                  value={m.date ?? plan.targetDate}
                  onChange={(v) =>
                    set({
                      milestones: plan.milestones.map((x, j) => (j === i ? { ...x, date: v } : x)),
                    })
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove milestone"
                onClick={() => set({ milestones: plan.milestones.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tasks ({plan.tasks.length})
        </p>
        <div className="space-y-2">
          {plan.tasks.map((t, i) => (
            <div key={i} className="rounded-lg border bg-card/50 p-2">
              <div className="flex gap-2">
                <Input
                  value={t.title}
                  onChange={(e) =>
                    set({
                      tasks: plan.tasks.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove task"
                  onClick={() => set({ tasks: plan.tasks.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                {t.milestone && <Badge variant="outline">{t.milestone}</Badge>}
                <Badge variant="secondary">{t.priority}</Badge>
                {t.dueDate && <span>due {t.dueDate}</span>}
                {t.subtasks.length > 0 && <span>· {t.subtasks.length} sub-tasks</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onRegenerate && (
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={busy}>
            Regenerate
          </Button>
        )}
        <Button size="sm" onClick={onConfirm} disabled={busy || !plan.title.trim()}>
          {confirmLabel} <Check className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
