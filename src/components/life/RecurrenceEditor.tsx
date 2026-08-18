import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/pickers/DatePicker";
import {
  PRESETS,
  WEEKDAY_LABELS,
  describeRule,
  presetToRule,
  ruleToPreset,
  type PresetId,
  type RecurrenceRule,
} from "@/lib/recurrence";

interface Props {
  value: RecurrenceRule | null | undefined;
  onChange: (rule: RecurrenceRule | null) => void;
  /** Anchor date (yyyy-mm-dd) used to seed "weekly on <day>" presets. */
  referenceDate?: string;
  /** Latest allowed end date (e.g. the parent goal's deadline). */
  maxDate?: string;
  className?: string;
}

export function RecurrenceEditor({
  value,
  onChange,
  referenceDate,
  maxDate,
  className,
}: Props) {
  const preset = ruleToPreset(value);
  const rule = value ?? null;
  const ref = useMemo(() => {
    if (!referenceDate) return undefined;
    const d = new Date(`${referenceDate.slice(0, 10)}T00:00:00`);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [referenceDate]);

  const showDays = !!rule && rule.freq === "weekly";
  const showInterval = !!rule && (preset === "custom" || preset === "biweekly");

  const setPreset = (id: PresetId) => onChange(presetToRule(id, ref));

  const patch = (p: Partial<RecurrenceRule>) => {
    if (!rule) return;
    onChange({ ...rule, ...p });
  };

  const toggleDay = (d: number) => {
    if (!rule) return;
    const days = new Set(rule.byWeekday ?? []);
    if (days.has(d)) days.delete(d);
    else days.add(d);
    const next = Array.from(days).sort((a, b) => a - b);
    patch({ byWeekday: next.length ? next : undefined });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              preset === p.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {rule && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          {showDays && (
            <div className="space-y-1.5">
              <Label className="text-xs">Repeat on</Label>
              <div className="flex gap-1">
                {WEEKDAY_LABELS.map((lbl, i) => {
                  const on = (rule.byWeekday ?? []).includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "h-9 flex-1 rounded-md border text-xs font-semibold transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showInterval && (
            <div className="space-y-1.5">
              <Label className="text-xs">Every N weeks</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={rule.interval}
                onChange={(e) =>
                  patch({ interval: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })
                }
                className="h-9 w-24"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Ends</Label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "never", label: "Never" },
                  { id: "count", label: "After N times" },
                  { id: "until", label: "On date" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.id === "never") patch({ end: { type: "never" } });
                    else if (opt.id === "count") patch({ end: { type: "count", count: 10 } });
                    else
                      patch({
                        end: {
                          type: "until",
                          date: maxDate ?? new Date().toISOString().slice(0, 10),
                        },
                      });
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    rule.end.type === opt.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {rule.end.type === "count" && (
              <Input
                type="number"
                min={1}
                max={999}
                value={rule.end.count}
                onChange={(e) =>
                  patch({
                    end: { type: "count", count: Math.max(1, Number(e.target.value) || 1) },
                  })
                }
                className="h-9 w-24"
              />
            )}
            {rule.end.type === "until" && (
              <DatePicker
                value={rule.end.date}
                onChange={(v) => patch({ end: { type: "until", date: v || "" } })}
                max={maxDate}
                className="w-full"
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">{describeRule(rule)}</p>
        </div>
      )}
    </div>
  );
}
