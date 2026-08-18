import { calculateItemPoints, getSkillPoints, getSkillTitle, getOverallRank, reconcilePoints } from "../rank";
import { Goal, Task, SubTask } from "../app-data";

describe("rank utility functions", () => {
  it("calculates item points based on spentHours", () => {
    expect(calculateItemPoints(0)).toBe(10);
    expect(calculateItemPoints(1)).toBe(15);
    expect(calculateItemPoints(2)).toBe(20);
    expect(calculateItemPoints(5)).toBe(20); // maxed out at 20
    expect(calculateItemPoints(undefined)).toBe(10);
  });

  it("calculates skill points accurately", () => {
    const goals: Goal[] = [
      {
        id: "g1",
        skill: "music",
        status: "completed",
        subGoals: [{ id: "sg1", done: true, title: "sg1" }],
      } as any,
      { id: "g2", skill: "tech", status: "not_started", subGoals: [] } as any,
    ];

    const tasks: Task[] = [
      { id: "t1", goalId: "g1", done: true, spentHours: 1, subtasks: [] } as any, // 15 points
      {
        id: "t2",
        subGoalId: "sg1",
        done: true,
        spentHours: 0,
        subtasks: [{ id: "st1", done: true, spentHours: 2 }],
      } as any, // 10 + 20 = 30 points
    ];

    // Goal = 100
    // Subgoal = 50
    // Task 1 = 15
    // Task 2 = 10 + 20 = 30
    // Total Base Points = 195

    // music is a CORE_SKILL, so multiplier is 2
    expect(getSkillPoints(goals, tasks, "music", undefined)).toBe(390);

    // if music is starred, multiplier is 3
    expect(getSkillPoints(goals, tasks, "music", "music")).toBe(585);
  });

  it("calculates skill titles", () => {
    expect(getSkillTitle(500)).toBe("Beginner");
    expect(getSkillTitle(1500)).toBe("Intermediate");
    expect(getSkillTitle(2500)).toBe("Enthusiast");
    expect(getSkillTitle(5500)).toBe("Professional");
    expect(getSkillTitle(15000)).toBe("Master");
    expect(getSkillTitle(25000)).toBe("Legend");
  });

  it("calculates overall rank", () => {
    expect(getOverallRank(100)).toBe("Recruit");
    expect(getOverallRank(500)).toBe("Private");
    expect(getOverallRank(2500)).toBe("Corporal");
    expect(getOverallRank(6500)).toBe("Sergeant");
    expect(getOverallRank(15000)).toBe("Lieutenant");
    expect(getOverallRank(25000)).toBe("Captain");
    expect(getOverallRank(45000)).toBe("Major");
    expect(getOverallRank(75000)).toBe("Colonel");
    expect(getOverallRank(120000)).toBe("General");
  });
});

describe("reconcilePoints", () => {
  const goal = (id: string, status: string, subs: { id: string; done: boolean }[]) =>
    ({ id, title: id, skill: "career", status, subGoals: subs }) as never;
  const task = (id: string, done: boolean, subs: { id: string; done: boolean }[] = []) =>
    ({ id, title: id, done, spentHours: 0, subtasks: subs }) as never;

  const empty = { totalPoints: 0, awardedPoints: {} };

  it("awards points for completed items", () => {
    const r = reconcilePoints(
      [goal("g1", "completed", [{ id: "s1", done: true }])],
      [task("t1", true, [{ id: "st1", done: true }])],
      empty,
    );
    // 100 goal + 50 subgoal + 10 task + 10 subtask
    expect(r.totalPoints).toBe(170);
    expect(r.changed).toBe(true);
  });

  it("does not award twice when toggled off and on", () => {
    const first = reconcilePoints([], [task("t1", true)], empty);
    const off = reconcilePoints([], [task("t1", false)], first);
    expect(off.totalPoints).toBe(first.totalPoints);
    expect(off.changed).toBe(false);
    const on = reconcilePoints([], [task("t1", true)], off);
    expect(on.totalPoints).toBe(first.totalPoints);
    expect(on.changed).toBe(false);
  });

  it("awards each cascaded task once", () => {
    const goals = [goal("g1", "in_progress", [{ id: "s1", done: true }])];
    const tasks = [task("t1", true), task("t2", true)];
    const once = reconcilePoints(goals, tasks, empty);
    const again = reconcilePoints(goals, tasks, once);
    expect(once.totalPoints).toBe(50 + 10 + 10);
    expect(again.totalPoints).toBe(once.totalPoints);
  });

  it("round-trips through JSON export/import", () => {
    const state = reconcilePoints([], [task("t1", true)], empty);
    const restored = JSON.parse(
      JSON.stringify({ totalPoints: state.totalPoints, awardedPoints: state.awardedPoints }),
    );
    const after = reconcilePoints([], [task("t1", true)], restored);
    expect(after.totalPoints).toBe(state.totalPoints);
    expect(after.changed).toBe(false);
  });
});

describe("getRankProgress", () => {
  it("reports progress inside a tier", () => {
    const p = getRankProgress(1250);
    expect(p.rank).toBe("Private");
    expect(p.nextRank).toBe("Corporal");
    expect(p.pointsToNext).toBe(750);
    expect(p.percent).toBe(50);
  });

  it("handles tier boundaries", () => {
    expect(getRankProgress(500).rank).toBe("Private");
    expect(getRankProgress(500).percent).toBe(0);
    expect(getRankProgress(499).rank).toBe("Recruit");
  });

  it("caps at the max rank", () => {
    const p = getRankProgress(250000);
    expect(p.rank).toBe("General");
    expect(p.nextRank).toBeNull();
    expect(p.percent).toBe(100);
    expect(p.pointsToNext).toBe(0);
  });

  it("clamps negative input", () => {
    expect(getRankProgress(-10).rank).toBe("Recruit");
  });
});
