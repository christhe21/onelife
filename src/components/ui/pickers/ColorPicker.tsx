import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export interface ColorPickerProps {
  value?: string; // #rrggbb
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

export function ColorPicker({ value, onChange, className, disabled, id }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const current = value || "#3b82f6";
  const [r, g, b] = hexToRgb(current);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [hex, setHex] = React.useState(current);

  React.useEffect(() => setHex(current), [current]);

  const setHsl = (nh: number, ns: number, nl: number) => {
    const [nr, ng, nb] = hslToRgb(nh, ns, nl);
    onChange(rgbToHex(nr, ng, nb));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("h-10 w-16 p-1", className)}
          aria-label="Pick color"
        >
          <span
            className="block h-full w-full rounded-sm border border-border"
            style={{ backgroundColor: current }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="h-10 w-10 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: current }}
          />
          <Input
            value={hex}
            onChange={(e) => {
              const v = e.target.value;
              setHex(v);
              if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                onChange(v.startsWith("#") ? v : `#${v}`);
              }
            }}
            className="h-8 text-sm uppercase tabular-nums"
            maxLength={7}
          />
        </div>
        <div className="mb-3 grid grid-cols-8 gap-1.5">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "h-6 w-6 rounded-sm border border-border transition-transform hover:scale-110",
                current.toLowerCase() === c.toLowerCase() && "ring-2 ring-ring ring-offset-1 ring-offset-background",
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
        <div className="space-y-2">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Hue</span><span className="tabular-nums">{Math.round(h)}°</span>
            </div>
            <Slider value={[h]} min={0} max={360} step={1} onValueChange={([v]) => setHsl(v, s, l)} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Saturation</span><span className="tabular-nums">{Math.round(s)}%</span>
            </div>
            <Slider value={[s]} min={0} max={100} step={1} onValueChange={([v]) => setHsl(h, v, l)} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Lightness</span><span className="tabular-nums">{Math.round(l)}%</span>
            </div>
            <Slider value={[l]} min={0} max={100} step={1} onValueChange={([v]) => setHsl(h, s, v)} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
