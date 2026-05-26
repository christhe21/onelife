import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppDataProvider, useAppData } from "@/lib/app-data";
import { AppShell, type TabId } from "@/components/life/AppShell";
import { Dashboard } from "@/components/life/Dashboard";
import { Goals } from "@/components/life/Goals";
import { Tasks } from "@/components/life/Tasks";
import { BucketList } from "@/components/life/BucketList";
import { Skills } from "@/components/life/Skills";

export const Route = createFileRoute("/")({
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
  const [tab, setTab] = useState<TabId>("dashboard");
  const { goals, tasks, bucketList } = useAppData();
  const stats = {
    goals: goals.filter((g) => g.status !== "completed").length,
    tasks: tasks.filter((t) => !t.done).length,
    bucket: bucketList.filter((b) => !b.achieved).length,
  };

  return (
    <AppShell tab={tab} onTab={setTab} stats={stats}>
      {tab === "dashboard" && <Dashboard />}
      {tab === "goals" && <Goals />}
      {tab === "tasks" && <Tasks />}
      {tab === "bucket" && <BucketList />}
      {tab === "skills" && <Skills />}
    </AppShell>
  );
}
