import {
  Sparkles,
  Target,
  Flag,
  ListChecks,
  CalendarCheck,
  Palette,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";
import { useNavigate } from "@tanstack/react-router";

const FEATURES = [
  {
    icon: Palette,
    title: "Skills",
    desc: "Life areas like Career, Health and Faith that color-code everything.",
  },
  { icon: Target, title: "Goals", desc: "Meaningful outcomes with a clear target date." },
  { icon: Flag, title: "Milestones", desc: "Sub-goals — checkpoints on the way to a goal." },
  {
    icon: ListChecks,
    title: "Tasks & sub-tasks",
    desc: "Concrete actions you tick off as you go.",
  },
  {
    icon: CalendarCheck,
    title: "Today & Calendar",
    desc: "Schedule blocks and see your day at a glance.",
  },
];

export function Welcome() {
  const { settings, updateSettings } = useAppData();
  const navigate = useNavigate();
  const hasOnboarded = !!settings.onboardedAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-xl shadow-primary/30 ring-1 ring-white/20">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">
              Life Manager
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Plan your life like you plan your week. Organize what matters into skills, goals,
            milestones, and tasks — then actually do them.
          </p>
        </div>

        {/* What it is */}
        <div className="mt-8 rounded-2xl border bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground sm:p-5">
          Life Manager is a personal workspace that keeps your long-term goals connected to your
          daily schedule. Pick the areas of life that matter, set goals with target dates, break
          them into milestones and tasks, and track progress over time.
        </div>

        {/* Features */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/", search: { onboarding: 1 } })}
            className="h-12 rounded-full px-6 shadow-lg shadow-primary/30 sm:min-w-[200px]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {hasOnboarded ? "Redo onboarding" : "Start onboarding"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              if (!hasOnboarded) {
                updateSettings({ onboardedAt: "skipped" });
              }
              navigate({ to: "/", search: {} });
            }}
            className="h-12 rounded-full px-6 sm:min-w-[200px]"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {hasOnboarded
            ? "You can jump straight back into your workspace."
            : "Not sure yet? Skip onboarding and explore the dashboard first."}
        </p>
      </div>
    </div>
  );
}
