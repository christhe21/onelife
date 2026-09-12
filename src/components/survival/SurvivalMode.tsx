import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleUserRound,
  HeartPulse,
  History,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { emptySurvivalDay, type SurvivalArea, type SurvivalRule } from "@/lib/survival-data";
import { useAppSettingsEffects } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const localDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const AREAS: Record<SurvivalArea, { label: string; icon: typeof Brain }> = {
  mind: { label: "Mind stability", icon: Brain },
  body: { label: "Body readiness", icon: HeartPulse },
  work: { label: "Work & recovery", icon: BriefcaseBusiness },
  preparedness: { label: "Practical readiness", icon: ShieldCheck },
};

type Section = "today" | "journal" | "history" | "rules" | "prepare";

const NAV: Array<{ id: Section; label: string; icon: typeof Brain }> = [
  { id: "today", label: "Today", icon: Activity },
  { id: "journal", label: "Check-in", icon: CircleUserRound },
  { id: "history", label: "History", icon: History },
  { id: "rules", label: "Rules", icon: Brain },
  { id: "prepare", label: "Prepare", icon: ShieldCheck },
];

export function SurvivalMode() {
  useAppSettingsEffects();
  const [section, setSection] = useState<Section>("today");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#survival-main" className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-primary-foreground">
        Skip to daily protocol
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open Survival Mode menu">
            <Menu />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="truncate font-display text-sm font-semibold">Survival Mode</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app"><ArrowLeft /> Workspace</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-3.5rem)] border-r border-border p-3 md:block">
          <SurvivalNav section={section} onSelect={setSection} />
          <p className="mt-6 px-3 text-xs leading-relaxed text-muted-foreground">
            No goals, ranks, or AI. Just today’s basics, recorded without judgment.
          </p>
        </aside>
        <main id="survival-main" className="min-w-0 px-4 py-6 sm:px-6 md:py-10 lg:px-10">
          {section === "today" && <TodayProtocol onOpenCheckIn={() => setSection("journal")} />}
          {section === "journal" && <DailyJournal />}
          {section === "history" && <SurvivalHistory />}
          {section === "rules" && <RuleManager />}
          {section === "prepare" && <Preparedness />}
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-foreground/30" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-background p-3 shadow-xl">
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-display font-semibold">Survival Mode</span>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></Button>
            </div>
            <SurvivalNav section={section} onSelect={(next) => { setSection(next); setMenuOpen(false); }} />
          </aside>
        </div>
      )}
    </div>
  );
}

function SurvivalNav({ section, onSelect }: { section: Section; onSelect: (section: Section) => void }) {
  return (
    <nav aria-label="Survival Mode">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Button variant={section === item.id ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => onSelect(item.id)}>
                <Icon /> {item.label}
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-7 max-w-2xl">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function TodayProtocol({ onOpenCheckIn }: { onOpenCheckIn: () => void }) {
  const { survival, toggleSurvivalRule, updateSurvivalDay } = useAppData();
  const date = localDate();
  const day = survival.days.find((entry) => entry.date === date) ?? emptySurvivalDay(date);
  const rules = survival.rules.filter((rule) => rule.enabled).sort((a, b) => a.order - b.order);
  const completed = new Set(day.completedRuleIds);
  const next = rules.find((rule) => !completed.has(rule.id));
  const percent = rules.length ? Math.round((completed.size / rules.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageIntro eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} title={day.reducedDay ? "Keep today gentle" : "Do the next useful thing"} description={day.reducedDay ? "A reduced day protects recovery. Basic care is enough." : "A grounded daily protocol for your mind, body, work, and practical readiness."} />

      <Card className="border-foreground/20">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardDescription>Next action</CardDescription>
              <CardTitle className="mt-1 text-xl">{next?.title ?? "Protocol complete"}</CardTitle>
            </div>
            <span className="text-sm font-medium tabular-nums">{completed.size}/{rules.length}</span>
          </div>
          <Progress value={percent} aria-label={`${percent}% of today's protocol complete`} />
        </CardHeader>
        <CardContent>
          {next ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{next.guidance}</p>
                <p className="mt-2 text-xs font-medium text-foreground">{targetLabel(next)}</p>
              </div>
              <Button onClick={() => toggleSurvivalRule(next.id, date)}><Check /> Mark done</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You covered today’s enabled rules. Rest is part of readiness.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <p className="text-sm font-medium">Reduced day</p>
          <p className="text-xs text-muted-foreground">Use for illness, injury, severe fatigue, or overload.</p>
        </div>
        <Switch checked={day.reducedDay} onCheckedChange={(checked) => updateSurvivalDay(date, { reducedDay: checked })} aria-label="Use reduced day" />
      </div>

      <section className="mt-8" aria-labelledby="protocol-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="protocol-heading" className="font-display text-lg font-semibold">Today’s protocol</h2>
          <Button variant="ghost" size="sm" onClick={onOpenCheckIn}>Daily check-in <ChevronRight /></Button>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {rules.map((rule) => {
            const done = completed.has(rule.id);
            const Icon = AREAS[rule.area].icon;
            return (
              <label key={rule.id} className="flex cursor-pointer items-start gap-3 py-4">
                <Checkbox className="mt-0.5 h-5 w-5" checked={done} onCheckedChange={() => toggleSurvivalRule(rule.id, date)} aria-label={`${done ? "Undo" : "Complete"} ${rule.title}`} />
                <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm font-medium", done && "text-muted-foreground line-through")}>{rule.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{rule.guidance}</span>
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">{targetLabel(rule)}</span>
              </label>
            );
          })}
        </div>
      </section>

      <SafetyNote day={day} />
    </div>
  );
}

function targetLabel(rule: SurvivalRule) {
  if (rule.targetType === "check") return "Once today";
  if (rule.targetMin != null && rule.targetMax != null) return `${rule.targetMin}–${rule.targetMax} ${rule.targetType}`;
  if (rule.targetMin != null) return `${rule.targetMin}+ ${rule.targetType}`;
  return "As appropriate";
}

function Metric({ label, value, suffix, min = 0, max = 24, step = 1, onChange }: { label: string; value?: number; suffix?: string; min?: number; max?: number; step?: number; onChange: (value: number | undefined) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input type="number" min={min} max={max} step={step} value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} />
        {suffix && <span className="pointer-events-none absolute right-3 top-3 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Rating({ label, value, low, high, onChange }: { label: string; value?: number; low: string; high: string; onChange: (value: number) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <Button key={score} type="button" variant={value === score ? "default" : "outline"} size="sm" onClick={() => onChange(score)} aria-label={`${label}: ${score} out of 5`}>{score}</Button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{low}</span><span>{high}</span></div>
    </fieldset>
  );
}

function DailyJournal() {
  const { survival, updateSurvivalDay } = useAppData();
  const [date, setDate] = useState(localDate());
  const day = survival.days.find((entry) => entry.date === date) ?? emptySurvivalDay(date);
  const update = (patch: Parameters<typeof updateSurvivalDay>[1]) => updateSurvivalDay(date, patch);

  return (
    <div className="mx-auto max-w-3xl">
      <PageIntro eyebrow="Detailed journal" title="Notice what your system needs" description="This is observation, not a score. Entries save as you make them." />
      <div className="mb-6 max-w-xs"><Label htmlFor="journal-date">Day</Label><Input id="journal-date" className="mt-2" type="date" max={localDate()} value={date} onChange={(event) => setDate(event.target.value)} /></div>

      <Card>
        <CardHeader><CardTitle>Condition</CardTitle><CardDescription>Use rough estimates. You do not need perfect measurements.</CardDescription></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <Metric label="Sleep" suffix="hours" min={0} max={24} step={0.25} value={day.sleepHours} onChange={(sleepHours) => update({ sleepHours })} />
          <Rating label="Sleep quality" low="Poor" high="Restful" value={day.sleepQuality} onChange={(sleepQuality) => update({ sleepQuality })} />
          <Rating label="Mood" low="Very low" high="Good" value={day.mood} onChange={(mood) => update({ mood })} />
          <Rating label="Energy" low="Empty" high="Strong" value={day.energy} onChange={(energy) => update({ energy })} />
          <Rating label="Stress" low="Calm" high="Overloaded" value={day.stress} onChange={(stress) => update({ stress })} />
          <Rating label="Pain or limitation" low="None" high="Severe" value={day.pain} onChange={(pain) => update({ pain })} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>What happened today</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Metric label="Outdoors" suffix="minutes" max={1440} value={day.outdoorsMinutes} onChange={(outdoorsMinutes) => update({ outdoorsMinutes })} />
          <Metric label="Movement or training" suffix="minutes" max={1440} value={day.movementMinutes} onChange={(movementMinutes) => update({ movementMinutes })} />
          <Metric label="Meditation or grounding" suffix="minutes" max={1440} value={day.meditationMinutes} onChange={(meditationMinutes) => update({ meditationMinutes })} />
          <Metric label="Focused work" suffix="hours" max={24} step={0.25} value={day.focusedWorkHours} onChange={(focusedWorkHours) => update({ focusedWorkHours })} />
          <Metric label="Real breaks" max={100} value={day.breakCount} onChange={(breakCount) => update({ breakCount })} />
          <div className="space-y-3 sm:pt-1">
            <CheckField label="Hydrated regularly" checked={day.hydration} onChange={(hydration) => update({ hydration })} />
            <CheckField label="Ate nourishing food" checked={day.nourishingFood} onChange={(nourishingFood) => update({ nourishingFood })} />
            <CheckField label="Had social contact" checked={day.socialContact} onChange={(socialContact) => update({ socialContact })} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Reflection</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div><Label htmlFor="reflection">What helped or drained you?</Label><Textarea id="reflection" className="mt-2" value={day.reflection} onChange={(event) => update({ reflection: event.target.value })} /></div>
          <div><Label htmlFor="recovery">What recovery do you need next?</Label><Textarea id="recovery" className="mt-2" value={day.recoveryNeeds} onChange={(event) => update({ recoveryNeeds: event.target.value })} /></div>
        </CardContent>
      </Card>
      <SafetyNote day={day} />
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={checked ?? false} onCheckedChange={(value) => onChange(value === true)} />{label}</label>;
}

function SafetyNote({ day }: { day: ReturnType<typeof emptySurvivalDay> }) {
  const needsCare = (day.mood != null && day.mood <= 1) || (day.stress != null && day.stress >= 5) || (day.pain != null && day.pain >= 4);
  return (
    <div className={cn("mt-6 border-l-2 pl-4 text-sm leading-relaxed text-muted-foreground", needsCare && "border-destructive text-foreground")}>
      {needsCare ? "Today’s check-in suggests reducing demands. Stop strenuous activity for concerning symptoms, and contact a trusted person or qualified health professional. If you may be in immediate danger, use your local emergency service." : "General guidance only. Adapt this protocol for your health, ability, responsibilities, and professional advice."}
    </div>
  );
}

function SurvivalHistory() {
  const { survival } = useAppData();
  const recent = [...survival.days].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const activeRules = survival.rules.filter((rule) => rule.enabled).length;
  const seven = recent.slice(0, 7);
  const average = (key: "sleepHours" | "movementMinutes" | "meditationMinutes" | "focusedWorkHours") => {
    const values = seven.map((day) => day[key]).filter((value): value is number => typeof value === "number");
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };
  return (
    <div className="mx-auto max-w-4xl">
      <PageIntro eyebrow="Recent pattern" title="History without judgment" description="Look for balance and recovery—not a perfect streak." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryStat label="Avg. sleep" value={`${average("sleepHours").toFixed(1)}h`} />
        <SummaryStat label="Avg. movement" value={`${Math.round(average("movementMinutes"))}m`} />
        <SummaryStat label="Avg. stillness" value={`${Math.round(average("meditationMinutes"))}m`} />
        <SummaryStat label="Avg. focus" value={`${average("focusedWorkHours").toFixed(1)}h`} />
      </div>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {recent.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Your daily check-ins will appear here.</p>}
        {recent.map((day) => (
          <div key={day.date} className="grid gap-3 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
            <div><p className="text-sm font-medium">{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p><p className="text-xs text-muted-foreground">{day.reducedDay ? "Reduced day" : "Standard day"}</p></div>
            <Progress value={activeRules ? (day.completedRuleIds.length / activeRules) * 100 : 0} />
            <p className="text-xs tabular-nums text-muted-foreground">{day.completedRuleIds.length}/{activeRules} rules</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return <div className="border-t-2 border-foreground p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p></div>;
}

function RuleManager() {
  const { survival, updateSurvivalRule, deleteSurvivalRule, addSurvivalRule, resetSurvivalRules, updateSurvivalPreferences } = useAppData();
  const [editing, setEditing] = useState<SurvivalRule | "new" | null>(null);
  const sorted = [...survival.rules].sort((a, b) => a.order - b.order);
  return (
    <div className="mx-auto max-w-4xl">
      <PageIntro eyebrow="Your protocol" title="Rules that protect capacity" description="Defaults are general guidance. Adjust them to your body, responsibilities, and professional advice." />
      <Card>
        <CardHeader><CardTitle>Daily ranges</CardTitle><CardDescription>These are planning boundaries, not medical prescriptions.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <RangeInputs label="Sleep window" unit="hours" min={survival.preferences.sleepHoursMin} max={survival.preferences.sleepHoursMax} onMin={(sleepHoursMin) => updateSurvivalPreferences({ sleepHoursMin })} onMax={(sleepHoursMax) => updateSurvivalPreferences({ sleepHoursMax })} />
          <RangeInputs label="Focused work window" unit="hours" min={survival.preferences.workHoursMin} max={survival.preferences.workHoursMax} onMin={(workHoursMin) => updateSurvivalPreferences({ workHoursMin })} onMax={(workHoursMax) => updateSurvivalPreferences({ workHoursMax })} />
        </CardContent>
      </Card>
      <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Daily rules</h2>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={resetSurvivalRules}><RotateCcw /> Defaults</Button><Button size="sm" onClick={() => setEditing("new")}><Plus /> Add rule</Button></div>
      </div>
      <div className="divide-y divide-border border-y border-border">
        {sorted.map((rule) => {
          const Icon = AREAS[rule.area].icon;
          return (
            <div key={rule.id} className="flex items-start gap-3 py-4">
              <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{rule.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{AREAS[rule.area].label} · {targetLabel(rule)}</p></div>
              <Switch checked={rule.enabled} onCheckedChange={(enabled) => updateSurvivalRule(rule.id, { enabled })} aria-label={`${rule.enabled ? "Pause" : "Enable"} ${rule.title}`} />
              <Button variant="ghost" size="icon" onClick={() => setEditing(rule)} aria-label={`Edit ${rule.title}`}><Pencil /></Button>
              {!rule.isDefault && <Button variant="ghost" size="icon" onClick={() => deleteSurvivalRule(rule.id)} aria-label={`Delete ${rule.title}`}><Trash2 /></Button>}
            </div>
          );
        })}
      </div>
      <RuleDialog rule={editing} onClose={() => setEditing(null)} onCreate={addSurvivalRule} onUpdate={updateSurvivalRule} />
    </div>
  );
}

function RangeInputs({ label, unit, min, max, onMin, onMax }: { label: string; unit: string; min: number; max: number; onMin: (value: number) => void; onMax: (value: number) => void }) {
  return <fieldset><legend className="text-sm font-medium">{label}</legend><div className="mt-2 grid grid-cols-2 gap-2"><Metric label="Minimum" suffix={unit} value={min} max={24} step={0.5} onChange={(value) => onMin(value ?? min)} /><Metric label="Maximum" suffix={unit} value={max} max={24} step={0.5} onChange={(value) => onMax(value ?? max)} /></div></fieldset>;
}

function RuleDialog({ rule, onClose, onCreate, onUpdate }: { rule: SurvivalRule | "new" | null; onClose: () => void; onCreate: (rule: Omit<SurvivalRule, "id" | "order" | "isDefault">) => void; onUpdate: (id: string, patch: Partial<SurvivalRule>) => void }) {
  const current = rule === "new" ? undefined : rule ?? undefined;
  const [title, setTitle] = useState("");
  const [guidance, setGuidance] = useState("");
  const [area, setArea] = useState<SurvivalArea>("mind");
  const [targetType, setTargetType] = useState<SurvivalRule["targetType"]>("check");
  const key = current?.id ?? String(rule);
  const effectiveTitle = title || current?.title || "";
  const effectiveGuidance = guidance || current?.guidance || "";
  const effectiveArea = current && !title && !guidance ? current.area : area;
  const effectiveTarget = current && !title && !guidance ? current.targetType : targetType;
  const save = () => {
    if (!effectiveTitle.trim()) return;
    const patch = { title: effectiveTitle.trim(), guidance: effectiveGuidance.trim(), area: effectiveArea, targetType: effectiveTarget, enabled: current?.enabled ?? true };
    if (current) onUpdate(current.id, patch); else onCreate(patch);
    setTitle(""); setGuidance(""); setArea("mind"); setTargetType("check"); onClose();
  };
  return (
    <Dialog key={key} open={rule !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{current ? "Edit rule" : "Add a daily rule"}</DialogTitle><DialogDescription>Keep it clear, achievable, and safe on difficult days.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label htmlFor="rule-title">Rule</Label><Input id="rule-title" className="mt-2" defaultValue={current?.title} onChange={(event) => setTitle(event.target.value)} placeholder="Take a screen-free walk" /></div>
          <div><Label htmlFor="rule-guidance">Guidance</Label><Textarea id="rule-guidance" className="mt-2" defaultValue={current?.guidance} onChange={(event) => setGuidance(event.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label>Area</Label><Select defaultValue={current?.area ?? "mind"} onValueChange={(value) => setArea(value as SurvivalArea)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(AREAS).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Target</Label><Select defaultValue={current?.targetType ?? "check"} onValueChange={(value) => setTargetType(value as SurvivalRule["targetType"])}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="check">Complete once</SelectItem><SelectItem value="minutes">Minutes</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="servings">Servings</SelectItem></SelectContent></Select></div></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save rule</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Preparedness() {
  const { survival, updatePreparednessItem } = useAppData();
  const ready = survival.preparedness.filter((item) => item.status === "ready").length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageIntro eyebrow="Practical readiness" title="Prepare calmly, one item at a time" description="Build ordinary household resilience. No fear-based predictions, weapons, or combat guidance." />
      <div className="mb-6"><div className="mb-2 flex justify-between text-sm"><span>{ready} ready</span><span>{survival.preparedness.length} total</span></div><Progress value={survival.preparedness.length ? (ready / survival.preparedness.length) * 100 : 0} /></div>
      <div className="divide-y divide-border border-y border-border">
        {survival.preparedness.map((item) => (
          <div key={item.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_10rem] sm:items-center">
            <div><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{item.category.replace("_", " ")}</p></div>
            <Select value={item.status} onValueChange={(status) => updatePreparednessItem(item.id, { status: status as typeof item.status })}><SelectTrigger aria-label={`Status for ${item.title}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_started">Not started</SelectItem><SelectItem value="ready">Ready</SelectItem><SelectItem value="review">Review needed</SelectItem></SelectContent></Select>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">For first-aid skills, use recognized local training. Follow local authorities during an actual emergency.</p>
    </div>
  );
}