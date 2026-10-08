export const MAX_FOCUS_PILLARS = 3;
export const HEALTH_SKILL_ID = "health";

export type FocusPillar = { type: "skill" | "goal"; id: string };
export type FocusMonth = { month: string; pillars: FocusPillar[]; reviewed: boolean };
export type FocusState = { current: FocusMonth; history: FocusMonth[] };

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function daysLeftInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() - date.getDate() + 1;
}

function normalizePillars(raw: unknown): FocusPillar[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((item) => {
    const x = item as Partial<FocusPillar>;
    if ((x.type !== "skill" && x.type !== "goal") || typeof x.id !== "string") return [];
    const key = `${x.type}:${x.id}`;
    if (seen.has(key) || x.id === HEALTH_SKILL_ID) return [];
    seen.add(key);
    return [{ type: x.type, id: x.id } as FocusPillar];
  }).slice(0, MAX_FOCUS_PILLARS);
}

export function createDefaultFocusState(date = new Date()): FocusState {
  return { current: { month: monthKey(date), pillars: [], reviewed: true }, history: [] };
}

export function normalizeFocusState(raw: unknown, date = new Date()): FocusState {
  const value = raw as Partial<FocusState> | undefined;
  const now = monthKey(date);
  const saved = value?.current;
  const history = Array.isArray(value?.history)
    ? value.history.flatMap((x) =>
        x && typeof x.month === "string"
          ? [{ month: x.month, pillars: normalizePillars(x.pillars), reviewed: true }]
          : [],
      ).slice(-12)
    : [];
  if (!saved || typeof saved.month !== "string") return createDefaultFocusState(date);
  const normalized = { month: saved.month, pillars: normalizePillars(saved.pillars), reviewed: Boolean(saved.reviewed) };
  if (saved.month === now) return { current: normalized, history };
  return {
    current: { month: now, pillars: normalized.pillars, reviewed: false },
    history: [...history.filter((x) => x.month !== saved.month), { ...normalized, reviewed: true }].slice(-12),
  };
}

export function goalIsFocused(goal: { id: string; skill: string } | undefined, focus: FocusState) {
  if (!goal) return false;
  return goal.skill === HEALTH_SKILL_ID || focus.current.pillars.some((p) =>
    (p.type === "skill" && p.id === goal.skill) || (p.type === "goal" && p.id === goal.id),
  );
}