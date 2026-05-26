import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

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

// Back-compat export (for template/reference downloads — read-only).
export const SKILLS = DEFAULT_SKILLS;
export type SkillId = string;
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
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  goalId?: string;
}

export interface BucketItem {
  id: string;
  title: string;
  notes?: string;
  targetYear?: number;
  achieved: boolean;
}

export interface AppData {
  goals: Goal[];
  tasks: Task[];
  bucketList: BucketItem[];
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

// ---- Normalization (defensive — accepts AI-generated / partial JSON) ----
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
  };
}

function normalizeTask(raw: any): Task {
  return {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    title: String(raw?.title ?? "Untitled task"),
    dueDate: typeof raw?.dueDate === "string" ? raw.dueDate : undefined,
    priority: PRIORITIES.includes(raw?.priority) ? raw.priority : "medium",
    done: Boolean(raw?.done),
    goalId: typeof raw?.goalId === "string" ? raw.goalId : undefined,
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
  return {
    goals: Array.isArray(raw.goals) ? raw.goals.map(normalizeGoal) : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : [],
    bucketList: Array.isArray(raw.bucketList) ? raw.bucketList.map(normalizeBucket) : [],
  };
}

// ---- Template (with embedded AI system prompt) ----
const AI_SYSTEM_PROMPT = `You are a thoughtful life-planning coach. Your job is to interview the user and then produce a JSON file they can upload into the "Life Manager" app.

Step 1 — Interview the user. Ask conversationally (one batch of questions at a time):
  1. Age, life stage, location/time-zone, weekly hours available for personal goals.
  2. Current skills they're proud of, and 2–3 areas they want to grow.
  3. 3–7 concrete goals across different areas of life (career, health, financial, learning, creative, social, life, technical).
     For each: a clear title, a one-sentence description, a realistic target date, and 2–4 sub-goals/milestones with their own target dates.
  4. Tasks for the next 2 weeks (5–10), each with due date, priority (low|medium|high), and optionally linked to one of the goals above.
  5. A small bucket list (3–6 lifetime wishes) with optional target year.

Step 2 — Output ONE JSON code block matching this exact shape (no commentary outside the block):

{
  "version": 1,
  "goals":      [ { "id": "...", "title": "...", "description": "...", "skill": "<one of: life|technical|health|creative|financial|social|career|learning>", "startDate": "YYYY-MM-DD", "targetDate": "YYYY-MM-DD", "status": "not_started|in_progress|completed", "currentActivity": "...", "manualProgress": 0, "subGoals": [ { "id": "...", "title": "...", "targetDate": "YYYY-MM-DD", "done": false } ] } ],
  "tasks":      [ { "id": "...", "title": "...", "dueDate": "YYYY-MM-DD", "priority": "low|medium|high", "done": false, "goalId": "<id of a goal above, or omit>" } ],
  "bucketList": [ { "id": "...", "title": "...", "notes": "...", "targetYear": 2030, "achieved": false } ]
}

Rules:
  - Use stable string ids (e.g. "goal-1", "sg-1", "t-1", "b-1"). Reference them consistently from tasks.goalId.
  - Dates must be ISO YYYY-MM-DD. \`skill\` must be one of the allowed IDs above.
  - Keep targets realistic given the user's stated weekly hours.
  - Default \`manualProgress\` to 0 and \`done\`/\`achieved\` to false unless the user says otherwise.
  - Do not invent personal facts the user did not share. Ask if unsure.`;

export const TEMPLATE_PAYLOAD = {
  version: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  _ai: {
    instructions:
      "Copy `_ai.systemPrompt` below into ChatGPT / Claude / any LLM as the system message. Answer its questions. It will return a JSON block — save it as a .json file and upload it via the Data → Import menu. Keys prefixed with `_` are ignored by the importer, so this same file can be uploaded as-is.",
    systemPrompt: AI_SYSTEM_PROMPT,
    schema: {
      skill: SKILLS.map((s) => s.id),
      goalStatus: STATUSES,
      taskPriority: PRIORITIES,
      dateFormat: "YYYY-MM-DD",
      required: {
        goal: ["id", "title", "skill", "startDate", "targetDate", "status", "subGoals"],
        task: ["id", "title", "priority", "done"],
        bucketItem: ["id", "title", "achieved"],
      },
    },
  },
  goals: [
    {
      id: "example-goal-1",
      title: "Learn TypeScript",
      description: "Become proficient in advanced TS patterns",
      skill: "technical",
      startDate: "2026-01-01",
      targetDate: "2026-06-30",
      status: "in_progress",
      currentActivity: "Reading the handbook, chapter 4",
      manualProgress: 25,
      subGoals: [
        { id: "sg-1", title: "Finish handbook", targetDate: "2026-03-01", done: false },
        { id: "sg-2", title: "Build a typed CLI", targetDate: "2026-05-15", done: false },
      ],
    },
    {
      id: "example-goal-2",
      title: "Run a 10K",
      description: "Train consistently for a 10K race",
      skill: "health",
      startDate: "2026-02-01",
      targetDate: "2026-08-01",
      status: "not_started",
      currentActivity: "Buying running shoes",
      manualProgress: 0,
      subGoals: [
        { id: "sg-3", title: "Run 3K nonstop", targetDate: "2026-03-15", done: false },
        { id: "sg-4", title: "Run 5K nonstop", targetDate: "2026-05-15", done: false },
      ],
    },
  ],
  tasks: [
    { id: "t-1", title: "Draft project outline", dueDate: "2026-01-10", priority: "high", done: false, goalId: "example-goal-1" },
    { id: "t-2", title: "Buy running shoes", dueDate: "2026-02-05", priority: "medium", done: false, goalId: "example-goal-2" },
  ],
  bucketList: [
    { id: "b-1", title: "See the northern lights", notes: "Ideally from Norway", targetYear: 2027, achieved: false },
    { id: "b-2", title: "Publish a book", notes: "Short story collection", targetYear: 2030, achieved: false },
  ],
};

export function downloadTemplate() {
  downloadJSON(TEMPLATE_PAYLOAD, "life-manager-template.json");
}

export function downloadSkillsReference() {
  downloadJSON(
    {
      description:
        "Valid values for the `skill` field on each goal. Use one of these IDs when generating data for life-manager-template.json.",
      skills: SKILLS.map((s) => ({ id: s.id, label: s.label })),
      statuses: STATUSES,
      taskPriorities: PRIORITIES,
    },
    "life-manager-skills-reference.json",
  );
}

interface Ctx extends AppData {
  skills: Skill[];
  addSkill: (s: Omit<Skill, "id"> & { id?: string }) => void;
  updateSkill: (id: string, patch: Partial<Omit<Skill, "id">>) => void;
  deleteSkill: (id: string) => void;

  addGoal: (g: Omit<Goal, "id" | "subGoals">) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addSubGoal: (goalId: string, title: string, targetDate?: string) => void;
  toggleSubGoal: (goalId: string, subId: string) => void;
  deleteSubGoal: (goalId: string, subId: string) => void;

  addTask: (t: Omit<Task, "id" | "done">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addBucket: (b: Omit<BucketItem, "id" | "achieved">) => void;
  updateBucket: (id: string, patch: Partial<BucketItem>) => void;
  toggleBucket: (id: string) => void;
  deleteBucket: (id: string) => void;

  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
  replaceAll: (data: AppData) => void;
  clearAll: () => void;
}

const AppDataContext = createContext<Ctx | null>(null);

interface Stored extends AppData {
  skills?: Skill[];
}

function loadInitial(): Stored {
  const empty: Stored = { goals: [], tasks: [], bucketList: [], skills: DEFAULT_SKILLS };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    const data = normalizeAppData(parsed);
    const skills: Skill[] = Array.isArray(parsed?.skills) && parsed.skills.length
      ? parsed.skills
          .filter((s: any) => s && typeof s.id === "string" && typeof s.label === "string")
          .map((s: any) => ({ id: s.id, label: s.label, color: typeof s.color === "string" ? s.color : "#10b981" }))
      : DEFAULT_SKILLS;
    return { ...data, skills };
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: EXPORT_VERSION, goals, tasks, bucketList, skills }),
        );
      } catch {
        /* quota exceeded — ignore */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [goals, tasks, bucketList, skills]);
  const value: Ctx = {
    goals,
    tasks,
    bucketList,
    skills,
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
      setGoals((cur) => [...cur, { ...g, id, subGoals: [] }]);
      return id;
    },
    updateGoal: (id, patch) =>
      setGoals((cur) => cur.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    deleteGoal: (id) => setGoals((cur) => cur.filter((g) => g.id !== id)),
    addSubGoal: (goalId, title, targetDate) =>
      setGoals((cur) =>
        cur.map((g) =>
          g.id === goalId
            ? { ...g, subGoals: [...g.subGoals, { id: uid(), title, targetDate, done: false }] }
            : g
        )
      ),
    toggleSubGoal: (goalId, subId) =>
      setGoals((cur) =>
        cur.map((g) =>
          g.id === goalId
            ? {
                ...g,
                subGoals: g.subGoals.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
              }
            : g
        )
      ),
    deleteSubGoal: (goalId, subId) =>
      setGoals((cur) =>
        cur.map((g) =>
          g.id === goalId ? { ...g, subGoals: g.subGoals.filter((s) => s.id !== subId) } : g
        )
      ),

    addTask: (t) => setTasks((cur) => [...cur, { ...t, id: uid(), done: false }]),
    toggleTask: (id) =>
      setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    deleteTask: (id) => setTasks((cur) => cur.filter((t) => t.id !== id)),

    addBucket: (b) => setBucketList((cur) => [...cur, { ...b, id: uid(), achieved: false }]),
    toggleBucket: (id) =>
      setBucketList((cur) =>
        cur.map((b) => (b.id === id ? { ...b, achieved: !b.achieved } : b))
      ),
    deleteBucket: (id) => setBucketList((cur) => cur.filter((b) => b.id !== id)),

    exportJSON: () => {
      const payload = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        goals,
        tasks,
        bucketList,
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
      setGoals(data.goals);
      setTasks(data.tasks);
      setBucketList(data.bucketList);
    },
    replaceAll: (data) => {
      const norm = normalizeAppData(data);
      setGoals(norm.goals);
      setTasks(norm.tasks);
      setBucketList(norm.bucketList);
    },
    clearAll: () => {
      setGoals([]);
      setTasks([]);
      setBucketList([]);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

export function progressFor(g: Goal): number {
  const subs = g.subGoals ?? [];
  if (subs.length === 0) return g.manualProgress ?? (g.status === "completed" ? 100 : 0);
  const done = subs.filter((s) => s.done).length;
  return Math.round((done / subs.length) * 100);
}

export function skillMeta(id: SkillId) {
  return SKILLS.find((s) => s.id === id) ?? SKILLS[0];
}
