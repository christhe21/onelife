import { useMemo } from "react";
import { Check, Crown, MapPin } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { RANK_TIERS, getRankIndex } from "@/lib/rank";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Display-only overview of every rank tier and where the user currently sits. */
export function RankLadder({ className }: { className?: string }) {
  const { totalPoints } = useAppData();
  const points = totalPoints ?? 0;
  const currentIndex = useMemo(() => getRankIndex(points), [points]);

  return (
    <ul className={cn("space-y-1.5", className)}>
      {RANK_TIERS.map((tier, i) => {
        const isCurrent = i === currentIndex;
        const achieved = i < currentIndex;
        const isTop = i === RANK_TIERS.length - 1;
        return (
          <li
            key={tier.name}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
              isCurrent ? "border-primary bg-primary/5" : "border-border",
              achieved && "opacity-70",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {achieved ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("truncate font-medium", isCurrent && "text-primary")}>
                  {tier.name}
                </span>
                {isTop && <Crown className="h-3.5 w-3.5 text-primary" aria-label="Top rank" />}
                {isTop && <span className="text-[10px] uppercase text-muted-foreground">Top rank</span>}
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <MapPin className="h-3 w-3" /> You are here
                  </span>
                )}
              </div>
              {isCurrent ? (
                <p className="text-xs text-muted-foreground">{fmt(points)} points</p>
              ) : !achieved ? (
                <p className="text-xs text-muted-foreground">
                  {fmt(Math.max(0, tier.min - points))} pts to go
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Achieved</p>
              )}
            </div>

            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {fmt(tier.min)} pts
            </span>
          </li>
        );
      })}
    </ul>
  );
}
