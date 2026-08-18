// Advanced recurrence rules (v1 — pragmatic subset of RFC 5545).
// The legacy `recurrence` enum ("none" | "daily" | ...) stays the source of
// truth for old data; `recurrenceRule` refines it when present.

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceEnd =
  | { type: "never" }
  | { type: "count"; count: number }
  | { type: "until"; date: string }; // yyyy-mm-dd

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  /** 1 = every, 2 = bi-weekly / every other. */
  interval: number;
  /** 0=Sun..6=Sat. Only meaningful for weekly frequency. */
  byWeekday?: number[];
  end: RecurrenceEnd;
}

export type LegacyRecurrence = "none" | RecurrenceFreq;

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MAX_OCCURRENCES = 800;

/** Runtime validation — returns a clean rule or undefined. */
export function normalizeRule(raw: unknown): RecurrenceRule | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const freq = r.freq;
  if (freq !== "daily" && freq !== "weekly" && freq !== "monthly" && freq !== "yearly") {
    return undefined;
  }
  const interval =
    typeof r.interval === "number" && r.interval >= 1 && r.interval <= 52
      ? Math.floor(r.interval)
      : 1;

  let byWeekday: number[] | undefined;
  if (Array.isArray(r.byWeekday)) {
    const days = Array.from(
      new Set(
        r.byWeekday.filter(
          (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6,
        ),
      ),
    ).sort((a, b) => a - b);
    if (days.length) byWeekday = days;
  }

  let end: RecurrenceEnd = { type: "never" };
  const rawEnd = r.end as Record<string, unknown> | undefined;
  if (rawEnd && typeof rawEnd === "object") {
    if (rawEnd.type === "count" && typeof rawEnd.count === "number" && rawEnd.count >= 1) {
      end = { type: "count", count: Math.min(999, Math.floor(rawEnd.count)) };
    } else if (
      rawEnd.type === "until" &&
      typeof rawEnd.date === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(rawEnd.date)
    ) {
      end = { type: "until", date: rawEnd.date.slice(0, 10) };
    }
  }

  return { freq, interval, byWeekday, end };
}

/** Effective rule for an item, falling back to the legacy enum. */
export function resolveRule(item: {
  recurrence?: LegacyRecurrence;
  recurrenceRule?: RecurrenceRule;
}): RecurrenceRule | null {
  const rule = normalizeRule(item.recurrenceRule);
  if (rule) return rule;
  const legacy = item.recurrence;
  if (!legacy || legacy === "none") return null;
  return { freq: legacy, interval: 1, end: { type: "never" } };
}

/** Legacy enum that best represents a rule (kept in sync for old code paths). */
export function ruleToLegacy(rule: RecurrenceRule | null | undefined): LegacyRecurrence {
  if (!rule) return "none";
  return rule.freq;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export type PresetId =
  | "none"
  | "daily"
  | "weekdays"
  | "weekends"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly"
  | "custom";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Bi-weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom days" },
];

export function presetToRule(preset: PresetId, referenceDate?: Date): RecurrenceRule | null {
  const dow = referenceDate ? referenceDate.getDay() : new Date().getDay();
  const end: RecurrenceEnd = { type: "never" };
  switch (preset) {
    case "none":
      return null;
    case "daily":
      return { freq: "daily", interval: 1, end };
    case "weekdays":
      return { freq: "weekly", interval: 1, byWeekday: [1, 2, 3, 4, 5], end };
    case "weekends":
      return { freq: "weekly", interval: 1, byWeekday: [0, 6], end };
    case "weekly":
      return { freq: "weekly", interval: 1, byWeekday: [dow], end };
    case "biweekly":
      return { freq: "weekly", interval: 2, byWeekday: [dow], end };
    case "monthly":
      return { freq: "monthly", interval: 1, end };
    case "yearly":
      return { freq: "yearly", interval: 1, end };
    case "custom":
      return { freq: "weekly", interval: 1, byWeekday: [dow], end };
  }
}

/** Which preset chip best matches a rule (for the editor UI). */
export function ruleToPreset(rule: RecurrenceRule | null | undefined): PresetId {
  if (!rule) return "none";
  const days = rule.byWeekday ?? [];
  const same = (a: number[]) => a.length === days.length && a.every((d) => days.includes(d));
  if (rule.freq === "daily" && rule.interval === 1) return "daily";
  if (rule.freq === "monthly") return "monthly";
  if (rule.freq === "yearly") return "yearly";
  if (rule.freq === "weekly") {
    if (rule.interval === 1 && same([1, 2, 3, 4, 5])) return "weekdays";
    if (rule.interval === 1 && same([0, 6])) return "weekends";
    if (rule.interval === 2 && days.length <= 1) return "biweekly";
    if (rule.interval === 1 && days.length <= 1) return "weekly";
    return "custom";
  }
  return "custom";
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function describeRule(rule: RecurrenceRule | null | undefined): string {
  if (!rule) return "Does not repeat";
  const days = rule.byWeekday ?? [];
  let base: string;
  if (rule.freq === "daily") {
    base = rule.interval === 1 ? "Every day" : `Every ${rule.interval} days`;
  } else if (rule.freq === "weekly") {
    const preset = ruleToPreset(rule);
    if (preset === "weekdays") base = "Every weekday";
    else if (preset === "weekends") base = "Every weekend";
    else {
      const names = days.map((d) => WEEKDAY_NAMES[d].slice(0, 3)).join(", ");
      const every = rule.interval === 1 ? "Weekly" : `Every ${rule.interval} weeks`;
      base = names ? `${every} on ${names}` : every;
    }
  } else if (rule.freq === "monthly") {
    base = rule.interval === 1 ? "Every month" : `Every ${rule.interval} months`;
  } else {
    base = rule.interval === 1 ? "Every year" : `Every ${rule.interval} years`;
  }

  if (rule.end.type === "count") return `${base}, ${rule.end.count} times`;
  if (rule.end.type === "until") return `${base} until ${fmtDate(rule.end.date)}`;
  return base;
}

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export interface Occurrence {
  start: Date;
  end: Date;
  index: number;
}

/**
 * Expands a rule into concrete occurrences between horizonStart and horizonEnd.
 * `start`/`end` define the first occurrence and its duration.
 */
export function expandRule(
  rule: RecurrenceRule | null | undefined,
  start: Date,
  end: Date,
  horizonStart: Date,
  horizonEnd: Date,
): Occurrence[] {
  const durationMs = Math.max(0, end.getTime() - start.getTime());
  if (!rule) {
    if (start > horizonEnd || start < horizonStart) return [{ start, end, index: 0 }];
    return [{ start, end, index: 0 }];
  }

  const untilDate =
    rule.end.type === "until" ? new Date(`${rule.end.date}T23:59:59`) : null;
  const maxCount = rule.end.type === "count" ? rule.end.count : Infinity;
  const hardEnd = untilDate && untilDate < horizonEnd ? untilDate : horizonEnd;

  const out: Occurrence[] = [];
  let produced = 0;

  const push = (d: Date) => {
    const s = new Date(d);
    const e = new Date(s.getTime() + durationMs);
    produced++;
    if (s >= horizonStart && s <= horizonEnd) {
      out.push({ start: s, end: e, index: produced - 1 });
    }
  };

  if (rule.freq === "weekly" && rule.byWeekday && rule.byWeekday.length) {
    const days = [...rule.byWeekday].sort((a, b) => a - b);
    // Week 0 anchored to the Sunday of the start date's week.
    const weekAnchor = addDays(start, -start.getDay());
    let week = 0;
    let guard = 0;
    while (produced < maxCount && guard < MAX_OCCURRENCES * 2) {
      guard++;
      const base = addDays(weekAnchor, week * 7 * rule.interval);
      if (base > hardEnd && base > start) break;
      for (const d of days) {
        const occ = addDays(base, d);
        occ.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
        if (occ < start) continue;
        if (occ > hardEnd) {
          guard = MAX_OCCURRENCES * 2;
          break;
        }
        if (produced >= maxCount) break;
        push(occ);
      }
      week++;
      if (out.length > MAX_OCCURRENCES) break;
    }
    return out;
  }

  let cursor = new Date(start);
  let step = 0;
  while (produced < maxCount && cursor <= hardEnd && step < MAX_OCCURRENCES) {
    push(cursor);
    step++;
    if (rule.freq === "daily") cursor = addDays(start, step * rule.interval);
    else if (rule.freq === "weekly") cursor = addDays(start, step * 7 * rule.interval);
    else if (rule.freq === "monthly") cursor = addMonths(start, step * rule.interval);
    else cursor = addMonths(start, step * 12 * rule.interval);
  }
  return out;
}

/** Next occurrence strictly after `from` (used when completing a recurring task). */
export function nextOccurrence(
  rule: RecurrenceRule | null | undefined,
  start: Date,
  from: Date,
): Date | null {
  if (!rule) return null;
  const horizonEnd = addDays(from, 400);
  const occ = expandRule(rule, start, start, new Date(from.getTime() + 1), horizonEnd);
  return occ.length ? occ[0].start : null;
}

// ---------------------------------------------------------------------------
// ICS
// ---------------------------------------------------------------------------

const ICS_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function ruleToRRule(rule: RecurrenceRule | null | undefined): string | null {
  if (!rule) return null;
  const parts = [`FREQ=${rule.freq.toUpperCase()}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.freq === "weekly" && rule.byWeekday?.length) {
    parts.push(`BYDAY=${rule.byWeekday.map((d) => ICS_DAYS[d]).join(",")}`);
  }
  if (rule.end.type === "count") parts.push(`COUNT=${rule.end.count}`);
  if (rule.end.type === "until") parts.push(`UNTIL=${rule.end.date.replace(/-/g, "")}T235959Z`);
  return parts.join(";");
}
