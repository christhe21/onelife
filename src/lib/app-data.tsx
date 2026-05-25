import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const SKILLS = [
  { id: "life", label: "Life", color: "#10b981" },
  { id: "technical", label: "Technical", color: "#3b82f6" },
  { id: "health", label: "Health", color: "#ef4444" },
  { id: "creative", label: "Creative", color: "#a855f7" },
  { id: "financial", label: "Financial", color: "#eab308" },
  { id: "social", label: "Social", color: "#ec4899" },
  { id: "career", label: "Career", color: "#6366f1" },
  { id: "learning", label: "Learning", color: "#14b8a6" },
] as const;

export type SkillId = (typeof SKILLS)[number]["id"];
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

const uid = () => Math.random().toString(36).slice(2, 10);

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

export const TEMPLATE_PAYLOAD = {
  version: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
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
      statuses: ["not_started", "in_progress", "completed"],
      taskPriorities: ["low", "medium", "high"],
    },
    "life-manager-skills-reference.json",
  );
}


interface Ctx extends AppData {
  addGoal: (g: Omit<Goal, "id" | "subGoals">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addSubGoal: (goalId: string, title: string, targetDate?: string) => void;
  toggleSubGoal: (goalId: string, subId: string) => void;
  deleteSubGoal: (goalId: string, subId: string) => void;

  addTask: (t: Omit<Task, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addBucket: (b: Omit<BucketItem, "id" | "achieved">) => void;
  toggleBucket: (id: string) => void;
  deleteBucket: (id: string) => void;

  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
  replaceAll: (data: AppData) => void;
}

const AppDataContext = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);

  // Warn before unload if user has data (it's session-only).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (goals.length || tasks.length || bucketList.length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [goals, tasks, bucketList]);

  const value: Ctx = {
    goals,
    tasks,
    bucketList,
    addGoal: (g) => setGoals((cur) => [...cur, { ...g, id: uid(), subGoals: [] }]),
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
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.goals) || !Array.isArray(data.tasks) || !Array.isArray(data.bucketList)) {
        throw new Error("Invalid file shape");
      }
      setGoals(data.goals);
      setTasks(data.tasks);
      setBucketList(data.bucketList);
    },
    replaceAll: (data) => {
      setGoals(data.goals);
      setTasks(data.tasks);
      setBucketList(data.bucketList);
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
  if (g.subGoals.length === 0) return g.manualProgress ?? (g.status === "completed" ? 100 : 0);
  const done = g.subGoals.filter((s) => s.done).length;
  return Math.round((done / g.subGoals.length) * 100);
}

export function skillMeta(id: SkillId) {
  return SKILLS.find((s) => s.id === id)!;
}
