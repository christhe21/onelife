import { useMemo, useState } from "react";
import { Briefcase, Check, Home, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppData, type Recurrence } from "@/lib/app-data";
import { cn } from "@/lib/utils";
import {
  LIFE_ROLES,
  HOME_TASK_PRESETS,
  homeTasksByIds,
  roleById,
  type HomeSupport,
} from "@/lib/life-graph";
import { BrandMark } from "@/components/marketing/BrandMark";
import { APP_NAME } from "@/lib/site";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function LifeGraphSteps({ onDone }: { onDone: () => void }) {
  const { addSkill, addGoal, addTask, updateSettings, skills } = useAppData();
  const [step, setStep] = useState<"role" | "home">("role");
  const [roleId, setRoleId] = useState("software-engineer");
  const [customRole, setCustomRole] = useState("");
  const [homeIds, setHomeIds] = useState<Set<string>>(new Set(["dishes", "laundry"]));
  const [homeSupport, setHomeSupport] = useState<HomeSupport>("self");

  const roleLabel = useMemo(() => {
    if (roleId === "other") return customRole.trim() || "Something else";
    return roleById(roleId)?.label ?? "";
  }, [roleId, customRole]);

  const applyRole = (id: string) => {
    setRoleId(id);
    const role = roleById(id);
    if (!role) return;
    role.skills.forEach((s) => {
      if (!skills.some((existing) => existing.id === s.id)) {
        addSkill({ id: s.id, label: s.label, color: s.color });
      }
    });
  };

  const persist = (extra?: { jobRole?: string; jobLabel?: string }) => {
    updateSettings({
      jobRole: extra?.jobRole ?? roleId,
      jobLabel: extra?.jobLabel ?? roleLabel,
      homeTaskIds: Array.from(homeIds),
      homeSupport,
    });
  };

  const skip = () => {
    persist({ jobRole: "skipped", jobLabel: "" });
    onDone();
  };

  const finish = () => {
    persist();
    const chores = homeTasksByIds(homeIds);
    if (chores.length) {
      const goalId = addGoal({
        title: "Home & daily life",
        description:
          homeSupport === "supported"
            ? "Simple household tasks you still want on the board. Skip anything someone else already covers."
            : "Simple household tasks you handle yourself — daily and weekly repeats.",
        skill: "life",
        startDate: todayYmd(),
        targetDate: addDays(365),
        status: "not_started",
        currentActivity: "",
      });
      chores.forEach((chore) => {
        const recurrence: Recurrence = chore.recurrence;
        addTask({
          title: chore.title,
          dueDate: todayYmd(),
          priority: "medium",
          goalId,
          recurrence,
        });
      });
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
        <BrandMark className="h-8 w-8 rounded-lg" />
        <span className="hidden font-display text-sm font-semibold sm:block">{APP_NAME}</span>
        <p className="flex-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {step === "role" ? "Work" : "Home"} · {step === "role" ? "1" : "2"}/2
        </p>
        <Button type="button" variant="ghost" className="h-11 rounded-full px-3" onClick={skip} aria-label="Skip life setup">
          Skip <X className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center p-5 sm:p-6">
          {step === "role" && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl font-semibold">What kind of work do you do?</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                This starts a graph of your life. A software engineer and someone in agriculture get
                different skill sets. We will not ask relationship questions.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {LIFE_ROLES.map((role) => {
                  const on = roleId === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => applyRole(role.id)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        on ? "border-primary bg-primary/10" : "bg-card hover:border-primary/50",
                      )}
                    >
                      <p className="text-sm font-semibold">{role.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{role.blurb}</p>
                    </button>
                  );
                })}
              </div>
              {roleId === "other" && (
                <div>
                  <Label className="text-xs" htmlFor="custom-role">
                    Your role
                  </Label>
                  <Input
                    id="custom-role"
                    className="mt-1.5"
                    placeholder="e.g. Baker, researcher, shop owner"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {step === "home" && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl font-semibold">How are you managing your home?</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Tick simple chores you handle. Those become daily or weekly tasks like wash dishes
                and clean clothes. Skip anything that is already covered for you.
              </p>
              <div className="grid gap-2">
                {(["self", "supported"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={homeSupport === mode}
                    onClick={() => setHomeSupport(mode)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm",
                      homeSupport === mode ? "border-primary bg-primary/10" : "bg-card",
                    )}
                  >
                    <span className="font-medium">
                      {mode === "self"
                        ? "I handle these myself"
                        : "Some of this is shared or covered for me"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                {HOME_TASK_PRESETS.map((chore) => {
                  const on = homeIds.has(chore.id);
                  return (
                    <button
                      key={chore.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setHomeIds((prev) => {
                          const nextSet = new Set(prev);
                          if (nextSet.has(chore.id)) nextSet.delete(chore.id);
                          else nextSet.add(chore.id);
                          return nextSet;
                        })
                      }
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 text-left",
                        on ? "border-primary bg-primary/10" : "bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                        )}
                      >
                        {on ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{chore.title}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {chore.recurrence}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{chore.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-card/80 px-4 py-3 backdrop-blur">
        <Button variant="ghost" className="h-11" disabled={step === "role"} onClick={() => setStep("role")}>
          Back
        </Button>
        {step === "role" ? (
          <Button
            className="h-11 rounded-full px-6"
            onClick={() => {
              applyRole(roleId);
              persist();
              setStep("home");
            }}
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button className="h-11 rounded-full px-6" onClick={finish}>
            Save home tasks <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
