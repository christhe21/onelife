import { clampDate } from "@/lib/utils";
import type { AiGoalPlan } from "@/lib/ai-plan.functions";

export interface CommitApi {
  addGoal: (g: {
    title: string;
    description: string;
    skill: string;
    startDate: string;
    targetDate: string;
    status: "not_started";
    currentActivity: string;
  }) => string;
  addSubGoal: (goalId: string, title: string, targetDate?: string) => string;
  ensureDefaultMilestone: (goalId: string) => string;
  addTask: (t: {
    title: string;
    dueDate?: string;
    priority: "low" | "medium" | "high";
    subGoalId?: string;
    subtasks?: { id: string; title: string; done: boolean; hoursPerWeek?: number; endDate?: string }[];
  }) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/** Persist an AI plan as goal → milestones → tasks → subtasks, clamping every date. */
export function commitAiPlan(api: CommitApi, plan: AiGoalPlan): string {
  const today = new Date().toISOString().slice(0, 10);
  const target = clampDate(plan.targetDate || today, today);

  const goalId = api.addGoal({
    title: plan.title.trim() || "Untitled goal",
    description: plan.description.trim(),
    skill: plan.skill || "life",
    startDate: today,
    targetDate: target,
    status: "not_started",
    currentActivity: "",
  });

  const byTitle = new Map<string, string>();
  plan.milestones
    .filter((m) => m.title.trim())
    .forEach((m) => {
      const id = api.addSubGoal(
        goalId,
        m.title.trim(),
        m.date ? clampDate(m.date, today, target) : target,
      );
      byTitle.set(m.title.trim().toLowerCase(), id);
    });

  const fallbackMilestoneId = () => {
    const first = byTitle.values().next();
    return first.done ? api.ensureDefaultMilestone(goalId) : (first.value as string);
  };

  plan.tasks
    .filter((t) => t.title.trim())
    .forEach((t) => {
      const linked = t.milestone ? byTitle.get(t.milestone.trim().toLowerCase()) : undefined;
      const subGoalId = linked ?? fallbackMilestoneId();
      api.addTask({
        title: t.title.trim(),
        dueDate: t.dueDate ? clampDate(t.dueDate, today, target) : undefined,
        priority: t.priority,
        subGoalId,
        subtasks: t.subtasks
          .filter((s) => s.title.trim())
          .map((s) => ({
            id: uid(),
            title: s.title.trim(),
            done: false,
            hoursPerWeek: s.hoursPerWeek,
            endDate: s.endDate ? clampDate(s.endDate, today, target) : undefined,
          })),
      });
    });

  return goalId;
}
