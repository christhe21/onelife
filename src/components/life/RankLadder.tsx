import { useMemo } from "react";
import { Check, Crown, MapPin } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { RANK_TIERS, RANK_DESCRIPTIONS, getRankIndex } from "@/lib/rank";
import { cn } from "@/lib/utils";
import { RankIcon } from "@/components/life/RankIcon";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Display-only horizontal strip of rank tiers.
 * Prefer RankLadderDialog (Embla carousel) for interactive browsing inside modals —
 * native overflow scrolling is unreliable on mobile inside Radix Dialog.
 * This component is kept for any non-modal / static use.
 */
export function RankLadder({ className }: { className?: string }) {
  const { totalPoints } = useAppData();
  const points = totalPoints ?? 0;
  const currentIndex = useMemo(() => getRankIndex(points), [points]);

  return (
    <ul
      role="list"
      aria-label="Rank ladder"
      className={cn(
        "flex gap-3 overflow-x-auto overscroll-x-contain touch-pan-x",
        "[-webkit-overflow-scrolling:touch] [scrollbar-width:none]",
        "[-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "snap-x snap-mandatory pb-1",
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
            role="listitem"
            data-current-rank={isCurrent ? "true" : undefined}
            className={cn(
              "flex w-[min(15rem,calc(100vw-3.5rem))] shrink-0 snap-center flex-col gap-2 rounded-xl border p-3 sm:w-60",
              isCurrent ? "border-primary bg-primary/5 shadow-sm" : "border-border",
              achieved && "opacity-70",
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  isCurrent ? "bg-primary/10" : "bg-muted/60",
                )}
              >
                <RankIcon rank={tier.name} className="h-9 w-9" />
              </div>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {achieved ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "truncate font-display font-semibold",
                  isCurrent && "text-primary",
                )}
              >
                {tier.name}
              </span>
              {isTop && (
                <Crown
                  className="h-3.5 w-3.5 shrink-0 text-primary"
                  aria-label="Top rank"
                />
              )}
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {fmt(tier.min)} pts
              </span>
            </div>

            <p className="text-xs leading-snug text-muted-foreground">
              {RANK_DESCRIPTIONS[tier.name]}
            </p>

            {isCurrent ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <MapPin className="h-3 w-3" aria-hidden />
                You are here · {fmt(points)} pts
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
