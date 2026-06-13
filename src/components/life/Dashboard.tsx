import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, ListChecks, Sparkles, TrendingUp } from "lucide-react";
import { SkillProgress } from "@/components/life/SkillProgress";
import { SkillsRadar } from "@/components/life/SkillsRadar";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { EmptyStateHero } from "@/components/life/EmptyStateHero";
import { progressFor, useAppData } from "@/lib/app-data";

export function Dashboard() {
  const { goals, tasks, bucketList, skills } = useAppData();
  const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const activeGoals = goals.filter((g) => g.status !== "completed").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const dueSoon = tasks.filter((t) => !t.done && t.dueDate && t.dueDate <= weekAhead).length;
  const openTasks = tasks.filter((t) => !t.done).length;
  const bucketRemaining = bucketList.filter((b) => !b.achieved).length;
  const bucketDone = bucketList.filter((b) => b.achieved).length;

  const avgProgress =
    goals.length === 0
      ? 0
      : Math.round(goals.reduce((a, g) => a + progressFor(g, tasks), 0) / goals.length);

  const bySkill = skills
    .map((s) => ({ skill: s, goals: goals.filter((g) => g.skill === s.id) }))
    .filter((g) => g.goals.length > 0);

  const isEmpty = goals.length + tasks.length + bucketList.length === 0;

  return (
    <div className="space-y-6">
      {isEmpty && <EmptyStateHero />}

      <LifeTimeline />
      {/* Hero stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Active goals"
          value={activeGoals}
          sub={`${completedGoals} completed`}
          tone="primary"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg. progress"
          value={`${avgProgress}%`}
          sub={`across ${goals.length} goal${goals.length === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={<ListChecks className="h-4 w-4" />}
          label="Tasks open"
          value={openTasks}
          sub={`${dueSoon} due within 7 days`}
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Bucket list"
          value={bucketRemaining}
          sub={`${bucketDone} achieved`}
        />
      </div>

      {!isEmpty && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SkillsRadar />
          </div>
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-base font-semibold">Progress by skill</h2>
              <span className="text-xs text-muted-foreground">
                {bySkill.length} skill area{bySkill.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {bySkill.map(({ skill, goals: gs }) => (
                <Card key={skill.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: skill.color }}
                      />
                      <span className="font-display">{skill.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {gs.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gs.map((g) => {
                      const pct = progressFor(g, tasks);
                      return (
                        <div key={g.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate font-medium">{g.title}</span>
                          </div>
                          <SkillProgress value={pct} color={skill.color} />
                          {g.currentActivity && (
                            <p className="text-xs italic text-muted-foreground">
                              “{g.currentActivity}”
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "primary";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span
            className={
              tone === "primary"
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                : "flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
            }
          >
            {icon}
          </span>
        </div>
        <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
