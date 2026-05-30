import { useRef } from "react";
import { Sparkles, Upload, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData, DEMO_DATA } from "@/lib/app-data";
import { NewGoalButton } from "@/components/life/NewGoalButton";
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
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-6 sm:p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Your dashboard is empty
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Explore a demo, add a goal, or import data you already have.
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
          <NewGoalButton
            trigger={
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" /> Add a goal
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
  );
}

