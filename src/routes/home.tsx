import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "@/components/life/Welcome";

export const Route = createFileRoute("/home")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Welcome — Life Manager" },
      {
        name: "description",
        content:
          "Session-based life manager: organize goals by skill, track sub-goals on a timeline, manage tasks, and keep a bucket list. Export/import as JSON.",
      },
    ],
  }),
});

function Home() {
  return (
    <Welcome />
  );
}
