import { MarketplaceGoalTemplate } from "./marketplace";
import { toast } from "sonner";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getFrierenVocabulary } from "./frieren";
import { celebrate } from "./celebrate";


export interface Skill {
  id: string;
  label: string;
  color: string;
}

export const DEFAULT_SKILLS: Skill[] = [
  { id: "life", label: "Life", color: "#10b981" },
  { id: "technical", label: "Technical", color: "#3b82f6" },
  { id: "health", label: "Health", color: "#ef4444" },
  { id: "creative", label: "Creative", color: "#a855f7" },
  { id: "financial", label: "Financial", color: "#eab308" },
  { id: "social", label: "Social", color: "#ec4899" },
  { id: "career", label: "Career", color: "#6366f1" },
  { id: "learning", label: "Learning", color: "#14b8a6" },
];

export const SKILLS = DEFAULT_SKILLS;
export type SkillId = string;
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type GoalStatus = "not_started" | "in_progress" | "completed";

export interface SubGoal {
  id: string;
  title: string;
  targetDate?: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  skill: SkillId;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  currentActivity?: string;
  subGoals: SubGoal[];
  manualProgress?: number;
  plannedHours?: number;
  spentHours?: number;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  hoursPerWeek?: number;
  endDate?: string;
  startDate?: string;
  plannedHours?: number;
  spentHours?: number;
  recurrence?: Recurrence;
  priority?: "low" | "medium" | "high";
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  subGoalId?: string;
  goalId?: string;
  subtasks: SubTask[];
  progress?: number;
  startDate?: string;
  endDate?: string;
  evidence?: string;
  plannedHours?: number;
  spentHours?: number;
  recurrence?: Recurrence;
}

export interface BucketItem {
  id: string;
  title: string;
  notes?: string;
  targetYear?: number;
  achieved: boolean;
}

export type TextScale = "sm" | "base" | "lg" | "xl";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeColor = "sage" | "ocean" | "sunset" | "lavender" | "monochrome" | "frieren";

export interface Settings {
  birthYear?: number;
  userName?: string;
  onboardedAt?: string;
  textScale?: TextScale;
  themeMode?: ThemeMode;
  themeColor?: ThemeColor;
  notificationsEnabled?: boolean;
  reminderLeadMinutes?: number;
  frierenSfx?: boolean;
}


export interface AppData {
  goals: Goal[];
  tasks: Task[];
  bucketList: BucketItem[];
  skills?: Skill[];
  settings?: Settings;
}

export const EXPORT_VERSION = 1;
const STORAGE_KEY = "life-manager:v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const STATUSES: GoalStatus[] = ["not_started", "in_progress", "completed"];
const PRIORITIES: Task["priority"][] = ["low", "medium", "high"];

function downloadJSON(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function nonNegNum(v: any): number | undefined {
  return typeof v === "number" && isFinite(v) && v >= 0 ? v : undefined;
}

function bumpDateString(iso?: string, rec?: Recurrence): string | undefined {
  if (!iso || !rec || rec === "none") return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  if (rec === "daily") d.setDate(d.getDate() + 1);
  else if (rec === "weekly") d.setDate(d.getDate() + 7);
  else if (rec === "monthly") d.setMonth(d.getMonth() + 1);
  else if (rec === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
function hoursBetween(startISO?: string, endISO?: string): number {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  if (!isFinite(s) || !isFinite(e) || e <= s) return 0;
  return (e - s) / 3_600_000;
}

// ---------------------------------------------------------------------------
// autoScheduleTasks: pure helper. Distributes tasks/subtasks into free 09:00–21:00
// slots between `goalStart` and `goalEnd`, never overlapping `existingBlocks`.
//
// Rules (mirrors test expectations):
//  - If a task has subtasks → only schedule the subtasks (parent stays blank;
//    `toggleSubtask` auto-completes the parent when all subs are done).
//  - If a task has no subtasks and plannedHours <= 3 → schedule the task itself.
//  - If a task has no subtasks and plannedHours > 3 → split into ~2h sessions
//    across consecutive days, materialised as new subtasks; parent stays blank.
//  - Subtasks always have startDate/endDate on the same calendar day.
// ---------------------------------------------------------------------------
const SESSION_HOURS = 2;
const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 21 * 60;

export function autoScheduleTasks(
  tasks: Task[],
  goalStart: string,
  goalEnd: string,
  existingBlocks: Array<{ startDate?: string; endDate?: string }>,
  now: Date = new Date(),
): Task[] {
  const busy: Array<[number, number]> = [];
  for (const b of existingBlocks) {
    if (b.startDate && b.endDate) {
      const s = new Date(b.startDate).getTime();
      const e = new Date(b.endDate).getTime();
      if (isFinite(s) && isFinite(e) && e > s) busy.push([s, e]);
    }
  }

  const startBound = new Date(`${goalStart}T00:00:00`);
  const endBound = new Date(`${goalEnd}T23:59:59`);
  const today0 = new Date(now);
  today0.setHours(0, 0, 0, 0);
  let cursor = new Date(Math.max(today0.getTime(), startBound.getTime()));

  function findSlot(durationH: number, fromDay: Date): { s: Date; e: Date } | null {
    const ms = Math.max(0.25, durationH) * 3_600_000;
    const day = new Date(fromDay);
    day.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      if (day.getTime() > endBound.getTime()) return null;
      for (let mins = DAY_START_MIN; mins + durationH * 60 <= DAY_END_MIN; mins += 30) {
        const s = new Date(day);
        s.setHours(0, mins, 0, 0);
        if (s.getTime() < now.getTime() && day.toDateString() === now.toDateString()) continue;
        const e = new Date(s.getTime() + ms);
        const overlap = busy.some(([bs, be]) => s.getTime() < be && e.getTime() > bs);
        if (!overlap) {
          busy.push([s.getTime(), e.getTime()]);
          return { s, e };
        }
      }
      day.setDate(day.getDate() + 1);
    }
    return null;
  }

  return tasks.map((t) => {
    const hasSubs = t.subtasks.length > 0;

    if (hasSubs) {
      const newSubs = t.subtasks.map((s) => {
        if (s.startDate && s.endDate) return s;
        const total = s.plannedHours ?? SESSION_HOURS;
        const dur = Math.min(3, Math.max(0.5, total));
        const slot = findSlot(dur, cursor);
        if (!slot) return s;
        return { ...s, startDate: slot.s.toISOString(), endDate: slot.e.toISOString() };
      });
      return { ...t, subtasks: newSubs };
    }

    // No existing subtasks.
    if (t.startDate && t.endDate) return t;
    const total = t.plannedHours ?? SESSION_HOURS;

    if (total <= 3) {
      const slot = findSlot(total, cursor);
      if (!slot) return t;
      return { ...t, startDate: slot.s.toISOString(), endDate: slot.e.toISOString() };
    }

    // Split into ~2h sessions across consecutive days.
    let remaining = total;
    const sessions: Array<{ s: Date; e: Date }> = [];
    let from = new Date(cursor);
    while (remaining > 0.001) {
      const dur = Math.min(SESSION_HOURS, remaining);
      const slot = findSlot(dur, from);
      if (!slot) break;
      sessions.push(slot);
      remaining -= dur;
      from = new Date(slot.s);
      from.setDate(from.getDate() + 1);
      from.setHours(0, 0, 0, 0);
    }
    if (sessions.length === 0) return t;
    const subs: SubTask[] = sessions.map((sl, i) => ({
      id: uid(),
      title: `${t.title} — session ${i + 1}/${sessions.length}`,
      done: false,
      startDate: sl.s.toISOString(),
      endDate: sl.e.toISOString(),
      plannedHours: (sl.e.getTime() - sl.s.getTime()) / 3_600_000,
    }));
    return { ...t, subtasks: subs };
  });
}



function normalizeSubTask(raw: any): SubTask {
  return {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    title: String(raw?.title ?? "Untitled subtask"),
    done: Boolean(raw?.done),
    hoursPerWeek: nonNegNum(raw?.hoursPerWeek),
    startDate: typeof raw?.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw?.endDate === "string" ? raw.endDate : undefined,
    plannedHours: nonNegNum(raw?.plannedHours),
    spentHours: nonNegNum(raw?.spentHours),
    recurrence: ["none", "daily", "weekly", "monthly", "yearly"].includes(raw?.recurrence)
      ? raw.recurrence
      : "none",
    priority: PRIORITIES.includes(raw?.priority) ? raw.priority : undefined,
    description: typeof raw?.description === "string" ? raw.description : undefined,
  };
}

function normalizeGoal(raw: any): Goal {
  const skill: SkillId = typeof raw?.skill === "string" && raw.skill.trim() ? raw.skill : "life";
  const status: GoalStatus = STATUSES.includes(raw?.status) ? raw.status : "not_started";
  const today = new Date().toISOString().slice(0, 10);
  const subGoals: SubGoal[] = Array.isArray(raw?.subGoals)
    ? raw.subGoals.map((s: any) => ({
        id: typeof s?.id === "string" ? s.id : uid(),
        title: String(s?.title ?? "Untitled milestone"),
        targetDate: typeof s?.targetDate === "string" ? s.targetDate : undefined,
        done: Boolean(s?.done),
      }))
    : [];
  return {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    title: String(raw?.title ?? "Untitled goal"),
    description: typeof raw?.description === "string" ? raw.description : undefined,
    skill,
    startDate: typeof raw?.startDate === "string" ? raw.startDate : today,
    targetDate: typeof raw?.targetDate === "string" ? raw.targetDate : today,
    status,
    currentActivity: typeof raw?.currentActivity === "string" ? raw.currentActivity : undefined,
    subGoals,
    manualProgress:
      typeof raw?.manualProgress === "number"
        ? Math.max(0, Math.min(100, raw.manualProgress))
        : undefined,
    plannedHours: nonNegNum(raw?.plannedHours),
    spentHours: nonNegNum(raw?.spentHours),
  };
}

function normalizeTask(raw: any): Task {
  const clamp = (n: any) =>
    typeof n === "number" && isFinite(n) ? Math.max(0, Math.min(100, n)) : undefined;
  return {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    title: String(raw?.title ?? "Untitled task"),
    dueDate: typeof raw?.dueDate === "string" ? raw.dueDate : undefined,
    priority: PRIORITIES.includes(raw?.priority) ? raw.priority : "medium",
    done: Boolean(raw?.done),
    subGoalId: typeof raw?.subGoalId === "string" ? raw.subGoalId : undefined,
    goalId: typeof raw?.goalId === "string" ? raw.goalId : undefined,
    subtasks: Array.isArray(raw?.subtasks) ? raw.subtasks.map(normalizeSubTask) : [],
    progress: clamp(raw?.progress),
    startDate: typeof raw?.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw?.endDate === "string" ? raw.endDate : undefined,
    evidence: typeof raw?.evidence === "string" ? raw.evidence : undefined,
    plannedHours: nonNegNum(raw?.plannedHours),
    spentHours: nonNegNum(raw?.spentHours),
    recurrence: ["none", "daily", "weekly", "monthly", "yearly"].includes(raw?.recurrence)
      ? raw.recurrence
      : "none",
  };
}

function normalizeBucket(raw: any): BucketItem {
  return {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    title: String(raw?.title ?? "Untitled"),
    notes: typeof raw?.notes === "string" ? raw.notes : undefined,
    targetYear: typeof raw?.targetYear === "number" ? raw.targetYear : undefined,
    achieved: Boolean(raw?.achieved),
  };
}

function normalizeAppData(raw: any): AppData {
  if (!raw || typeof raw !== "object") throw new Error("File is not a JSON object");
  const issues: string[] = [];
  if (raw.goals != null && !Array.isArray(raw.goals)) issues.push("`goals` must be an array");
  if (raw.tasks != null && !Array.isArray(raw.tasks)) issues.push("`tasks` must be an array");
  if (raw.bucketList != null && !Array.isArray(raw.bucketList))
    issues.push("`bucketList` must be an array");
  if (issues.length) throw new Error(issues.join("; "));

  const skills: Skill[] | undefined =
    Array.isArray(raw.skills) && raw.skills.length
      ? raw.skills
          .filter((s: any) => s && typeof s.id === "string" && typeof s.label === "string")
          .map((s: any) => ({
            id: s.id,
            label: s.label,
            color: typeof s.color === "string" ? s.color : "#10b981",
          }))
      : undefined;

  const settings: Settings | undefined =
    raw.settings && typeof raw.settings === "object"
      ? {
          birthYear:
            typeof raw.settings.birthYear === "number" ? raw.settings.birthYear : undefined,
          userName: typeof raw.settings.userName === "string" ? raw.settings.userName : undefined,
          onboardedAt:
            typeof raw.settings.onboardedAt === "string" ? raw.settings.onboardedAt : undefined,
          textScale: ["sm", "base", "lg", "xl"].includes(raw.settings.textScale)
            ? raw.settings.textScale
            : undefined,
          notificationsEnabled:
            typeof raw.settings.notificationsEnabled === "boolean"
              ? raw.settings.notificationsEnabled
              : undefined,
          reminderLeadMinutes:
            typeof raw.settings.reminderLeadMinutes === "number"
              ? raw.settings.reminderLeadMinutes
              : undefined,
        }
      : undefined;

  return {
    goals: Array.isArray(raw.goals) ? raw.goals.map(normalizeGoal) : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : [],
    bucketList: Array.isArray(raw.bucketList) ? raw.bucketList.map(normalizeBucket) : [],
    skills,
    settings,
  };
}

const AI_SYSTEM_PROMPT = `You are a thoughtful life-planning coach. Interview the user, then output a JSON file matching this shape exactly:
{
  "version": 1,
  "skills": [{"id":"string","label":"string","color":"#HEXHEX"}],
  "settings": {
    "birthYear": 1990, "userName": "string", "onboardedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "textScale": "sm|base|lg|xl", "notificationsEnabled": true, "reminderLeadMinutes": 15
  },
  "goals": [{
    "id": "string", "title": "string", "description": "string",
    "skill": "life|technical|health|creative|financial|social|career|learning|<custom>",
    "startDate": "YYYY-MM-DD", "targetDate": "YYYY-MM-DD",
    "status": "not_started|in_progress|completed",
    "currentActivity": "string", "manualProgress": 0,
    "plannedHours": 40, "spentHours": 0,
    "subGoals": [{"id":"string","title":"string","targetDate":"YYYY-MM-DD","done":false}]
  }],
  "tasks": [{
    "id": "string", "title": "string", "dueDate": "YYYY-MM-DD",
    "priority": "low|medium|high", "done": false, "subGoalId": "<subGoal id or omit>",
    "progress": 0, "startDate": "YYYY-MM-DDTHH:mm:ss", "endDate": "YYYY-MM-DDTHH:mm:ss",
    "evidence": "what has been done so far / links",
    "plannedHours": 4, "spentHours": 0,
    "subtasks": [{"id":"string","title":"string","done":false,"hoursPerWeek":2,"plannedHours":2,"spentHours":0,"startDate":"YYYY-MM-DDTHH:mm:ss","endDate":"YYYY-MM-DDTHH:mm:ss"}]
  }],
  "bucketList": [{"id":"string","title":"string","notes":"string","targetYear":2030,"achieved":false}]
}
Use ISO YYYY-MM-DD dates for dates, and YYYY-MM-DDTHH:mm:ss for calendar specific times. plannedHours = total effort estimate for the goal/task/subtask; spentHours is auto-updated when scheduled blocks are completed. Capture prior progress with progress/startDate/evidence so partially-done work is preserved. Ensure calendar schedule dates (startDate, endDate) are fully populated if a task is scheduled for a specific time. For subtasks, startDate and endDate must always be on the same calendar day. hoursPerWeek defines recurrence, not the date range. Output ONLY the raw JSON without markdown codeblocks or other text.`;

export const TEMPLATE_PAYLOAD = {
  version: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  _ai: {
    instructions: "Copy systemPrompt into an LLM, get JSON back, import it.",
    systemPrompt: AI_SYSTEM_PROMPT,
  },
  _schema: {
    skills: "id, label, color",
    settings:
      "birthYear, userName, onboardedAt, textScale, notificationsEnabled, reminderLeadMinutes",
    goal: "title, description, skill, startDate, targetDate, status, currentActivity, manualProgress (0-100), plannedHours, spentHours, subGoals[]",
    task: "title, priority, dueDate, subGoalId, progress (0-100), startDate, endDate, evidence, plannedHours, spentHours, subtasks[]", // subGoalId links task to a milestone (subgoal) under a goal
    subtask:
      "title, done, hoursPerWeek (auto-schedules .ics), startDate, endDate, plannedHours, spentHours",
    bucketList: "title, notes, targetYear, achieved",
  },
  skills: [
    { id: "life", label: "Life", color: "#10b981" },
    { id: "technical", label: "Technical", color: "#3b82f6" },
  ],
  settings: {
    birthYear: 1990,
    userName: "Alex",
    onboardedAt: "2026-01-01T00:00:00.000Z",
    textScale: "base",
    notificationsEnabled: true,
    reminderLeadMinutes: 15,
  },
  goals: [
    {
      id: "g_run5k",
      title: "Run a 5K under 25 minutes",
      description: "Build aerobic base then add intervals.",
      skill: "health",
      startDate: "2026-01-05",
      targetDate: "2026-06-30",
      status: "in_progress",
      currentActivity: "3 easy runs / week, building to 5km",
      manualProgress: 40,
      plannedHours: 60,
      spentHours: 22,
      subGoals: [
        { id: "sg1", title: "Run 5km continuously", targetDate: "2026-03-15", done: true },
        { id: "sg2", title: "Sub-30 min 5K", targetDate: "2026-05-01", done: false },
      ],
    },
    {
      id: "g_react",
      title: "Ship a portfolio site",
      description: "Personal site showcasing 3 projects.",
      skill: "technical",
      startDate: "2026-02-01",
      targetDate: "2026-04-30",
      status: "not_started",
      currentActivity: "Planning Phase",
      manualProgress: 0,
      plannedHours: 40,
      spentHours: 0,
      subGoals: [
        { id: "sg3", title: "Complete wireframes", targetDate: "2026-02-15", done: false },
      ],
    },
  ],
  tasks: [
    {
      id: "t_outline",
      title: "Outline portfolio sections",
      dueDate: "2026-02-10",
      priority: "high",
      done: false,
      subGoalId: undefined,
      progress: 35,
      startDate: "2026-02-03T09:00:00",
      endDate: "2026-02-03T11:00:00",
      evidence: "Drafted hero + about copy in Notion.",
      plannedHours: 6,
      spentHours: 2,
      subtasks: [
        {
          id: "st1",
          title: "Pick 3 projects",
          done: true,
          hoursPerWeek: 0,
          plannedHours: 1,
          spentHours: 1,
          startDate: "2026-02-03T09:00:00",
          endDate: "2026-02-03T10:00:00",
        },
        {
          id: "st2",
          title: "Write case studies",
          done: false,
          hoursPerWeek: 3,
          plannedHours: 5,
          spentHours: 1,
          startDate: "2026-02-04T13:00:00",
          endDate: "2026-02-25T17:00:00",
        },
      ],
    },
    {
      id: "t_intervals",
      title: "Tuesday interval run",
      dueDate: "2026-02-04",
      priority: "medium",
      done: true,
      subGoalId: undefined,
      progress: 100,
      startDate: "2026-02-04T07:00:00",
      endDate: "2026-02-04T08:00:00",
      evidence: "8x400m @ 5:00/km",
      plannedHours: 1,
      spentHours: 1,
      subtasks: [
        {
          id: "st3",
          title: "Warmup 10 mins",
          done: true,
          hoursPerWeek: 0,
          plannedHours: 0.2,
          spentHours: 0.2,
          startDate: "2026-02-04T07:00:00",
          endDate: "2026-02-04T07:10:00",
        },
      ],
    },
  ],
  bucketList: [
    {
      id: "b1",
      title: "See the northern lights",
      notes: "Iceland or Tromsø",
      targetYear: 2028,
      achieved: false,
    },
  ],
};

export function downloadTemplate() {
  downloadJSON(TEMPLATE_PAYLOAD, "life-manager-template.json");
}

export function downloadSkillsReference() {
  downloadJSON(
    {
      skills: SKILLS.map((s) => ({ id: s.id, label: s.label })),
      statuses: STATUSES,
      taskPriorities: PRIORITIES,
    },
    "life-manager-skills-reference.json",
  );
}

interface Ctx extends AppData {
  skills: Skill[];
  settings: Settings;
  setBirthYear: (y: number | undefined) => void;
  updateSettings: (patch: Partial<Settings>) => void;

  addSkill: (s: Omit<Skill, "id"> & { id?: string }) => void;
  updateSkill: (id: string, patch: Partial<Omit<Skill, "id">>) => void;
  deleteSkill: (id: string) => void;

  addGoal: (g: Omit<Goal, "id" | "subGoals">) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addSubGoal: (goalId: string, title: string, targetDate?: string) => string;
  toggleSubGoal: (goalId: string, subId: string) => void;
  deleteSubGoal: (goalId: string, subId: string) => void;
  ensureDefaultMilestone: (goalId: string) => string;

  addTask: (t: Omit<Task, "id" | "done" | "subtasks"> & { subtasks?: SubTask[] }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  rescheduleTask: (id: string, newYmd: string) => void;

  addSubtask: (taskId: string, st: Omit<SubTask, "id" | "done">) => void;
  updateSubtask: (taskId: string, subId: string, patch: Partial<SubTask>) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  deleteSubtask: (taskId: string, subId: string) => void;
  rescheduleSubtask: (taskId: string, subId: string, newYmd: string) => void;

  addBucket: (b: Omit<BucketItem, "id" | "achieved">) => void;
  updateBucket: (id: string, patch: Partial<BucketItem>) => void;
  toggleBucket: (id: string) => void;
  deleteBucket: (id: string) => void;

  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
  appendJSON: (file: File) => Promise<{ goals: number; tasks: number; bucket: number }>;
  replaceAll: (data: AppData) => void;
  clearAll: () => void;
  importMarketplaceGoal: (template: MarketplaceGoalTemplate, opts?: { autoSchedule?: boolean }) => void;
  autoScheduleGoal: (goalId: string) => number;
  autoScheduleSkill: (skillId: string) => number;

}

const AppDataContext = createContext<Ctx | null>(null);

interface Stored extends AppData {
  skills?: Skill[];
  settings?: Settings;
}

function loadInitial(): Stored {
  const empty: Stored = {
    goals: [],
    tasks: [],
    bucketList: [],
    skills: DEFAULT_SKILLS,
    settings: {},
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    const data = normalizeAppData(parsed);
    const skills: Skill[] =
      Array.isArray(parsed?.skills) && parsed.skills.length
        ? parsed.skills
            .filter((s: any) => s && typeof s.id === "string" && typeof s.label === "string")
            .map((s: any) => ({
              id: s.id,
              label: s.label,
              color: typeof s.color === "string" ? s.color : "#10b981",
            }))
        : DEFAULT_SKILLS;
    const settings: Settings =
      parsed?.settings && typeof parsed.settings === "object"
        ? {
            birthYear:
              typeof parsed.settings.birthYear === "number" ? parsed.settings.birthYear : undefined,
            userName:
              typeof parsed.settings.userName === "string" ? parsed.settings.userName : undefined,
            onboardedAt:
              typeof parsed.settings.onboardedAt === "string"
                ? parsed.settings.onboardedAt
                : undefined,
            textScale: ["sm", "base", "lg", "xl"].includes(parsed.settings.textScale)
              ? parsed.settings.textScale
              : undefined,
            themeMode: ["light", "dark", "system"].includes(parsed.settings.themeMode)
              ? parsed.settings.themeMode
              : undefined,
            themeColor: [
              "sage",
              "ocean",
              "sunset",
              "lavender",
              "monochrome",
              "frieren",
            ].includes(parsed.settings.themeColor)
              ? parsed.settings.themeColor
              : undefined,
            notificationsEnabled:
              typeof parsed.settings.notificationsEnabled === "boolean"
                ? parsed.settings.notificationsEnabled
                : undefined,
            reminderLeadMinutes:
              typeof parsed.settings.reminderLeadMinutes === "number"
                ? parsed.settings.reminderLeadMinutes
                : undefined,
            frierenSfx:
              typeof parsed.settings.frierenSfx === "boolean"
                ? parsed.settings.frierenSfx
                : undefined,
          }
        : {};
    return { ...data, skills, settings };

  } catch {
    return empty;
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const initial = useRef<Stored | null>(null);
  if (initial.current === null) initial.current = loadInitial();

  const [goals, setGoals] = useState<Goal[]>(initial.current.goals);
  const [tasks, setTasks] = useState<Task[]>(initial.current.tasks);
  const [bucketList, setBucketList] = useState<BucketItem[]>(initial.current.bucketList);
  const [skills, setSkills] = useState<Skill[]>(initial.current.skills ?? DEFAULT_SKILLS);
  const [settings, setSettings] = useState<Settings>(initial.current.settings ?? {});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: EXPORT_VERSION, goals, tasks, bucketList, skills, settings }),
        );
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [goals, tasks, bucketList, skills, settings]);

  useEffect(() => {
    // Auto-complete subGoals and goals when their linked tasks are all completed.
    setGoals((currentGoals) => {
      let changed = false;
      const newGoals = currentGoals.map((g) => {
        let goalChanged = false;
        const newSubGoals = g.subGoals.map((sg) => {
          const linkedTasks = tasks.filter((t) => t.subGoalId === sg.id);
          const hasLinkedTasks = linkedTasks.length > 0;
          const allTasksDone = hasLinkedTasks && linkedTasks.every((t) => t.done);

          let newDone = sg.done;
          if (hasLinkedTasks) {
            if (allTasksDone && !sg.done) {
              newDone = true;
              goalChanged = true;
            } else if (!allTasksDone && sg.done) {
              newDone = false;
              goalChanged = true;
            }
          }
          return newDone !== sg.done ? { ...sg, done: newDone } : sg;
        });

        let newStatus = g.status;

        if (newSubGoals.length > 0) {
          const allSubGoalsDone = newSubGoals.every((sg) => sg.done);
          if (allSubGoalsDone && g.status !== "completed") {
            newStatus = "completed";
            goalChanged = true;
            celebrate("goal");
          } else if (!allSubGoalsDone && g.status === "completed") {
            newStatus = "in_progress";
            goalChanged = true;
          }
        }


        if (goalChanged) {
          changed = true;
          return { ...g, subGoals: newSubGoals, status: newStatus };
        }
        return g;
      });

      return changed ? newGoals : currentGoals;
    });
  }, [tasks]);

  // Promote linked goal to in_progress when a task / subgoal first completes
  const promoteGoal = (goalId?: string) => {
    if (!goalId) return;
    setGoals((cur) =>
      cur.map((g) =>
        g.id === goalId && g.status === "not_started" ? { ...g, status: "in_progress" } : g,
      ),
    );
  };

  const bumpGoalSpent = (goalId: string, delta: number) => {
    setGoals((cur) =>
      cur.map((g) =>
        g.id === goalId ? { ...g, spentHours: Math.max(0, (g.spentHours ?? 0) + delta) } : g,
      ),
    );
  };

  const importMarketplaceGoal = (
    template: MarketplaceGoalTemplate,
    opts?: { autoSchedule?: boolean },
  ) => {

    let finalSkillId = skills.find(
      (s) => s.label.toLowerCase() === template.skillName.toLowerCase(),
    )?.id;
    if (!finalSkillId) {
      const newSkillId = uid();
      finalSkillId = newSkillId;
      setSkills((prev) => [
        ...prev,
        { id: newSkillId, label: template.skillName, color: "#9ca3af" },
      ]);
    }

    const today = new Date();
    const startDate = today.toISOString().split("T")[0];

    const targetDateObj = new Date(today);
    targetDateObj.setDate(today.getDate() + template.durationDays);
    const targetDate = targetDateObj.toISOString().split("T")[0];

    const newGoal: Goal = {
      id: uid(),
      title: template.title,
      description: template.description + (template.advice ? `\n\nAdvice: ${template.advice}` : ""),
      skill: finalSkillId,
      startDate,
      targetDate,
      status: "not_started",
      subGoals: template.subGoals.map((sg) => {
        const d = new Date(today);
        d.setDate(today.getDate() + sg.dayOffset);
        return {
          id: uid(),
          title: sg.title,
          targetDate: d.toISOString().split("T")[0],
          done: false,
        };
      }),
    };

    const newTasks: Task[] = template.tasks.map((t) => {
      let taskStartDate, taskEndDate;
      if (t.startDayOffset !== undefined) {
        const sd = new Date(today);
        sd.setDate(today.getDate() + t.startDayOffset);
        taskStartDate = sd.toISOString().split("T")[0];
      }
      if (t.endDayOffset !== undefined) {
        const ed = new Date(today);
        ed.setDate(today.getDate() + t.endDayOffset);
        taskEndDate = ed.toISOString().split("T")[0];
      }

      const linkedSubGoalId =
        t.subGoalIndex !== undefined &&
        t.subGoalIndex >= 0 &&
        t.subGoalIndex < newGoal.subGoals.length
          ? newGoal.subGoals[t.subGoalIndex].id
          : undefined;

      return {
        id: uid(),
        title: t.title,
        priority: t.priority,
        done: false,
        subGoalId: linkedSubGoalId,
        startDate: taskStartDate,
        endDate: taskEndDate,
        recurrence: t.recurrence,
        plannedHours: t.plannedHours,
        evidence: [t.description, t.notes].filter(Boolean).join("\n\n") || undefined,
        subtasks: t.subtasks.map((st) => ({
          id: uid(),
          title: st.title,
          done: false,
          recurrence: st.recurrence,
          plannedHours: st.plannedHours,
          priority: st.priority,
        })),
      };
    });

    let scheduledTasks = newTasks;
    if (opts?.autoSchedule) {
      const existing: Array<{ startDate?: string; endDate?: string }> = [];
      for (const t of tasks) {
        existing.push({ startDate: t.startDate, endDate: t.endDate });
        for (const s of t.subtasks)
          existing.push({ startDate: s.startDate, endDate: s.endDate });
      }
      scheduledTasks = autoScheduleTasks(newTasks, startDate, targetDate, existing);
    }

    setGoals((prev) => [...prev, newGoal]);
    setTasks((prev) => [...prev, ...scheduledTasks]);
    const vocab = getFrierenVocabulary(settings.themeColor === "frieren");
    if (opts?.autoSchedule) {
      const blocks = scheduledTasks.reduce((n, t) => {
        const subBlocks = t.subtasks.filter((s) => s.startDate && s.endDate).length;
        const taskBlock = t.startDate && t.endDate ? 1 : 0;
        return n + subBlocks + taskBlock;
      }, 0);
      toast.success(
        vocab.isFrieren
          ? `${blocks} preparations scheduled in the grimoire.`
          : `Goal imported · ${blocks} blocks scheduled`,
      );
    } else {
      toast.success(
        vocab.isFrieren ? `A new quest inscribed in the grimoire.` : "Goal imported successfully!",
      );
    }
  };

  const autoScheduleGoalFn = (goalId: string): number => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return 0;
    const subGoalIds = new Set(goal.subGoals.map((sg) => sg.id));
    const goalTasks = tasks.filter((t) => t.subGoalId && subGoalIds.has(t.subGoalId));
    const otherBlocks: Array<{ startDate?: string; endDate?: string }> = [];
    for (const t of tasks) {
      if (goalTasks.find((gt) => gt.id === t.id)) continue;
      otherBlocks.push({ startDate: t.startDate, endDate: t.endDate });
      for (const s of t.subtasks)
        otherBlocks.push({ startDate: s.startDate, endDate: s.endDate });
    }
    const rescheduled = autoScheduleTasks(goalTasks, goal.startDate, goal.targetDate, otherBlocks);
    const byId = new Map(rescheduled.map((t) => [t.id, t]));
    let count = 0;
    setTasks((cur) =>
      cur.map((t) => {
        const r = byId.get(t.id);
        if (!r) return t;
        count +=
          r.subtasks.filter((s) => s.startDate && s.endDate).length +
          (r.startDate && r.endDate ? 1 : 0);
        return r;
      }),
    );
    return count;
  };

  const autoScheduleSkillFn = (skillId: string): number => {
    let total = 0;
    for (const g of goals) if (g.skill === skillId) total += autoScheduleGoalFn(g.id);
    return total;
  };


  const value: Ctx = {
    goals,
    tasks,
    bucketList,
    skills,
    settings,
    setBirthYear: (y) => setSettings((s) => ({ ...s, birthYear: y })),
    updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),

    addSkill: (s) =>
      setSkills((cur) => {
        const id = s.id?.trim() || s.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || uid();
        if (cur.some((x) => x.id === id)) return cur;
        return [...cur, { id, label: s.label, color: s.color }];
      }),
    updateSkill: (id, patch) =>
      setSkills((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    deleteSkill: (id) => setSkills((cur) => cur.filter((s) => s.id !== id)),

    addGoal: (g) => {
      const id = uid();
      const generalId = uid();
      setGoals((cur) => [
        ...cur,
        {
          ...g,
          id,
          subGoals: [{ id: generalId, title: "General", done: false }],
        },
      ]);
      return id;
    },
    updateGoal: (id, patch) =>
      setGoals((cur) => cur.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    deleteGoal: (id) => {
      const goalToDelete = goals.find((g) => g.id === id);
      if (goalToDelete) {
        const subGoalIds = new Set(goalToDelete.subGoals.map((sg) => sg.id));
        setTasks((cur) =>
          cur.filter((t) => t.goalId !== id && (!t.subGoalId || !subGoalIds.has(t.subGoalId))),
        );
      }
      setGoals((cur) => cur.filter((g) => g.id !== id));
    },
    addSubGoal: (goalId, title, targetDate) => {
      const id = uid();
      setGoals((cur) =>
        cur.map((g) => {
          if (g.id !== goalId) return g;
          let clamped = targetDate;
          if (clamped) {
            if (g.targetDate && clamped > g.targetDate) clamped = g.targetDate;
            if (g.startDate && clamped < g.startDate) clamped = g.startDate;
          }
          return {
            ...g,
            subGoals: [...g.subGoals, { id, title, targetDate: clamped, done: false }],
          };
        }),
      );
      return id;
    },

    ensureDefaultMilestone: (goalId) => {
      const existing = goals.find((g) => g.id === goalId);
      const first = existing?.subGoals[0];
      if (first) return first.id;
      const id = uid();
      setGoals((cur) =>
        cur.map((g) =>
          g.id === goalId
            ? { ...g, subGoals: [...g.subGoals, { id, title: "General", done: false }] }
            : g,
        ),
      );
      return id;
    },
    toggleSubGoal: (goalId, subId) => {
      let cascade = false;
      setGoals((cur) =>
        cur.map((g) => {
          if (g.id !== goalId) return g;
          const subGoals = g.subGoals.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
          const wasCompleting = subGoals.find((s) => s.id === subId)?.done;
          cascade = !!wasCompleting;
          if (wasCompleting) celebrate("milestone");
          const status: GoalStatus =
            g.status === "not_started" && wasCompleting ? "in_progress" : g.status;
          return { ...g, subGoals, status };
        }),
      );

      // Cascade-close: when a milestone closes, mark every open task (and its subtasks)
      // linked to that milestone as done.
      if (cascade) {
        setTasks((cur) =>
          cur.map((t) =>
            t.subGoalId === subId
              ? { ...t, done: true, subtasks: t.subtasks.map((s) => ({ ...s, done: true })) }
              : t,
          ),
        );
      }
    },
    deleteSubGoal: (goalId, subId) => {
      setTasks((cur) => cur.filter((t) => t.subGoalId !== subId));
      setGoals((cur) =>
        cur.map((g) =>
          g.id === goalId ? { ...g, subGoals: g.subGoals.filter((s) => s.id !== subId) } : g,
        ),
      );
    },

    addTask: (t) =>
      setTasks((cur) => [...cur, { ...t, id: uid(), done: false, subtasks: t.subtasks ?? [] }]),
    updateTask: (id, patch) =>
      setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    toggleTask: (id) => {
      let promoted: string | undefined;
      let goalDelta = 0;
      let goalIdForDelta: string | undefined;
      setTasks((cur) =>
        cur.map((t) => {
          if (t.id !== id) return t;
          const isRecurring = t.recurrence && t.recurrence !== "none";
          // If moving to done and it's recurring, bump instead
          if (!t.done && isRecurring) {
            const bumpedDueDate = bumpDateString(t.dueDate, t.recurrence);
            const bumpedStartDate = bumpDateString(t.startDate, t.recurrence);
            const bumpedEndDate = bumpDateString(t.endDate, t.recurrence);
            const vocab = getFrierenVocabulary(settings.themeColor === "frieren");
            toast.success(
              vocab.isFrieren
                ? `Another preparation complete. The cycle continues.`
                : `Recurring task bumped to next occurrence`,
            );
            return {
              ...t,
              dueDate: bumpedDueDate,
              startDate: bumpedStartDate,
              endDate: bumpedEndDate,
            };
          }

          const nowDone = !t.done;
          const delta = hoursBetween(t.startDate, t.endDate);
          const curSpent = t.spentHours ?? 0;
          const nextSpent = nowDone ? curSpent + delta : Math.max(0, curSpent - delta);
          // Promote linked goal on ANY interaction
          promoted = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId))?.id;
          if (delta > 0) {
            goalDelta = nowDone ? delta : -delta;
            goalIdForDelta = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId))?.id;
          }
          if (nowDone) celebrate("task");
          // Cascade-close subtasks when task is being completed
          const subtasks = nowDone ? t.subtasks.map((s) => ({ ...s, done: true })) : t.subtasks;
          return { ...t, done: nowDone, spentHours: nextSpent, subtasks };
        }),
      );

      promoteGoal(promoted);
      if (goalIdForDelta && goalDelta !== 0) bumpGoalSpent(goalIdForDelta, goalDelta);
    },
    deleteTask: (id) => setTasks((cur) => cur.filter((t) => t.id !== id)),
    rescheduleTask: (id, newYmd) => {
      const shift = (iso: string | undefined) => (iso ? newYmd + iso.slice(10) : iso);
      setTasks((cur) =>
        cur.map((t) =>
          t.id === id
            ? {
                ...t,
                dueDate: t.dueDate ? newYmd : t.dueDate,
                startDate: shift(t.startDate),
                endDate: shift(t.endDate),
              }
            : t,
        ),
      );
      toast.success(`Moved to ${newYmd}`);
    },

    addSubtask: (taskId, st) =>
      setTasks((cur) =>
        cur.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...t.subtasks, { ...st, id: uid(), done: false }] }
            : t,
        ),
      ),
    updateSubtask: (taskId, subId, patch) =>
      setTasks((cur) =>
        cur.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, ...patch } : s)) }
            : t,
        ),
      ),
    toggleSubtask: (taskId, subId) => {
      let promoted: string | undefined;
      let goalDelta = 0;
      let taskDelta = 0;
      let goalIdForDelta: string | undefined;
      setTasks((cur) =>
        cur.map((t) => {
          if (t.id !== taskId) return t;
          let nextTaskSpent = t.spentHours ?? 0;
          let toggledSubtaskNowDone = false;
          const subtasks = t.subtasks.map((s) => {
            if (s.id !== subId) return s;
            const isRecurring = s.recurrence && s.recurrence !== "none";
            if (!s.done && isRecurring) {
              const bumpedStartDate = bumpDateString(s.startDate, s.recurrence);
              const bumpedEndDate = bumpDateString(s.endDate, s.recurrence);
              const vocab = getFrierenVocabulary(settings.themeColor === "frieren");
              toast.success(
                vocab.isFrieren
                  ? `Another preparation complete. The cycle continues.`
                  : `Recurring subtask bumped to next occurrence`,
              );
              return {
                ...s,
                startDate: bumpedStartDate,
                endDate: bumpedEndDate,
              };
            }

            const nowDone = !s.done;
            toggledSubtaskNowDone = nowDone;
            const delta = hoursBetween(s.startDate, s.endDate);
            const curSpent = s.spentHours ?? 0;
            const nextSpent = nowDone ? curSpent + delta : Math.max(0, curSpent - delta);
            promoted = goals.find((g) => g.subGoals.some((sg) => sg.id === t.subGoalId))?.id;
            if (delta > 0) {
              const signed = nowDone ? delta : -delta;
              taskDelta = signed;
              goalDelta = signed;
              goalIdForDelta = goals.find((g) =>
                g.subGoals.some((sg) => sg.id === t.subGoalId),
              )?.id;
              nextTaskSpent = Math.max(0, nextTaskSpent + signed);
            }
            if (nowDone) celebrate("task");
            return { ...s, done: nowDone, spentHours: nextSpent };
          });


          let nextTaskDone = t.done;
          const allSubsDone = subtasks.length > 0 && subtasks.every((s) => s.done);

          const isTaskRecurring = t.recurrence && t.recurrence !== "none";
          if (!toggledSubtaskNowDone) {
            nextTaskDone = false;
          } else if (allSubsDone && !isTaskRecurring) {
            nextTaskDone = true;
          }

          return {
            ...t,
            done: nextTaskDone,
            subtasks,
            spentHours: taskDelta !== 0 ? nextTaskSpent : t.spentHours,
          };
        }),
      );
      promoteGoal(promoted);
      if (goalIdForDelta && goalDelta !== 0) bumpGoalSpent(goalIdForDelta, goalDelta);
    },
    deleteSubtask: (taskId, subId) =>
      setTasks((cur) =>
        cur.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) } : t,
        ),
      ),
    rescheduleSubtask: (taskId, subId, newYmd) => {
      const shift = (iso: string | undefined) => (iso ? newYmd + iso.slice(10) : iso);
      setTasks((cur) =>
        cur.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) =>
                  s.id === subId
                    ? { ...s, startDate: shift(s.startDate), endDate: shift(s.endDate) }
                    : s,
                ),
              }
            : t,
        ),
      );
      toast.success(`Moved to ${newYmd}`);
    },

    addBucket: (b) => setBucketList((cur) => [...cur, { ...b, id: uid(), achieved: false }]),
    updateBucket: (id, patch) =>
      setBucketList((cur) => cur.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    toggleBucket: (id) =>
      setBucketList((cur) => cur.map((b) => (b.id === id ? { ...b, achieved: !b.achieved } : b))),
    deleteBucket: (id) => setBucketList((cur) => cur.filter((b) => b.id !== id)),

    importMarketplaceGoal,
    autoScheduleGoal: autoScheduleGoalFn,
    autoScheduleSkill: autoScheduleSkillFn,

    exportJSON: () => {
      const payload = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        goals,
        tasks,
        bucketList,
        skills,
        settings,
      };
      downloadJSON(payload, `life-manager-${new Date().toISOString().slice(0, 10)}.json`);
    },
    importJSON: async (file) => {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON");
      }
      const data = normalizeAppData(parsed);
      let dateCorrected = false;
      data.tasks.forEach((t) => {
        t.subtasks.forEach((s) => {
          if (s.startDate && s.endDate && s.startDate.slice(0, 10) !== s.endDate.slice(0, 10)) {
            dateCorrected = true;
            s.endDate = s.startDate.slice(0, 11) + s.endDate.slice(11);
          }
        });
      });
      if (dateCorrected) {
        toast.warning("Some subtasks spanning multiple days were auto-corrected to same-day.");
      }
      setGoals(data.goals);
      setTasks(data.tasks);
      setBucketList(data.bucketList);
      if (data.skills) setSkills(data.skills);
      if (data.settings) setSettings(data.settings);
    },
    appendJSON: async (file) => {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON");
      }
      const data = normalizeAppData(parsed);
      let dateCorrected = false;
      data.tasks.forEach((t) => {
        t.subtasks.forEach((s) => {
          if (s.startDate && s.endDate && s.startDate.slice(0, 10) !== s.endDate.slice(0, 10)) {
            dateCorrected = true;
            s.endDate = s.startDate.slice(0, 11) + s.endDate.slice(11);
          }
        });
      });
      if (dateCorrected) {
        toast.warning("Some subtasks spanning multiple days were auto-corrected to same-day.");
      }
      // Remap ids so we never collide with existing data, and rewire goalId references
      const goalIdMap = new Map<string, string>();
      const subGoalIdMap = new Map<string, string>();
      const newGoals = data.goals.map((g) => {
        const nid = uid();
        goalIdMap.set(g.id, nid);
        return {
          ...g,
          id: nid,
          subGoals: g.subGoals.map((s) => {
            const sid = uid();
            subGoalIdMap.set(s.id, sid);
            return { ...s, id: sid };
          }),
        };
      });
      const newTasks = data.tasks.map((t) => ({
        ...t,
        id: uid(),
        subGoalId: t.subGoalId ? (subGoalIdMap.get(t.subGoalId) ?? undefined) : undefined,
        subtasks: t.subtasks.map((s) => ({ ...s, id: uid() })),
      }));
      const newBucket = data.bucketList.map((b) => ({ ...b, id: uid() }));
      setGoals((cur) => [...cur, ...newGoals]);
      setTasks((cur) => [...cur, ...newTasks]);
      setBucketList((cur) => [...cur, ...newBucket]);
      if (data.skills) {
        setSkills((cur) => {
          const combined = [...cur];
          data.skills!.forEach((s) => {
            if (!combined.some((x) => x.id === s.id)) combined.push(s);
          });
          return combined;
        });
      }
      if (data.settings) {
        setSettings((cur) => ({ ...cur, ...data.settings }));
      }
      return { goals: newGoals.length, tasks: newTasks.length, bucket: newBucket.length };
    },
    replaceAll: (data) => {
      const norm = normalizeAppData(data);
      setGoals(norm.goals);
      setTasks(norm.tasks);
      setBucketList(norm.bucketList);
      if (norm.skills) setSkills(norm.skills);
      if (norm.settings) setSettings(norm.settings);
    },
    clearAll: () => {
      setGoals([]);
      setTasks([]);
      setBucketList([]);
      setSkills(DEFAULT_SKILLS);
      setSettings({});
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.location.href = "/home";
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

export function progressFor(g: Goal, tasks: Task[] = []): number {
  const linked = tasks.filter(
    (t) => t.subGoalId && g.subGoals?.some((sg) => sg.id === t.subGoalId),
  );
  if (linked.length > 0) {
    const done = linked.filter((t) => t.done).length;
    return Math.round((done / linked.length) * 100);
  }
  const subs = g.subGoals ?? [];
  if (subs.length > 0) {
    const done = subs.filter((s) => s.done).length;
    return Math.round((done / subs.length) * 100);
  }
  if (g.status === "completed") return 100;
  return g.manualProgress ?? 0;
}

export const DEMO_DATA: AppData = {
  goals: TEMPLATE_PAYLOAD.goals.map((g) => normalizeGoal(g)),
  tasks: TEMPLATE_PAYLOAD.tasks.map((t) => normalizeTask(t)),
  bucketList: TEMPLATE_PAYLOAD.bucketList.map((b) => normalizeBucket(b)),
};

export function skillMeta(id: SkillId) {
  return SKILLS.find((s) => s.id === id) ?? SKILLS[0];
}
