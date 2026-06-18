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
        total === 0
          ? 0
          : Math.round(gs.reduce((a, g) => a + progressFor(g, tasks), 0) / total);

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
          Solid shape = what you've achieved. Outer ring = your planned ambition
          (in‑progress + not‑started goals).
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 w-full sm:h-96">
          <ClientOnly fallback={<div className="h-full" />}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={data}
                outerRadius="68%"
                cx="50%"
                cy="52%"
                margin={{ top: 24, right: 56, bottom: 24, left: 56 }}
              >
                <defs>
                  <linearGradient id="radarAchieved" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.95} />
                    <stop offset="25%" stopColor="#8b5cf6" stopOpacity={0.95} />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity={0.95} />
                    <stop offset="75%" stopColor="#f59e0b" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
                  </linearGradient>
                  <linearGradient id="radarPlanned" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.18} />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.18} />
                  </linearGradient>
                  {/* 3D depth: soft drop shadow + inner highlight */}
                  <filter id="radar3d" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                    <feOffset dx="3" dy="6" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.55" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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
                    if (name === "Planned")
                      return [`${p?.plannedGoals ?? 0} in pipeline`, name];
                    return [val, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                />

                {/* Planned ceiling — translucent outer shell */}
                <Radar
                  name="Planned"
                  dataKey="planned"
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.6}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="url(#radarPlanned)"
                  fillOpacity={1}
                  isAnimationActive
                />

                {/* 3D shadow layer (offset, blurred) */}
                <Radar
                  name="shadow"
                  dataKey="achieved"
                  stroke="none"
                  fill="#000"
                  fillOpacity={0.18}
                  legendType="none"
                  isAnimationActive={false}
                  style={{ filter: "url(#radar3d)", transform: "translate(4px, 8px)" }}
                />

                {/* Achieved — vivid gradient with glow */}
                <Radar
                  name="Achieved"
                  dataKey="achieved"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#radarAchieved)"
                  fillOpacity={0.85}
                  dot={{
                    r: 3,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{ r: 5 }}
                  style={{ filter: "url(#radarGlow)" }}
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
