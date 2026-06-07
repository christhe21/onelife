import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "onelife-due-banner-dismissed";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function DueBanner({ onGoTasks }: { onGoTasks: () => void }) {
  const { tasks } = useAppData();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissedFor(window.localStorage.getItem(DISMISS_KEY));
  }, []);

  const today = todayStr();
  const dueToday = tasks.filter((t) => !t.done && t.dueDate && t.dueDate <= today);

  if (dueToday.length === 0) return null;
  if (dismissedFor === today) return null;

  const overdue = dueToday.filter((t) => t.dueDate! < today).length;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        <AlertCircle className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="font-medium text-foreground">
          {dueToday.length} task{dueToday.length === 1 ? "" : "s"} need attention
          {overdue > 0 && <span className="ml-1 text-destructive">({overdue} overdue)</span>}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {dueToday
            .slice(0, 3)
            .map((t) => t.title)
            .join(" · ")}
          {dueToday.length > 3 && ` +${dueToday.length - 3} more`}
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" className="h-7 rounded-full px-3 text-xs" onClick={onGoTasks}>
            Review tasks
          </Button>
        </div>
      </div>
      <button
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, today);
          setDismissedFor(today);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
