import { describe, expect, it, vi } from "vitest";
import { applyAssistantAction, type AssistantApi } from "../assistant-actions";

function api(): AssistantApi {
  return {
    skills: [{ id: "learning", label: "Learning", color: "#000" }],
    goals: [{ id: "g1", title: "Java", skill: "learning", startDate: "2026-01-01", targetDate: "2026-12-01", status: "in_progress", subGoals: [{ id: "m1", title: "General", done: false }] }],
    tasks: [{ id: "t1", title: "Walk", priority: "medium", done: false, subtasks: [] }],
    books: { version: 1, books: [] } as never,
    addSkill: vi.fn(), updateSkill: vi.fn(), addGoal: vi.fn(() => "g2"), updateGoal: vi.fn(), deleteGoal: vi.fn(),
    addSubGoal: vi.fn(() => "m2"), ensureDefaultMilestone: vi.fn(() => "m1"), addTask: vi.fn(), updateTask: vi.fn(),
    deleteTask: vi.fn(), addBook: vi.fn(() => "b1"), deleteBook: vi.fn(), setBookmark: vi.fn(), addReadingSession: vi.fn(),
  };
}

describe("assistant actions", () => {
  it("creates tasks under a goal's milestone", () => {
    const a = api();
    applyAssistantAction(a, "create_task", { title: "Read ch 3", goal_id: "g1", milestone_id: null });
    expect(a.addTask).toHaveBeenCalledWith(expect.objectContaining({ goalId: "g1", subGoalId: "m1" }));
  });
  it("refuses tasks without an existing goal", () => {
    expect(() => applyAssistantAction(api(), "create_task", { title: "x", goal_id: "nope" })).toThrow();
  });
  it("completes an existing task", () => {
    const a = api();
    applyAssistantAction(a, "complete_task", { task_id: "t1", done: true });
    expect(a.updateTask).toHaveBeenCalledWith("t1", { done: true });
  });
});
