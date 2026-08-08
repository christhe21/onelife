import { useEffect, useState } from "react";
import { ResponsiveRadar } from "@nivo/radar";

export interface RadarDatum {
  skill: string;
  Achieved: number;
  Planned: number;
  totalGoals: number;
  doneGoals: number;
  plannedGoals: number;
}

function tokenColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  // Some browsers resolve custom properties to full colors (rgb()/lab()/#hex),
  // others keep raw HSL channel triplets that still need the hsl() wrapper.
  return raw.includes("(") || raw.startsWith("#") ? raw : `hsl(${raw})`;
}

export default function SkillsRadarChart({ data }: { data: RadarDatum[] }) {
  const [palette, setPalette] = useState({
    primary: "#6366f1",
    muted: "#94a3b8",
    text: "#334155",
    grid: "#cbd5e1",
    popover: "#ffffff",
    border: "#e2e8f0",
  });

  useEffect(() => {
    const read = () =>
      setPalette({
        primary: tokenColor("--primary", "#6366f1"),
        muted: tokenColor("--muted-foreground", "#94a3b8"),
        text: tokenColor("--foreground", "#334155"),
        grid: tokenColor("--border", "#cbd5e1"),
        popover: tokenColor("--popover", "#ffffff"),
        border: tokenColor("--border", "#e2e8f0"),
      });
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    return () => obs.disconnect();
  }, []);

  return (
    <ResponsiveRadar
      data={data as unknown as Record<string, unknown>[]}
      keys={["Planned", "Achieved"]}
      indexBy="skill"
      maxValue={100}
      margin={{ top: 48, right: 72, bottom: 56, left: 72 }}
      curve="linearClosed"
      borderWidth={2}
      borderColor={{ from: "color" }}
      gridLevels={4}
      gridShape="circular"
      gridLabelOffset={18}
      enableDots
      dotSize={7}
      dotColor={{ theme: "background" }}
      dotBorderWidth={2}
      dotBorderColor={{ from: "color" }}
      colors={[palette.muted, palette.primary]}
      fillOpacity={0.28}
      blendMode="normal"
      motionConfig="gentle"
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          translateY: 44,
          itemWidth: 90,
          itemHeight: 18,
          itemTextColor: palette.text,
          symbolSize: 12,
          symbolShape: "circle",
        },
      ]}
      theme={{
        text: { fill: palette.text, fontSize: 12, fontFamily: "Manrope, Open Sans, sans-serif" },
        axis: { ticks: { text: { fill: palette.text } } },
        grid: { line: { stroke: palette.grid, strokeOpacity: 0.6 } },
        tooltip: {
          container: {
            background: palette.popover,
            color: palette.text,
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${palette.border}`,
          },
        },
      }}
    />
  );
}
