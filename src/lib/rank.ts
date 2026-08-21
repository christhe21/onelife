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

/** Ordered rank tiers — single source of truth for rank name + thresholds. */
export const RANK_TIERS: { name: string; min: number }[] = [
  { name: "Beginner", min: 0 },
  { name: "Intermediate", min: 500 },
  { name: "Advanced", min: 2000 },
  { name: "Professional", min: 5000 },
  { name: "Master", min: 10000 },
  { name: "Grandmaster", min: 20000 },
  { name: "Epic", min: 35000 },
  { name: "Legendary", min: 60000 },
  { name: "One", min: 100000 },
];

/** Display-only one-line meaning for each rank tier. */
export const RANK_DESCRIPTIONS: Record<string, string> = {
  Beginner: "You've just started — every point counts from here.",
  Intermediate: "You're building steady habits and finishing what you start.",
  Advanced: "Your progress is consistent and compounding across skills.",
  Professional: "You work at a reliable, high standard without needing motivation.",
  Master: "Deep skill and disciplined execution are now your default.",
  Grandmaster: "You operate far above average and set your own bar.",
  Epic: "Rare territory — your output speaks for itself.",
  Legendary: "Sustained excellence across years of effort.",
  One: "The top rank. There is nothing above this.",
};




export function getRankIndex(totalPoints: number): number {
  const pts = Math.max(0, totalPoints ?? 0);
  let idx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (pts >= RANK_TIERS[i].min) idx = i;
  }
  return idx;
}

export function getOverallRank(totalPoints: number): string {
  return RANK_TIERS[getRankIndex(totalPoints)].name;
}

export interface RankProgress {
  rank: string;
  index: number;
  nextRank: string | null;
  currentMin: number;
  nextMin: number | null;
  pointsIntoRank: number;
  pointsToNext: number;
  percent: number;
}

export function getRankProgress(totalPoints: number): RankProgress {
  const pts = Math.max(0, totalPoints ?? 0);
  const index = getRankIndex(pts);
  const tier = RANK_TIERS[index];
  const next = RANK_TIERS[index + 1] ?? null;
  if (!next) {
    return {
      rank: tier.name,
      index,
      nextRank: null,
      currentMin: tier.min,
      nextMin: null,
      pointsIntoRank: pts - tier.min,
      pointsToNext: 0,
      percent: 100,
    };
  }
  const span = next.min - tier.min;
  const into = pts - tier.min;
  return {
    rank: tier.name,
    index,
    nextRank: next.name,
    currentMin: tier.min,
    nextMin: next.min,
    pointsIntoRank: into,
    pointsToNext: next.min - pts,
    percent: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
  };
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
