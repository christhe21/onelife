import { renderHook, act } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { AppDataProvider, useAppData } from "../app-data";
import React from "react";

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
