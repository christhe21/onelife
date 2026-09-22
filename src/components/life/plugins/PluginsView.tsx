import { BookOpen, Dumbbell, NotebookPen, Puzzle, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppData } from "@/lib/app-data";
import { PLUGIN_CATALOG } from "@/lib/plugins-data";

const ICONS: Record<string, typeof Puzzle> = {
  books: BookOpen,
  fitness: Dumbbell,
  finance: Wallet,
  journal: NotebookPen,
};

export function PluginsView({ onOpenBooks }: { onOpenBooks?: () => void }) {
  const { plugins, setPluginEnabled } = useAppData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Plugins</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch on the parts of life you want to track. Each one adds its own section to the
          sidebar and keeps its data separate from your goals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLUGIN_CATALOG.map((p) => {
          const Icon = ICONS[p.id] ?? Puzzle;
          const enabled = plugins.enabled.includes(p.id);
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-sm font-semibold">{p.name}</h2>
                    {!p.available && (
                      <Badge variant="secondary" className="text-[10px]">
                        Coming soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.tagline}</p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={!p.available}
                  onCheckedChange={(v) => setPluginEnabled(p.id, v)}
                  aria-label={`Enable ${p.name}`}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{p.description}</p>
              {p.id === "books" && enabled && onOpenBooks && (
                <Button variant="outline" size="sm" className="self-start" onClick={onOpenBooks}>
                  Open my library
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
