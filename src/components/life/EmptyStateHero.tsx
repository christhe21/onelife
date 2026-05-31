import { useRef } from "react";
import { Sparkles, Upload, Play, Plus, Compass, Sun, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData, DEMO_DATA } from "@/lib/app-data";
import { NewGoalButton } from "@/components/life/NewGoalButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function EmptyStateHero() {
  const { replaceAll, importJSON, settings } = useAppData();
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

  const greeting = settings.userName?.trim()
    ? `Welcome back, ${settings.userName.trim()}.`
    : "Welcome.";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-secondary/40 bg-gradient-to-br from-secondary/40 via-background to-card p-6 shadow-sm sm:p-10">
      {/* decorative warmth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-secondary/60 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "14px 14px",
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {greeting}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          A calm place for the life you{" "}
          <span className="italic text-primary">want to build</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          Set meaningful goals, focus on today, and watch them grow on your
          mind map. Begin in any way that feels right.
        </p>

        <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
          <IntentCard
            icon={<Play className="h-5 w-5" />}
            title="See a demo"
            sub="Explore sample data"
            onClick={() => {
              replaceAll(DEMO_DATA);
              toast.success("Demo data loaded");
            }}
          />
          <NewGoalButton
            trigger={
              <IntentCard
                primary
                icon={<Plus className="h-5 w-5" />}
                title="Add your first goal"
                sub="Guided in a few steps"
              />
            }
          />
          <IntentCard
            icon={<Upload className="h-5 w-5" />}
            title="Import JSON"
            sub="Bring data you have"
            onClick={() => fileRef.current?.click()}
          />
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

        <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
          <Reason icon={<Compass className="h-4 w-4" />} title="Long-term clarity" body="One place for the goals that matter most." />
          <Reason icon={<Sun className="h-4 w-4" />} title="Today's focus" body="See what to do today without the noise." />
          <Reason icon={<Network className="h-4 w-4" />} title="Visual mind map" body="Watch your life take shape, branch by branch." />
        </div>
      </div>
    </section>
  );
}

function IntentCard({
  icon,
  title,
  sub,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        primary
          ? "border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          primary ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary/60 text-primary",
        )}
      >
        {icon}
      </span>
      <span className="mt-1 text-sm font-semibold">{title}</span>
      <span className={cn("text-xs", primary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {sub}
      </span>
    </button>
  );
}

function Reason({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
