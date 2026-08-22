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
    body: "After setup you land here. It is the scoreboard for the goal you just created — rank, time, stats, and progress by life area.",
  },
  {
    id: "dash-rank",
    section: "Dashboard",
    tab: "dashboard",
    target: "dash-rank",
    title: "Rank",
    body: "Points come from finishing tasks and milestones. Tap the card any time to see the full ladder.",
  },
  {
    id: "dash-timeline",
    section: "Dashboard",
    tab: "dashboard",
    target: "dash-timeline",
    title: "Life timeline",
    body: "A long view of where this season sits. Set your birth year in Settings later if you want it personal.",
  },
  {
    id: "dash-stats",
    section: "Dashboard",
    tab: "dashboard",
    target: "dash-stats",
    title: "What you can do here",
    body: "Active goals, average progress, open tasks, and bucket-list items. These numbers update as you work the hierarchy: goal → milestone → task.",
  },
  {
    id: "dash-progress",
    section: "Dashboard",
    tab: "dashboard",
    target: "dash-progress",
    title: "Progress by life area",
    body: "Each card is a life area you picked. The bars are the goals under that area — including the one from onboarding.",
  },
  {
    id: "today",
    section: "Today",
    tab: "today",
    target: "page-heading",
    title: "Today",
    body: "A short list of what is due or scheduled today. Use this when you do not want the full calendar.",
  },
  {
    id: "cal-intro",
    section: "Calendar",
    tab: "calendar",
    target: "page-heading",
    title: "Calendar",
    body: "Scheduled tasks live here. Switch Agenda, Day, Week, or Month from the tabs on this screen.",
  },
  {
    id: "cal-agenda",
    section: "Calendar",
    tab: "calendar",
    target: "cal-agenda",
    title: "Agenda",
    body: "A dated list — weekdays and the work sitting on each one. Click Agenda to open it, then continue.",
    calendarView: "agenda",
    advanceOnTargetClick: true,
  },
  {
    id: "cal-day",
    section: "Calendar",
    tab: "calendar",
    target: "cal-day",
    title: "Day",
    body: "One day, hour by hour. Click Day to see the timeline, then continue.",
    calendarView: "day",
    advanceOnTargetClick: true,
  },
  {
    id: "cal-week",
    section: "Calendar",
    tab: "calendar",
    target: "cal-week",
    title: "Week",
    body: "Seven weekdays side by side. Click Week to open it. Drag tasks later to reschedule.",
    calendarView: "week",
    advanceOnTargetClick: true,
  },
  {
    id: "cal-month",
    section: "Calendar",
    tab: "calendar",
    target: "cal-month",
    title: "Month",
    body: "The wide view. Click Month, then look for chips on the days that already have tasks.",
    calendarView: "month",
    advanceOnTargetClick: true,
  },
  {
    id: "overview-tree",
    section: "Overview",
    tab: "overview",
    target: "overview-tree",
    title: "Overview · tree",
    body: "The same hierarchy as onboarding, as a tree: life area → goal → milestone → task. Tap a node to expand. Click Tree to open it.",
    overviewView: "tree",
    advanceOnTargetClick: true,
  },
  {
    id: "overview-map",
    section: "Overview",
    tab: "overview",
    target: "overview-map",
    title: "Overview · map",
    body: "A spatial mind map of the same data. Click Map, then drag to pan and scroll to zoom.",
    overviewView: "map",
    advanceOnTargetClick: true,
  },
  {
    id: "goals",
    section: "Goals",
    tab: "goals",
    target: "page-heading",
    title: "Goals",
    body: "Create and edit goals and their milestones. This is the home of the goal you made in setup.",
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
    id: "settings-intro",
    section: "Settings",
    tab: "settings",
    target: "page-heading",
    title: "Settings",
    body: "Small but useful: profile, theme, font size, and reminders. You can replay this tour from here later.",
  },
  {
    id: "settings-theme",
    section: "Settings",
    tab: "settings",
    target: "settings-appearance",
    title: "Color and mode",
    body: "Light, dark, or system — plus color themes. Change these any time; they apply across the app.",
  },
  {
    id: "settings-type",
    section: "Settings",
    tab: "settings",
    target: "settings-type",
    title: "Font size",
    body: "Compact through Large. Everything scales from this one control.",
  },
];
