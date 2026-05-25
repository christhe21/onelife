import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SKILLS, progressFor, skillMeta, useAppData } from "@/lib/app-data";

export function Dashboard() {
  const { goals, tasks, bucketList } = useAppData();
  const today = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const activeGoals = goals.filter((g) => g.status !== "completed").length;
  const dueSoon = tasks.filter((t) => !t.done && t.dueDate && t.dueDate <= weekAhead).length;
  const bucketRemaining = bucketList.filter((b) => !b.achieved).length;

  const bySkill = SKILLS.map((s) => ({
    skill: s,
    goals: goals.filter((g) => g.skill === s.id),
  })).filter((g) => g.goals.length > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active goals</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{activeGoals}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tasks due in 7 days</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{dueSoon}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bucket list remaining</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{bucketRemaining}</div></CardContent>
        </Card>
      </div>

      {bySkill.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Add a goal to see your dashboard.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {bySkill.map(({ skill, goals: gs }) => (
            <Card key={skill.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: skill.color }} />
                  {skill.label}
                  <Badge variant="secondary" className="ml-2">{gs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {gs.map((g) => {
                  const pct = progressFor(g);
                  const meta = skillMeta(g.skill);
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{g.title}</span>
                        <span className="text-xs text-muted-foreground" style={{ color: meta.color }}>{pct}%</span>
                      </div>
                      <Progress value={pct} />
                      {g.currentActivity && (
                        <div className="text-xs text-muted-foreground">→ {g.currentActivity}</div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {goals.length + tasks.length + bucketList.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Your data lives only in this browser session. Use Export to save it, Import to restore it.
        </p>
      )}
    </div>
  );
}
