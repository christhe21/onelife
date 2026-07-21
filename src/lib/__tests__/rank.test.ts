import { calculateItemPoints, getSkillPoints, getSkillTitle, getOverallRank } from "../rank";
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
      { id: "g1", skill: "music", status: "completed", subGoals: [{ id: "sg1", done: true, title: "sg1" }] } as any,
      { id: "g2", skill: "tech", status: "not_started", subGoals: [] } as any,
    ];

    const tasks: Task[] = [
      { id: "t1", goalId: "g1", done: true, spentHours: 1, subtasks: [] } as any, // 15 points
      { id: "t2", subGoalId: "sg1", done: true, spentHours: 0, subtasks: [{ id: "st1", done: true, spentHours: 2 }] } as any, // 10 + 20 = 30 points
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
