import { useRef } from "react";
import { Sparkles, Upload, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData, DEMO_DATA } from "@/lib/app-data";
import { TEMPLATES } from "@/lib/templates";
import { OnboardingWizard } from "@/components/life/OnboardingWizard";
import { toast } from "sonner";

export function EmptyStateHero() {
  const { replaceAll, importJSON } = useAppData();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onImport = async (f: File | null) => {
    if (!f) return;
    try {
      await importJSON(f);
      toast.success("Imported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-6 sm:p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Start your life dashboard
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Choose how you&apos;d like to begin — explore a demo, build your first goal,
            or import data you already have.
          </p>

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                replaceAll(DEMO_DATA);
                toast.success("Demo data loaded");
              }}
            >
              <Play className="mr-2 h-4 w-4" /> See a demo
            </Button>
            <OnboardingWizard
              trigger={
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" /> Add your first goal
                </Button>
              }
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                onImport(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-base font-semibold">
            Or start from a science-backed template
          </h3>
          <span className="text-xs text-muted-foreground">{TEMPLATES.length} templates</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <OnboardingWizard
              key={t.id}
              initialTemplate={t}
              trigger={
                <button
                  type="button"
                  className="group flex h-full flex-col rounded-lg border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(t.durationDays / 7)} weeks
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{t.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] italic text-muted-foreground/80">
                    {t.rationale}
                  </p>
                </button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
