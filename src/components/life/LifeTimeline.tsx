import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";
import { cn } from "@/lib/utils";

const LIFE_SPAN = 80;

export function LifeTimeline() {
  const { goals, skills, settings, setBirthYear } = useAppData();
  const [draft, setDraft] = useState<string>(settings.birthYear ? String(settings.birthYear) : "");

  const birth = settings.birthYear;
  const now = new Date();
  const currentAge = birth ? now.getFullYear() - birth : 0;
  const currentDecade = Math.floor(currentAge / 10);
  const [selectedDecade, setSelectedDecade] = useState<number>(currentDecade);

  const skillColor = (id: string) => skills.find((s) => s.id === id)?.color ?? "#94a3b8";
  

  // Bucket goals into decades by start year
  const { goalsByDecade, dots } = useMemo(() => {
    const by: Record<number, typeof goals> = {};
    const ds: { age: number; color: string; title: string }[] = [];
    for (let d = 0; d < 8; d++) by[d] = [];
    if (!birth) return { goalsByDecade: by, dots: ds };
    for (const g of goals) {
      if (!g.startDate) continue;
      const age = new Date(g.startDate).getFullYear() - birth;
      const decade = Math.floor(age / 10);
      if (decade >= 0 && decade < 8) by[decade].push(g);
      if (age >= 0 && age <= LIFE_SPAN) ds.push({ age, color: skillColor(g.skill), title: g.title });
    }
    return { goalsByDecade: by, dots: ds };
  }, [goals, birth, skills]);

  if (!birth) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Life canvas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your birth year to see your goals plotted across the decades of your life.
          </p>
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs">Birth year</Label>
              <Input
                type="number"
                placeholder="e.g. 1995"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-32"
              />
            </div>
            <Button
              onClick={() => {
                const y = parseInt(draft, 10);
                if (y > 1900 && y < 2100) setBirthYear(y);
              }}
            >
              Show timeline
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPct = Math.min(100, Math.max(0, (currentAge / LIFE_SPAN) * 100));
  const selected = goalsByDecade[selectedDecade] ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="font-display text-base">Life canvas</CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Born {birth} · Age {currentAge} · {Math.round(progressPct)}% of {LIFE_SPAN} years
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            const v = prompt("Birth year", String(birth));
            const y = v ? parseInt(v, 10) : NaN;
            if (y > 1900 && y < 2100) setBirthYear(y);
          }}
        >
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Life ribbon — one row */}
        <div className="px-1 pt-2">
          <div className="relative h-10">
            {/* track */}
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
            {/* lived portion */}
            <div
              className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/70"
              style={{ width: `${progressPct}%` }}
            />
            {/* decade ticks */}
            {Array.from({ length: 9 }).map((_, i) => {
              const left = (i / 8) * 100;
              const isCurrent = i === currentDecade;
              const isSelected = i === selectedDecade;
              const d = i < 8 ? i : null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => d !== null && setSelectedDecade(d)}
                  className="group absolute top-0 flex h-full -translate-x-1/2 flex-col items-center"
                  style={{ left: `${left}%` }}
                  aria-label={d !== null ? `Decade ${d * 10}s` : `Age ${LIFE_SPAN}`}
                >
                  <span
                    className={cn(
                      "h-3 w-0.5 rounded-full bg-border transition-colors",
                      isCurrent && "bg-primary",
                      isSelected && "bg-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-1 text-[10px] tabular-nums text-muted-foreground transition-colors",
                      (isCurrent || isSelected) && "font-semibold text-foreground",
                    )}
                  >
                    {i * 10}
                  </span>
                </button>
              );
            })}
            {/* goal dots */}
            {dots.map((d, i) => {
              const left = (d.age / LIFE_SPAN) * 100;
              const isOpen = openDot === i;
              return (
                <span
                  key={i}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%` }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDot((cur) => (cur === i ? null : i));
                    }}
                    className="block h-2.5 w-2.5 rounded-full ring-2 ring-background transition-transform hover:scale-125"
                    style={{ backgroundColor: d.color }}
                    aria-label={`${d.title} · age ${d.age}`}
                  />
                  {isOpen && (
                    <div className="pointer-events-none absolute left-1/2 z-30 mt-2 w-40 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                      <div className="font-medium leading-tight">{d.title}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">age {d.age}</div>
                    </div>
                  )}
                </span>
              );
            })}
            {/* you-are-here marker */}
            <div
              className="pointer-events-none absolute top-0 z-10 flex h-full -translate-x-1/2 flex-col items-center"
              style={{ left: `${progressPct}%` }}
            >
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                {currentAge}
              </span>
              <span className="mt-0.5 h-3 w-px bg-primary" />
            </div>
          </div>
        </div>

        {/* Selected decade detail */}
        <div className="rounded-lg border bg-card/60 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-semibold tabular-nums">
                {selectedDecade * 10}s
              </span>
              <span className="text-[11px] text-muted-foreground">
                {birth + selectedDecade * 10}–{birth + selectedDecade * 10 + 9}
              </span>
              {selectedDecade === currentDecade && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  You are here
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {selected.length} {selected.length === 1 ? "goal" : "goals"}
            </span>
          </div>

          {selected.length === 0 ? (
            <p className="py-2 text-center text-[11px] italic text-muted-foreground">
              No goals planned for this decade yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {selected.map((g) => {
                const startAge = new Date(g.startDate).getFullYear() - birth;
                const endAge = g.targetDate ? new Date(g.targetDate).getFullYear() - birth : startAge;
                return (
                  <li key={g.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: skillColor(g.skill) }}
                    />
                    <span className="truncate font-medium">{g.title}</span>
                    <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      age {startAge}{endAge !== startAge ? `–${endAge}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* compact legend */}
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
