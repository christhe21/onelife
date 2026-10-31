import { z } from "zod";
import type { BucketItem, Goal, SubGoal, SubTask, Skill, Task } from "./app-data";
import type { Book, BooksState, ReadingSession } from "./plugins-data";
import type { SurvivalRule, SurvivalState } from "./survival-data";
import type { FocusPillar, FocusState } from "./focus";

/** App-data actions the voice assistant may call. Settings are intentionally excluded. */
export interface AssistantApi {
  skills: Skill[];
  goals: Goal[];
  tasks: Task[];
  books: BooksState;
  bucketList?: BucketItem[];
  focus?: FocusState;
  survival?: SurvivalState;
  plugins?: { enabled: string[] };
  addSkill: (s: Omit<Skill, "id">) => void;
  updateSkill: (id: string, patch: Partial<Omit<Skill, "id">>) => void;
  deleteSkill?: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "subGoals">) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addSubGoal: (goalId: string, title: string, targetDate?: string) => string;
  updateSubGoal?: (goalId: string, subId: string, patch: Partial<SubGoal>) => void;
  toggleSubGoal?: (goalId: string, subId: string) => void;
  deleteSubGoal?: (goalId: string, subId: string) => void;
  moveSubGoal?: (subId: string, toGoalId: string) => void;
  ensureDefaultMilestone: (goalId: string) => string;
  addTask: (t: Omit<Task, "id" | "done" | "subtasks">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  rescheduleTask?: (id: string, ymd: string, hm?: string) => void;
  canScheduleTask?: (taskId: string) => boolean;
  addSubtask?: (taskId: string, st: Omit<SubTask, "id" | "done">) => void;
  updateSubtask?: (taskId: string, subId: string, patch: Partial<SubTask>) => void;
  toggleSubtask?: (taskId: string, subId: string) => void;
  deleteSubtask?: (taskId: string, subId: string) => void;
  autoScheduleGoal?: (goalId: string) => { blockedReason?: string; scheduled?: unknown[] } & Record<string, unknown>;
  autoScheduleSkill?: (skillId: string) => { blockedReason?: string } & Record<string, unknown>;
  setFocusPillars?: (p: FocusPillar[]) => void;
  confirmFocusMonth?: () => void;
  addBucket?: (b: Omit<BucketItem, "id" | "achieved">) => void;
  updateBucket?: (id: string, patch: Partial<BucketItem>) => void;
  toggleBucket?: (id: string) => void;
  deleteBucket?: (id: string) => void;
  addBook: (b: Partial<Book> & { title: string }) => string;
  updateBook?: (id: string, patch: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  setBookmark: (id: string, page: number) => void;
  addReadingSession: (bookId: string, s: Omit<ReadingSession, "id" | "done">) => void;
  deleteReadingSession?: (bookId: string, sessionId: string) => void;
  setPluginEnabled?: (id: string, enabled: boolean) => void;
  addSurvivalRule?: (r: Omit<SurvivalRule, "id" | "order" | "isDefault">) => void;
  updateSurvivalRule?: (id: string, patch: Partial<SurvivalRule>) => void;
  toggleSurvivalRule?: (id: string, date: string) => void;
  deleteSurvivalRule?: (id: string) => void;
}

const ns = z.string().nullable();
const nn = z.number().nullable();
const nb = z.boolean().nullable();

/** Single source of truth for every assistant tool: name, plain description, input schema. */
export const ASSISTANT_TOOLS = {
  create_skill: { description: "Add a new skill / area of life.", input: z.object({ label: z.string(), color: ns }) },
  update_skill: { description: "Rename or recolor a skill.", input: z.object({ skill_id: z.string(), label: ns, color: ns }) },
  delete_skill: { description: "Remove a custom skill (built-in skills stay). Confirm first.", input: z.object({ skill_id: z.string() }) },
  create_goal: { description: "Add a goal under a skill, with optional deadline (YYYY-MM-DD) and description.", input: z.object({ title: z.string(), skill_id: z.string(), target_date: ns, description: ns }) },
  update_goal: { description: "Change a goal's title, description, deadline, skill or status (not_started, in_progress, completed).", input: z.object({ goal_id: z.string(), title: ns, description: ns, target_date: ns, skill_id: ns, status: ns }) },
  delete_goal: { description: "Remove a goal and its milestones. Confirm first.", input: z.object({ goal_id: z.string() }) },
  create_milestone: { description: "Add a milestone under a goal.", input: z.object({ goal_id: z.string(), title: z.string(), target_date: ns }) },
  update_milestone: { description: "Rename or change the date of a milestone.", input: z.object({ milestone_id: z.string(), title: ns, target_date: ns }) },
  move_milestone: { description: "Move a milestone (with its tasks) to another goal.", input: z.object({ milestone_id: z.string(), to_goal_id: z.string() }) },
  toggle_milestone: { description: "Mark a milestone done or not done.", input: z.object({ milestone_id: z.string() }) },
  delete_milestone: { description: "Remove a milestone and its tasks. Confirm first.", input: z.object({ milestone_id: z.string() }) },
  create_task: { description: "Add a task under a goal (and optionally a milestone). Priority low, medium or high.", input: z.object({ title: z.string(), goal_id: z.string(), milestone_id: ns, due_date: ns, priority: ns }) },
  update_task: { description: "Change a task's title, priority, due date or milestone.", input: z.object({ task_id: z.string(), title: ns, priority: ns, due_date: ns, milestone_id: ns }) },
  complete_task: { description: "Tick or untick a task.", input: z.object({ task_id: z.string(), done: z.boolean() }) },
  delete_task: { description: "Remove a task. Confirm first.", input: z.object({ task_id: z.string() }) },
  schedule_event: { description: "Put a task or meeting on the calendar at date (YYYY-MM-DD) + start time (HH:MM) for some minutes. Without task_id a new task is created under goal_id. repeat: none, daily, weekly, monthly, yearly.", input: z.object({ task_id: ns, title: ns, goal_id: ns, date: z.string(), start_time: z.string(), minutes: z.number(), repeat: ns }) },
  reschedule_event: { description: "Move a calendar item to a new date and optional start time.", input: z.object({ task_id: z.string(), date: z.string(), start_time: ns }) },
  unschedule_event: { description: "Take a task off the calendar (keeps the task).", input: z.object({ task_id: z.string() }) },
  add_subtask: { description: "Add a checklist step inside a task.", input: z.object({ task_id: z.string(), title: z.string() }) },
  update_subtask: { description: "Rename a checklist step.", input: z.object({ task_id: z.string(), subtask_id: z.string(), title: z.string() }) },
  toggle_subtask: { description: "Tick or untick a checklist step.", input: z.object({ task_id: z.string(), subtask_id: z.string() }) },
  delete_subtask: { description: "Remove a checklist step.", input: z.object({ task_id: z.string(), subtask_id: z.string() }) },
  auto_schedule: { description: "Auto-plan a goal or skill's open tasks into free calendar time. kind is goal or skill. Confirm first.", input: z.object({ kind: z.string(), id: z.string() }) },
  list_calendar: { description: "Read what's scheduled between two dates (read-only, no confirmation).", input: z.object({ from: z.string(), to: ns }) },
  set_focus_pillars: { description: "Set this month's focus pillars (max 3, each a skill or goal; Health is always active and never counts). Pass the full new list.", input: z.object({ pillars: z.array(z.object({ type: z.string(), id: z.string() })) }) },
  confirm_focus_month: { description: "Confirm the monthly focus review.", input: z.object({}) },
  add_someday: { description: "Add an item to the Someday list.", input: z.object({ title: z.string(), notes: ns, target_year: nn }) },
  update_someday: { description: "Edit a Someday item.", input: z.object({ id: z.string(), title: ns, notes: ns, target_year: nn }) },
  toggle_someday: { description: "Mark a Someday item achieved / not achieved.", input: z.object({ id: z.string() }) },
  delete_someday: { description: "Remove a Someday item. Confirm first.", input: z.object({ id: z.string() }) },
  add_book: { description: "Add a book. shelf is queue, reading or finished.", input: z.object({ title: z.string(), author: ns, page_count: nn, shelf: ns }) },
  update_book: { description: "Change a book's shelf (queue, reading, finished), priority (high, medium, low), title or author.", input: z.object({ book_id: z.string(), shelf: ns, priority: ns, title: ns, author: ns }) },
  delete_book: { description: "Remove a book. Confirm first.", input: z.object({ book_id: z.string() }) },
  set_bookmark: { description: "Save the page reached in a book.", input: z.object({ book_id: z.string(), page: z.number() }) },
  log_reading: { description: "Plan or record a reading session (date, optional HH:MM start, minutes); optionally update bookmark.", input: z.object({ book_id: z.string(), minutes: z.number(), date: ns, start_time: ns, current_page: nn }) },
  delete_reading: { description: "Remove a reading session.", input: z.object({ book_id: z.string(), session_id: z.string() }) },
  enable_plugin: { description: "Turn a plugin (e.g. books) on or off.", input: z.object({ plugin_id: z.string(), enabled: z.boolean() }) },
  add_survival_rule: { description: "Add a Survival Mode protocol item. area: mind, body, work, preparedness.", input: z.object({ title: z.string(), area: ns, guidance: ns }) },
  update_survival_rule: { description: "Edit or enable/disable a Survival Mode protocol item.", input: z.object({ rule_id: z.string(), title: ns, guidance: ns, enabled: nb }) },
  toggle_survival_rule: { description: "Tick / untick a Survival protocol item for a day (default today).", input: z.object({ rule_id: z.string(), date: ns }) },
  delete_survival_rule: { description: "Remove a Survival protocol item. Confirm first.", input: z.object({ rule_id: z.string() }) },
  rename_item: { description: "Quick rename of a goal, task or skill. kind is goal, task or skill.", input: z.object({ kind: z.string(), id: z.string(), title: z.string() }) },
} as const;

export type AssistantToolName = keyof typeof ASSISTANT_TOOLS;

/** Readable list for the Settings page (includes the server-side suggestion tool). */
export const ASSISTANT_TOOL_LIST: { name: string; description: string }[] = [
  ...Object.entries(ASSISTANT_TOOLS).map(([name, t]) => ({ name, description: t.description })),
  { name: "send_suggestion", description: "Save an idea or feedback to your Suggestions inbox." },
];

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const ymd = (v: unknown) => {
  const s = str(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
};
const hm = (v: unknown) => {
  const s = str(v);
  return s && /^\d{1,2}:\d{2}$/.test(s) ? s.padStart(5, "0") : undefined;
};
const today = () => new Date().toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");
const localIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const prio = (p: unknown) => (p === "low" || p === "high" || p === "medium" ? p : undefined);
const RECUR = ["none", "daily", "weekly", "monthly", "yearly"] as const;

function need<T>(fn: T | undefined): T {
  if (!fn) throw new Error("That isn't available right now");
  return fn;
}

function findMilestone(api: AssistantApi, id: unknown) {
  for (const g of api.goals) {
    const m = g.subGoals.find((s) => s.id === id);
    if (m) return { goal: g, milestone: m };
  }
  throw new Error("Couldn't find that milestone");
}
const findTask = (api: AssistantApi, id: unknown) => {
  const t = api.tasks.find((x) => x.id === id);
  if (!t) throw new Error("Couldn't find that task");
  return t;
};
const findGoal = (api: AssistantApi, id: unknown) => {
  const g = api.goals.find((x) => x.id === id);
  if (!g) throw new Error("Couldn't find that goal");
  return g;
};
const findBook = (api: AssistantApi, id: unknown) => {
  const b = api.books.books.find((x) => x.id === id);
  if (!b) throw new Error("Couldn't find that book");
  return b;
};
const blocked = (api: AssistantApi, taskId: string) => {
  if (api.canScheduleTask && !api.canScheduleTask(taskId))
    throw new Error("That's outside your three focus pillars — swap a focus pillar first.");
};

/** Applies one assistant action and returns a short confirmation, or throws a readable error. */
export function applyAssistantAction(api: AssistantApi, action: string, args: Record<string, unknown>): string {
  switch (action) {
    case "create_skill": {
      const label = str(args.label);
      if (!label) throw new Error("Skill needs a name");
      api.addSkill({ label, color: str(args.color) ?? "#6b7280" });
      return `Added skill “${label}”`;
    }
    case "update_skill": {
      const s = api.skills.find((x) => x.id === args.skill_id);
      if (!s) throw new Error("Couldn't find that skill");
      const patch: Partial<Skill> = {};
      if (str(args.label)) patch.label = str(args.label);
      if (str(args.color)) patch.color = str(args.color);
      api.updateSkill(s.id, patch);
      return `Updated skill “${patch.label ?? s.label}”`;
    }
    case "delete_skill": {
      const s = api.skills.find((x) => x.id === args.skill_id);
      if (!s) throw new Error("Couldn't find that skill");
      need(api.deleteSkill)(s.id);
      return `Deleted skill “${s.label}”`;
    }
    case "create_goal": {
      const title = str(args.title);
      const skill = api.skills.find((s) => s.id === args.skill_id)?.id ?? api.skills[0]?.id;
      if (!title || !skill) throw new Error("Goal needs a title and skill");
      const target = ymd(args.target_date) ?? new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      api.addGoal({ title, skill, startDate: today(), targetDate: target, status: "not_started", description: str(args.description) });
      return `Added goal “${title}”`;
    }
    case "update_goal": {
      const g = findGoal(api, args.goal_id);
      const patch: Partial<Goal> = {};
      if (str(args.title)) patch.title = str(args.title);
      if (str(args.description)) patch.description = str(args.description);
      if (ymd(args.target_date)) patch.targetDate = ymd(args.target_date);
      if (api.skills.some((s) => s.id === args.skill_id)) patch.skill = String(args.skill_id);
      if (args.status === "not_started" || args.status === "in_progress" || args.status === "completed") patch.status = args.status;
      api.updateGoal(g.id, patch);
      return `Updated goal “${patch.title ?? g.title}”`;
    }
    case "delete_goal": {
      const g = findGoal(api, args.goal_id);
      api.deleteGoal(g.id);
      return `Deleted goal “${g.title}”`;
    }
    case "create_milestone": {
      const goal = api.goals.find((g) => g.id === args.goal_id);
      const title = str(args.title);
      if (!goal || !title) throw new Error("Couldn't find that goal");
      api.addSubGoal(goal.id, title, ymd(args.target_date));
      return `Added milestone “${title}” to ${goal.title}`;
    }
    case "update_milestone": {
      const { goal, milestone } = findMilestone(api, args.milestone_id);
      const patch: Partial<SubGoal> = {};
      if (str(args.title)) patch.title = str(args.title);
      if (ymd(args.target_date)) patch.targetDate = ymd(args.target_date);
      need(api.updateSubGoal)(goal.id, milestone.id, patch);
      return `Updated milestone “${patch.title ?? milestone.title}”`;
    }
    case "move_milestone": {
      const { milestone } = findMilestone(api, args.milestone_id);
      const to = findGoal(api, args.to_goal_id);
      need(api.moveSubGoal)(milestone.id, to.id);
      return `Moved “${milestone.title}” to ${to.title}`;
    }
    case "toggle_milestone": {
      const { goal, milestone } = findMilestone(api, args.milestone_id);
      need(api.toggleSubGoal)(goal.id, milestone.id);
      return `${milestone.done ? "Reopened" : "Completed"} milestone “${milestone.title}”`;
    }
    case "delete_milestone": {
      const { goal, milestone } = findMilestone(api, args.milestone_id);
      need(api.deleteSubGoal)(goal.id, milestone.id);
      return `Deleted milestone “${milestone.title}”`;
    }
    case "create_task": {
      const goal = api.goals.find((g) => g.id === args.goal_id);
      const title = str(args.title);
      if (!goal || !title) throw new Error("Tasks belong to a goal — couldn't find it");
      const sub = goal.subGoals.find((s) => s.id === args.milestone_id)?.id ?? api.ensureDefaultMilestone(goal.id);
      api.addTask({ title, goalId: goal.id, subGoalId: sub, priority: prio(args.priority) ?? "medium", dueDate: ymd(args.due_date) });
      return `Added task “${title}”`;
    }
    case "update_task": {
      const t = findTask(api, args.task_id);
      const patch: Partial<Task> = {};
      if (str(args.title)) patch.title = str(args.title);
      if (prio(args.priority)) patch.priority = prio(args.priority);
      if (ymd(args.due_date)) patch.dueDate = ymd(args.due_date);
      if (str(args.milestone_id)) {
        const { goal, milestone } = findMilestone(api, args.milestone_id);
        patch.subGoalId = milestone.id;
        patch.goalId = goal.id;
      }
      api.updateTask(t.id, patch);
      return `Updated task “${patch.title ?? t.title}”`;
    }
    case "complete_task": {
      const task = findTask(api, args.task_id);
      api.updateTask(task.id, { done: args.done !== false });
      return `${args.done !== false ? "Completed" : "Reopened"} “${task.title}”`;
    }
    case "delete_task": {
      const t = findTask(api, args.task_id);
      api.deleteTask(t.id);
      return `Deleted task “${t.title}”`;
    }
    case "schedule_event": {
      const date = ymd(args.date);
      const time = hm(args.start_time);
      const minutes = Math.max(15, Math.round(Number(args.minutes) || 60));
      if (!date || !time) throw new Error("I need a date and start time");
      const [y, m, d] = date.split("-").map(Number);
      const [hh, mm] = time.split(":").map(Number);
      const start = new Date(y, m - 1, d, hh, mm);
      const end = new Date(start.getTime() + minutes * 60_000);
      const repeat = RECUR.includes(args.repeat as never) ? (args.repeat as Task["recurrence"]) : undefined;
      const slot: Partial<Task> = { startDate: localIso(start), endDate: localIso(end), dueDate: date, ...(repeat ? { recurrence: repeat } : {}) };
      if (str(args.task_id)) {
        const t = findTask(api, args.task_id);
        blocked(api, t.id);
        api.updateTask(t.id, slot);
        return `Scheduled “${t.title}” on ${date} at ${time}`;
      }
      const title = str(args.title);
      const goal = findGoal(api, args.goal_id);
      if (!title) throw new Error("What should the event be called?");
      const sub = api.ensureDefaultMilestone(goal.id);
      api.addTask({ title, goalId: goal.id, subGoalId: sub, priority: "medium", ...slot });
      return `Scheduled “${title}” on ${date} at ${time}`;
    }
    case "reschedule_event": {
      const t = findTask(api, args.task_id);
      const date = ymd(args.date);
      if (!date) throw new Error("I need a date");
      blocked(api, t.id);
      need(api.rescheduleTask)(t.id, date, hm(args.start_time));
      return `Moved “${t.title}” to ${date}${hm(args.start_time) ? ` ${hm(args.start_time)}` : ""}`;
    }
    case "unschedule_event": {
      const t = findTask(api, args.task_id);
      api.updateTask(t.id, { startDate: undefined, endDate: undefined });
      return `Took “${t.title}” off the calendar`;
    }
    case "add_subtask": {
      const t = findTask(api, args.task_id);
      const title = str(args.title);
      if (!title) throw new Error("Step needs a name");
      need(api.addSubtask)(t.id, { title });
      return `Added step “${title}”`;
    }
    case "update_subtask": {
      const t = findTask(api, args.task_id);
      const title = str(args.title);
      if (!title || !t.subtasks.some((s) => s.id === args.subtask_id)) throw new Error("Couldn't find that step");
      need(api.updateSubtask)(t.id, String(args.subtask_id), { title });
      return `Renamed step to “${title}”`;
    }
    case "toggle_subtask": {
      const t = findTask(api, args.task_id);
      const s = t.subtasks.find((x) => x.id === args.subtask_id);
      if (!s) throw new Error("Couldn't find that step");
      need(api.toggleSubtask)(t.id, s.id);
      return `${s.done ? "Reopened" : "Ticked"} “${s.title}”`;
    }
    case "delete_subtask": {
      const t = findTask(api, args.task_id);
      const s = t.subtasks.find((x) => x.id === args.subtask_id);
      if (!s) throw new Error("Couldn't find that step");
      need(api.deleteSubtask)(t.id, s.id);
      return `Deleted step “${s.title}”`;
    }
    case "auto_schedule": {
      const id = String(args.id);
      const res = args.kind === "skill" ? need(api.autoScheduleSkill)(id) : need(api.autoScheduleGoal)(findGoal(api, id).id);
      if (res?.blockedReason) throw new Error(res.blockedReason);
      return "Auto-scheduled into free time";
    }
    case "list_calendar": {
      const from = ymd(args.from) ?? today();
      const to = ymd(args.to) ?? from;
      const items = api.tasks
        .filter((t) => t.startDate && t.startDate.slice(0, 10) >= from && t.startDate.slice(0, 10) <= to)
        .map((t) => `${t.startDate!.slice(0, 16).replace("T", " ")} ${t.title}`);
      return items.length ? items.join("; ") : `Nothing scheduled ${from}${to !== from ? ` to ${to}` : ""}`;
    }
    case "set_focus_pillars": {
      const raw = Array.isArray(args.pillars) ? (args.pillars as { type?: unknown; id?: unknown }[]) : [];
      const pillars: FocusPillar[] = [];
      for (const p of raw) {
        if (p.type === "skill" && api.skills.some((s) => s.id === p.id) && p.id !== "health") pillars.push({ type: "skill", id: String(p.id) });
        else if (p.type === "goal" && api.goals.some((g) => g.id === p.id)) pillars.push({ type: "goal", id: String(p.id) });
      }
      const unique = pillars.filter((p, i) => pillars.findIndex((q) => q.type === p.type && q.id === p.id) === i);
      if (unique.length > 3) throw new Error("Only three focus pillars per month — pick three.");
      need(api.setFocusPillars)(unique);
      const names = unique.map((p) => (p.type === "skill" ? api.skills.find((s) => s.id === p.id)?.label : api.goals.find((g) => g.id === p.id)?.title));
      return unique.length ? `Focus set: ${names.join(", ")}` : "Focus pillars cleared";
    }
    case "confirm_focus_month":
      need(api.confirmFocusMonth)();
      return "Focus month confirmed";
    case "add_someday": {
      const title = str(args.title);
      if (!title) throw new Error("Needs a title");
      need(api.addBucket)({ title, notes: str(args.notes), targetYear: typeof args.target_year === "number" ? args.target_year : undefined });
      return `Added “${title}” to Someday`;
    }
    case "update_someday": {
      const b = api.bucketList?.find((x) => x.id === args.id);
      if (!b) throw new Error("Couldn't find that Someday item");
      const patch: Partial<BucketItem> = {};
      if (str(args.title)) patch.title = str(args.title);
      if (str(args.notes)) patch.notes = str(args.notes);
      if (typeof args.target_year === "number") patch.targetYear = args.target_year;
      need(api.updateBucket)(b.id, patch);
      return `Updated “${patch.title ?? b.title}”`;
    }
    case "toggle_someday": {
      const b = api.bucketList?.find((x) => x.id === args.id);
      if (!b) throw new Error("Couldn't find that Someday item");
      need(api.toggleBucket)(b.id);
      return `${b.achieved ? "Reopened" : "Achieved"} “${b.title}”`;
    }
    case "delete_someday": {
      const b = api.bucketList?.find((x) => x.id === args.id);
      if (!b) throw new Error("Couldn't find that Someday item");
      need(api.deleteBucket)(b.id);
      return `Deleted “${b.title}”`;
    }
    case "add_book": {
      const title = str(args.title);
      if (!title) throw new Error("Book needs a title");
      const shelf = args.shelf === "reading" || args.shelf === "finished" ? args.shelf : "queue";
      api.addBook({ title, author: str(args.author), pageCount: typeof args.page_count === "number" ? args.page_count : undefined, shelf });
      return `Added book “${title}”`;
    }
    case "update_book": {
      const b = findBook(api, args.book_id);
      const patch: Partial<Book> = {};
      if (args.shelf === "queue" || args.shelf === "reading" || args.shelf === "finished") patch.shelf = args.shelf;
      if (prio(args.priority)) (patch as Record<string, unknown>).priority = prio(args.priority);
      if (str(args.title)) patch.title = str(args.title);
      if (str(args.author)) patch.author = str(args.author);
      need(api.updateBook)(b.id, patch);
      return `Updated “${patch.title ?? b.title}”`;
    }
    case "delete_book": {
      const b = findBook(api, args.book_id);
      api.deleteBook(b.id);
      return `Deleted book “${b.title}”`;
    }
    case "set_bookmark": {
      const b = findBook(api, args.book_id);
      api.setBookmark(b.id, Math.max(0, Math.round(Number(args.page) || 0)));
      return `Bookmarked ${b.title} at page ${Math.round(Number(args.page) || 0)}`;
    }
    case "log_reading": {
      const book = findBook(api, args.book_id);
      const minutes = Number(args.minutes);
      if (!(minutes > 0)) throw new Error("How many minutes?");
      api.addReadingSession(book.id, { date: ymd(args.date) ?? today(), startTime: hm(args.start_time), minutes: Math.round(minutes) });
      if (typeof args.current_page === "number") api.setBookmark(book.id, args.current_page);
      return `Logged ${Math.round(minutes)} min of ${book.title}`;
    }
    case "delete_reading": {
      const b = findBook(api, args.book_id);
      need(api.deleteReadingSession)(b.id, String(args.session_id));
      return "Reading session removed";
    }
    case "enable_plugin": {
      const id = str(args.plugin_id);
      if (!id) throw new Error("Which plugin?");
      need(api.setPluginEnabled)(id, args.enabled !== false);
      return `${args.enabled !== false ? "Turned on" : "Turned off"} ${id}`;
    }
    case "add_survival_rule": {
      const title = str(args.title);
      if (!title) throw new Error("Needs a title");
      const areas = ["mind", "body", "work", "preparedness"];
      need(api.addSurvivalRule)({
        title,
        area: (areas.includes(String(args.area)) ? args.area : "mind") as SurvivalRule["area"],
        guidance: str(args.guidance) ?? "",
        targetType: "check",
        enabled: true,
      });
      return `Added “${title}” to Survival protocol`;
    }
    case "update_survival_rule": {
      const r = api.survival?.rules.find((x) => x.id === args.rule_id);
      if (!r) throw new Error("Couldn't find that protocol item");
      const patch: Partial<SurvivalRule> = {};
      if (str(args.title)) patch.title = str(args.title);
      if (str(args.guidance)) patch.guidance = str(args.guidance);
      if (typeof args.enabled === "boolean") patch.enabled = args.enabled;
      need(api.updateSurvivalRule)(r.id, patch);
      return `Updated “${patch.title ?? r.title}”`;
    }
    case "toggle_survival_rule": {
      const r = api.survival?.rules.find((x) => x.id === args.rule_id);
      if (!r) throw new Error("Couldn't find that protocol item");
      need(api.toggleSurvivalRule)(r.id, ymd(args.date) ?? today());
      return `Toggled “${r.title}”`;
    }
    case "delete_survival_rule": {
      const r = api.survival?.rules.find((x) => x.id === args.rule_id);
      if (!r) throw new Error("Couldn't find that protocol item");
      need(api.deleteSurvivalRule)(r.id);
      return `Removed “${r.title}”`;
    }
    case "rename_item": {
      const title = str(args.title);
      if (!title) throw new Error("New name is empty");
      if (args.kind === "goal" && api.goals.some((g) => g.id === args.id)) api.updateGoal(String(args.id), { title });
      else if (args.kind === "task" && api.tasks.some((t) => t.id === args.id)) api.updateTask(String(args.id), { title });
      else if (args.kind === "skill" && api.skills.some((s) => s.id === args.id)) api.updateSkill(String(args.id), { label: title });
      else throw new Error("Couldn't find that item");
      return `Renamed to “${title}”`;
    }
    case "suggestion_saved":
      return "Suggestion sent — thank you!";
    default:
      throw new Error("Unknown action");
  }
}

/** Compact, id-bearing summary of the plan the assistant reads. */
export function buildAssistantContext(api: Pick<AssistantApi, "skills" | "goals" | "tasks" | "books" | "bucketList" | "focus" | "survival" | "plugins">): string {
  const lines: string[] = [];
  lines.push("Skills: " + api.skills.map((s) => `${s.label} [${s.id}]`).join(", "));
  if (api.focus) {
    const p = api.focus.current.pillars;
    lines.push(`Focus pillars (${api.focus.current.month}, ${p.length}/3, Health always active): ` + (p.map((x) => `${x.type}:${x.id}`).join(", ") || "none"));
  }
  for (const g of api.goals.slice(0, 60)) {
    lines.push(`Goal "${g.title}" [${g.id}] skill=${g.skill} status=${g.status} target=${g.targetDate}`);
    for (const m of g.subGoals) lines.push(`  Milestone "${m.title}" [${m.id}]${m.done ? " done" : ""}`);
  }
  const open = api.tasks.filter((t) => !t.done).slice(0, 120);
  for (const t of open) {
    const steps = t.subtasks.length ? ` steps=${t.subtasks.map((s) => `${s.title}[${s.id}]${s.done ? "✓" : ""}`).join("|")}` : "";
    lines.push(`Task "${t.title}" [${t.id}] goal=${t.goalId ?? "-"} milestone=${t.subGoalId ?? "-"}${t.dueDate ? ` due=${t.dueDate}` : ""}${t.startDate ? ` at=${t.startDate.slice(0, 16)}` : ""}${steps}`);
  }
  for (const b of (api.bucketList ?? []).slice(0, 40)) lines.push(`Someday "${b.title}" [${b.id}]${b.achieved ? " achieved" : ""}`);
  for (const b of api.books.books.slice(0, 60)) lines.push(`Book "${b.title}" [${b.id}] shelf=${b.shelf} page=${b.currentPage}`);
  if (api.plugins) lines.push("Plugins on: " + (api.plugins.enabled.join(", ") || "none"));
  for (const r of (api.survival?.rules ?? []).slice(0, 30)) lines.push(`Survival rule "${r.title}" [${r.id}] area=${r.area}${r.enabled ? "" : " off"}`);
  return lines.join("\n").slice(0, 40_000);
}
