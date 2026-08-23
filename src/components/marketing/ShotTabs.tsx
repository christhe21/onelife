import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScreenshotFrame } from "./ScreenshotFrame";

export interface Shot {
  id: string;
  label: string;
  src: string;
  alt: string;
  caption?: string;
}

export function ShotTabs({ shots, className }: { shots: Shot[]; className?: string }) {
  const [active, setActive] = useState(shots[0]?.id);
  const current = shots.find((s) => s.id === active) ?? shots[0];
  if (!current) return null;

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Product screenshots"
        className="mx-auto flex w-full max-w-full snap-x gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1 sm:w-fit"
      >
        {shots.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={s.id === current.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition-colors",
              s.id === current.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <ScreenshotFrame
          key={current.id}
          src={current.src}
          alt={current.alt}
          caption={current.caption}
        />
      </div>
    </div>
  );
}
