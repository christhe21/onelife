import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAppData } from "@/lib/app-data";

const LIFE_SPAN = 80;

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
            Enter your birth year to see all your goals plotted across your life — an 80-year horizontal canvas.
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
  const endYear = birth + LIFE_SPAN;
  const startMs = new Date(birth, 0, 1).getTime();
  const endMs = new Date(endYear, 11, 31).getTime();
  const span = endMs - startMs;
  const now = Date.now();
  const nowPct = Math.max(0, Math.min(100, ((now - startMs) / span) * 100));

  // Decade ticks
  const ticks: { year: number; pct: number }[] = [];
  for (let y = birth; y <= endYear; y += 5) {
    ticks.push({ year: y, pct: ((new Date(y, 0, 1).getTime() - startMs) / span) * 100 });
  }

  // Lay out goals into lanes (greedy by start date)
  const sorted = [...goals]
    .filter((g) => g.startDate && g.targetDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const lanes: { end: number }[] = [];
  const placed = sorted.map((g) => {
    const s = new Date(g.startDate).getTime();
    const e = new Date(g.targetDate).getTime();
    let lane = lanes.findIndex((l) => l.end <= s);
    if (lane === -1) {
      lanes.push({ end: e });
      lane = lanes.length - 1;
    } else {
      lanes[lane] = { end: e };
    }
    const leftPct = ((s - startMs) / span) * 100;
    const widthPct = Math.max(0.4, ((e - s) / span) * 100);
    return { g, lane, leftPct, widthPct };
  });
  const laneCount = Math.max(1, lanes.length);
  const ROW_H = 22;

  const skillColor = (id: string) => skills.find((s) => s.id === id)?.color ?? "#94a3b8";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-display text-base">
          Life canvas — {birth} → {endYear}
        </CardTitle>
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
        <div className="overflow-x-auto">
          <div className="relative min-w-[720px]" style={{ height: laneCount * ROW_H + 56 }}>
            {/* year ticks */}
            <div className="absolute inset-x-0 top-0 h-6">
              {ticks.map((t) => (
                <div key={t.year} className="absolute -translate-x-1/2 text-[10px] text-muted-foreground" style={{ left: `${t.pct}%` }}>
                  {t.year}
                </div>
              ))}
            </div>
            {/* baseline track */}
            <div className="absolute inset-x-0 top-7 h-px bg-border" />
            {/* lanes background */}
            <div className="absolute inset-x-0" style={{ top: 30, height: laneCount * ROW_H }}>
              {Array.from({ length: laneCount }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-border/30"
                  style={{ top: i * ROW_H, height: ROW_H }}
                />
              ))}
            </div>
            {/* goal bars */}
            {placed.map(({ g, lane, leftPct, widthPct }) => (
              <div
                key={g.id}
                className="group absolute flex items-center overflow-hidden rounded-md px-2 text-[10px] font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:z-20"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  top: 30 + lane * ROW_H + 2,
                  height: ROW_H - 4,
                  backgroundColor: skillColor(g.skill),
                  minWidth: 6,
                }}
                title={`${g.title}\n${g.startDate} → ${g.targetDate}`}
              >
                <span className="truncate">{g.title}</span>
              </div>
            ))}
            {/* today marker */}
            <div
              className="absolute z-10 w-0.5 bg-foreground"
              style={{ left: `${nowPct}%`, top: 24, height: laneCount * ROW_H + 12 }}
            />
            <div
              className="absolute -translate-x-1/2 rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-semibold text-background"
              style={{ left: `${nowPct}%`, top: laneCount * ROW_H + 38 }}
            >
              today
            </div>
          </div>
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
