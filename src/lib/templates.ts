import type { SkillId } from "@/lib/app-data";

export interface TemplateSubGoal {
  title: string;
  /** Days offset from start date */
  offsetDays: number;
}

export interface TemplateTask {
  title: string;
  priority: "low" | "medium" | "high";
  /** Days offset from start date for due date */
  offsetDays: number;
}

export interface GoalTemplate {
  id: string;
  category: "Career" | "Health" | "Travel" | "Faith" | "Music";
  /** Skill id to attach the goal to (auto-created if missing). */
  skill: SkillId;
  /** Skill label + color used if skill must be created. */
  skillLabel: string;
  skillColor: string;
  title: string;
  description: string;
  /** One-line citation/source for the science behind this template. */
  rationale: string;
  durationDays: number;
  subGoals: TemplateSubGoal[];
  tasks: TemplateTask[];
}

export const TEMPLATES: GoalTemplate[] = [
  {
    id: "tpl_career_deliberate",
    category: "Career",
    skill: "career",
    skillLabel: "Career",
    skillColor: "#6366f1",
    title: "12-week deliberate-practice sprint",
    description:
      "Pick one career skill and improve it through focused, feedback-driven practice for 12 weeks.",
    rationale:
      "Based on Ericsson's deliberate-practice research (1993): expert performance comes from focused, effortful practice with rapid feedback.",
    durationDays: 84,
    subGoals: [
      { title: "Define the skill and baseline assessment", offsetDays: 7 },
      { title: "Mid-sprint review with mentor or peer", offsetDays: 42 },
      { title: "Final demo / portfolio update", offsetDays: 84 },
    ],
    tasks: [
      { title: "Block 4×45-min practice sessions this week", priority: "high", offsetDays: 7 },
      { title: "Write weekly reflection (what improved?)", priority: "medium", offsetDays: 7 },
      { title: "Request feedback from one person", priority: "medium", offsetDays: 14 },
    ],
  },
  {
    id: "tpl_health_c25k",
    category: "Health",
    skill: "health",
    skillLabel: "Health",
    skillColor: "#ef4444",
    title: "Couch-to-5K running plan",
    description:
      "Go from no running to a continuous 5K over 9 weeks of progressive interval training.",
    rationale:
      "Based on the NHS Couch-to-5K programme — progressive overload with rest days reliably builds aerobic base in beginners.",
    durationDays: 63,
    subGoals: [
      { title: "Complete week 3 (3×3-min runs)", offsetDays: 21 },
      { title: "Run 20 min continuously", offsetDays: 42 },
      { title: "Finish a continuous 5K", offsetDays: 63 },
    ],
    tasks: [
      { title: "Monday run — week 1 day 1", priority: "high", offsetDays: 1 },
      { title: "Wednesday run — week 1 day 2", priority: "medium", offsetDays: 3 },
      { title: "Friday run — week 1 day 3", priority: "medium", offsetDays: 5 },
    ],
  },
  {
    id: "tpl_travel_quarterly",
    category: "Travel",
    skill: "travel",
    skillLabel: "Travel",
    skillColor: "#0ea5e9",
    title: "One trip per quarter",
    description: "Plan and take four distinct trips this year — local or international.",
    rationale:
      "Van Boven & Gilovich (2003): experiential purchases produce more durable happiness than material ones.",
    durationDays: 365,
    subGoals: [
      { title: "Q1 trip booked", offsetDays: 60 },
      { title: "Q2 trip booked", offsetDays: 150 },
      { title: "Q3 trip booked", offsetDays: 240 },
      { title: "Q4 trip booked", offsetDays: 330 },
    ],
    tasks: [
      { title: "Shortlist 5 destinations", priority: "medium", offsetDays: 14 },
      { title: "Set quarterly travel budget", priority: "high", offsetDays: 21 },
      { title: "Book Q1 flights & lodging", priority: "high", offsetDays: 45 },
    ],
  },
  {
    id: "tpl_faith_contemplative",
    category: "Faith",
    skill: "faith",
    skillLabel: "Faith",
    skillColor: "#a855f7",
    title: "Daily 10-minute contemplative practice",
    description:
      "Build a sustained daily practice of prayer, scripture, or meditation for 8 weeks.",
    rationale:
      "Modeled on Kabat-Zinn's MBSR cadence (1990) — 8 weeks of short daily practice reliably establishes a habit and shifts well-being.",
    durationDays: 56,
    subGoals: [
      { title: "Complete 14 consecutive days", offsetDays: 14 },
      { title: "Halfway check-in journal entry", offsetDays: 28 },
      { title: "Finish 8-week cycle", offsetDays: 56 },
    ],
    tasks: [
      { title: "Pick text / practice and a fixed time-of-day", priority: "high", offsetDays: 2 },
      { title: "Set daily phone reminder", priority: "medium", offsetDays: 2 },
      { title: "Weekly journal: what shifted?", priority: "low", offsetDays: 7 },
    ],
  },
  {
    id: "tpl_music_20h",
    category: "Music",
    skill: "music",
    skillLabel: "Music",
    skillColor: "#f59e0b",
    title: "20-hour rapid-skill ramp",
    description:
      "Reach a recognisable level on an instrument or song via 20 hours of focused practice (~30 min/day).",
    rationale:
      "Josh Kaufman, The First 20 Hours (2013): the first 20 focused hours produce the steepest skill gains.",
    durationDays: 42,
    subGoals: [
      { title: "Hours 1–5: fundamentals nailed", offsetDays: 10 },
      { title: "Hours 6–12: first song playable", offsetDays: 24 },
      { title: "Hours 13–20: perform for someone", offsetDays: 42 },
    ],
    tasks: [
      { title: "Schedule 30-min daily practice block", priority: "high", offsetDays: 2 },
      { title: "Pick the target song / piece", priority: "medium", offsetDays: 3 },
      { title: "Record a baseline video", priority: "low", offsetDays: 5 },
    ],
  },
];

export const CATEGORIES = ["Career", "Health", "Travel", "Faith", "Music"] as const;
export type Category = (typeof CATEGORIES)[number];
