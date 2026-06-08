import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data";

function hmToTodayISO(hm: string, dateYMD?: string): string {
  const [h, m] = hm.split(":").map(Number);
  const d = dateYMD ? new Date(`${dateYMD}T00:00:00`) : new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

function formatHours(h: number): string {
  if (h <= 0) return "0h";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return `${mm}m`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}

interface FlatItem {
  kind: "task" | "subtask";
  taskId: string;
  subId?: string;
  title: string;
  goalTitle?: string;
  skillColor?: string;
  plannedHours?: number;
  spentHours?: number;
}

export function AddToScheduleDialog({
  open,
  onOpenChange,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: string;
}) {
  const { tasks, goals, skills, updateTask, updateSubtask } = useAppData();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FlatItem | null>(null);
  const now = new Date();
  const defaultStart = `${String(now.getHours()).padStart(2, "0")}:00`;
  const defaultEnd = `${String((now.getHours() + 1) % 24).padStart(2, "0")}:00`;
  const [from, setFrom] = useState(defaultStart);
  const [till, setTill] = useState(defaultEnd);
  const [plannedHoursStr, setPlannedHoursStr] = useState("");

  const flat: FlatItem[] = useMemo(() => {
    const out: FlatItem[] = [];
    for (const t of tasks) {
      const g = goals.find((x) => x.id === t.goalId);
      const sk = skills.find((s) => s.id === g?.skill);
      out.push({
        kind: "task",
        taskId: t.id,
        title: t.title,
        goalTitle: g?.title,
        skillColor: sk?.color,
        plannedHours: t.plannedHours,
        spentHours: t.spentHours,
      });
      for (const s of t.subtasks) {
        out.push({
          kind: "subtask",
          taskId: t.id,
          subId: s.id,
          title: s.title,
          goalTitle: t.title,
          skillColor: sk?.color,
          plannedHours: s.plannedHours,
          spentHours: s.spentHours,
        });
      }
    }
    return out;
  }, [tasks, goals, skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? flat.filter(
          (i) => i.title.toLowerCase().includes(q) || (i.goalTitle ?? "").toLowerCase().includes(q),
        )
      : flat;
    return base.slice(0, 60);
  }, [flat, query]);

  const reset = () => {
    setQuery("");
    setSelected(null);
    setFrom(defaultStart);
    setTill(defaultEnd);
    setPlannedHoursStr("");
  };

  // Duration in hours from the time pickers
  const durationH = useMemo(() => {
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = till.split(":").map(Number);
    return Math.max(0, (th * 60 + tm - fh * 60 - fm) / 60);
  }, [from, till]);

  // Sync planned hours field when a new item is selected
  const onPick = (i: FlatItem) => {
    setSelected(i);
    setPlannedHoursStr(i.plannedHours != null ? String(i.plannedHours) : "");
  };

  const submit = () => {
    if (!selected) return;
    const startIso = hmToTodayISO(from, defaultDate);
    const endIso = hmToTodayISO(till, defaultDate);
    const parsedPlanned = plannedHoursStr.trim() === "" ? undefined : Number(plannedHoursStr);
    const patch: { startDate: string; endDate: string; plannedHours?: number } = {
      startDate: startIso,
      endDate: endIso,
    };
    if (parsedPlanned != null && isFinite(parsedPlanned) && parsedPlanned >= 0) {
      patch.plannedHours = parsedPlanned;
    }
    if (selected.kind === "task") {
      updateTask(selected.taskId, patch);
    } else if (selected.subId) {
      updateSubtask(selected.taskId, selected.subId, patch);
    }
    onOpenChange(false);
    reset();
  };

  const remaining =
    selected?.plannedHours != null
      ? Math.max(0, selected.plannedHours - (selected.spentHours ?? 0))
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-md flex-col gap-3 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base sm:text-lg">Add to schedule</DialogTitle>
          <DialogDescription className="text-xs">
            Search a task or subtask, then pick a time window.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Search tasks & subtasks…"
              className="pl-8 text-base"
            />
          </div>

          {selected ? (
            <div className="flex min-w-0 items-start gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-sm">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: selected.skillColor ?? "#888" }}
              />
              {selected.kind === "subtask" && (
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                  sub
                </Badge>
              )}
              <span className="min-w-0 flex-1 break-words leading-snug">{selected.title}</span>

              {remaining != null && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatHours(remaining)} / {formatHours(selected.plannedHours!)} left
                </span>
              )}
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="max-h-56 min-w-0 overflow-y-auto rounded-md border">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No matches. Try another search.
                </p>
              ) : (
                <ul className="divide-y">
                  {filtered.map((i) => (
                    <li key={`${i.kind}-${i.taskId}-${i.subId ?? ""}`} className="min-w-0">
                      <button
                        onClick={() => onPick(i)}
                        className="flex w-full min-w-0 items-start gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted/60"
                      >
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: i.skillColor ?? "#888" }}
                        />
                        {i.kind === "subtask" && (
                          <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                            sub
                          </Badge>
                        )}
                        <span className="min-w-0 flex-1 break-words leading-snug">
                          {i.title}
                          {i.goalTitle && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              · {i.goalTitle}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <label className="min-w-0 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">From</span>
              <Input
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="text-base"
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Till</span>
              <Input
                type="time"
                value={till}
                onChange={(e) => setTill(e.target.value)}
                className="text-base"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Estimated hours (total)
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.25}
                value={plannedHoursStr}
                onChange={(e) => setPlannedHoursStr(e.target.value)}
                placeholder="e.g. 4"
                className="text-base"
              />
            </label>
            <div className="rounded-md bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
              This block:{" "}
              <span className="font-medium text-foreground">{formatHours(durationH)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!selected || from >= till}
            className="w-full sm:w-auto"
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
