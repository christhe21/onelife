import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SurvivalMode } from "@/components/survival/SurvivalMode";
import { APP_NAME } from "@/lib/site";

export const Route = createFileRoute("/survival")({
  head: () => ({
    meta: [
      { title: `Survival Mode — ${APP_NAME}` },
      {
        name: "description",
        content: "A calm daily protocol for mental stability, physical readiness, sustainable work, recovery, and practical preparedness.",
      },
      { property: "og:title", content: `Survival Mode — ${APP_NAME}` },
      {
        property: "og:description",
        content: "Build everyday resilience with a grounded daily protocol and private journal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SurvivalRoute,
});

function SurvivalRoute() {
  return (
    <>
      <SurvivalMode />
      <Toaster />
    </>
  );
}