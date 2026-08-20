import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RankLadder } from "@/components/life/RankLadder";

/** Wraps the rank ladder in a modal; the caller supplies the trigger. */
export function RankLadderDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>("[data-current-rank='true']");
      el?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-4 py-3 pr-12 text-left">
          <DialogTitle className="font-display text-base">Rank ladder</DialogTitle>
          <DialogDescription className="text-xs">
            Every tier and the points needed to reach it.
          </DialogDescription>
        </DialogHeader>
        <div ref={bodyRef} className="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4 pb-4">
          <RankLadder />
        </div>
      </DialogContent>
    </Dialog>
  );
}
