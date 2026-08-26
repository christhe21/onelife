import { describe, expect, test } from "vitest";
import { homeTasksByIds, LIFE_ROLES, roleById } from "../life-graph";

describe("life graph presets", () => {
  test("software engineer and agriculture have different skill sets", () => {
    const eng = roleById("software-engineer");
    const farm = roleById("agriculture");
    expect(eng?.skills.map((s) => s.id)).toContain("technical");
    expect(farm?.skills.map((s) => s.id)).toContain("adaptability");
    expect(eng?.skills.map((s) => s.id)).not.toEqual(farm?.skills.map((s) => s.id));
  });

  test("home task lookup only returns checked simple chores", () => {
    const picked = homeTasksByIds(["dishes", "laundry"]);
    expect(picked.map((t) => t.title)).toEqual(["Wash dishes", "Clean clothes"]);
    expect(picked.map((t) => t.recurrence)).toEqual(["daily", "weekly"]);
  });

  test("every role has an id used by onboarding", () => {
    expect(LIFE_ROLES.map((r) => r.id)).toContain("other");
  });
});
