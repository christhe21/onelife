import { Recurrence, SkillId } from "./app-data";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface MarketplaceSubGoal {
  title: string;
  dayOffset: number;
  description?: string;
}

export interface MarketplaceSubTask {
  title: string;
  recurrence?: Recurrence;
  plannedHours?: number;
  priority?: "low" | "medium" | "high";
}

export interface MarketplaceTask {
  title: string;
  priority: "low" | "medium" | "high";
  subGoalIndex?: number;
  startDayOffset?: number;
  endDayOffset?: number;
  recurrence?: Recurrence;
  plannedHours?: number;
  description?: string;
  notes?: string;
  subtasks: MarketplaceSubTask[];
}

export interface MarketplaceGoalTemplate {
  id: string;
  title: string;
  description: string;
  skillName: string;
  creatorName: string;
  verified: boolean;
  resources: string[];
  advice: string;
  durationDays: number;
  tags?: string[];
  coverEmoji?: string;
  difficulty?: Difficulty;
  subGoals: MarketplaceSubGoal[];
  tasks: MarketplaceTask[];
}
