import { useEffect, useRef } from "react";

const BUTTERFLIES = ["one", "two", "three", "four", "five", "six", "seven"] as const;

function Butterfly() {
  return (
    <svg viewBox="0 0 48 36" className="h-full w-full overflow-visible" aria-hidden="true">
      <g className="butterfly-wing butterfly-wing-left">
        <path
          d="M22 18C15 4 3 2 3 10c0 7 9 12 19 11C14 23 9 30 14 33c5 3 9-5 10-13Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </g>
      <g className="butterfly-wing butterfly-wing-right">
        <path
          d="M26 18C33 4 45 2 45 10c0 7-9 12-19 11 8 2 13 9 8 12-5 3-9-5-10-13Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </g>
      <path d="M24 12v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 13c-2-4-5-5-7-5m7 5c2-4 5-5 7-5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function Plant({ variant }: { variant: "fern" | "stem" | "grass" }) {
  if (variant === "fern") {
    return (
      <svg viewBox="0 0 120 230" className="h-full w-full" aria-hidden="true">
        <path d="M60 226C58 174 62 116 68 32" className="garden-stroke" />
        <path d="M65 65C43 49 26 50 12 57M64 84C88 65 103 66 114 73M62 104C40 87 24 90 9 99M62 124C84 105 101 108 113 118M60 145C40 130 25 134 14 145M60 164C78 149 94 151 105 163M59 184C43 174 31 178 22 188" className="garden-stroke garden-fine" />
        <path d="M68 32c-8 9-8 17-1 23 8-8 9-16 1-23ZM12 57c10 0 17 4 22 12-11 2-19-2-22-12Zm102 16c-11 0-18 4-24 13 12 1 20-3 24-13ZM9 99c11-1 19 3 25 12-12 2-21-2-25-12Zm104 19c-11-1-19 3-25 12 12 2 21-2 25-12ZM14 145c10-1 18 3 24 11-11 2-19-2-24-11Zm91 18c-10-1-17 2-22 10 10 2 18-1 22-10Z" className="garden-fill" />
      </svg>
    );
  }

  if (variant === "stem") {
    return (
      <svg viewBox="0 0 110 220" className="h-full w-full" aria-hidden="true">
        <path d="M54 220C54 168 48 110 57 42M54 145c-18-20-31-27-43-28M53 171c18-19 32-24 45-23M54 112c15-16 26-21 39-20" className="garden-stroke" />
        <path d="M57 42c-12-14-4-31 8-35 7 14 4 27-8 35Zm-3 0C42 29 26 31 21 43c10 8 22 8 33-1Zm-43 75c15-3 25 2 31 15-16 3-26-2-31-15Zm87 31c-16-2-26 3-33 16 16 3 27-2 33-16ZM93 92c-14-2-23 2-29 14 15 3 24-2 29-14Z" className="garden-fill" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 190" className="h-full w-full" aria-hidden="true">
      <path d="M14 190C18 139 16 107 7 62M37 190c-2-61 4-104 22-154M67 190c-5-53-1-96 12-133M98 190c4-56 16-98 39-139M128 190c-1-42 8-74 29-103M157 190c-6-35-4-63 8-86" className="garden-stroke" />
      <path d="M54 49c-8-12-6-24 4-35 9 13 8 25-4 35Zm78 14c-3-15 2-27 16-35 4 16-1 28-16 35ZM77 72c-8-11-7-21 2-31 9 11 8 22-2 31ZM8 75c-8-8-9-17-3-27 9 8 10 17 3 27Zm149 25c-2-13 3-22 15-28 3 13-2 23-15 28Z" className="garden-fill" />
    </svg>
  );
}

export function ButterflyBackdrop() {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!backdrop || !precisePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    const updatePointer = (event: PointerEvent) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = backdrop.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
        backdrop.style.setProperty("--garden-pointer-x", `${(x - 0.5) * -18}px`);
        backdrop.style.setProperty("--garden-pointer-y", `${(y - 0.5) * -12}px`);
      });
    };
    const settle = () => {
      backdrop.style.setProperty("--garden-pointer-x", "0px");
      backdrop.style.setProperty("--garden-pointer-y", "0px");
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("mouseleave", settle);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("mouseleave", settle);
    };
  }, []);

  return (
    <div ref={backdropRef} className="butterfly-backdrop" aria-hidden="true">
      <div className="garden-haze garden-haze-left" />
      <div className="garden-haze garden-haze-right" />
      <div className="garden-layer garden-layer-back">
        <span className="garden-plant garden-plant-one"><Plant variant="grass" /></span>
        <span className="garden-plant garden-plant-two"><Plant variant="fern" /></span>
        <span className="garden-plant garden-plant-three"><Plant variant="stem" /></span>
      </div>
      <div className="garden-layer garden-layer-front">
        <span className="garden-plant garden-plant-four"><Plant variant="stem" /></span>
        <span className="garden-plant garden-plant-five"><Plant variant="grass" /></span>
        <span className="garden-plant garden-plant-six"><Plant variant="fern" /></span>
      </div>
      <div className="garden-layer garden-layer-groves">
        <div className="garden-grove garden-grove-one">
          <span className="garden-plant"><Plant variant="fern" /></span>
          <span className="garden-plant"><Plant variant="grass" /></span>
        </div>
        <div className="garden-grove garden-grove-two">
          <span className="garden-plant"><Plant variant="stem" /></span>
          <span className="garden-plant"><Plant variant="fern" /></span>
          <span className="garden-plant"><Plant variant="grass" /></span>
        </div>
        <div className="garden-grove garden-grove-three">
          <span className="garden-plant"><Plant variant="grass" /></span>
          <span className="garden-plant"><Plant variant="stem" /></span>
        </div>
        <div className="garden-grove garden-grove-four">
          <span className="garden-plant"><Plant variant="fern" /></span>
          <span className="garden-plant"><Plant variant="stem" /></span>
          <span className="garden-plant"><Plant variant="grass" /></span>
        </div>
      </div>
      {BUTTERFLIES.map((name) => (
        <span key={name} className={`butterfly-flight butterfly-flight-${name}`}>
          <span className="butterfly-avoid">
            <span className="butterfly-drift">
            <Butterfly />
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}