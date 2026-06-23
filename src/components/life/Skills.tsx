import { useState } from "react";
import { Plus, Trash2, Palette, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data";
import { toast } from "sonner";

const DEFAULT_SESSION_H = 2;

export function Skills() {
  const { skills, addSkill, updateSkill, deleteSkill, goals, tasks, autoScheduleSkill } =
    useAppData();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#10b981");

  const submit = () => {
    if (!label.trim()) return;
    addSkill({ label, color });
    setLabel("");
    setColor("#10b981");
  };

  // Estimate remaining work per skill: sum (plannedHours - spentHours) of incomplete
  // tasks/subtasks belonging to goals of this skill. Falls back to 2h per item when
  // plannedHours is missing (matches the auto-schedule default block).
  const estimateForSkill = (skillId: string) => {
    const skillGoalIds = new Set(goals.filter((g) => g.skill === skillId).map((g) => g.id));
    const skillSubGoalIds = new Set(
      goals.filter((g) => g.skill === skillId).flatMap((g) => g.subGoals.map((sg) => sg.id)),
    );
    let hours = 0;
    let items = 0;
    let unscheduled = 0;
    for (const t of tasks) {
      const belongs =
        (t.subGoalId && skillSubGoalIds.has(t.subGoalId)) ||
        (t.goalId && skillGoalIds.has(t.goalId));
      if (!belongs) continue;
      const hasSubs = t.subtasks.length > 0;
      if (hasSubs) {
        for (const s of t.subtasks) {
          if (s.done) continue;
          const planned = s.plannedHours ?? DEFAULT_SESSION_H;
          hours += Math.max(0, planned - (s.spentHours ?? 0));
          items++;
          if (!s.startDate || !s.endDate) unscheduled++;
        }
      } else {
        if (t.done) continue;
        const planned = t.plannedHours ?? DEFAULT_SESSION_H;
        hours += Math.max(0, planned - (t.spentHours ?? 0));
        items++;
        if (!t.startDate || !t.endDate) unscheduled++;
      }
    }
    return { hours, items, unscheduled };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">New skill name</Label>
            <Input
              placeholder="e.g. Mindfulness"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
            />
          </div>
          <Button onClick={submit}>
            <Plus className="mr-2 h-4 w-4" />
            Add skill
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-2">
        {skills.map((s) => {
          const inUse = goals.filter((g) => g.skill === s.id).length;
          const est = estimateForSkill(s.id);
          const sessions = Math.ceil(est.hours / DEFAULT_SESSION_H);
          return (
            <Card key={s.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => updateSkill(s.id, { color: e.target.value })}
                    className="h-9 w-10 cursor-pointer rounded-md border border-input bg-transparent p-1"
                    title="Change color"
                  />
                  <Input
                    value={s.label}
                    onChange={(e) => updateSkill(s.id, { label: e.target.value })}
                    className="flex-1"
                  />
                  <Badge variant="secondary" title="Goals using this skill">
                    <Palette className="mr-1 h-3 w-3" /> {inUse}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (inUse > 0) {
                        toast.error(
                          `Can't delete: ${inUse} goal${inUse === 1 ? "" : "s"} use this skill`,
                        );
                        return;
                      }
                      deleteSkill(s.id);
                    }}
                    title="Delete skill"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {est.items > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pl-12">
                    <p className="text-xs text-muted-foreground">
                      ≈ {est.hours.toFixed(1)}h remaining · ~{sessions} session
                      {sessions === 1 ? "" : "s"} @ {DEFAULT_SESSION_H}h
                      {est.unscheduled > 0 && (
                        <span className="ml-1 opacity-70">
                          · {est.unscheduled} unscheduled
                        </span>
                      )}
                    </p>
                    {est.unscheduled > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => {
                          const n = autoScheduleSkill(s.id);
                          toast.success(
                            n > 0
                              ? `Scheduled ${n} block${n === 1 ? "" : "s"}`
                              : "Nothing new to schedule",
                          );
                        }}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Schedule next sessions
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
