import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/site";
import { BrandMark } from "@/components/marketing/BrandMark";
import { ArrowRight, ArrowLeft, Check, Compass, PenLine, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/lib/app-data";

const STEPS = ["welcome", "areas", "start", "shape", "done"] as const;
type Step = (typeof STEPS)[number];

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Onboarding({ onFinish }: { onFinish?: () => void } = {}) {
  const { addGoal, updateSettings } = useAppData();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const previous = document.title;
    document.title = `Welcome — ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, []);

  const finish = () => {
    if (name.trim()) updateSettings({ userName: name.trim() });
    updateSettings({ onboardedAt: new Date().toISOString() });
    onFinish?.();
  };

  const commit = () => {
    addGoal({
      title: goalTitle.trim() || "My first goal",
      description: "",
      skill: "life",
      startDate: today,
      targetDate: addDays(90),
      status: "not_started",
      currentActivity: "",
    });
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <BrandMark className="h-8 w-8 rounded-lg" />
        <span className="hidden font-display text-sm font-semibold sm:block">{APP_NAME}</span>
        <p className="flex-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {step} · {STEPS.indexOf(step) + 1}/{STEPS.length}
        </p>
        <Button type="button" variant="ghost" onClick={finish} aria-label="Skip setup" className="h-11 rounded-full">
          Skip <X className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center p-6">
          {step === "welcome" && (
            <div className="w-full text-center">
              <h1 className="font-display text-3xl font-semibold">Welcome to {APP_NAME}</h1>
              <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
                One clear goal, broken into milestones, turned into tasks you can actually do.
              </p>
              <div className="mx-auto mt-7 max-w-xs text-left">
                <Label htmlFor="onboarding-name">
                  What should we call you? <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="onboarding-name"
                  autoFocus
                  placeholder="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button size="lg" className="mt-6 h-12 rounded-full" onClick={() => setStep("areas")}>
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          {step === "areas" && (
            <div className="w-full space-y-4">
              <h1 className="font-display text-2xl font-semibold">Which life areas matter to you?</h1>
              <button type="button" onClick={() => setStep("start")} className="text-xs font-medium underline">
                Skip — use Career and Health
              </button>
            </div>
          )}
          {step === "start" && (
            <div className="w-full space-y-4">
              <h1 className="font-display text-2xl font-semibold">Choose a starting point</h1>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setStep("shape")} className="flex items-start gap-3 rounded-2xl border bg-card p-4 text-left">
                  <PenLine className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Blank goal</p>
                    <p className="text-xs text-muted-foreground">Write your own goal, milestones and tasks.</p>
                  </div>
                </button>
                <button type="button" className="flex items-start gap-3 rounded-2xl border bg-card p-4 text-left">
                  <Compass className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">Just explore</p>
                    <p className="text-xs text-muted-foreground">Adds a sample goal so nothing is empty.</p>
                  </div>
                </button>
              </div>
            </div>
          )}
          {step === "shape" && (
            <div className="w-full space-y-4">
              <h1 className="font-display text-2xl font-semibold">Shape your first goal</h1>
              <Label>Goal title</Label>
              <Input autoFocus value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g. Run a 5K under 25 minutes" />
            </div>
          )}
          {step === "done" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Check className="h-7 w-7" />
              </div>
              <h1 className="font-display text-3xl font-semibold">You're all set{name.trim() ? `, ${name.trim()}` : ""}</h1>
              <Button className="mt-6 h-12 rounded-full px-7" size="lg" onClick={finish}>
                Enter dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {step !== "welcome" && step !== "done" && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Button variant="ghost" onClick={() => setStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)])}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {step === "areas" && (
            <Button className="h-11 rounded-full px-6" onClick={() => setStep("start")}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === "shape" && (
            <Button className="h-11 rounded-full px-6" onClick={commit} disabled={!goalTitle.trim()}>
              Create goal <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
