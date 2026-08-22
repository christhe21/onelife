import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";
import { cn } from "@/lib/utils";
import type { TabId } from "@/components/life/AppShell";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

type TourStep = {
  id: string;
  tab: TabId;
  title: string;
  body: string;
  target?: string;
  calendarView?: CalendarViewMode;
  requireClick?: boolean;
};

const STEPS: TourStep[] = [
  {
    id: "dash-intro",
    tab: "dashboard",
    title: "This is your dashboard",
    body: "After onboarding, this is home. Rank, timeline, and stats for the goals you just created live here.",
    target: "tour-dashboard",
  },
  {
    id: "dash-rank",
    tab: "dashboard",
    title: "Rank",
    body: "Points from finishing tasks and milestones climb this ladder. Tap the card anytime to see the ranks.",
    target: "tour-rank",
  },
  {
    id: "dash-timeline",
    tab: "dashboard",
    title: "Life timeline",
    body: "A long view of your goal windows. It is how OneLife keeps the year visible without opening Calendar.",
    target: "tour-timeline",
  },
  {
    id: "dash-stats",
    tab: "dashboard",
    title: "The numbers",
    body: "Active goals, average progress, open tasks, and bucket-list items. These update as you check things off.",
    target: "tour-stats",
  },
  {
    id: "today",
    tab: "today",
    title: "Today",
    body: "What to do now. Tasks due or scheduled today show up here so you do not have to hunt the calendar.",
  },
  {
    id: "cal-intro",
    tab: "calendar",
    title: "Calendar",
    body: "Scheduled tasks live here. Four views: Agenda, Day, Week, and Month. Next you will click through each one.",
    calendarView: "agenda",
  },
  {
    id: "cal-agenda",
    tab: "calendar",
    title: "Agenda",
    body: "A list of upcoming blocks, grouped by day. Click Agenda in the view switcher to open it.",
    target: "tour-cal-agenda",
    calendarView: "agenda",
    requireClick: true,
  },
  {
    id: "cal-day",
    tab: "calendar",
    title: "Day",
    body: "One date, hour by hour. Click Day to see timed blocks and the now-line.",
    target: "tour-cal-day",
    calendarView: "day",
    requireClick: true,
  },
  {
    id: "cal-week",
    tab: "calendar",
    title: "Week",
    body: "Monday–Sunday grid. Click Week. Drag events between days when you need to reschedule.",
    target: "tour-cal-week",
    calendarView: "week",
    requireClick: true,
  },
  {
    id: "cal-month",
    tab: "calendar",
    title: "Month",
    body: "The big picture. Heat and streaks show busy days. Click Month, then continue.",
    target: "tour-cal-month",
    calendarView: "month",
    requireClick: true,
  },
  {
    id: "overview",
    tab: "overview",
    title: "Overview",
    body: "The hierarchy as a tree or map: life area → goal → milestone → task. Same pattern as onboarding.",
  },
  {
    id: "goals",
    tab: "goals",
    title: "Goals",
    body: "Edit the goals from onboarding, add milestones, or import a template from the marketplace.",
  },
  {
    id: "tasks",
    tab: "tasks",
    title: "Tasks",
    body: "The working list. Check items off, nest subtasks, or send a block onto the calendar.",
  },
  {
    id: "bucket",
    tab: "bucket",
    title: "Bucket list",
    body: "Wishes without a schedule. Promote one into a goal when you are ready to work it.",
  },
  {
    id: "skills",
    tab: "skills",
    title: "Skills",
    body: "Life areas and their colors. Goals inherit the color of the area they belong to.",
  },
  {
    id: "settings-intro",
    tab: "settings",
    title: "Settings",
    body: "Profile, reminders, and how the app looks. Two controls most people change first: color and font size.",
  },
  {
    id: "settings-theme",
    tab: "settings",
    title: "Color and theme",
    body: "Light, dark, or system — then a color palette. Try one; you can switch anytime.",
    target: "tour-settings-theme",
  },
  {
    id: "settings-type",
    tab: "settings",
    title: "Text size",
    body: "Compact through Large. This scales type across the whole app, not just this page.",
    target: "tour-settings-type",
  },
];

function queryTarget(id?: string): HTMLElement | null {
  if (!id) return null;
  return document.querySelector(`[data-tour="${id}"]`);
}

function clickCalendarTab(label: string) {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]')) as HTMLElement[];
  const match = tabs.find((el) => el.textContent?.trim().toLowerCase() === label.toLowerCase());
  match?.click();
}

export function GuidedTour({
  tab,
  onTab,
  startSignal = 0,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  /** Increment to start or replay the tour from Settings. */
  startSignal?: number;
}) {
  const { settings, updateSettings } = useAppData();
  const [phase, setPhase] = useState<"idle" | "invite" | "tour">("idle");
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [waiting, setWaiting] = useState(false);
  const ignoreClick = useRef(false);

  const step = STEPS[idx];

  useEffect(() => {
    if (startSignal > 0) {
      setIdx(0);
      setPhase("tour");
      onTab("dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal]);

  useEffect(() => {
    if (phase !== "idle") return;
    if (!settings.onboardedAt) return;
    if (settings.tutorialCompletedAt) return;
    setPhase("invite");
  }, [phase, settings.onboardedAt, settings.tutorialCompletedAt]);

  const finish = (status: "completed" | "skipped") => {
    updateSettings({ tutorialCompletedAt: `${status}:${new Date().toISOString()}` });
    setPhase("idle");
    setIdx(0);
    onTab("dashboard");
  };

  const go = (nextIdx: number) => {
    const next = STEPS[nextIdx];
    if (!next) {
      finish("completed");
      return;
    }
    setIdx(nextIdx);
    onTab(next.tab);
    setWaiting(!!next.requireClick);
  };

  useEffect(() => {
    if (phase !== "tour" || !step) return;
    if (tab !== step.tab) onTab(step.tab);
    if (step.calendarView) {
      ignoreClick.current = true;
      const t = window.setTimeout(() => {
        clickCalendarTab(step.calendarView!);
        window.setTimeout(() => {
          ignoreClick.current = false;
        }, 280);
      }, 60);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, step?.id]);

  useLayoutEffect(() => {
    if (phase !== "tour") return;
    const measure = () => {
      const el = queryTarget(step?.target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    const t = window.setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [phase, idx, step?.target, tab]);

  useEffect(() => {
    if (phase !== "tour" || !step?.requireClick) return;
    const onClick = (e: MouseEvent) => {
      if (ignoreClick.current) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const hit = step.target ? el.closest(`[data-tour="${step.target}"]`) : null;
      if (hit) {
        setWaiting(false);
        window.setTimeout(() => go(idx + 1), 180);
        return;
      }
      if (step.calendarView) {
        const tabEl = el.closest('[role="tab"]') as HTMLElement | null;
        if (tabEl && tabEl.textContent?.trim().toLowerCase() === step.calendarView) {
          setWaiting(false);
          window.setTimeout(() => go(idx + 1), 180);
        }
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, step?.id]);

  const pad = 8;
  const highlight = useMemo(() => {
    if (!rect) return null;
    return {
      top: Math.max(8, rect.top - pad),
      left: Math.max(8, rect.left - pad),
      width: Math.min(window.innerWidth - 16, rect.width + pad * 2),
      height: Math.min(window.innerHeight - 16, rect.height + pad * 2),
    };
  }, [rect]);

  if (phase === "idle") return null;

  if (phase === "invite") {
    return (
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center">
        <div
          role="dialog"
          aria-labelledby="tour-invite-title"
          className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Compass className="h-6 w-6" />
          </div>
          <h2 id="tour-invite-title" className="font-display text-center text-xl font-semibold">
            Do you want a tutorial on this?
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            A short walk through Dashboard, Calendar (agenda → day → week → month), Overview, and
            Settings — including font and color.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => finish("skipped")}>
              Skip
            </Button>
            <Button
              onClick={() => {
                setIdx(0);
                setPhase("tour");
                onTab("dashboard");
              }}
            >
              Start tutorial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <div className="pointer-events-auto absolute inset-0 bg-black/55" onClick={() => undefined} />
      {highlight && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          }}
        />
      )}

      <div
        className={cn(
          "pointer-events-auto absolute left-1/2 z-[81] w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border bg-background p-4 shadow-2xl",
          highlight && highlight.top > window.innerHeight / 2 ? "bottom-4" : "bottom-4 sm:bottom-8",
        )}
        role="dialog"
        aria-labelledby="tour-step-title"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
              {step.tab} · {idx + 1} of {STEPS.length}
            </p>
            <h3 id="tour-step-title" className="font-display text-base font-semibold">
              {step.title}
            </h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            aria-label="Skip tutorial"
            onClick={() => finish("skipped")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{step.body}</p>
        {waiting && (
          <p className="mt-2 text-xs font-medium text-primary">
            Click {step.calendarView ?? "the highlighted control"} to continue
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={idx === 0}
            onClick={() => go(Math.max(0, idx - 1))}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
          </Button>
          <Button size="sm" onClick={() => go(idx + 1)} disabled={waiting}>
            {idx === STEPS.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
