import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { suggestItems } from "@/lib/ai-plan.functions";

export interface AiSuggestion {
  title: string;
  date?: string;
  priority: "low" | "medium" | "high";
  hoursPerWeek?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "milestones" | "tasks" | "subtasks";
  goalTitle: string;
  goalDescription?: string;
  targetDate?: string;
  parentTitle?: string;
  existing?: string[];
  onAccept: (items: AiSuggestion[]) => void;
}

const TITLES = {
  milestones: "Suggest milestones",
  tasks: "Suggest next tasks",
  subtasks: "Break this down",
} as const;

export function AiSuggestDialog({
  open,
  onOpenChange,
  kind,
  goalTitle,
  goalDescription,
  targetDate,
  parentTitle,
  existing = [],
  onAccept,
}: Props) {
  const suggest = useServerFn(suggestItems);
  const [items, setItems] = useState<AiSuggestion[]>([]);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await suggest({
        data: {
          kind,
          today: new Date().toISOString().slice(0, 10),
          goalTitle,
          goalDescription,
          targetDate,
          parentTitle,
          existing,
        },
      });
      setItems(res);
      setPicked(Object.fromEntries(res.map((_, i) => [i, true])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open) {
      setItems([]);
      setPicked({});
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chosen = items.filter((_, i) => picked[i]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> {TITLES[kind]}
          </DialogTitle>
        </DialogHeader>

        {busy && (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking about “{parentTitle ?? goalTitle}”…
          </p>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {!busy && items.length > 0 && (
          <div className="space-y-2">
            {items.map((it, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-2 rounded-lg border bg-card/50 p-2 text-sm"
              >
                <Checkbox
                  checked={!!picked[i]}
                  onCheckedChange={(v) => setPicked((cur) => ({ ...cur, [i]: !!v }))}
                />
                <span>
                  {it.title}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    {it.date ? `· ${it.date}` : ""}
                    {kind === "tasks" ? ` · ${it.priority}` : ""}
                    {it.hoursPerWeek ? ` · ${it.hoursPerWeek}h/wk` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
            Regenerate
          </Button>
          <Button
            size="sm"
            disabled={busy || chosen.length === 0}
            onClick={() => {
              onAccept(chosen);
              onOpenChange(false);
            }}
          >
            Add {chosen.length || ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
