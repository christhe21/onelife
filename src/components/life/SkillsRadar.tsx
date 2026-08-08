import { lazy, Suspense, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { progressFor, useAppData, DEFAULT_SKILLS } from "@/lib/app-data";
import type { RadarDatum } from "@/components/life/SkillsRadarChart";

const SkillsRadarChart = lazy(() => import("@/components/life/SkillsRadarChart"));

/** Keep axis labels short so they never clip the chart's edges. */
function shortLabel(label: string) {
  const base = label.replace(/\s*Skills?$/i, "").trim();
  if (base.length <= 12) return base;
  const first = base.split(/\s+/)[0];
  return first.length <= 12 ? first : `${base.slice(0, 11)}…`;
}

export function SkillsRadar() {
  const { goals, skills, tasks } = useAppData();

  const data = useMemo<RadarDatum[]>(() => {
    const combinedSkills = [...DEFAULT_SKILLS];
    skills.forEach((s) => {
      if (!combinedSkills.some((ds) => ds.id === s.id)) combinedSkills.push(s);
    });

    return combinedSkills.map((ds) => {
      const s = skills.find((x) => x.id === ds.id) || ds;
      const gs = goals.filter((g) => g.skill === s.id);

      const total = gs.length;
      const done = gs.filter((g) => g.status === "completed").length;
      const planned = gs.filter((g) => g.status !== "completed").length;

      const achieved =
        total === 0 ? 0 : Math.round(gs.reduce((a, g) => a + progressFor(g, tasks), 0) / total);

      return {
        skill: shortLabel(s.label),
        Achieved: achieved,
        Planned: total === 0 ? 0 : 100,
        totalGoals: total,
        doneGoals: done,
        plannedGoals: planned,
      };
    });
  }, [goals, skills, tasks]);

  const hasData = data.some((d) => d.Planned > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">Development radar</CardTitle>
        <p className="text-xs text-muted-foreground">
          Solid shape = what you've achieved. Outer ring = your planned ambition (in‑progress +
          not‑started goals).
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 w-full sm:h-96">
          <ClientOnly fallback={<div className="h-full" />}>
            <Suspense fallback={<div className="h-full" />}>
              <SkillsRadarChart data={data} />
            </Suspense>
          </ClientOnly>

          {!hasData && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm text-muted-foreground">
              <span className="rounded bg-background/80 px-2 py-1 backdrop-blur-sm">
                Add goals to each skill to see your balance.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
