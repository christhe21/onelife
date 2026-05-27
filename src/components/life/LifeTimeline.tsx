import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";

const LIFE_SPAN = 80;
const DECADES = 8; // 0-9, 10-19, ..., 70-79

export function LifeTimeline() {
  const { goals, skills, settings, setBirthYear } = useAppData();
  const [draft, setDraft] = useState<string>(settings.birthYear ? String(settings.birthYear) : "");

  if (!settings.birthYear) {
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

  const birth = settings.birthYear;
  const now = new Date();
  const currentAge = now.getFullYear() - birth;
  const skillColor = (id: string) => skills.find((s) => s.id === id)?.color ?? "#94a3b8";

  // Bucket goals into decades by their start year
  const goalsByDecade: Record<number, typeof goals> = {};
  for (let d = 0; d < DECADES; d++) goalsByDecade[d] = [];
  for (const g of goals) {
    if (!g.startDate) continue;
    const start = new Date(g.startDate);
    const age = start.getFullYear() - birth;
    const decade = Math.floor(age / 10);
    if (decade >= 0 && decade < DECADES) goalsByDecade[decade].push(g);
  }

  const currentDecade = Math.floor(currentAge / 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="font-display text-base">Life canvas</CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Born {birth} · Age {currentAge} · {LIFE_SPAN} years across {DECADES} decades
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const v = prompt("Birth year", String(birth));
            const y = v ? parseInt(v, 10) : NaN;
            if (y > 1900 && y < 2100) setBirthYear(y);
          }}
        >
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {Array.from({ length: DECADES }).map((_, d) => {
            const ageStart = d * 10;
            const ageEnd = ageStart + 9;
            const yearStart = birth + ageStart;
            const yearEnd = birth + ageEnd;
            const isPast = d < currentDecade;
            const isCurrent = d === currentDecade;
            const decadeGoals = goalsByDecade[d];

            return (
              <div
                key={d}
                className={`relative rounded-lg border p-3 transition-opacity ${
                  isPast ? "bg-muted/30 opacity-70" : isCurrent ? "border-primary/50 bg-primary/5" : "bg-card"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-lg font-semibold tabular-nums">
                      {ageStart}s
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {yearStart}–{yearEnd}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      You are here · {currentAge}
                    </span>
                  )}
                </div>

                {/* 10 year cells */}
                <div className="relative grid grid-cols-10 gap-px overflow-hidden rounded bg-border/50">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const cellAge = ageStart + i;
                    const cellIsNow = cellAge === currentAge;
                    return (
                      <div
                        key={i}
                        className={`h-7 ${cellIsNow ? "bg-primary/20" : "bg-background"}`}
                        title={`Age ${cellAge} · ${birth + cellAge}`}
                      />
                    );
                  })}
                  {/* today marker line inside current decade */}
                  {isCurrent && (
                    <div
                      className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-primary"
                      style={{
                        left: `${((currentAge - ageStart + (now.getMonth() / 12)) / 10) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Goal pills */}
                <div className="mt-2 min-h-[20px] space-y-1">
                  {decadeGoals.length === 0 ? (
                    <p className="text-[10px] italic text-muted-foreground">No goals planned.</p>
                  ) : (
                    decadeGoals.map((g) => {
                      const startAge = new Date(g.startDate).getFullYear() - birth;
                      const endAge = g.targetDate ? new Date(g.targetDate).getFullYear() - birth : startAge;
                      const leftPct = Math.max(0, ((startAge - ageStart) / 10) * 100);
                      const widthPct = Math.max(8, Math.min(100 - leftPct, ((endAge - startAge + 1) / 10) * 100));
                      return (
                        <div key={g.id} className="relative h-5">
                          <div
                            className="absolute top-0 flex h-5 items-center overflow-hidden rounded px-1.5 text-[10px] font-medium text-white shadow-sm"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: skillColor(g.skill),
                            }}
                            title={`${g.title}\n${g.startDate} → ${g.targetDate}`}
                          >
                            <span className="truncate">{g.title}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
