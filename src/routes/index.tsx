import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  Flag,
  Github,
  ListChecks,
  Network,
  Palette,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Reveal } from "@/components/marketing/Reveal";
import { ScreenshotFrame } from "@/components/marketing/ScreenshotFrame";
import { CTABand } from "@/components/marketing/CTABand";
import { APP_DESCRIPTION, GITHUB_URL, SITE_URL } from "@/lib/site";

const TITLE = "OneLife — Plan your life like you plan your week";
const DESC = APP_DESCRIPTION;

export const Route = createFileRoute("/")({
  component: MarketingHome,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/marketing/dashboard.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}/marketing/dashboard.jpg` },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "OneLife",
          applicationCategory: "ProductivityApplication",
          operatingSystem: "Web, Android",
          description: DESC,
          url: SITE_URL,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
});

const WHAT = [
  {
    icon: Target,
    title: "Goals that don't drift",
    desc: "Every goal sits under a life skill and carries a real target date, so ambition turns into a plan.",
  },
  {
    icon: Flag,
    title: "Milestones in between",
    desc: "Break a goal into checkpoints. Progress becomes visible long before the finish line.",
  },
  {
    icon: CalendarCheck,
    title: "Work that gets scheduled",
    desc: "Tasks land on a calendar — manually or auto-scheduled into your free hours.",
  },
  {
    icon: Trophy,
    title: "Momentum you can feel",
    desc: "Points, ranks and streaks reward the boring consistency that actually moves the needle.",
  },
];

const STEPS = [
  { icon: Palette, label: "Skills", desc: "Name the areas of life you care about." },
  { icon: Target, label: "Goals", desc: "Set outcomes with a target date." },
  { icon: Flag, label: "Milestones", desc: "Split each goal into checkpoints." },
  { icon: ListChecks, label: "Tasks", desc: "Turn checkpoints into actions." },
  { icon: CalendarCheck, label: "Calendar", desc: "Schedule them and show up." },
];

function MarketingHome() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-gradient-to-br from-primary/20 via-accent/20 to-transparent blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-16 text-center sm:pt-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Free · open source · works on web and Android
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Plan your life like you plan your week.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground sm:text-lg">
              {APP_DESCRIPTION}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full rounded-full px-7 sm:w-auto">
                <Link to="/app" search={{ onboarding: 1 }}>
                  Start free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full px-7 sm:w-auto"
              >
                <Link to="/features">See features</Link>
              </Button>
            </div>
          </Reveal>
          {GITHUB_URL && (
            <Reveal delay={320}>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" /> Read the code on GitHub
              </a>
            </Reveal>
          )}

          <Reveal delay={200} from="scale" className="mt-14">
            <ScreenshotFrame
              src="/marketing/dashboard.jpg"
              alt="OneLife dashboard showing rank progress, skills and upcoming goals"
              caption="The dashboard: rank, skills and what needs you next."
            />
          </Reveal>
        </div>
      </section>

      {/* What is it */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            What is OneLife?
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            A single workspace for the long game. Most tools track today's to-dos; OneLife connects
            them to the life you're actually trying to build.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {WHAT.map((w, i) => (
            <Reveal key={w.title} delay={i * 90}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <w.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              See it in motion
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal from="left">
              <ScreenshotFrame
                src="/marketing/calendar.jpg"
                alt="OneLife calendar with scheduled tasks, heatmap and progress rings"
                caption="Calendar with drag-to-reschedule and auto-scheduling."
              />
            </Reveal>
            <Reveal from="right" delay={120}>
              <ScreenshotFrame
                src="/marketing/overview.jpg"
                alt="OneLife mindmap overview linking skills, goals, milestones and tasks"
                caption="Mindmap overview of everything you're working toward."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Five layers, one straight line from intention to action.
          </p>
        </Reveal>
        <ol className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <li className="h-full list-none rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Step {i + 1}</span>
                </div>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-sm font-semibold">{s.label}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={200} className="mt-10">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <Network className="h-5 w-5 shrink-0 text-primary" />
            Everything stays linked — finish the tasks and the milestone, goal and skill all move
            with you.
          </div>
        </Reveal>
      </section>

      <CTABand />
    </MarketingLayout>
  );
}
