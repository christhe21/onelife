import { renderHook, act } from "@testing-library/react";
import { expect, test, describe, beforeEach } from "vitest";
import { AppDataProvider, useAppData, autoScheduleTasks, type Task } from "../app-data";
import { MarketplaceGoalTemplate } from "../marketplace";
import React from "react";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>{children}</AppDataProvider>
);

beforeEach(() => {
  if (typeof window !== "undefined") window.localStorage.clear();
});

function buildTemplate(overrides: Partial<MarketplaceGoalTemplate> = {}): MarketplaceGoalTemplate {
  return {
    id: "tmpl",
    title: "Test Template",
    description: "desc",
    skillName: "Health",
    creatorName: "Tester",
    verified: false,
    resources: [],
    advice: "",
    durationDays: 30,
    subGoals: [{ title: "MS 1", dayOffset: 7 }],
    tasks: [
      {
        title: "Parent task with subs",
        priority: "medium",
        subGoalIndex: 0,
        plannedHours: 4,
        subtasks: [
          { title: "Sub A", plannedHours: 2 },
          { title: "Sub B", plannedHours: 2 },
        ],
      },
    ],
    ...overrides,
  };
}

describe("autoScheduleTasks", () => {
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const start = ymd(today);
  const end = ymd(new Date(today.getTime() + 30 * 86400000));

  test("subtasks scheduled, parent task left blank when task has subtasks", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        title: "Parent",
        priority: "medium",
        done: false,
        subtasks: [
          { id: "s1", title: "A", done: false, plannedHours: 2 },
          { id: "s2", title: "B", done: false, plannedHours: 2 },
        ],
      },
    ];
    const [out] = autoScheduleTasks(tasks, start, end, []);
    expect(out.startDate).toBeUndefined();
    expect(out.endDate).toBeUndefined();
    expect(out.subtasks[0].startDate).toBeTruthy();
    expect(out.subtasks[0].endDate).toBeTruthy();
    // same calendar day invariant
    expect(out.subtasks[0].startDate!.slice(0, 10)).toEqual(
      out.subtasks[0].endDate!.slice(0, 10),
    );
    expect(out.subtasks[1].startDate).toBeTruthy();
  });

  test("schedules the task itself when there are no subtasks", () => {
    const tasks: Task[] = [
      { id: "t1", title: "Solo", priority: "low", done: false, plannedHours: 2, subtasks: [] },
    ];
    const [out] = autoScheduleTasks(tasks, start, end, []);
    expect(out.startDate).toBeTruthy();
    expect(out.endDate).toBeTruthy();
    expect(out.subtasks.length).toBe(0);
    const dur = (new Date(out.endDate!).getTime() - new Date(out.startDate!).getTime()) / 3600000;
    expect(dur).toBeCloseTo(2);
  });

  test("splits long plannedHours into multiple ~2h sessions across distinct days", () => {
    const tasks: Task[] = [
      { id: "t1", title: "Big", priority: "high", done: false, plannedHours: 6, subtasks: [] },
    ];
    const [out] = autoScheduleTasks(tasks, start, end, []);
    expect(out.startDate).toBeUndefined();
    expect(out.subtasks.length).toBe(3);
    const days = new Set(out.subtasks.map((s) => s.startDate!.slice(0, 10)));
    expect(days.size).toBe(3);
  });

  test("does not overlap an existing scheduled block", () => {
    const dayStart = new Date(today);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 2 * 3600000);
    const existing = [{ startDate: dayStart.toISOString(), endDate: dayEnd.toISOString() }];
    const tasks: Task[] = [
      { id: "t1", title: "Solo", priority: "low", done: false, plannedHours: 1, subtasks: [] },
    ];
    const [out] = autoScheduleTasks(tasks, start, end, existing);
    const startMs = new Date(out.startDate!).getTime();
    expect(startMs).toBeGreaterThanOrEqual(dayEnd.getTime());
  });
});

describe("importMarketplaceGoal auto-schedule flag", () => {
  test("default import leaves new tasks unscheduled", () => {
    const { result } = renderHook(() => useAppData(), { wrapper });
    act(() => {
      result.current.importMarketplaceGoal(buildTemplate());
    });
    const added = result.current.tasks.find((t) => t.title === "Parent task with subs");
    expect(added).toBeDefined();
    expect(added!.subtasks.every((s) => !s.startDate && !s.endDate)).toBe(true);
  });

  test("auto-schedule fills subtask start/end dates", () => {
    const { result } = renderHook(() => useAppData(), { wrapper });
    act(() => {
      result.current.importMarketplaceGoal(buildTemplate(), { autoSchedule: true });
    });
    const added = result.current.tasks.find((t) => t.title === "Parent task with subs");
    expect(added).toBeDefined();
    expect(added!.startDate).toBeUndefined();
    expect(added!.subtasks.every((s) => !!s.startDate && !!s.endDate)).toBe(true);
  });
});

describe("toggleSubtask cascading completion", () => {
  test("completing all subtasks auto-completes the parent task", () => {
    const { result } = renderHook(() => useAppData(), { wrapper });
    let taskId: string;
    act(() => {
      result.current.addTask({
        title: "Parent",
        priority: "medium",
        subtasks: [
          { id: "a", title: "A", done: false } as any,
          { id: "b", title: "B", done: false } as any,
        ],
      });
    });
    taskId = result.current.tasks.find((t) => t.title === "Parent")!.id;
    const subs = result.current.tasks.find((t) => t.id === taskId)!.subtasks;
    act(() => {
      result.current.toggleSubtask(taskId, subs[0].id);
      result.current.toggleSubtask(taskId, subs[1].id);
    });
    const updated = result.current.tasks.find((t) => t.id === taskId)!;
    expect(updated.subtasks.every((s) => s.done)).toBe(true);
    expect(updated.done).toBe(true);
  });
});



describe("AppData cascading deletes", () => {
  test("deleteGoal removes tasks associated with its subGoals", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppDataProvider>{children}</AppDataProvider>
    );

    const { result } = renderHook(() => useAppData(), { wrapper });

    let goalId: string;
    let subGoalId: string;

    act(() => {
      // Create a goal
      goalId = result.current.addGoal({
        title: "Test Goal",
        skill: "health",
        description: "",
        startDate: new Date().toISOString().slice(0, 10),
        targetDate: new Date().toISOString().slice(0, 10),
        status: "not_started",
      });

      // Goal should automatically have a default milestone, let's get its id
      subGoalId = result.current.ensureDefaultMilestone(goalId);

      // Add a task linked to this subgoal
      result.current.addTask({
        title: "Test Task",
        priority: "medium",
        subGoalId: subGoalId,
      });

      // Add a second task linked to this subgoal
      result.current.addTask({
        title: "Test Task 2",
        priority: "low",
        subGoalId: subGoalId,
      });

      // Add an unlinked task
      result.current.addTask({
        title: "Unlinked Task",
        priority: "medium",
      });
    });

    // Verify initial state
    expect(result.current.goals.length).toBeGreaterThan(0);
    expect(result.current.tasks.length).toBeGreaterThanOrEqual(3);
    const initialTasksCount = result.current.tasks.length;

    // The subGoalId we just created should be linked to exactly 2 tasks
    const tasksLinkedToGoal = result.current.tasks.filter((t) => t.subGoalId === subGoalId);
    expect(tasksLinkedToGoal.length).toBe(2);

    act(() => {
      // Delete the goal
      result.current.deleteGoal(goalId);
    });

    // Verify cascading deletion
    expect(result.current.goals.find((g) => g.id === goalId)).toBeUndefined();

    // The two linked tasks should be gone
    const remainingTasksLinkedToGoal = result.current.tasks.filter(
      (t) => t.subGoalId === subGoalId,
    );
    expect(remainingTasksLinkedToGoal.length).toBe(0);

    // The unlinked task should still exist
    expect(result.current.tasks.find((t) => t.title === "Unlinked Task")).toBeDefined();

    // Check total tasks count is reduced by 2
    expect(result.current.tasks.length).toBe(initialTasksCount - 2);
  });
});
