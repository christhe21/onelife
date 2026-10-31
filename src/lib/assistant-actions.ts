import type { Goal, Skill, Task } from "./app-data";
import type { Book, BooksState } from "./plugins-data";

/** Subset of app-data actions the voice assistant may call. */
export interface AssistantApi {
  skills: Skill[];
  goals: Goal[];
  tasks: Task[];
  books: BooksState;
  addSkill: (s: Omit<Skill, "id">) => void;
  updateSkill: (id: string, patch: Partial<Omit<Skill, "id">>) => void;
  addGoal: (g: Omit<Goal, "id" | "subGoals">) => string;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addSubGoal: (goalId: string, title: string, targetDate?: string) => string;
  ensureDefaultMilestone: (goalId: string) => string;
  addTask: (t: Omit<Task, "id" | "done" | "subtasks">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addBook: (b: Partial<Book> & { title: string }) => string;
  deleteBook: (id: string) => void;
  setBookmark: (id: string, page: number) => void;
  addReadingSession: (bookId: string, s: { date: string; minutes: number }) => void;
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const ymd = (v: unknown) => {
  const s = str(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
};
const today = () => new Date().toISOString().slice(0, 10);

/** Applies one assistant action and returns a short confirmation, or throws a readable error. */
export function applyAssistantAction(api: AssistantApi, action: string, args: Record<string, unknown>): string {
  switch (action) {
    case "create_skill": {
      const label = str(args.label);
      if (!label) throw new Error("Skill needs a name");
      api.addSkill({ label, color: "#6b7280" });
      return `Added skill “${label}”`;
    }
    case "create_goal": {
      const title = str(args.title);
      const skill = api.skills.find((s) => s.id === args.skill_id)?.id ?? api.skills[0]?.id;
      if (!title || !skill) throw new Error("Goal needs a title and skill");
      const start = today();
      const target = ymd(args.target_date) ?? new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      api.addGoal({ title, skill, startDate: start, targetDate: target, status: "not_started", description: str(args.description) });
      return `Added goal “${title}”`;
    }
    case "create_milestone": {
      const goal = api.goals.find((g) => g.id === args.goal_id);
      const title = str(args.title);
      if (!goal || !title) throw new Error("Couldn't find that goal");
      api.addSubGoal(goal.id, title, ymd(args.target_date));
      return `Added milestone “${title}” to ${goal.title}`;
    }
    case "create_task": {
      const goal = api.goals.find((g) => g.id === args.goal_id);
      const title = str(args.title);
      if (!goal || !title) throw new Error("Tasks belong to a goal — couldn't find it");
      const sub = goal.subGoals.find((s) => s.id === args.milestone_id)?.id ?? api.ensureDefaultMilestone(goal.id);
      const p = args.priority;
      const priority = p === "low" || p === "high" ? p : "medium";
      api.addTask({ title, goalId: goal.id, subGoalId: sub, priority, dueDate: ymd(args.due_date) });
      return `Added task “${title}”`;
    }
    case "complete_task": {
      const task = api.tasks.find((t) => t.id === args.task_id);
      if (!task) throw new Error("Couldn't find that task");
      api.updateTask(task.id, { done: args.done !== false });
      return `${args.done !== false ? "Completed" : "Reopened"} “${task.title}”`;
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
    case "delete_item": {
      const id = String(args.id);
      if (args.kind === "goal" && api.goals.some((g) => g.id === id)) api.deleteGoal(id);
      else if (args.kind === "task" && api.tasks.some((t) => t.id === id)) api.deleteTask(id);
      else if (args.kind === "book" && api.books.books.some((b) => b.id === id)) api.deleteBook(id);
      else throw new Error("Couldn't find that item");
      return "Deleted";
    }
    case "add_book": {
      const title = str(args.title);
      if (!title) throw new Error("Book needs a title");
      const shelf = args.shelf === "reading" || args.shelf === "finished" ? args.shelf : "queue";
      api.addBook({ title, author: str(args.author), pageCount: typeof args.page_count === "number" ? args.page_count : undefined, shelf });
      return `Added book “${title}”`;
    }
    case "log_reading": {
      const book = api.books.books.find((b) => b.id === args.book_id);
      const minutes = Number(args.minutes);
      if (!book || !(minutes > 0)) throw new Error("Couldn't find that book");
      api.addReadingSession(book.id, { date: ymd(args.date) ?? today(), minutes: Math.round(minutes) });
      if (typeof args.current_page === "number") api.setBookmark(book.id, args.current_page);
      return `Logged ${Math.round(minutes)} min of ${book.title}`;
    }
    case "suggestion_saved":
      return "Suggestion sent — thank you!";
    default:
      throw new Error("Unknown action");
  }
}

/** Compact, id-bearing summary of the plan the assistant reads. */
export function buildAssistantContext(api: Pick<AssistantApi, "skills" | "goals" | "tasks" | "books">): string {
  const lines: string[] = [];
  lines.push("Skills: " + api.skills.map((s) => `${s.label} [${s.id}]`).join(", "));
  for (const g of api.goals.slice(0, 60)) {
    lines.push(`Goal "${g.title}" [${g.id}] skill=${g.skill} status=${g.status} target=${g.targetDate}`);
    for (const m of g.subGoals) lines.push(`  Milestone "${m.title}" [${m.id}]${m.done ? " done" : ""}`);
  }
  const open = api.tasks.filter((t) => !t.done).slice(0, 120);
  for (const t of open) lines.push(`Task "${t.title}" [${t.id}] goal=${t.goalId ?? "-"}${t.dueDate ? ` due=${t.dueDate}` : ""}`);
  for (const b of api.books.books.slice(0, 60)) lines.push(`Book "${b.title}" [${b.id}] shelf=${b.shelf} page=${b.currentPage}`);
  return lines.join("\n").slice(0, 40_000);
}
