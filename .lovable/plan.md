# Voice assistant: full data access (except Settings)

The assistant gets one named tool per thing it can change. Every tool goes through the app's normal actions, so the three-focus limit, Health always on, and Task → Milestone → Goal rules still apply. Settings (theme, notifications, birth year, account, export/import, clear all) stay off-limits.

## Permission rule
- Before any change, the assistant says what it will do and waits for "yes". Deletes and auto-scheduling always need a clear yes.
- Read-only questions ("what's on Tuesday?") need no confirmation.
- A visible "Assistant tools" list in Settings shows every tool name + description so you can see what it can touch.
- Any new feature added later must register its tool in the same list (rule recorded for future work).

## Tool list

| # | Tool | What it does |
|---|------|--------------|
| 1 | create_skill | Add a skill |
| 2 | update_skill | Rename / recolor / describe a skill |
| 3 | delete_skill | Remove a skill |
| 4 | create_goal | Add a goal (optional skill, deadline, points) |
| 5 | update_goal | Change goal title, deadline, skill, status |
| 6 | delete_goal | Remove a goal |
| 7 | create_milestone | Add a milestone under a goal |
| 8 | update_milestone | Rename / change dates of a milestone |
| 9 | move_milestone | Move a milestone to another goal |
| 10 | toggle_milestone | Mark milestone done / not done |
| 11 | delete_milestone | Remove a milestone |
| 12 | create_task | Add a task under a milestone/goal |
| 13 | update_task | Change task title, notes, priority, milestone |
| 14 | complete_task | Tick / untick a task |
| 15 | delete_task | Remove a task |
| 16 | schedule_event | Put a task or meeting on the calendar at a date + start time + length, with optional repeat (daily/weekly/etc.) |
| 17 | reschedule_event | Move a calendar item to a new time |
| 18 | unschedule_event | Take a task off the calendar |
| 19 | add_subtask / update_subtask / toggle_subtask / delete_subtask | Manage checklist steps inside a task |
| 20 | auto_schedule | Auto-plan a goal or skill into free calendar time |
| 21 | list_calendar | Read what's scheduled on a day/week (read-only) |
| 22 | set_focus_pillars | Choose / swap this month's three focus pillars |
| 23 | confirm_focus_month | Confirm the monthly focus review |
| 24 | add_someday / update_someday / toggle_someday / delete_someday | Manage the Someday list |
| 25 | add_book / update_book / delete_book | Manage books and shelves/priority |
| 26 | set_bookmark | Save page reached in a book |
| 27 | log_reading / delete_reading | Plan or record reading sessions |
| 28 | enable_plugin | Turn a plugin (e.g. Books) on or off |
| 29 | survival_rule tools | Add / edit / tick / delete Survival Mode protocol items |
| 30 | rename_item | Quick rename of any item |
| 31 | send_suggestion | Save an idea to your Suggestions inbox |

"Meetings": scheduled as calendar items (a task with time + length) so they appear in Calendar, Agenda and reminders. If they need attendees/locations later, that's a separate addition.

## Technical details
- `src/lib/assistant-actions.ts`: export an `ASSISTANT_TOOLS` registry (name, description, args schema) as the single source of truth; extend `AssistantApi` + `applyAssistantAction` with all actions above mapped to app-data actions (updateSkill, deleteGoal, moveSubGoal, rescheduleTask, add/update/toggle/deleteSubtask, setFocusPillars, bucket actions, book/session actions, setPluginEnabled, survival rule actions, autoScheduleGoal/Skill returning blockedReason). Guards errors returned to the assistant as text.
- `buildAssistantContext`: add focus pillars, open slots, scheduled items for the next 14 days, Someday, plugins, survival rules (still capped).
- `live-relay.server.ts`: generate action tools from the registry; system prompt adds the confirm-before-change rule and "never touch Settings".
- `AssistantSettingsCard`: render the tool list.
- AGENTS.md: replace voice rule with "every new data action must be added to ASSISTANT_TOOLS".
- Tests: focus-blocked schedule_event, set_focus_pillars max 3, move_milestone, schedule_event sets date/time.
