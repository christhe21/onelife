import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Flag, ListChecks, Palette, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Reveal } from "@/components/marketing/Reveal";
import { ScreenshotFrame } from "@/components/marketing/ScreenshotFrame";
import { CTABand } from "@/components/marketing/CTABand";
import { APP_NAME, SITE_URL } from "@/lib/site";

const TITLE = `How it works — ${APP_NAME}`;
const DESC = `Skills, goals, milestones, tasks and a calendar: the five stages ${APP_NAME} uses to turn an intention into work that actually gets done.`;

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/how-it-works` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/how-it-works` }],
  }),
});

const STAGES: {
  icon: typeof Target;
  label: string;
  title: string;
  body: string;
  points: string[];
  shot?: { src: string; alt: string };
}[] = [
  {
    icon: Palette,
    label: "Skills",
    title: "Name the areas of life you care about",
    body: "Career, Health, Faith, Music — whatever you're actually trying to grow. Each area gets a color, and everything below it inherits that color across the app.",
    points: [
      "Pick areas during setup in one tap each",
      "Add, rename or recolor them later in Settings",
      "Progress rolls up per area on the dashboard",
    ],
    shot: {
      src: "/marketing/dashboard.jpg",
      alt: `${APP_NAME} dashboard showing progress grouped by life area`,
    },
  },
  {
    icon: Target,
    label: "Goals",
    title: "Set an outcome with a real date",
    body: "A goal belongs to exactly one area and always has a target date. That single constraint is what stops a wish list from becoming background noise.",
    points: [
      "Start from a template or a blank goal",
      "Target dates drive every downstream deadline",
      "Progress is computed from the work beneath it",
    ],
    shot: {
      src: "/marketing/goals.jpg",
      alt: `${APP_NAME} goals list with target dates and progress`,
    },
  },
  {
    icon: Flag,
    label: "Milestones",
    title: "Split the goal into checkpoints",
    body: "Milestones are the proof you're moving. Every goal gets at least one, so no task ever floats without a reason to exist.",
    points: [
      "Dated checkpoints between today and the target",
      "Completing one bumps the goal forward",
      "Visible as a middle layer in the overview map",
    ],
    shot: {
      src: "/marketing/overview.jpg",
      alt: `${APP_NAME} mindmap showing milestones between goals and tasks`,
    },
  },
  {
    icon: ListChecks,
    label: "Tasks",
    title: "Turn checkpoints into next actions",
    body: "Tasks and subtasks hang off a milestone with a deadline and a priority. This is the layer you actually touch each day.",
    points: [
      "Subtasks for anything bigger than one sitting",
      "Recurrence rules for the habits",
      "Checking one off moves the milestone and goal",
    ],
  },
  {
    icon: CalendarCheck,
    label: "Calendar",
    title: "Schedule it and show up",
    body: "Work that never hits a calendar rarely happens. Drop tasks into time slots yourself, or let auto-scheduling fill your free hours.",
    points: [
      "Month, week, day and agenda views",
      "Drag to reschedule with conflict detection",
      "Reminders on web and Android",
    ],
    shot: {
      src: "/marketing/calendar.jpg",
      alt: `${APP_NAME} calendar with scheduled task blocks`,
    },
  },
];

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto w-full max-w-6xl px-5 pb-4 pt-16 sm:pt-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            From intention to a slot on your calendar, in five stages.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-lg">{DESC}</p>
        </Reveal>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-16 px-5 py-10 sm:space-y-24">
        {STAGES.map((s, i) => (
          <section key={s.label} className="grid items-center gap-8 lg:grid-cols-2">
            <Reveal from={i % 2 === 0 ? "left" : "right"} className={i % 2 ? "lg:order-2" : ""}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              <ul className="mt-5 space-y-2">
                {s.points.map((p) => (
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
              {s.shot ? (
                <ScreenshotFrame src={s.shot.src} alt={s.shot.alt} />
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-10">
                  <s.icon className="h-12 w-12 text-primary/40" />
                </div>
              )}
            </Reveal>
          </section>
        ))}
      </div>

      <section className="mx-auto w-full max-w-6xl px-5 pb-4">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-sm text-muted-foreground">
              Setup walks you through all five stages in about a minute.
            </p>
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link to="/app" search={{ onboarding: 1 }}>
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <CTABand />
    </MarketingLayout>
  );
}
