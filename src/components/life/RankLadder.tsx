import { forwardRef, useMemo, type UIEventHandler } from "react";
import { Check, Crown, MapPin } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { RANK_TIERS, RANK_DESCRIPTIONS, getRankIndex } from "@/lib/rank";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

export interface RankLadderProps {
  className?: string;
  onScroll?: UIEventHandler<HTMLUListElement>;
}

/**
 * Display-only horizontal strip of every rank tier and where the user sits.
 * Designed for fluid sideways scrolling (Apple-style): snap points, touch-pan-x,
 * overscroll containment, responsive card width that fits phones → desktop.
 */
export const RankLadder = forwardRef<
  HTMLUListElement,
  RankLadderProps
>(function RankLadder({ className, onScroll }, ref) {
  const { totalPoints } = useAppData();
  const points = totalPoints ?? 0;
  const currentIndex = useMemo(() => getRankIndex(points), [points]);

  return (
    <ul
      ref={ref}
      role="list"
      aria-label="Rank ladder — swipe or use arrows to browse every tier"
      tabIndex={0}
      onScroll={onScroll}
      className={cn(
        // Horizontal strip that actually scrolls on touch + mouse
        "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain",
        "touch-pan-x [-webkit-overflow-scrolling:touch]",
        // Hide scrollbar for a clean Apple-like look (dots + arrows remain)
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "pb-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
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
            data-rank-index={i}
            className={cn(
              // Responsive width: ~1 card + peek of next on phones, fixed on larger
              "flex w-[min(15rem,calc(100vw-3.5rem))] shrink-0 snap-center flex-col gap-2 rounded-xl border p-3 sm:w-60",
              isCurrent ? "border-primary bg-primary/5 shadow-sm" : "border-border",
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
});
