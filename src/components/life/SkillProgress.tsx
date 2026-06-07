import { cn } from "@/lib/utils";

interface Props {
  value: number;
  color?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function SkillProgress({ value, color, size = "md", showLabel = true, className }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const accent = color ?? "hsl(var(--primary))";
  const heights = { sm: "h-2", md: "h-2.5", lg: "h-3.5" }[size];
  const labelSize = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" }[size];

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted/60 ring-1 ring-inset ring-border/50",
          heights,
        )}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent} 0%, ${accent} 60%, color-mix(in oklab, ${accent} 70%, white) 100%)`,
            boxShadow: `0 0 12px -2px ${accent}`,
          }}
        />
        {/* shimmer */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full animate-[skillshimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ transform: pct > 0 ? undefined : "translateX(-100%)" }}
        />
      </div>
      {showLabel && (
        <div
          className={cn("mt-1 flex justify-end font-semibold tabular-nums", labelSize)}
          style={{ color: accent }}
        >
          {pct}%
        </div>
      )}
      <style>{`@keyframes skillshimmer { 0% { transform: translateX(-100%);} 60%,100% { transform: translateX(400%);} }`}</style>
    </div>
  );
}
