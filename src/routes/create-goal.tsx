import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CreateGoalWizard } from "@/components/life/CreateGoalWizard";
import { APP_NAME } from "@/lib/site";

export const Route = createFileRoute("/create-goal")({
  component: CreateGoalPage,
  head: () => ({
    meta: [
      { title: `Create a Goal — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Author a complete goal: milestones, tasks, subtasks, and recurring schedules with daily, weekly, monthly presets.",
      },
    ],
  }),
});

function CreateGoalPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 lg:px-10 lg:py-10">
      <CreateGoalWizard />
      <Toaster />
    </div>
  );
}
