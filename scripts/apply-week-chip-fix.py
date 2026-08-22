from pathlib import Path

p = Path("src/components/life/CalendarView.tsx")
s = p.read_text()
changed = False

if 'from "@/components/life/WeekGrid"' not in s:
    s = s.replace(
        '} from "@/components/life/CalendarFilters";',
        '} from "@/components/life/CalendarFilters";\nimport { WeekGrid as WeekGridView } from "@/components/life/WeekGrid";\nimport { HOUR_PX } from "@/components/life/calendar-week-layout";',
    )
    changed = True

if "const HOUR_PX = 48;" in s:
    s = s.replace(
        "const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23\nconst HOUR_PX = 48;\n",
        "const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23\n",
    )
    changed = True

if 'zone.getAttribute("data-drop-hour-px")' not in s:
    s = s.replace(
        "    const raw = base + ((y - rect.top) / HOUR_PX) * 60;",
        '    const hourPx = Number(zone.getAttribute("data-drop-hour-px") ?? HOUR_PX) || HOUR_PX;\n    const raw = base + ((y - rect.top) / hourPx) * 60;',
    )
    s = s.replace(
        "        data-drop-base={baseHour}\n      >",
        "        data-drop-base={baseHour}\n        data-drop-hour-px={HOUR_PX}\n      >",
    )
    changed = True

if "<WeekGridView" not in s:
    s = s.replace(
        '{view === "week" && (\n            <WeekGrid\n',
        '{view === "week" && (\n            <WeekGridView\n',
    )
    changed = True

old_h = "                    const height = Math.max(20, (endH - startH) * HOUR_PX - 2);"
if old_h in s:
    s = s.replace(old_h, "                    const height = Math.max(40, (endH - startH) * HOUR_PX - 2);")
    changed = True

old_chip = '''                        className={cn(
                          "absolute inset-x-1 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-1 text-[10px] shadow-sm active:cursor-grabbing flex flex-col transition-all hover:scale-[1.02] hover:shadow-md hover:z-10",
                          e.done && "opacity-60 line-through",
                          drag.dragId === e.id && "opacity-40",
                        )}'''
new_chip = '''                        className={cn(
                          "absolute inset-x-0.5 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-0 text-[12px] leading-none shadow-sm active:cursor-grabbing flex items-center hover:z-10",
                          e.done && "opacity-60 line-through",
                          drag.dragId === e.id && "opacity-40",
                        )}'''
if old_chip in s:
    s = s.replace(old_chip, new_chip)
    changed = True

old_body = '''                        <div
                          className="break-words font-medium leading-tight mb-0.5 line-clamp-2"
                          style={{ color: `color-mix(in oklab, ${e.color} 80%, currentColor)` }}
                        >
                          {e.title}
                        </div>
                        <div
                          className="truncate opacity-80 mt-auto"
                          style={{ color: `color-mix(in oklab, ${e.color} 80%, currentColor)` }}
                        >
                          {hm(e.start)}–{hm(e.end)}
                        </div>'''
new_body = '''                        <div
                          className="min-w-0 flex-1 truncate font-medium"
                          style={{ color: `color-mix(in oklab, ${e.color} 90%, currentColor)` }}
                        >
                          {e.title}
                        </div>'''
if old_body in s:
    s = s.replace(old_body, new_body)
    changed = True

old_col = '''                  className={cn(
                    "relative border-l",
                    drag.dragging && drag.target?.day === key && "bg-primary/10",
                  )}'''
new_col = '''                  className={cn(
                    "relative border-l",
                    isCurrentDay && "bg-primary/5",
                    drag.dragging && drag.target?.day === key && "bg-primary/10",
                  )}'''
if old_col in s:
    s = s.replace(old_col, new_col, 1)
    changed = True

p.write_text(s)
print("changed" if changed else "already applied")
