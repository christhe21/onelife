import { useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { progressFor, useAppData, DEFAULT_SKILLS } from "@/lib/app-data";

export function SkillsRadar() {
  const { goals, skills, tasks } = useAppData();

  const data = useMemo(() => {
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

      // "Planned" ceiling — how far you'd reach if every active/not-started
      // goal were completed. Equals 100 whenever any goals exist in the skill,
      // visualising the gap between current state and full ambition.
      const plannedCeiling = total === 0 ? 0 : 100;

      return {
        skill: s.label,
        achieved,
        planned: plannedCeiling,
        fullMark: 100,
        totalGoals: total,
        doneGoals: done,
        plannedGoals: planned,
      };
    });
  }, [goals, skills, tasks]);

  const hasData = data.some((d) => d.planned > 0);

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
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={data}
                outerRadius="60%"
                cx="50%"
                cy="50%"
                margin={{ top: 32, right: 64, bottom: 32, left: 64 }}
              >
                <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontFamily: "Manrope, sans-serif" }}
                  tickFormatter={(v: string) => v.replace(/\s*Skills?$/i, "")}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                  stroke="hsl(var(--border))"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val: number, name: string, item: any) => {
                    const p = item?.payload;
                    if (name === "Achieved")
                      return [`${val}% (${p?.doneGoals ?? 0}/${p?.totalGoals ?? 0} done)`, name];
                    if (name === "Planned") return [`${p?.plannedGoals ?? 0} in pipeline`, name];
                    return [val, name];
                  }}
                />
                <Legend
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <div className="flex w-full items-center justify-center gap-6 pt-4">
                        {payload?.map((entry, index) => (
                          <div key={`item-${index}`} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: entry.color,
                                opacity: entry.value === "Planned" ? 0.2 : 0.8
                              }}
                            />
                            <span className="text-sm font-medium text-foreground font-sans">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />

                {/* Planned ceiling — semi-transparent fill with dashed border */}
                <Radar
                  name="Planned"
                  dataKey="planned"
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.8}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.15}
                  isAnimationActive
                />

                {/* Achieved — clean solid color with sharp border */}
                <Radar
                  name="Achieved"
                  dataKey="achieved"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  dot={{
                    r: 3.5,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2.5,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
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
