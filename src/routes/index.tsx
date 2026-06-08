import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppDataProvider, useAppData } from "@/lib/app-data";
import { AppShell, type TabId } from "@/components/life/AppShell";
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
import { Welcome } from "@/components/life/Welcome";
import { CalendarView } from "@/components/life/CalendarView";
import { SettingsView } from "@/components/life/Settings";
import { useAppSettingsEffects } from "@/hooks/use-app-settings";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    onboarding: z.number().optional(),
  }),
  component: Index,
  head: () => ({
    meta: [
      { title: "Life Manager — Goals, Tasks & Bucket List" },
      {
        name: "description",
        content:
          "Session-based life manager: organize goals by skill, track sub-goals on a timeline, manage tasks, and keep a bucket list. Export/import as JSON.",
      },
    ],
  }),
});

function Index() {
  return (
    <AppDataProvider>
      <Shell />
      <Toaster />
    </AppDataProvider>
  );
}

function Shell() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("dashboard");
  const { goals, tasks, bucketList, settings } = useAppData();
  useAppSettingsEffects();
  useNotifications();
  const stats = {
    goals: goals.filter((g) => g.status !== "completed").length,
    tasks: tasks.filter((t) => !t.done).length,
    bucket: bucketList.filter((b) => !b.achieved).length,
  };

  if (!settings.onboardedAt && search.onboarding !== 1) {
    return <Navigate to="/home" replace />;
  }

  if (search.onboarding === 1) {
    return <Onboarding onFinish={() => navigate({ to: "/", search: {} })} />;
  }

  return (
    <AppShell tab={tab} onTab={setTab} stats={stats} onHome={() => navigate({ to: "/home" })}>
      <DueBanner onGoTasks={() => setTab("tasks")} />
      {tab === "dashboard" && <Dashboard />}
      {tab === "today" && (
        <Today
          onGoTasks={() => setTab("tasks")}
          onGoGoals={() => setTab("goals")}
          onGoCalendar={() => setTab("calendar")}
        />
      )}
      {tab === "calendar" && <CalendarView />}
      {tab === "overview" && <Overview />}
      {tab === "goals" && <Goals />}
      {tab === "tasks" && <Tasks />}
      {tab === "bucket" && <BucketList />}
      {tab === "skills" && <Skills />}
      {tab === "settings" && <SettingsView />}
    </AppShell>
  );
}
