import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";
import { TOUR_STEPS, type CalendarTourView, type OverviewTourView } from "@/lib/product-tour";
import type { TabId } from "@/components/life/AppShell";
import { cn } from "@/lib/utils";

type Phase = "idle" | "invite" | "running";

type Rect = { top: number; left: number; width: number; height: number; radius: number };

const TOUR_DONE_KEY = "onelife:tour-completed";
const TOUR_NEVER_KEY = "onelife:tour-never";

const TARGET_LABELS: Record<string, string> = {
  "cal-agenda": "Agenda",
  "cal-day": "Day",
  "cal-week": "Week",
  "cal-month": "Month",
  "overview-tree": "Tree",
  "overview-map": "Map",
  "settings-appearance": "Appearance",
  "settings-type": "Text size",
};

export function findTourTarget(target?: string): HTMLElement | null {
  if (!target) return null;
  const byAttr = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (byAttr) return byAttr;
  const label = TARGET_LABELS[target];
  if (!label) return null;
  const buttons = Array.from(document.querySelectorAll("button"));
  const exactBtn =
    buttons.find((b) => {
      const text = b.textContent?.replace(/\s+/g, " ").trim() ?? "";
      return text === label || text.endsWith(label);
    }) ?? null;
  if (exactBtn) return exactBtn;
  const titled = Array.from(document.querySelectorAll("h2, h3, div, span")).filter((el) => {
    const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return text === label || text.startsWith(label + " ") || text.endsWith(" " + label);
  });
  titled.sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0));
  const hit = titled[0] as HTMLElement | undefined;
  return (hit?.closest("[class*='rounded']") as HTMLElement | null) ?? hit ?? null;
}

function readCornerRadius(el: HTMLElement, holeW: number, holeH: number) {
  const raw = window.getComputedStyle(el).borderTopLeftRadius || "0";
  const parsed = Number.parseFloat(raw);
  const fromEl = Number.isFinite(parsed) ? parsed : 0;
  const padded = fromEl > 2 ? fromEl + 6 : 14;
  return Math.min(padded, holeW / 2, holeH / 2);
}

function writeTourDoneFlag(done: boolean) {
  try {
    if (done) window.localStorage.setItem(TOUR_DONE_KEY, "1");
    else window.localStorage.removeItem(TOUR_DONE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

function readTourDoneFlag() {
  try {
    return window.localStorage.getItem(TOUR_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeTourNeverFlag() {
  try {
    window.localStorage.setItem(TOUR_NEVER_KEY, "1");
  } catch {
    /* ignore */
  }
}

function clearTourNeverFlag() {
  try {
    window.localStorage.removeItem(TOUR_NEVER_KEY);
  } catch {
    /* ignore */
  }
}

function readTourNeverFlag() {
  try {
    return window.localStorage.getItem(TOUR_NEVER_KEY) === "1";
  } catch {
    return false;
  }
}

export function ProductTour({
  tab,
  onTab,
  onCalendarView,
  onOverviewView,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  onCalendarView?: (v: CalendarTourView) => void;
  onOverviewView?: (v: OverviewTourView) => void;
}) {
  const { settings } = useAppData();
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [hole, setHole] = useState<Rect | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const dismiss = useCallback(() => {
    writeTourDoneFlag(true);
    setPhase("idle");
    setStepIdx(0);
    setHole(null);
  }, []);

  const never = useCallback(() => {
    writeTourNeverFlag();
    writeTourDoneFlag(true);
    setPhase("idle");
    setStepIdx(0);
    setHole(null);
  }, []);

  const start = useCallback(() => {
    writeTourDoneFlag(false);
    clearTourNeverFlag();
    setStepIdx(0);
    setPhase("running");
  }, []);

  useEffect(() => {
    if (!settings.onboardedAt || readTourDoneFlag() || readTourNeverFlag()) return;
    const t = window.setTimeout(() => {
      if (phaseRef.current === "idle") setPhase("invite");
    }, 450);
    return () => window.clearTimeout(t);
  }, [settings.onboardedAt]);

  useEffect(() => {
    const onReplay = () => {
      writeTourDoneFlag(false);
      start();
    };
    window.addEventListener("onelife:start-tour", onReplay);
    return () => window.removeEventListener("onelife:start-tour", onReplay);
  }, [start]);

  const step = TOUR_STEPS[stepIdx];

  useEffect(() => {
    if (phase !== "running" || !step) return;
    onTab(step.tab);
    if (step.calendarView) onCalendarView?.(step.calendarView);
    if (step.overviewView) onOverviewView?.(step.overviewView);
    const clickTimer = window.setTimeout(() => {
      if (!step.target || !step.advanceOnTargetClick) return;
      findTourTarget(step.target)?.click();
    }, 70);
    return () => window.clearTimeout(clickTimer);
  }, [phase, step, onTab, onCalendarView, onOverviewView]);

  const measure = useCallback(() => {
    if (phase !== "running" || !step?.target) {
      setHole(null);
      return false;
    }
    const el = findTourTarget(step.target);
    if (!el) {
      setHole(null);
      return false;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const r = el.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) {
      setHole(null);
      return false;
    }
    const pad = 8;
    const width = r.width + pad * 2;
    const height = r.height + pad * 2;
    setHole({
      top: r.top - pad,
      left: r.left - pad,
      width,
      height,
      radius: readCornerRadius(el, width, height),
    });
    return true;
  }, [phase, step]);

  useLayoutEffect(() => {
    if (phase !== "running") return;
    let attempts = 0;
    let timer = 0;
    const tick = () => {
      const ok = measure();
      attempts += 1;
      if (!ok && attempts < 16) timer = window.setTimeout(tick, 60);
    };
    tick();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [phase, stepIdx, tab, measure]);

  const next = useCallback(() => {
    if (stepIdx >= TOUR_STEPS.length - 1) {
      dismiss();
      return;
    }
    setStepIdx((i) => i + 1);
  }, [dismiss, stepIdx]);

  const back = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, next, back, dismiss]);

  useEffect(() => {
    if (phase !== "running" || !step?.advanceOnTargetClick || !step.target) return;
    let armed = false;
    const arm = window.setTimeout(() => {
      armed = true;
    }, 180);
    const onClick = (e: MouseEvent) => {
      if (!armed) return;
      const el = findTourTarget(step.target);
      if (el && e.target instanceof Node && el.contains(e.target)) {
        window.setTimeout(next, 140);
      }
    };
    window.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("click", onClick, true);
    };
  }, [phase, step, next]);

  if (phase === "idle") return null;

  if (phase === "invite") {
    return (
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center">
        <div
          role="dialog"
          aria-labelledby="tour-invite-title"
          className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 id="tour-invite-title" className="font-display text-xl font-semibold">
            Want a quick tour?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Eight short stops: dashboard, today, calendar, overview, goals, tasks and settings. Takes
            under a minute, and you can replay it later from Settings.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={never} className="sm:mr-auto">
              Never show this
            </Button>
            <Button variant="ghost" onClick={dismiss}>
              Not now
            </Button>
            <Button onClick={start}>
              Take the tour <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tooltipStyle = tooltipPosition(hole);

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden" aria-live="polite">
      <SpotlightMask hole={hole} />
      <div
        className={cn(
          "absolute z-[81] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border bg-card p-4 shadow-2xl",
        )}
        style={tooltipStyle}
        role="dialog"
        aria-labelledby="tour-step-title"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
            {step.section} · {stepIdx + 1} of {TOUR_STEPS.length}
          </p>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={dismiss}
            aria-label="Skip tutorial"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <h2 id="tour-step-title" className="font-display text-base font-semibold">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
        {step.advanceOnTargetClick && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Click the highlighted control to open it, or press Next.
          </p>
        )}
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stepIdx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={back} disabled={stepIdx === 0}>
            Back
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={dismiss}>
              Skip tour
            </Button>
            <Button size="sm" onClick={next}>
              {stepIdx === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dim the page with a rounded cutout so the ring and the hole share the same curve. */
function SpotlightMask({ hole }: { hole: Rect | null }) {
  if (!hole) {
    return <div className="absolute inset-0 bg-foreground/50" />;
  }
  const { top, left, width, height, radius } = hole;
  return (
    <>
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
      <div className="absolute" style={{ top: top + height, left: 0, right: 0, bottom: 0 }} />
      <div className="absolute" style={{ top, left: 0, width: Math.max(0, left), height }} />
      <div className="absolute" style={{ top, left: left + width, right: 0, height }} />
      <div
        className="pointer-events-none absolute"
        style={{
          top,
          left,
          width,
          height,
          borderRadius: radius,
          boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.5)",
          outline: "2px solid hsl(var(--primary))",
          outlineOffset: 0,
        }}
      />
    </>
  );
}

function tooltipPosition(hole: Rect | null): CSSProperties {
  const width = Math.min(352, typeof window === "undefined" ? 352 : window.innerWidth - 24);
  if (!hole) {
    return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(Math.max(12, hole.left), vw - width - 12);
  const below = hole.top + hole.height + 12;
  if (below + 230 < vh) return { top: below, left };
  const above = hole.top - 12 - 210;
  if (above > 12) return { top: Math.max(12, above), left };
  return { top: Math.max(12, vh / 2 - 110), left };
}

export function startProductTour() {
  window.dispatchEvent(new Event("onelife:start-tour"));
}
