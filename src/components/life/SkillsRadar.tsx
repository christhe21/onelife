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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { progressFor, useAppData, DEFAULT_SKILLS } from "@/lib/app-data";

export function SkillsRadar() {
  const { goals, skills, tasks } = useAppData();

  const data = useMemo(() => {
    // Ensure all 8 default skills are always present in the radar chart
    const combinedSkills = [...DEFAULT_SKILLS];
    skills.forEach((s) => {
      if (!combinedSkills.some((ds) => ds.id === s.id)) {
        combinedSkills.push(s);
      }
    });

    return combinedSkills.map((ds) => {
      // Use user-modified skill if it exists, otherwise default
      const s = skills.find((x) => x.id === ds.id) || ds;
      const gs = goals.filter((g) => g.skill === s.id);
      const avg =
        gs.length === 0
          ? 0
          : Math.round(gs.reduce((a, g) => a + progressFor(g, tasks), 0) / gs.length);
      return { skill: s.label, value: avg, fullMark: 100, color: s.color };
    });
  }, [goals, skills, tasks]);

  const hasData = data.some((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">Development radar</CardTitle>
        <p className="text-xs text-muted-foreground">
          Average progress per skill area — see where you are well-rounded and where to invest.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-72 w-full">
          <ClientOnly fallback={<div className="h-full" />}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="78%">
                <defs>
                  <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Progress"]}
                />
                <Radar name="Progress" dataKey="value" stroke="none" fill="url(#radarFill)" />
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
