import type { Recurrence } from "@/lib/app-data";

export type HomeSupport = "self" | "supported";

export interface LifeRole {
  id: string;
  label: string;
  blurb: string;
  areas: string[];
  skills: { id: string; label: string; color: string }[];
}

export interface HomeTaskPreset {
  id: string;
  title: string;
  blurb: string;
  recurrence: Extract<Recurrence, "daily" | "weekly">;
}

export const LIFE_ROLES: LifeRole[] = [
  {
    id: "software-engineer",
    label: "Software engineer",
    blurb: "Build, ship, and keep systems healthy.",
    areas: ["Career", "Learning"],
    skills: [
      { id: "technical", label: "Technical", color: "#3b82f6" },
      { id: "career", label: "Career", color: "#6366f1" },
      { id: "learning", label: "Learning", color: "#14b8a6" },
      { id: "communication", label: "Communication", color: "#f59e0b" },
    ],
  },
  {
    id: "agriculture",
    label: "Agriculture",
    blurb: "Land, crops, animals, and seasonal work.",
    areas: ["Career", "Health"],
    skills: [
      { id: "career", label: "Career", color: "#6366f1" },
      { id: "health", label: "Health", color: "#ef4444" },
      { id: "adaptability", label: "Adaptability", color: "#8b5cf6" },
      { id: "financial", label: "Financial", color: "#eab308" },
    ],
  },
  {
    id: "student",
    label: "Student",
    blurb: "Classes, projects, and building skills.",
    areas: ["Learning", "Career"],
    skills: [
      { id: "learning", label: "Learning", color: "#14b8a6" },
      { id: "critical-thinking", label: "Critical Thinking", color: "#6b7280" },
      { id: "communication", label: "Communication", color: "#f59e0b" },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    blurb: "Care work with a heavy daily rhythm.",
    areas: ["Career", "Health"],
    skills: [
      { id: "career", label: "Career", color: "#6366f1" },
      { id: "health", label: "Health", color: "#ef4444" },
      { id: "communication", label: "Communication", color: "#f59e0b" },
    ],
  },
  {
    id: "education",
    label: "Education",
    blurb: "Teaching, mentoring, and planning lessons.",
    areas: ["Career", "Learning", "Social"],
    skills: [
      { id: "career", label: "Career", color: "#6366f1" },
      { id: "learning", label: "Learning", color: "#14b8a6" },
      { id: "communication", label: "Communication", color: "#f59e0b" },
    ],
  },
  {
    id: "trades",
    label: "Trades & field work",
    blurb: "Hands-on work, tools, and site days.",
    areas: ["Career", "Health"],
    skills: [
      { id: "career", label: "Career", color: "#6366f1" },
      { id: "health", label: "Health", color: "#ef4444" },
      { id: "adaptability", label: "Adaptability", color: "#8b5cf6" },
    ],
  },
  {
    id: "creative",
    label: "Creative",
    blurb: "Making things — art, writing, music, design.",
    areas: ["Creative", "Career"],
    skills: [
      { id: "creative", label: "Creative", color: "#a855f7" },
      { id: "career", label: "Career", color: "#6366f1" },
      { id: "communication", label: "Communication", color: "#f59e0b" },
    ],
  },
  {
    id: "other",
    label: "Something else",
    blurb: "Name the work you actually do.",
    areas: ["Career"],
    skills: [{ id: "career", label: "Career", color: "#6366f1" }],
  },
];

export const HOME_TASK_PRESETS: HomeTaskPreset[] = [
  { id: "dishes", title: "Wash dishes", blurb: "Clear the sink.", recurrence: "daily" },
  { id: "laundry", title: "Clean clothes", blurb: "Wash and put away laundry.", recurrence: "weekly" },
  { id: "tidy", title: "Tidy living space", blurb: "A short reset of shared rooms.", recurrence: "daily" },
  { id: "trash", title: "Take out trash", blurb: "Bins out on the usual day.", recurrence: "weekly" },
  { id: "meals", title: "Cook a simple meal", blurb: "One home-cooked meal.", recurrence: "daily" },
  { id: "groceries", title: "Grocery run", blurb: "Restock basics.", recurrence: "weekly" },
  { id: "plants", title: "Water plants", blurb: "If you keep any.", recurrence: "weekly" },
];

export function roleById(id: string | undefined): LifeRole | undefined {
  return LIFE_ROLES.find((r) => r.id === id);
}

export function homeTasksByIds(ids: Iterable<string>): HomeTaskPreset[] {
  const set = new Set(ids);
  return HOME_TASK_PRESETS.filter((t) => set.has(t.id));
}
