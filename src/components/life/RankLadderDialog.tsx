import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
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
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader className="flex-row items-start justify-between gap-2 space-y-0 border-b px-4 py-3 text-left">
          <div className="min-w-0">
            <DialogTitle className="font-display text-base">Rank ladder</DialogTitle>
            <DialogDescription className="text-xs">
              Every tier and the points needed to reach it.
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        <div ref={bodyRef} className="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4 pb-4">
          <RankLadder />
        </div>
      </DialogContent>
    </Dialog>
  );
}
