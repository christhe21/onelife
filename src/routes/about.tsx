import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Github, HeartHandshake, Lightbulb, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Reveal } from "@/components/marketing/Reveal";
import { CTABand } from "@/components/marketing/CTABand";
import { GITHUB_URL, SITE_URL } from "@/lib/site";

const TITLE = "About — OneLife";
const DESC =
  "OneLife is built by a productivity practitioner focused on improving their own life and helping others do the same. Free to use, open to feedback.";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/about` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
});

const VALUES = [
  {
    icon: Lightbulb,
    title: "Structure beats willpower",
    desc: "Motivation fades. A plan with milestones, deadlines and a calendar slot survives the day you don't feel like it.",
  },
  {
    icon: HeartHandshake,
    title: "Built in the open",
    desc: "The source is public. Read it, fork it, file an issue, send a pull request — the project gets better when people poke at it.",
  },
  {
    icon: Rocket,
    title: "Free while it grows",
    desc: "OneLife is free to use today. No paywalls, no upsell in the middle of your planning session.",
  },
];

function AboutPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto w-full max-w-3xl px-5 pt-16 sm:pt-24">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Why OneLife exists
          </h1>
        </Reveal>
        <Reveal delay={90}>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              I'm a productivity practitioner — someone obsessed with improving my own life and
              helping other people improve theirs. I kept running into the same wall: task apps are
              great at today and useless at the next three years, and goal apps are great at
              ambition and useless on a Tuesday morning.
            </p>
            <p>
              OneLife is my answer. It holds the whole chain in one place — the life skills you're
              investing in, the goals under them, the milestones that prove you're moving, the tasks
              that get it done, and the calendar where they finally take up real time.
            </p>
            <p>
              It's the tool I use on myself. Everything in it exists because I needed it, not
              because it looked good on a feature list.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 100}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold">{v.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-8">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Where it stands today</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              OneLife runs on the web and ships as an Android build. It's free, actively developed,
              and shaped by the people who use it. If something is missing or annoying, say so — the
              fastest way in is an issue on GitHub.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full">
                <Link to="/app" search={{ onboarding: 1 }}>
                  Try it free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {GITHUB_URL && (
                <Button asChild variant="outline" className="rounded-full">
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                    <Github className="mr-2 h-4 w-4" /> Contribute on GitHub
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <CTABand />
    </MarketingLayout>
  );
}
