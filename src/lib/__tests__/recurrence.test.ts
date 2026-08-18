import { describe, expect, it } from "vitest";
import {
  describeRule,
  expandRule,
  normalizeRule,
  presetToRule,
  resolveRule,
  ruleToPreset,
  ruleToRRule,
  type RecurrenceRule,
} from "../recurrence";

const d = (s: string) => new Date(s);

describe("normalizeRule", () => {
  it("rejects junk", () => {
    expect(normalizeRule(null)).toBeUndefined();
    expect(normalizeRule({ freq: "hourly" })).toBeUndefined();
  });
  it("cleans weekdays and end condition", () => {
    const r = normalizeRule({
      freq: "weekly",
      interval: 2,
      byWeekday: [3, 3, 9, 1],
      end: { type: "count", count: 5 },
    })!;
    expect(r.byWeekday).toEqual([1, 3]);
    expect(r.interval).toBe(2);
    expect(r.end).toEqual({ type: "count", count: 5 });
  });
});

describe("legacy compatibility", () => {
  it("falls back to the legacy enum", () => {
    expect(resolveRule({ recurrence: "none" })).toBeNull();
    expect(resolveRule({ recurrence: "weekly" })).toMatchObject({ freq: "weekly", interval: 1 });
  });
  it("prefers the advanced rule when present", () => {
    const rule = presetToRule("weekends")!;
    expect(resolveRule({ recurrence: "daily", recurrenceRule: rule })).toMatchObject({
      byWeekday: [0, 6],
    });
  });
});

describe("presets", () => {
  it("round-trips", () => {
    expect(ruleToPreset(presetToRule("weekdays"))).toBe("weekdays");
    expect(ruleToPreset(presetToRule("weekends"))).toBe("weekends");
    expect(ruleToPreset(presetToRule("biweekly"))).toBe("biweekly");
    expect(ruleToPreset(null)).toBe("none");
  });
});

describe("expandRule", () => {
  const start = d("2026-01-05T09:00:00"); // Monday
  const end = d("2026-01-05T10:00:00");

  it("expands weekdays only", () => {
    const occ = expandRule(
      presetToRule("weekdays"),
      start,
      end,
      start,
      d("2026-01-11T23:59:59"),
    );
    expect(occ).toHaveLength(5);
    expect(occ.every((o) => o.start.getDay() >= 1 && o.start.getDay() <= 5)).toBe(true);
    expect(occ[0].end.getTime() - occ[0].start.getTime()).toBe(3600000);
  });

  it("honours a count end condition", () => {
    const rule: RecurrenceRule = { freq: "daily", interval: 1, end: { type: "count", count: 3 } };
    expect(expandRule(rule, start, end, start, d("2026-03-01"))).toHaveLength(3);
  });

  it("honours an until end condition", () => {
    const rule: RecurrenceRule = {
      freq: "daily",
      interval: 1,
      end: { type: "until", date: "2026-01-07" },
    };
    expect(expandRule(rule, start, end, start, d("2026-03-01"))).toHaveLength(3);
  });

  it("supports bi-weekly intervals", () => {
    const rule = presetToRule("biweekly", start)!;
    const occ = expandRule(rule, start, end, start, d("2026-02-16T23:59:59"));
    expect(occ.map((o) => o.start.getDate())).toEqual([5, 19, 2, 16]);
  });

  it("returns a single occurrence with no rule", () => {
    expect(expandRule(null, start, end, start, d("2026-03-01"))).toHaveLength(1);
  });
});

describe("output formats", () => {
  it("builds RRULE strings", () => {
    expect(ruleToRRule(presetToRule("weekdays"))).toBe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
    expect(
      ruleToRRule({ freq: "daily", interval: 3, end: { type: "count", count: 4 } }),
    ).toBe("FREQ=DAILY;INTERVAL=3;COUNT=4");
    expect(ruleToRRule(null)).toBeNull();
  });
  it("describes rules in plain English", () => {
    expect(describeRule(null)).toBe("Does not repeat");
    expect(describeRule(presetToRule("weekdays"))).toBe("Every weekday");
    expect(describeRule({ freq: "daily", interval: 1, end: { type: "count", count: 5 } })).toBe(
      "Every day, 5 times",
    );
  });
});
