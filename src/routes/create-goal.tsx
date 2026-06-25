import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CreateGoalWizard } from "@/components/life/CreateGoalWizard";

export const Route = createFileRoute("/create-goal")({
  component: CreateGoalPage,
  head: () => ({
    meta: [
      { title: "Create a Goal — Life Manager" },
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
