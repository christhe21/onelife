with open("src/lib/app-data.tsx", "r") as f:
    content = f.read()

# Add recurrenceRule to Task
content = content.replace("recurrence?: \"none\" | \"daily\" | \"weekly\" | \"monthly\" | \"yearly\";", "recurrence?: \"none\" | \"daily\" | \"weekly\" | \"monthly\" | \"yearly\";\n  recurrenceRule?: string;")
# Add recurrenceRule to SubTask
content = content.replace("recurrence?: \"none\" | \"daily\" | \"weekly\" | \"monthly\" | \"yearly\";\n}", "recurrence?: \"none\" | \"daily\" | \"weekly\" | \"monthly\" | \"yearly\";\n  recurrenceRule?: string;\n}")

# Fix SubTask replacement if it matched the first occurrence wrongly
content = content.replace("export interface SubTask {\n  id: string;\n  title: string;\n  done: boolean;\n  dueDate?: string;\n  startDate?: string;\n  duration?: number;\n  recurrence?: \"none\" | \"daily\" | \"weekly\" | \"monthly\" | \"yearly\";\n  recurrenceRule?: string;\n}", "export interface SubTask {\n  id: string;\n  title: string;\n  done: boolean;\n  dueDate?: string;\n  startDate?: string;\n  duration?: number;\n  recurrence?: \"none\" | \"daily\" | \"weekly\" | \"monthly\" | \"yearly\";\n  recurrenceRule?: string;\n}")

# Update bumpDateString to handle rrule
rrule_bump_logic = """
export const bumpDateString = (dateStr: string | undefined, rule: "daily" | "weekly" | "monthly" | "yearly" | "none", recurrenceRule?: string): string | undefined => {
  if (!dateStr || rule === "none") return dateStr;

  if (recurrenceRule) {
    try {
      const { rrulestr } = require("rrule");
      const ruleObj = rrulestr(recurrenceRule);
      // Use local timezone to match user's perspective
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      const parts = dateStr.split('T');
      const timeStr = parts.length > 1 ? parts[1] : '';

      const dtstart = new Date(year, month - 1, day);
      // RRule needs a time to start searching from
      const options = ruleObj.options;
      options.dtstart = dtstart;

      const { RRule } = require("rrule");
      const rrule = new RRule(options);

      // Get the next occurrence strictly after the current date
      // We add 1 second to dtstart to ensure we get the *next* occurrence
      const afterDate = new Date(dtstart.getTime() + 1000);
      const nextDate = rrule.after(afterDate);

      if (nextDate) {
        // Format back to YYYY-MM-DD
        const nextYear = nextDate.getFullYear();
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextDay = String(nextDate.getDate()).padStart(2, '0');

        const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;
        return timeStr ? `${nextDateStr}T${timeStr}` : nextDateStr;
      } else {
        // No more occurrences (e.g., reached UNTIL limit)
        return undefined; // Or return dateStr if you prefer not to bump
      }
    } catch (e) {
      console.error("Error parsing recurrenceRule in bumpDate:", e);
      // Fallback to basic rule if parsing fails
    }
  }
"""

content = content.replace("export const bumpDateString = (dateStr: string | undefined, rule: \"daily\" | \"weekly\" | \"monthly\" | \"yearly\" | \"none\"): string | undefined => {\n  if (!dateStr || rule === \"none\") return dateStr;", rrule_bump_logic)

with open("src/lib/app-data.tsx", "w") as f:
    f.write(content)
