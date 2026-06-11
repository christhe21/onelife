import { Recurrence, SkillId } from "./app-data";

export interface MarketplaceSubGoal {
  title: string;
  dayOffset: number;
}

export interface MarketplaceSubTask {
  title: string;
  recurrence?: Recurrence;
}

export interface MarketplaceTask {
  title: string;
  priority: "low" | "medium" | "high";
  subGoalIndex?: number;
  startDayOffset?: number;
  endDayOffset?: number;
  recurrence?: Recurrence;
  plannedHours?: number;
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
  subGoals: MarketplaceSubGoal[];
  tasks: MarketplaceTask[];
}
