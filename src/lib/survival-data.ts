export const SURVIVAL_DATA_VERSION = 1;

export type SurvivalArea = "mind" | "body" | "work" | "preparedness";
export type SurvivalTargetType = "check" | "minutes" | "hours" | "servings";

export interface SurvivalRule {
  id: string;
  area: SurvivalArea;
  title: string;
  guidance: string;
  targetType: SurvivalTargetType;
  targetMin?: number;
  targetMax?: number;
  enabled: boolean;
  order: number;
  isDefault: boolean;
  safetyNote?: string;
}

export interface SurvivalDay {
  date: string;
  sleepHours?: number;
  sleepQuality?: number;
  mood?: number;
  energy?: number;
  stress?: number;
  pain?: number;
  outdoorsMinutes?: number;
  movementMinutes?: number;
  meditationMinutes?: number;
  focusedWorkHours?: number;
  breakCount?: number;
  hydration?: boolean;
  nourishingFood?: boolean;
  socialContact?: boolean;
  reducedDay: boolean;
  completedRuleIds: string[];
  reflection: string;
  recoveryNeeds: string;
  updatedAt: string;
}

export type PreparednessStatus = "not_started" | "ready" | "review";

export interface PreparednessItem {
  id: string;
  category: "contacts" | "documents" | "supplies" | "communication" | "first_aid";
  title: string;
  note?: string;
  status: PreparednessStatus;
  reviewDate?: string;
  isDefault: boolean;
}

export interface SurvivalPreferences {
  remindersEnabled: boolean;
  workHoursMin: number;
  workHoursMax: number;
  sleepHoursMin: number;
  sleepHoursMax: number;
}

export interface SurvivalState {
  version: number;
  rules: SurvivalRule[];
  days: SurvivalDay[];
  preparedness: PreparednessItem[];
  preferences: SurvivalPreferences;
}

const id = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_SURVIVAL_RULES: SurvivalRule[] = [
  {
    id: "survival-mind-pause",
    area: "mind",
    title: "Take a quiet pause",
    guidance: "Breathe, meditate, or sit without a screen. Start with what feels manageable.",
    targetType: "minutes",
    targetMin: 5,
    targetMax: 20,
    enabled: true,
    order: 1,
    isDefault: true,
  },
  {
    id: "survival-body-daylight",
    area: "body",
    title: "Get daylight and fresh air",
    guidance: "Step outside when safe, even if it is only for a short walk or seated break.",
    targetType: "minutes",
    targetMin: 10,
    targetMax: 30,
    enabled: true,
    order: 2,
    isDefault: true,
  },
  {
    id: "survival-body-move",
    area: "body",
    title: "Move within your capacity",
    guidance: "Choose walking, mobility, strength, or cardio. Stop for pain, dizziness, or unusual symptoms.",
    targetType: "minutes",
    targetMin: 20,
    targetMax: 60,
    enabled: true,
    order: 3,
    isDefault: true,
    safetyNote: "Adapt for illness, injury, disability, and clinician advice.",
  },
  {
    id: "survival-body-basics",
    area: "body",
    title: "Cover food and water basics",
    guidance: "Drink regularly and eat nourishing meals you can sustain.",
    targetType: "check",
    enabled: true,
    order: 4,
    isDefault: true,
  },
  {
    id: "survival-work-focus",
    area: "work",
    title: "Work in bounded focus blocks",
    guidance: "Choose a realistic stopping point and take a short break at least every 60–90 minutes.",
    targetType: "hours",
    targetMin: 2,
    targetMax: 6,
    enabled: true,
    order: 5,
    isDefault: true,
  },
  {
    id: "survival-mind-connect",
    area: "mind",
    title: "Connect with another person",
    guidance: "A message, call, shared meal, or time outside the house counts.",
    targetType: "check",
    enabled: true,
    order: 6,
    isDefault: true,
  },
  {
    id: "survival-work-shutdown",
    area: "work",
    title: "Close the day deliberately",
    guidance: "Stop work, reduce stimulation, and leave space for sleep and recovery.",
    targetType: "check",
    enabled: true,
    order: 7,
    isDefault: true,
  },
];

export const DEFAULT_PREPAREDNESS: PreparednessItem[] = [
  { id: "prepare-contacts", category: "contacts", title: "Keep important contacts available offline", status: "not_started", isDefault: true },
  { id: "prepare-documents", category: "documents", title: "Store copies of essential documents securely", status: "not_started", isDefault: true },
  { id: "prepare-supplies", category: "supplies", title: "Maintain a practical household essentials kit", status: "not_started", isDefault: true },
  { id: "prepare-communication", category: "communication", title: "Agree on a family or household contact plan", status: "not_started", isDefault: true },
  { id: "prepare-first-aid", category: "first_aid", title: "Keep a first-aid kit and know how to use it", status: "not_started", isDefault: true },
];

export const DEFAULT_SURVIVAL_PREFERENCES: SurvivalPreferences = {
  remindersEnabled: false,
  workHoursMin: 2,
  workHoursMax: 6,
  sleepHoursMin: 7,
  sleepHoursMax: 9,
};

export function createDefaultSurvivalState(): SurvivalState {
  return {
    version: SURVIVAL_DATA_VERSION,
    rules: DEFAULT_SURVIVAL_RULES.map((rule) => ({ ...rule })),
    days: [],
    preparedness: DEFAULT_PREPAREDNESS.map((item) => ({ ...item })),
    preferences: { ...DEFAULT_SURVIVAL_PREFERENCES },
  };
}

const areas: SurvivalArea[] = ["mind", "body", "work", "preparedness"];
const targetTypes: SurvivalTargetType[] = ["check", "minutes", "hours", "servings"];
const preparednessStatuses: PreparednessStatus[] = ["not_started", "ready", "review"];

function finiteInRange(value: unknown, min: number, max: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : undefined;
}

export function normalizeSurvivalState(raw: unknown): SurvivalState {
  const fallback = createDefaultSurvivalState();
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as Record<string, unknown>;
  const rules = Array.isArray(value.rules)
    ? value.rules
        .filter((rule): rule is Record<string, unknown> => Boolean(rule && typeof rule === "object"))
        .map((rule, index): SurvivalRule => ({
          id: typeof rule.id === "string" ? rule.id : id(),
          area: areas.includes(rule.area as SurvivalArea) ? (rule.area as SurvivalArea) : "mind",
          title: typeof rule.title === "string" ? rule.title.slice(0, 120) : "Personal rule",
          guidance: typeof rule.guidance === "string" ? rule.guidance.slice(0, 500) : "",
          targetType: targetTypes.includes(rule.targetType as SurvivalTargetType)
            ? (rule.targetType as SurvivalTargetType)
            : "check",
          targetMin: finiteInRange(rule.targetMin, 0, 24 * 60),
          targetMax: finiteInRange(rule.targetMax, 0, 24 * 60),
          enabled: rule.enabled !== false,
          order: finiteInRange(rule.order, 0, 10_000) ?? index,
          isDefault: Boolean(rule.isDefault),
          safetyNote: typeof rule.safetyNote === "string" ? rule.safetyNote.slice(0, 300) : undefined,
        }))
    : fallback.rules;

  const days = Array.isArray(value.days)
    ? value.days
        .filter((day): day is Record<string, unknown> => Boolean(day && typeof day === "object" && typeof (day as Record<string, unknown>).date === "string"))
        .map((day): SurvivalDay => ({
          date: String(day.date).slice(0, 10),
          sleepHours: finiteInRange(day.sleepHours, 0, 24),
          sleepQuality: finiteInRange(day.sleepQuality, 1, 5),
          mood: finiteInRange(day.mood, 1, 5),
          energy: finiteInRange(day.energy, 1, 5),
          stress: finiteInRange(day.stress, 1, 5),
          pain: finiteInRange(day.pain, 1, 5),
          outdoorsMinutes: finiteInRange(day.outdoorsMinutes, 0, 1440),
          movementMinutes: finiteInRange(day.movementMinutes, 0, 1440),
          meditationMinutes: finiteInRange(day.meditationMinutes, 0, 1440),
          focusedWorkHours: finiteInRange(day.focusedWorkHours, 0, 24),
          breakCount: finiteInRange(day.breakCount, 0, 100),
          hydration: typeof day.hydration === "boolean" ? day.hydration : undefined,
          nourishingFood: typeof day.nourishingFood === "boolean" ? day.nourishingFood : undefined,
          socialContact: typeof day.socialContact === "boolean" ? day.socialContact : undefined,
          reducedDay: Boolean(day.reducedDay),
          completedRuleIds: Array.isArray(day.completedRuleIds)
            ? day.completedRuleIds.filter((entry): entry is string => typeof entry === "string")
            : [],
          reflection: typeof day.reflection === "string" ? day.reflection.slice(0, 5000) : "",
          recoveryNeeds: typeof day.recoveryNeeds === "string" ? day.recoveryNeeds.slice(0, 2000) : "",
          updatedAt: typeof day.updatedAt === "string" ? day.updatedAt : new Date().toISOString(),
        }))
        .slice(-730)
    : [];

  const preparedness = Array.isArray(value.preparedness)
    ? value.preparedness
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item): PreparednessItem => ({
          id: typeof item.id === "string" ? item.id : id(),
          category: ["contacts", "documents", "supplies", "communication", "first_aid"].includes(String(item.category))
            ? (item.category as PreparednessItem["category"])
            : "supplies",
          title: typeof item.title === "string" ? item.title.slice(0, 160) : "Preparedness item",
          note: typeof item.note === "string" ? item.note.slice(0, 1000) : undefined,
          status: preparednessStatuses.includes(item.status as PreparednessStatus)
            ? (item.status as PreparednessStatus)
            : "not_started",
          reviewDate: typeof item.reviewDate === "string" ? item.reviewDate.slice(0, 10) : undefined,
          isDefault: Boolean(item.isDefault),
        }))
    : fallback.preparedness;

  const prefs = value.preferences && typeof value.preferences === "object"
    ? (value.preferences as Record<string, unknown>)
    : {};
  return {
    version: SURVIVAL_DATA_VERSION,
    rules,
    days,
    preparedness,
    preferences: {
      remindersEnabled: Boolean(prefs.remindersEnabled),
      workHoursMin: finiteInRange(prefs.workHoursMin, 0, 12) ?? fallback.preferences.workHoursMin,
      workHoursMax: finiteInRange(prefs.workHoursMax, 0, 16) ?? fallback.preferences.workHoursMax,
      sleepHoursMin: finiteInRange(prefs.sleepHoursMin, 4, 12) ?? fallback.preferences.sleepHoursMin,
      sleepHoursMax: finiteInRange(prefs.sleepHoursMax, 4, 14) ?? fallback.preferences.sleepHoursMax,
    },
  };
}

export function emptySurvivalDay(date: string): SurvivalDay {
  return {
    date,
    reducedDay: false,
    completedRuleIds: [],
    reflection: "",
    recoveryNeeds: "",
    updatedAt: new Date().toISOString(),
  };
}