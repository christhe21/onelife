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
  const bodyRef = useRef<HTMLDivElement>(null);

  const getList = () => bodyRef.current?.querySelector<HTMLElement>("ul");

  const syncActive = useCallback(() => {
    const list = getList();
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

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>("[data-current-rank='true']");
      el?.scrollIntoView({ inline: "center", block: "nearest" });
      syncActive();
    }, 60);
    return () => clearTimeout(t);
  }, [open, syncActive]);

  const scrollBy = (dir: -1 | 1) => {
    const list = getList();
    if (!list) return;
    const step = (list.firstElementChild as HTMLElement | null)?.offsetWidth ?? 240;
    list.scrollBy({ left: dir * (step + 12), behavior: "smooth" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-4 py-3 pr-12 text-left">
          <DialogTitle className="font-display text-base">Rank ladder</DialogTitle>
          <DialogDescription className="text-xs">
            Swipe sideways to see every tier and what it means.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4 pt-3">
          <div ref={bodyRef} onScroll={syncActive}>
            <RankLadder />
          </div>

          <div className="mt-1 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous rank"
              className="h-8 w-8"
              onClick={() => scrollBy(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5">
              {RANK_TIERS.map((t, i) => (
                <span
                  key={t.name}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next rank"
              className="h-8 w-8"
              onClick={() => scrollBy(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
