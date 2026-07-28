import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface TimePickerProps {
  value?: string; // HH:MM (24h)
  onChange: (v: string) => void;
  minuteStep?: number;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseHM(v?: string): { h: number; m: number } {
  if (!v) return { h: 9, m: 0 };
  const [h, m] = v.split(":").map((x) => parseInt(x, 10));
  return {
    h: isFinite(h) ? Math.min(23, Math.max(0, h)) : 9,
    m: isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

function format12(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${period}`;
}

export function TimePicker({
  value,
  onChange,
  minuteStep = 5,
  className,
  disabled,
  placeholder = "Pick a time",
  id,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { h, m } = parseHM(value);
  const hoursRef = React.useRef<HTMLDivElement>(null);
  const minsRef = React.useRef<HTMLDivElement>(null);

  const minutes = React.useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 60; i += minuteStep) arr.push(i);
    return arr;
  }, [minuteStep]);

  React.useEffect(() => {
    if (!open) return;
    // Scroll selected into view after open
    requestAnimationFrame(() => {
      hoursRef.current?.querySelector<HTMLButtonElement>(`[data-h="${h}"]`)?.scrollIntoView({
        block: "center",
      });
      const nearestM = minutes.reduce(
        (p, c) => (Math.abs(c - m) < Math.abs(p - m) ? c : p),
        minutes[0],
      );
      minsRef.current?.querySelector<HTMLButtonElement>(`[data-m="${nearestM}"]`)?.scrollIntoView({
        block: "center",
      });
    });
  }, [open, h, m, minutes]);

  const set = (nh: number, nm: number) => {
    onChange(`${pad(nh)}:${pad(nm)}`);
  };

  // Prevent parent (Popover / Dialog) from stealing touch scroll gestures
  const stopTouchPropagation = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? format12(h, m) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // keep focus out of lists so scroll works
      >
        <div className="mb-2 text-center text-lg font-semibold tabular-nums">
          {format12(h, m)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-center text-[11px] font-medium text-muted-foreground">
              Hour
            </div>
            <div
              ref={hoursRef}
              className="h-40 overflow-y-auto overscroll-contain rounded-md border bg-muted/30 touch-pan-y"
              style={{ WebkitOverflowScrolling: "touch" }}
              onTouchStart={stopTouchPropagation}
              onTouchMove={stopTouchPropagation}
            >
              {Array.from({ length: 24 }, (_, i) => i).map((hh) => (
                <button
                  key={hh}
                  data-h={hh}
                  type="button"
                  onClick={() => set(hh, m)}
                  className={cn(
                    "block w-full px-2 py-1.5 text-center text-sm tabular-nums hover:bg-accent",
                    hh === h && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {pad(hh)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-center text-[11px] font-medium text-muted-foreground">
              Min
            </div>
            <div
              ref={minsRef}
              className="h-40 overflow-y-auto overscroll-contain rounded-md border bg-muted/30 touch-pan-y"
              style={{ WebkitOverflowScrolling: "touch" }}
              onTouchStart={stopTouchPropagation}
              onTouchMove={stopTouchPropagation}
            >
              {minutes.map((mm) => (
                <button
                  key={mm}
                  data-m={mm}
                  type="button"
                  onClick={() => set(h, mm)}
                  className={cn(
                    "block w-full px-2 py-1.5 text-center text-sm tabular-nums hover:bg-accent",
                    mm === m && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {pad(mm)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={`${pad(h)}:${pad(m)}`}
            onChange={(e) => {
              const p = parseHM(e.target.value);
              set(p.h, p.m);
            }}
            className="h-8 text-sm tabular-nums"
            placeholder="HH:MM"
          />
          <Button size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
