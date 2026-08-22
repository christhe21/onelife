from pathlib import Path

p = Path("src/components/life/CalendarView.tsx")
t = p.read_text()
if "WeekGrid as WeekGridView" in t or 'from "@/components/life/WeekGrid"' in t:
    print("already wired")
    raise SystemExit(0)

t = t.replace(
    '} from "@/components/life/CalendarFilters";',
    '} from "@/components/life/CalendarFilters";\nimport { WeekGrid as WeekGridView } from "@/components/life/WeekGrid";\nimport { HOUR_PX } from "@/components/life/calendar-week-layout";',
)
t = t.replace("const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23\nconst HOUR_PX = 48;\n", "const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23\n")
t = t.replace(
    "    const raw = base + ((y - rect.top) / HOUR_PX) * 60;",
    '    const hourPx = Number(zone.getAttribute("data-drop-hour-px") ?? HOUR_PX) || HOUR_PX;\n    const raw = base + ((y - rect.top) / hourPx) * 60;',
)
t = t.replace(
    '{view === "week" && (\n            <WeekGrid\n',
    '{view === "week" && (\n            <WeekGridView\n',
)
t = t.replace(
    "        data-drop-base={baseHour}\n      >",
    "        data-drop-base={baseHour}\n        data-drop-hour-px={HOUR_PX}\n      >",
)
p.write_text(t)
print("wired CalendarView")
