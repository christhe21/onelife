import {
  Sparkles,
  ScrollText,
  MapPin,
  BookOpen,
  Footprints,
  Moon,
  CalendarHeart,
  Wand2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useAppData } from "@/lib/app-data";

export type FrierenIconKey =
  | "goal"
  | "task"
  | "milestone"
  | "skill"
  | "streak"
  | "today"
  | "calendar"
  | "settings"
  | "completed";

const FRIEREN_MAP: Record<FrierenIconKey, LucideIcon> = {
  goal: Sparkles,
  task: ScrollText,
  milestone: MapPin,
  skill: BookOpen,
  streak: Footprints,
  today: Moon,
  calendar: CalendarHeart,
  settings: Wand2,
  completed: Star,
};

/**
 * Returns a themed icon component. When the Frieren theme is active, swap to the
 * Frieren-flavored lucide glyph; otherwise return the caller's default.
 */
export function useThemedIcon(defaultIcon: LucideIcon, key: FrierenIconKey): LucideIcon {
  const { settings } = useAppData();
  if (settings.themeColor === "frieren") return FRIEREN_MAP[key];
  return defaultIcon;
}
