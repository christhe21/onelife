import { useMemo } from "react";
import { Check, Crown, MapPin } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { RANK_TIERS, RANK_DESCRIPTIONS, getRankIndex } from "@/lib/rank";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Display-only horizontal strip of every rank tier and where the user sits. */
export function RankLadder({ className }: { className?: string }) {
  const { totalPoints } = useAppData();
  const points = totalPoints ?? 0;
  const currentIndex = useMemo(() => getRankIndex(points), [points]);

  return (
    <ul
      className={cn(
        "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]",
        className,
      )}
    >
      {RANK_TIERS.map((tier, i) => {
        const isCurrent = i === currentIndex;
        const achieved = i < currentIndex;
        const isTop = i === RANK_TIERS.length - 1;
        return (
          <li
            key={tier.name}
            data-current-rank={isCurrent ? "true" : undefined}
            className={cn(
              "flex w-[15rem] shrink-0 snap-center flex-col gap-2 rounded-xl border p-3",
              isCurrent ? "border-primary bg-primary/5" : "border-border",
              achieved && "opacity-70",
            )}
          >
            <div className="flex items-center gap-2">
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
              <span
                className={cn("truncate font-display font-semibold", isCurrent && "text-primary")}
              >
                {tier.name}
              </span>
              {isTop && <Crown className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Top rank" />}
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {fmt(tier.min)} pts
              </span>
            </div>

            <p className="text-xs leading-snug text-muted-foreground">
              {RANK_DESCRIPTIONS[tier.name]}
            </p>

            {isCurrent ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <MapPin className="h-3 w-3" /> You are here · {fmt(points)} pts
              </span>
            ) : achieved ? (
              <span className="text-[11px] text-muted-foreground">Achieved</span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {fmt(Math.max(0, tier.min - points))} pts to go
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
