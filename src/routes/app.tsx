import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useAppData } from "@/lib/app-data";
import { AppShell, type TabId } from "@/components/life/AppShell";
import { ProductTour } from "@/components/life/ProductTour";
import { TourReplayCard } from "@/components/life/TourReplayCard";
import { z } from "zod";
import { Dashboard } from "@/components/life/Dashboard";
import { Today } from "@/components/life/Today";
import { Goals } from "@/components/life/Goals";
import { Tasks } from "@/components/life/Tasks";
import { BucketList } from "@/components/life/BucketList";
import { Skills } from "@/components/life/Skills";
import { DueBanner } from "@/components/life/DueBanner";
import { Overview } from "@/components/life/Overview";
import { Onboarding } from "@/components/life/Onboarding";
import { CalendarView } from "@/components/life/CalendarView";
import { SettingsView } from "@/components/life/Settings";
import { GoalMarketplace } from "@/components/life/GoalMarketplace";
import { useAppSettingsEffects } from "@/hooks/use-app-settings";
import { APP_NAME } from "@/lib/site";

export const Route = createFileRoute("/app")({
  validateSearch: z.object({
    onboarding: z.number().optional(),
  }),
  component: AppRoute,
  head: () => ({
    meta: [
      { title: `Your workspace — ${APP_NAME}` },
      {
        name: "description",
        content:
          `The ${APP_NAME} workspace: organize goals by skill, track milestones, manage tasks and schedule everything on your calendar.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AppRoute() {
  return (
    <>
      <Shell />
      <Toaster />
    </>
  );
}

function Shell() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [overviewView, setOverviewView] = useState<"tree" | "map">("tree");
  const { goals, tasks, bucketList, settings, importMarketplaceGoal } = useAppData();
  useAppSettingsEffects();
  const stats = {
    goals: goals.filter((g) => g.status !== "completed").length,
    tasks: tasks.filter((t) => !t.done).length,
    bucket: bucketList.filter((b) => !b.achieved).length,
  };

  if (search.onboarding === 1 || !settings.onboardedAt) {
    return (
      <Onboarding onFinish={() => navigate({ to: "/app", search: { onboarding: undefined } })} />
    );
  }

  return (
    <AppShell tab={tab} onTab={setTab} stats={stats} onHome={() => navigate({ to: "/" })}>
      <DueBanner onGoTasks={() => setTab("tasks")} />
      {tab === "dashboard" && <Dashboard />}
      {tab === "today" && (
        <Today
          onGoTasks={() => setTab("tasks")}
          onGoGoals={() => setTab("goals")}
          onGoCalendar={() => setTab("calendar")}
        />
      )}
      {tab === "calendar" && <CalendarView onGoTasks={() => setTab("tasks")} />}
      {tab === "overview" && <Overview view={overviewView} onViewChange={setOverviewView} />}
      {tab === "goals" && <Goals onGoMarketplace={() => setTab("marketplace")} />}
      {tab === "tasks" && <Tasks />}
      {tab === "bucket" && <BucketList />}
      {tab === "skills" && <Skills />}
      {tab === "settings" && (
        <>
          <TourReplayCard />
          <SettingsView />
        </>
      )}
      {tab === "marketplace" && (
        <GoalMarketplace
          onImport={(t, opts) => {
            importMarketplaceGoal(t, opts);
            setTab("goals");
          }}
        />
      )}
      <ProductTour tab={tab} onTab={setTab} onOverviewView={setOverviewView} />
    </AppShell>
  );
}
