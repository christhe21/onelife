import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the element animates in. */
  delay?: number;
  /** Direction the element travels from. */
  from?: "up" | "left" | "right" | "scale";
}

const HIDDEN: Record<NonNullable<Props["from"]>, string> = {
  up: "translate-y-6 opacity-0",
  left: "-translate-x-6 opacity-0",
  right: "translate-x-6 opacity-0",
  scale: "scale-95 opacity-0",
};

export function Reveal({ children, className, delay = 0, from = "up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const t = window.setTimeout(() => setShown(true), delay);
            io.disconnect();
            return () => window.clearTimeout(t);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
        shown ? "translate-x-0 translate-y-0 scale-100 opacity-100" : HIDDEN[from],
        className,
      )}
    >
      {children}
    </div>
  );
}
