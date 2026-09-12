import * as XLSX from "xlsx";
import type { BucketItem, Goal, Skill, Task } from "./app-data";

/**
 * One-click spreadsheet export. Produces an .xlsx workbook with a readable
 * sheet per level of the hierarchy — no format rules for the user to learn.
 */
export function exportSpreadsheet(opts: {
  goals: Goal[];
  tasks: Task[];
  bucketList: BucketItem[];
  skills: Skill[];
  fileName?: string;
}) {
  const { goals, tasks, bucketList, skills } = opts;
  const skillLabel = (id?: string) => skills.find((s) => s.id === id)?.label ?? id ?? "";

  const goalById = new Map(goals.map((g) => [g.id, g]));
  const milestoneIndex = new Map<string, { goal: Goal; title: string }>();
  for (const g of goals) {
    for (const sg of g.subGoals ?? []) milestoneIndex.set(sg.id, { goal: g, title: sg.title });
  }

  const goalRows = goals.map((g) => ({
    Goal: g.title,
    "Life area": skillLabel(g.skill),
    Status: g.status.replace("_", " "),
    Start: g.startDate ?? "",
    Target: g.targetDate ?? "",
    Milestones: (g.subGoals ?? []).length,
    "Milestones done": (g.subGoals ?? []).filter((s) => s.done).length,
    Notes: g.description ?? "",
  }));

  const milestoneRows = goals.flatMap((g) =>
    (g.subGoals ?? []).map((sg) => ({
      Goal: g.title,
      Milestone: sg.title,
      "Life area": skillLabel(g.skill),
      Target: sg.targetDate ?? "",
      Done: sg.done ? "Yes" : "No",
    })),
  );

  const taskRows = tasks.map((t) => {
    const m = t.subGoalId ? milestoneIndex.get(t.subGoalId) : undefined;
    const g = m?.goal ?? (t.goalId ? goalById.get(t.goalId) : undefined);
    return {
      Task: t.title,
      Goal: g?.title ?? "",
      Milestone: m?.title ?? "",
      "Life area": skillLabel(g?.skill),
      Priority: t.priority,
      Due: t.dueDate ?? "",
      Done: t.done ? "Yes" : "No",
      Subtasks: t.subtasks.length,
      "Subtasks done": t.subtasks.filter((s) => s.done).length,
    };
  });

  const scheduleRows: Record<string, string>[] = [];
  const fmt = (v?: string) => (v ? v.replace("T", " ").slice(0, 16) : "");
  for (const t of tasks) {
    const m = t.subGoalId ? milestoneIndex.get(t.subGoalId) : undefined;
    const g = m?.goal ?? (t.goalId ? goalById.get(t.goalId) : undefined);
    if (t.startDate && t.subtasks.length === 0) {
      scheduleRows.push({
        Item: t.title,
        Type: "Task",
        Goal: g?.title ?? "",
        Start: fmt(t.startDate),
        End: fmt(t.endDate),
        Done: t.done ? "Yes" : "No",
      });
    }
    for (const s of t.subtasks) {
      if (!s.startDate) continue;
      scheduleRows.push({
        Item: s.title,
        Type: "Subtask",
        Goal: `${t.title}${g ? ` (${g.title})` : ""}`,
        Start: fmt(s.startDate),
        End: fmt(s.endDate),
        Done: s.done ? "Yes" : "No",
      });
    }
  }

  const somedayRows = bucketList.map((b) => ({
    Idea: b.title,
    Horizon: b.targetYear ? String(b.targetYear) : "Someday",
    Done: b.achieved ? "Yes" : "No",
    Notes: b.notes ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: Record<string, unknown>[], empty: string) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ [empty]: "" }]);
    const widths = rows.length
      ? Object.keys(rows[0]!).map((k) => ({
          wch: Math.min(
            48,
            Math.max(
              k.length + 2,
              ...rows.map((r) => String((r as Record<string, unknown>)[k] ?? "").length + 2),
            ),
          ),
        }))
      : [{ wch: 24 }];
    sheet["!cols"] = widths;
    XLSX.utils.book_append_sheet(wb, sheet, name);
  };

  add("Goals", goalRows, "No goals yet");
  add("Milestones", milestoneRows, "No milestones yet");
  add("Tasks", taskRows, "No tasks yet");
  add("Schedule", scheduleRows, "Nothing scheduled yet");
  add("Someday", somedayRows, "No ideas yet");

  const name = opts.fileName ?? `onelife-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, name);
}
