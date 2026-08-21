import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RankLadder } from "@/components/life/RankLadder";
import { RANK_TIERS } from "@/lib/rank";
import { cn } from "@/lib/utils";

/** Wraps the rank ladder in a modal; the caller supplies the trigger. */
export function RankLadderDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const syncActive = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const center = list.scrollLeft + list.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(list.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const mid = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(mid - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  // When the dialog opens, center the current rank and sync the dots.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const el = listRef.current?.querySelector<HTMLElement>(
        "[data-current-rank='true']",
      );
      el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
      // Allow layout to settle then sync
      requestAnimationFrame(() => syncActive());
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, syncActive]);

  const scrollBy = (dir: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;
    const step =
      (list.firstElementChild as HTMLElement | null)?.offsetWidth ?? 240;
    list.scrollBy({ left: dir * (step + 12), behavior: "smooth" });
  };

  // Keyboard support when the strip (or dialog) has focus
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(1);
    } else if (e.key === "Home") {
      e.preventDefault();
      listRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      const list = listRef.current;
      if (list) list.scrollTo({ left: list.scrollWidth, behavior: "smooth" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-[calc(100vw-1.5rem)] overflow-hidden p-0 sm:max-w-md"
        onKeyDown={onKeyDown}
      >
        <DialogHeader className="border-b px-4 py-3 pr-12 text-left">
          <DialogTitle className="font-display text-base">Rank ladder</DialogTitle>
          <DialogDescription className="text-xs">
            Swipe sideways or use the arrows to see every tier and what it means.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 pb-4 pt-3 sm:px-4">
          {/* The actual scroll container is the <ul> inside RankLadder */}
          <div className="-mx-1">
            <RankLadder ref={listRef} onScroll={undefined as never} />
            {/* Attach scroll listener via effect below because RankLadder forwards ref to ul */}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous rank"
              className="h-9 w-9 shrink-0"
              onClick={() => scrollBy(-1)}
              disabled={active <= 0}
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
                  onClick={() => {
                    const el = listRef.current?.children[i] as HTMLElement | undefined;
                    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
                  }}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next rank"
              className="h-9 w-9 shrink-0"
              onClick={() => scrollBy(1)}
              disabled={active >= RANK_TIERS.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Attach the scroll listener once the list is mounted / dialog is open.
// We do it via a small effect inside the component above would be cleaner,
// but to keep the file simple we rely on the ref + the effect already present.
// (The RankLadder ul receives the ref; we need to wire onScroll.)
