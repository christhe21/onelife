import type { Task } from "@/lib/app-data";

const BLOCK_MINUTES = 20;
const DAY_START_HOUR = 9; // 09:00
const DAY_END_HOUR = 18; // 18:00 — fits weekdays + weekends per user

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtICS(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

interface Block {
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

function nextSlot(cursor: Date): Date {
  // Move to next free 20-min slot in the work window [9:00, 18:00]
  const d = new Date(cursor);
  if (
    d.getHours() >= DAY_END_HOUR ||
    (d.getHours() === DAY_END_HOUR - 1 && d.getMinutes() >= 60 - BLOCK_MINUTES + 1)
  ) {
    d.setDate(d.getDate() + 1);
    d.setHours(DAY_START_HOUR, 0, 0, 0);
  } else if (d.getHours() < DAY_START_HOUR) {
    d.setHours(DAY_START_HOUR, 0, 0, 0);
  }
  return d;
}

function addBlocks(
  cursor: Date,
  count: number,
  title: string,
  description: string,
  dueDate?: Date,
): { blocks: Block[]; cursor: Date } {
  const blocks: Block[] = [];
  let cur = nextSlot(new Date(cursor));
  for (let i = 0; i < count; i++) {
    if (dueDate && cur > dueDate) break;
    const start = new Date(cur);
    const end = new Date(start.getTime() + BLOCK_MINUTES * 60000);
    blocks.push({ title, start, end, description });
    cur = nextSlot(new Date(end));
  }
  return { blocks, cursor: cur };
}

/**
 * Build a focused-work schedule:
 * - Each open task without subtasks → 1 × 20-min block (high=2, medium=1, low=1)
 *   placed before its due date.
 * - Each subtask with hoursPerWeek + endDate → spread (hoursPerWeek*3) blocks per week
 *   until endDate.
 */
export function buildSchedule(tasks: Task[], goalsTitleById: Record<string, string>): Block[] {
  const all: Block[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  // Start at next slot from now
  let cursor = nextSlot(new Date(now));

  // Tasks (open, with sub-tasks or plain)
  const open = tasks.filter((t) => !t.done);
  for (const t of open) {
    const goalLabel = t.goalId ? goalsTitleById[t.goalId] : undefined;
    const desc = goalLabel ? `Goal: ${goalLabel}` : "";
    const due = t.dueDate ? new Date(`${t.dueDate}T${pad(DAY_END_HOUR)}:00:00`) : undefined;

    if (t.subtasks.length === 0) {
      const reps = t.priority === "high" ? 2 : 1;
      const r = addBlocks(cursor, reps, `Focus: ${t.title}`, desc, due);
      all.push(...r.blocks);
      cursor = r.cursor;
    } else {
      for (const st of t.subtasks) {
        if (st.done) continue;
        const end = st.endDate ? new Date(`${st.endDate}T${pad(DAY_END_HOUR)}:00:00`) : due;
        const hpw = st.hoursPerWeek ?? 1;
        const blocksPerWeek = Math.max(1, Math.round(hpw * (60 / BLOCK_MINUTES)));
        // total weeks from now → end
        const weeks = end
          ? Math.max(1, Math.ceil((end.getTime() - cursor.getTime()) / (7 * 86400000)))
          : 4;
        for (let w = 0; w < weeks; w++) {
          const weekEnd = new Date(cursor);
          weekEnd.setDate(weekEnd.getDate() + 7);
          let placed = 0;
          while (placed < blocksPerWeek && cursor < weekEnd && (!end || cursor < end)) {
            const start = new Date(cursor);
            const stop = new Date(start.getTime() + BLOCK_MINUTES * 60000);
            all.push({
              title: `Focus: ${t.title} — ${st.title}`,
              start,
              end: stop,
              description: `${desc}${desc ? "\n" : ""}Subtask: ${st.title} (${hpw}h/wk)`,
            });
            placed++;
            cursor = nextSlot(new Date(stop));
          }
          if (cursor < weekEnd) cursor = nextSlot(new Date(weekEnd));
        }
      }
    }
  }

  return all.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function blocksToICS(blocks: Block[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Life Manager//Focus Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const stamp = fmtICS(new Date());
  for (const b of blocks) {
    const uid = `${b.start.getTime()}-${Math.random().toString(36).slice(2, 8)}@life-manager`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtICS(b.start)}`,
      `DTEND:${fmtICS(b.end)}`,
      `SUMMARY:${escapeICS(b.title)}`,
      b.description ? `DESCRIPTION:${escapeICS(b.description)}` : "",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

function escapeICS(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadICS(tasks: Task[], goalsTitleById: Record<string, string>) {
  const blocks = buildSchedule(tasks, goalsTitleById);
  if (blocks.length === 0) {
    alert("Nothing to schedule — add open tasks or subtasks first.");
    return;
  }
  const ics = blocksToICS(blocks);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `life-manager-schedule-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
