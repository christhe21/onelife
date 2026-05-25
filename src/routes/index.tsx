import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { AppDataProvider } from "@/lib/app-data";
import { ExportImport } from "@/components/life/ExportImport";
import { Dashboard } from "@/components/life/Dashboard";
import { Goals } from "@/components/life/Goals";
import { Tasks } from "@/components/life/Tasks";
import { BucketList } from "@/components/life/BucketList";

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
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <h1 className="text-xl font-semibold">Life Manager</h1>
              <p className="text-xs text-muted-foreground">
                Goals, sub-goals, tasks & bucket list — session only. Export to keep.
              </p>
            </div>
            <ExportImport />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          <Tabs defaultValue="dashboard">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="bucket">Bucket list</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-4"><Dashboard /></TabsContent>
            <TabsContent value="goals" className="mt-4"><Goals /></TabsContent>
            <TabsContent value="tasks" className="mt-4"><Tasks /></TabsContent>
            <TabsContent value="bucket" className="mt-4"><BucketList /></TabsContent>
          </Tabs>
        </main>
        <Toaster />
      </div>
    </AppDataProvider>
  );
}
