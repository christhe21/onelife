import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { getRankProgress } from "@/lib/rank";
import { RankIcon } from "@/components/life/RankIcon";

const fmt = (n: number) => n.toLocaleString("en-US");

export function RankCard({ interactive = false }: { interactive?: boolean }) {
  const { totalPoints } = useAppData();
  const p = useMemo(() => getRankProgress(totalPoints ?? 0), [totalPoints]);

  return (
    <Card
      className={
        interactive
          ? "overflow-hidden transition-colors hover:border-primary/50 hover:bg-accent/40 active:bg-accent/60"
          : "overflow-hidden"
      }
    >
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RankIcon rank={p.rank} className="h-9 w-9" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-primary ring-1 ring-border">
              {p.index + 1}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current rank</p>
            <h2 className="truncate font-display text-lg font-semibold leading-tight">{p.rank}</h2>
            {interactive && (
              <p className="text-[11px] text-primary">Tap to view all ranks</p>
            )}
          </div>

          <div className="text-right">
            <p className="font-display text-lg font-semibold leading-tight">{fmt(totalPoints ?? 0)}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Progress value={p.percent} className="h-2" />
          {p.nextRank ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted-foreground">
              <span>
                {fmt(p.pointsToNext)} pts to <span className="text-foreground">{p.nextRank}</span>
              </span>
              <span>
                {fmt(totalPoints ?? 0)} / {fmt(p.nextMin ?? 0)}
              </span>
            </div>
          ) : (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary" /> Max rank reached
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
