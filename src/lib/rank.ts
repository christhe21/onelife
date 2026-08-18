import { Goal, Task, SubTask, Skill, CORE_SKILLS } from "./app-data";

/** Calculate base points for a task or subtask */
export function calculateItemPoints(spentHours: number | undefined): number {
  return Math.min(20, 10 + 5 * (spentHours ?? 0));
}

export function getSkillPoints(
  goals: Goal[],
  tasks: Task[],
  skillId: string,
  starredSkillId?: string,
): number {
  let basePoints = 0;

  // Find all goals with this skill
  const skillGoals = goals.filter((g) => g.skill === skillId);

  for (const goal of skillGoals) {
    if (goal.status === "completed") {
      basePoints += 100;
    }
    for (const sg of goal.subGoals) {
      if (sg.done) {
        basePoints += 50;
      }
    }
  }

  // Find all tasks linked to those goals (directly or via subgoal)
  const goalIds = new Set(skillGoals.map((g) => g.id));
  const subGoalIds = new Set(skillGoals.flatMap((g) => g.subGoals.map((sg) => sg.id)));

  const skillTasks = tasks.filter(
    (t) => (t.goalId && goalIds.has(t.goalId)) || (t.subGoalId && subGoalIds.has(t.subGoalId)),
  );

  for (const task of skillTasks) {
    if (task.done) {
      basePoints += calculateItemPoints(task.spentHours);
    }
    for (const subtask of task.subtasks) {
      if (subtask.done) {
        basePoints += calculateItemPoints(subtask.spentHours);
      }
    }
  }

  let multiplier = 1;
  if (starredSkillId === skillId) {
    multiplier = 3;
  } else if (CORE_SKILLS.includes(skillId)) {
    multiplier = 2;
  }

  return Math.floor(basePoints * multiplier);
}

export function getSkillTitle(points: number): string {
  if (points >= 20000) return "Legend";
  if (points >= 10000) return "Master";
  if (points >= 5000) return "Professional";
  if (points >= 2000) return "Enthusiast";
  if (points >= 1000) return "Intermediate";
  return "Beginner";
}

export function getOverallRank(totalPoints: number): string {
  if (totalPoints >= 100000) return "General";
  if (totalPoints >= 60000) return "Colonel";
  if (totalPoints >= 35000) return "Major";
  if (totalPoints >= 20000) return "Captain";
  if (totalPoints >= 10000) return "Lieutenant";
  if (totalPoints >= 5000) return "Sergeant";
  if (totalPoints >= 2000) return "Corporal";
  if (totalPoints >= 500) return "Private";
  return "Recruit";
}

// ---------------------------------------------------------------------------
// Points ledger (Phase 1): lifetime points, awarded once per item id.
// ---------------------------------------------------------------------------

export const GOAL_POINTS = 100;
export const SUBGOAL_POINTS = 50;

export type PointsLedger = Record<string, number>;

export interface PointsState {
  totalPoints: number;
  awardedPoints: PointsLedger;
}

/**
 * Scans the current goals/tasks tree and awards points for every completed item
 * that has not been awarded yet. Never removes or subtracts: points are lifetime.
 * Returns the same object identity semantics as a reducer — callers should compare
 * `changed` before writing state.
 */
export function reconcilePoints(
  goals: Goal[],
  tasks: Task[],
  state: PointsState,
): PointsState & { changed: boolean } {
  const ledger: PointsLedger = { ...state.awardedPoints };
  let total = state.totalPoints ?? 0;
  let changed = false;

  const award = (id: string, points: number) => {
    if (!id || ledger[id] != null || points <= 0) return;
    ledger[id] = points;
    total += points;
    changed = true;
  };

  for (const g of goals) {
    if (g.status === "completed") award(`goal:${g.id}`, GOAL_POINTS);
    for (const sg of g.subGoals) {
      if (sg.done) award(`subgoal:${sg.id}`, SUBGOAL_POINTS);
    }
  }

  for (const t of tasks) {
    if (t.done) award(`task:${t.id}`, calculateItemPoints(t.spentHours));
    for (const st of t.subtasks) {
      if (st.done) award(`subtask:${st.id}`, calculateItemPoints(st.spentHours));
    }
  }

  return { totalPoints: total, awardedPoints: ledger, changed };
}

/** Merges two ledgers/totals (used when appending an imported file). */
export function mergePoints(a: PointsState, b: PointsState): PointsState {
  return {
    totalPoints: (a.totalPoints ?? 0) + (b.totalPoints ?? 0),
    awardedPoints: { ...a.awardedPoints, ...b.awardedPoints },
  };
}
