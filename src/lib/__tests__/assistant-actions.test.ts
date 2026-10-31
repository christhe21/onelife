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

describe("full-access assistant tools", () => {
  it("schedules an event at the given date and time", () => {
    const a = { ...api(), canScheduleTask: () => true };
    applyAssistantAction(a, "schedule_event", { task_id: "t1", date: "2026-11-02", start_time: "09:30", minutes: 45, repeat: null });
    expect(a.updateTask).toHaveBeenCalledWith("t1", expect.objectContaining({ startDate: "2026-11-02T09:30:00", endDate: "2026-11-02T10:15:00" }));
  });
  it("refuses scheduling outside the focus pillars", () => {
    const a = { ...api(), canScheduleTask: () => false };
    expect(() => applyAssistantAction(a, "schedule_event", { task_id: "t1", date: "2026-11-02", start_time: "09:30", minutes: 30 })).toThrow(/focus/);
    expect(a.updateTask).not.toHaveBeenCalled();
  });
  it("allows at most three focus pillars", () => {
    const a = { ...api(), skills: [1, 2, 3, 4].map((n) => ({ id: `s${n}`, label: `S${n}`, color: "#000" })), setFocusPillars: vi.fn() };
    expect(() => applyAssistantAction(a, "set_focus_pillars", { pillars: [1, 2, 3, 4].map((n) => ({ type: "skill", id: `s${n}` })) })).toThrow();
    applyAssistantAction(a, "set_focus_pillars", { pillars: [{ type: "skill", id: "s1" }, { type: "skill", id: "s2" }] });
    expect(a.setFocusPillars).toHaveBeenCalledWith([{ type: "skill", id: "s1" }, { type: "skill", id: "s2" }]);
  });
  it("moves a milestone to another goal", () => {
    const a = { ...api(), moveSubGoal: vi.fn() };
    a.goals.push({ ...a.goals[0], id: "g2", title: "English", subGoals: [] });
    applyAssistantAction(a, "move_milestone", { milestone_id: "m1", to_goal_id: "g2" });
    expect(a.moveSubGoal).toHaveBeenCalledWith("m1", "g2");
  });
});
