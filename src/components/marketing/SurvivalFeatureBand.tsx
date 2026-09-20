import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AREAS = [
  { icon: Brain, label: "Steady your mind" },
  { icon: HeartPulse, label: "Care for your body" },
  { icon: BriefcaseBusiness, label: "Work within your capacity" },
  { icon: ShieldCheck, label: "Prepare without panic" },
];

export function SurvivalFeatureBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cn("survival-band relative isolate overflow-hidden", entered && "is-visible")}
      aria-labelledby="survival-heading"
    >
      <div className="survival-band-garden" aria-hidden="true">
        <span className="survival-stem survival-stem-left" />
        <span className="survival-stem survival-stem-right" />
        <span className="survival-butterfly">
          <span className="survival-wing survival-wing-left" />
          <span className="survival-wing survival-wing-right" />
        </span>
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-center lg:py-24">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Survival Mode
          </div>
          <h2 id="survival-heading" className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Some days are not for chasing goals.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            When life feels heavy, switch to a calm daily protocol for your mind, body, work,
            recovery, and practical readiness.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link to="/survival">
                Enter Survival Mode <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">No goals, ranks, streaks, or AI.</p>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.label} className="flex min-h-28 flex-col justify-between bg-card p-5">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <p className="mt-6 text-sm font-medium text-card-foreground">{area.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}