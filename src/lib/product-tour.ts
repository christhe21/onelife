import type { TabId } from "@/components/life/AppShell";

export type CalendarTourView = "agenda" | "day" | "week" | "month";
export type OverviewTourView = "tree" | "map";

export type TourStep = {
  id: string;
  section: string;
  tab: TabId;
  target?: string;
  title: string;
  body: string;
  calendarView?: CalendarTourView;
  overviewView?: OverviewTourView;
  /** Advance when the highlighted control is clicked (in addition to Next). */
  advanceOnTargetClick?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dash-intro",
    section: "Dashboard",
    tab: "dashboard",
    target: "page-heading",
    title: "This is your dashboard",
    body: "The scoreboard for everything you're working on — rank, stats and progress by life area.",
  },
  {
    id: "dash-rank",
    section: "Dashboard",
    tab: "dashboard",
    target: "dash-rank",
    title: "Rank and points",
    body: "Finishing tasks and milestones earns points. Tap the card to see the full ladder.",
  },
  {
    id: "today",
    section: "Today",
    tab: "today",
    target: "page-heading",
    title: "Today",
    body: "A short list of what is due or scheduled today, without the full calendar.",
  },
  {
    id: "calendar",
    section: "Calendar",
    tab: "calendar",
    target: "page-heading",
    title: "Calendar",
    body: "Scheduled work lives here. Switch between Agenda, Day, Week and Month, and drag blocks to reschedule.",
    calendarView: "week",
  },
  {
    id: "overview",
    section: "Overview",
    tab: "overview",
    target: "overview-map",
    title: "Overview",
    body: "Your whole plan as a tree or a mindmap: life area → goal → milestone → task. Drag to pan, scroll to zoom.",
    overviewView: "map",
  },
  {
    id: "goals",
    section: "Goals",
    tab: "goals",
    target: "page-heading",
    title: "Goals",
    body: "Create and edit goals and their milestones — including the one from setup.",
  },
  {
    id: "tasks",
    section: "Tasks",
    tab: "tasks",
    target: "page-heading",
    title: "Tasks",
    body: "The actionable list. Check one off and the parent milestone and goal move forward.",
  },
  {
    id: "settings",
    section: "Settings",
    tab: "settings",
    target: "page-heading",
    title: "Settings",
    body: "Profile, theme, text size and reminders. You can replay this tour from here any time.",
  },
];
