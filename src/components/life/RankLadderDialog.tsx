import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Crown, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useAppData } from "@/lib/app-data";
import { RANK_TIERS, RANK_DESCRIPTIONS, getRankIndex } from "@/lib/rank";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Rank ladder modal — horizontal Embla carousel (reliable on mobile inside Dialog). */
export function RankLadderDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);
  const { totalPoints } = useAppData();
  const points = totalPoints ?? 0;
  const currentIndex = getRankIndex(points);

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return;
    setActive(carouselApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  // When dialog opens, jump to the user's current rank
  useEffect(() => {
    if (!open || !api) return;
    // Small delay so Embla has measured the slides
    const t = window.setTimeout(() => {
      api.scrollTo(currentIndex, true);
      setActive(currentIndex);
    }, 40);
    return () => window.clearTimeout(t);
  }, [open, api, currentIndex]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn(
          // Grow the modal from the center toward top + bottom
          // Mobile: use most of the dynamic viewport; desktop: cap so it stays balanced
          "max-h-[min(94dvh,36rem)] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0",
          "sm:max-h-[min(90vh,38rem)] sm:max-w-md",
        )}
      >
        <DialogHeader className="border-b px-4 py-4 pr-12 text-left sm:py-5">
          <DialogTitle className="font-display text-base sm:text-lg">
            Rank ladder
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Swipe sideways or use the arrows to see every tier and what it means.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col px-3 pb-5 pt-4 sm:px-4 sm:pb-6 sm:pt-5">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              containScroll: "trimSnaps",
              dragFree: false,
              skipSnaps: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {RANK_TIERS.map((tier, i) => {
                const isCurrent = i === currentIndex;
                const achieved = i < currentIndex;
                const isTop = i === RANK_TIERS.length - 1;

                return (
                  <CarouselItem
                    key={tier.name}
                    className="basis-[85%] pl-3 sm:basis-[78%]"
                  >
                    <div
                      className={cn(
                        // Taller cards so the extra modal height is used
                        "flex min-h-[10.5rem] flex-col gap-3 rounded-xl border p-4 sm:min-h-[12rem] sm:p-5",
                        isCurrent
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border",
                        achieved && "opacity-70",
                      )}
                      data-current-rank={isCurrent ? "true" : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                          aria-hidden
                        >
                          {achieved ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span
                          className={cn(
                            "truncate font-display text-base font-semibold",
                            isCurrent && "text-primary",
                          )}
                        >
                          {tier.name}
                        </span>
                        {isTop && (
                          <Crown
                            className="h-4 w-4 shrink-0 text-primary"
                            aria-label="Top rank"
                          />
                        )}
                        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                          {fmt(tier.min)} pts
                        </span>
                      </div>

                      <p className="text-sm leading-snug text-muted-foreground">
                        {RANK_DESCRIPTIONS[tier.name]}
                      </p>

                      {isCurrent ? (
                        <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          You are here · {fmt(points)} pts
                        </span>
                      ) : achieved ? (
                        <span className="mt-auto text-xs text-muted-foreground">
                          Achieved
                        </span>
                      ) : (
                        <span className="mt-auto text-xs text-muted-foreground">
                          {fmt(Math.max(0, tier.min - points))} pts to go
                        </span>
                      )}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between gap-2 sm:mt-5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous rank"
              className="h-9 w-9 shrink-0"
              onClick={() => api?.scrollPrev()}
              disabled={!api?.canScrollPrev()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div
              className="flex items-center justify-center gap-1.5"
              role="tablist"
              aria-label="Rank position"
            >
              {RANK_TIERS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Go to ${t.name}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    i === active
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                  onClick={() => api?.scrollTo(i)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next rank"
              className="h-9 w-9 shrink-0"
              onClick={() => api?.scrollNext()}
              disabled={!api?.canScrollNext()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
