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
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ShotTabs, type Shot } from "@/components/marketing/ShotTabs";
import { FaqAccordion, type FaqItem } from "@/components/marketing/FaqAccordion";
import { CTABand } from "@/components/marketing/CTABand";
import { APP_DESCRIPTION, APP_NAME, GITHUB_URL, SITE_URL } from "@/lib/site";

const TITLE = `${APP_NAME} — Plan your life like you plan your week`;
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
          name: APP_NAME,
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

const SHOTS: Shot[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    src: "/marketing/dashboard.jpg",
    alt: `${APP_NAME} dashboard showing rank progress, skills and upcoming goals`,
    caption: "Rank, life areas and what needs you next — all on one screen.",
  },
  {
    id: "calendar",
    label: "Calendar",
    src: "/marketing/calendar.jpg",
    alt: `${APP_NAME} calendar with scheduled tasks, heatmap and progress rings`,
    caption: "Drag to reschedule, or let auto-scheduling fill your free hours.",
  },
  {
    id: "overview",
    label: "Mindmap",
    src: "/marketing/overview.jpg",
    alt: `${APP_NAME} mindmap linking skills, goals, milestones and tasks`,
    caption: "Every skill, goal, milestone and task in one connected map.",
  },
  {
    id: "goals",
    label: "Goals",
    src: "/marketing/goals.jpg",
    alt: `${APP_NAME} goals list with target dates and progress bars`,
    caption: "Goals with real dates and progress computed from the work beneath.",
  },
  {
    id: "ranks",
    label: "Ranks",
    src: "/marketing/ranks.jpg",
    alt: `${APP_NAME} rank ladder from Beginner to One`,
    caption: "Points and ranks that reward consistency, not busywork.",
  },
];

const JOBS = [
  {
    problem: "“I have goals, but they never turn into anything.”",
    solution:
      "Every goal is forced through milestones and tasks before it can sit in your list — so a wish becomes a next action within minutes.",
  },
  {
    problem: "“My to-do app has no idea what I'm working toward.”",
    solution:
      "Tasks always belong to a milestone, which belongs to a goal, which belongs to a life area. Nothing floats.",
  },
  {
    problem: "“I plan on Sunday and forget by Tuesday.”",
    solution:
      "Work gets scheduled on a real calendar with reminders on web and Android, so the plan follows you into the week.",
  },
  {
    problem: "“I can't tell if I'm actually making progress.”",
    solution:
      "Progress rolls up from tasks to goals to life areas, and points and ranks show the long-term trend.",
  },
];

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

const FAQS: FaqItem[] = [
  {
    q: "Is it really free?",
    a: `Yes. ${APP_NAME} is free to use and the source is public. There is no paid tier, no trial timer and no credit card.`,
  },
  {
    q: "Do I need an account?",
    a: "No. You can use everything locally in the browser. Creating an account only adds cloud sync so your plan follows you between devices.",
  },
  {
    q: "How long does setup take?",
    a: "About a minute. Setup asks for your name, the life areas you care about, and one goal — or you can load a sample plan and explore first.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. The web app is built mobile-first, installs as a PWA, and there is an Android build with native reminders.",
  },
  {
    q: "Can I get my data out?",
    a: "Any time. Export a full JSON snapshot from Settings, import it back, or send scheduled work to your calendar app.",
  },
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
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-4 text-xs text-muted-foreground">
              No account needed · about a minute to set up
            </p>
          </Reveal>

          <Reveal delay={200} from="scale" className="mt-14">
            <ShotTabs shots={SHOTS} />
          </Reveal>

          {GITHUB_URL && (
            <Reveal delay={320}>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" /> Read the code on GitHub
              </a>
            </Reveal>
          )}
        </div>
      </section>

      {/* Jobs / problems */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHeading
            eyebrow="Why it exists"
            title="Built for the gap between wanting something and doing it"
            desc="Four problems most planning tools leave to willpower."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {JOBS.map((j, i) => (
              <Reveal key={j.problem} delay={i * 80}>
                <div className="h-full rounded-2xl border border-border bg-card p-6">
                  <p className="font-display text-base font-semibold">{j.problem}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{j.solution}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What is it */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="What it is"
          title={`A single workspace for the long game`}
          desc={`Most tools track today's to-dos. ${APP_NAME} connects them to the life you're actually trying to build.`}
        />
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

      {/* How it works strip */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHeading
            eyebrow="How it works"
            title="Five layers, one straight line from intention to action"
          />
          <ol className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <li className="h-full list-none rounded-2xl border border-border bg-card p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {i + 1}
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
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
              <Network className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Everything stays linked — finish the tasks and the milestone, goal and life area all
                move with you.
              </p>
              <Button asChild variant="outline" className="rounded-full sm:ml-auto">
                <Link to="/how-it-works">
                  Walk through it <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <SectionHeading eyebrow="FAQ" title="Common questions" align="center" />
        <div className="mt-8">
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <CTABand />
    </MarketingLayout>
  );
}
