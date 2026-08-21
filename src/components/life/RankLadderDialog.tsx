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
          // Force a taller modal (min-height). Max only capped before — dialog stayed short.
          // Mobile: ~58–70% of screen; desktop: comfortable fixed band.
          "flex flex-col overflow-hidden p-0",
          "min-h-[min(70dvh,26rem)] max-h-[min(92dvh,40rem)]",
          "w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)]",
          "sm:min-h-[28rem] sm:max-h-[min(88vh,42rem)] sm:w-full sm:max-w-md",
        )}
      >
        <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:py-5">
          <DialogTitle className="font-display text-base sm:text-lg">
            Rank ladder
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Swipe sideways to move between ranks. Each card is one rank and its full description.
          </DialogDescription>
        </DialogHeader>

        {/* Body grows to fill the taller modal */}
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-5 pt-4 sm:px-4 sm:pb-6 sm:pt-5">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              containScroll: "trimSnaps",
              dragFree: false,
              skipSnaps: false,
            }}
            className="w-full flex-1"
          >
            <CarouselContent className="-ml-3 h-full">
              {RANK_TIERS.map((tier, i) => {
                const isCurrent = i === currentIndex;
                const achieved = i < currentIndex;
                const isTop = i === RANK_TIERS.length - 1;

                return (
                  <CarouselItem
                    key={tier.name}
                    className="basis-[88%] pl-3 sm:basis-[80%]"
                  >
                    <div
                      className={cn(
                        // One rank per card: title + full description visible, no inner scroll
                        "flex h-full min-h-[12rem] flex-col gap-3 rounded-xl border p-4 sm:min-h-[14rem] sm:gap-4 sm:p-5",
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
                            "truncate font-display text-base font-semibold sm:text-lg",
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

                      {/* Full description — no clamp, no inner scroll */}
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
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
          <div className="mt-4 flex shrink-0 items-center justify-between gap-2 sm:mt-5">
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
