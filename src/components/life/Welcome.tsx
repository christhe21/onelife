import {
  Sparkles,
  Target,
  Flag,
  ListChecks,
  CalendarCheck,
  Palette,
  ArrowRight,
  LayoutDashboard,
  PlayCircle,
  Stars,
  Compass,
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
          <div className="mx-auto mb-6 flex justify-center gap-2 text-primary/40">
            <Sparkles className="h-6 w-6 -rotate-12" />
            <Compass className="h-8 w-8 text-primary/60" />
            <Stars className="h-6 w-6 rotate-12" />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
            Your life, one dashboard.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            Plan your life like you plan your week. Organize what matters into skills, goals,
            milestones, and tasks — then actually do them.
          </p>
        </div>

        {/* Features */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="mt-1">
                <div className="text-sm font-semibold text-foreground">{f.title}</div>
                <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Placeholder */}
        <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex aspect-video w-full flex-col items-center justify-center bg-muted/30 p-6 text-center">
            <PlayCircle className="mb-3 h-10 w-10 text-primary/40" />
            <h3 className="font-medium text-foreground">See how it works</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-[250px]">
              Watch a quick 2-minute walkthrough on how to set your first goals and start tracking
              progress.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/", search: { onboarding: 1 } })}
            className="w-full h-14 rounded-full px-8 shadow-xl shadow-primary/20 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground sm:max-w-md"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {hasOnboarded ? "Redo onboarding" : "Start onboarding"}
          </Button>

          <button
            onClick={() => {
              if (!hasOnboarded) {
                updateSettings({ onboardedAt: "skipped" });
              }
              navigate({ to: "/", search: {} });
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Skip onboarding
          </button>
        </div>

        {hasOnboarded && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            You can jump straight back into your workspace.
          </p>
        )}
      </div>
    </div>
  );
}
