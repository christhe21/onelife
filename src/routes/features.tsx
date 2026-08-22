import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  CloudUpload,
  Network,
  Palette,
  Store,
  Target,
  Trophy,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Reveal } from "@/components/marketing/Reveal";
import { ScreenshotFrame } from "@/components/marketing/ScreenshotFrame";
import { CTABand } from "@/components/marketing/CTABand";
import { SITE_URL } from "@/lib/site";

const TITLE = "Features — OneLife";
const DESC =
  "Skills, goals, milestones and tasks, a drag-and-drop calendar with auto-scheduling, a mindmap overview, ranks and points, reminders, themes and cloud sync.";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/features` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/features` }],
  }),
});

const GROUPS: {
  icon: typeof Target;
  title: string;
  desc: string;
  points: string[];
  shot?: { src: string; alt: string };
}[] = [
  {
    icon: Target,
    title: "The planning hierarchy",
    desc: "Skills hold goals, goals hold milestones, milestones hold tasks and subtasks. Nothing floats without a reason to exist.",
    points: [
      "Color-coded life skills like Career, Health or Faith",
      "Goals with target dates and progress rollups",
      "Milestones as checkpoints on the way",
      "Tasks and subtasks with deadlines and priorities",
    ],
  },
  {
    icon: CalendarClock,
    title: "Calendar and auto-scheduling",
    desc: "Put the work in real time slots. Drag it around when life changes.",
    points: [
      "Month, week, day and agenda views",
      "Drag-and-drop rescheduling with conflict detection",
      "Auto-schedule a goal or a whole skill into your free hours",
      "Configurable work hours, recurrence rules and .ics export",
    ],
    shot: {
      src: "/marketing/calendar.png",
      alt: "OneLife calendar with scheduled task blocks and progress rings",
    },
  },
  {
    icon: Network,
    title: "Mindmap overview",
    desc: "Zoom out and see the whole structure of your life plan in one canvas — or as a tree.",
    points: [
      "Radial mindmap that expands outward without clutter",
      "Tree view for a compact hierarchy",
      "Theme-aware rendering in light and dark",
    ],
    shot: {
      src: "/marketing/overview.png",
      alt: "OneLife mindmap of skills, goals, milestones and tasks",
    },
  },
  {
    icon: Trophy,
    title: "Ranks and points",
    desc: "Completions earn points; points move you along a nine-tier ladder from Beginner to One.",
    points: [
      "Hand-drawn rank marks for every tier",
      "Rank ladder with thresholds and a 'you are here' marker",
      "Confetti and sound when you rank up",
    ],
    shot: {
      src: "/marketing/ranks.png",
      alt: "OneLife rank ladder showing tiers from Beginner to One",
    },
  },
  {
    icon: Store,
    title: "Goal marketplace",
    desc: "Start from a ready-made plan instead of a blank page.",
    points: [
      "Templates like Couch to 5K, DSA mastery and deep work",
      "Search, tags, grid and list views",
      "Import a full hierarchy and optionally auto-schedule it",
    ],
  },
  {
    icon: Bell,
    title: "Reminders",
    desc: "Nudges that reach you where you are.",
    points: [
      "Web push notifications",
      "Native Android reminders that survive reboots",
      "Due-today banner inside the app",
    ],
  },
  {
    icon: Palette,
    title: "Themes",
    desc: "Make the workspace yours.",
    points: [
      "Light, dark and a Frieren-inspired theme",
      "Themed icon set and ambient audio",
      "Adjustable text size",
    ],
  },
  {
    icon: CloudUpload,
    title: "Your data, portable",
    desc: "Sign in to sync, or keep it local and carry it in a file.",
    points: [
      "Optional account with per-user cloud sync",
      "One-click JSON export and import",
      "Everything in the export — nothing hidden",
    ],
  },
];

function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-16 sm:pt-20">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything OneLife does
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-lg">{DESC}</p>
        </Reveal>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-16 px-5 py-10">
        {GROUPS.map((g, i) => (
          <section key={g.title} className="grid items-center gap-8 lg:grid-cols-2">
            <Reveal from={i % 2 === 0 ? "left" : "right"} className={i % 2 ? "lg:order-2" : ""}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <g.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">{g.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{g.desc}</p>
              <ul className="mt-5 space-y-2">
                {g.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal
              from={i % 2 === 0 ? "right" : "left"}
              delay={100}
              className={i % 2 ? "lg:order-1" : ""}
            >
              {g.shot ? (
                <ScreenshotFrame src={g.shot.src} alt={g.shot.alt} />
              ) : (
                <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-10">
                  <g.icon className="h-12 w-12 text-primary/40" />
                </div>
              )}
            </Reveal>
          </section>
        ))}
      </div>

      <CTABand />
    </MarketingLayout>
  );
}
