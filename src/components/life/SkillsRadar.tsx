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
import { progressFor, useAppData } from "@/lib/app-data";

export function SkillsRadar() {
  const { goals, skills, tasks } = useAppData();

  const data = useMemo(() => {
    return skills.map((s) => {
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
        <div className="h-72 w-full">
          {hasData ? (
            <ClientOnly fallback={<div className="h-full" />}>
              <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="78%">
                <defs>
                  <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
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
                <Radar
                  name="Progress"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#radarFill)"
                />
              </RadarChart>
            </ResponsiveContainer>
            </ClientOnly>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Add goals and progress to see your radar.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
