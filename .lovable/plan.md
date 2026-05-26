# Plan

## 1. Bug fixes

**Goals tab crashes after import** — `GoalCard` calls `goal.subGoals.map(...)` and `progressFor` reads `g.subGoals.length`. AI-generated/imported JSON often omits `subGoals` (or `manualProgress`, `status`), so the map throws and React shows "something went wrong".

Fix in `src/lib/app-data.tsx` → `importJSON` and `replaceAll`: normalize every record before storing.
- `goals[]`: ensure `subGoals: []` (array), default `status: "not_started"`, default `skill: "life"` if invalid, default `manualProgress: 0`, generate `id` if missing, coerce `subGoals[].done` to boolean.
- `tasks[]`: default `priority: "medium"`, `done: false`, generate `id`.
- `bucketList[]`: default `achieved: false`, generate `id`.
- Throw a clear error listing which top-level key is wrong (currently only "Invalid file shape").

**Reload loses all data** — currently state lives only in React memory. User now wants reload-safety without a backend. Add lightweight `localStorage` persistence:
- On mount in `AppDataProvider`, hydrate state from `localStorage["life-manager:v1"]` (wrapped in try/catch).
- On any change to `goals/tasks/bucketList`, debounce-write the same key.
- Add a "Clear all data" item to the Data dropdown that wipes storage + state (confirm dialog).
- This is purely client-side, still no backend, still no login. Keeps the existing export/import as the portability path.

## 2. JSON template: embed AI system prompt

Update `TEMPLATE_PAYLOAD` in `src/lib/app-data.tsx` to include an `_ai` block at the top of the file (underscore prefix is ignored on import). It contains:
- `systemPrompt`: a ready-to-paste prompt instructing an LLM to act as a life-planning coach, ask the user about their age, life stage, current skills, ambitions, available time per week, and constraints, then output a JSON file matching the rest of this template's schema.
- `instructions`: short human-readable note ("Paste `_ai.systemPrompt` into ChatGPT/Claude/etc., answer its questions, then upload the JSON it produces here").
- `schema`: inline JSON-schema-ish description of every field, valid `skill` IDs, valid `status` values, valid `priority` values, date formats. So the LLM has the contract in one file.

The importer ignores any key starting with `_`, so the same file remains directly uploadable.

## 3. New features (small, high-value)

a. **Quick-add task on a goal** — in `GoalCard`, an "Add task" inline action that creates a Task pre-linked via `goalId`. Closes the loop between goals → daily work.

b. **Task → goal link visible in Tasks tab** — show the linked goal's title as a chip on each task row; clicking it switches to the Goals tab filtered to that skill.

c. **Overdue + due-today badges** — compute on tasks and on sub-goal milestones; surface red/amber chips on the Dashboard "Tasks open" card and on each goal's timeline tooltip.

d. **Promote bucket-list item to a goal** — one-click button on each bucket item: opens the New Goal dialog prefilled with title + a sensible target date (the `targetYear` if set).

e. **Search box in header** — single input that filters across goals/tasks/bucket by title; sets the active tab to the first matching section.

Skipping (not enough payoff for the complexity): recurring tasks, reminders/notifications, charts/analytics, multi-user, calendar view.

## 4. Files touched

- `src/lib/app-data.tsx` — normalization on import, localStorage persist/hydrate, `TEMPLATE_PAYLOAD._ai`, optional `clearAll()`.
- `src/components/life/Goals.tsx` — defensive `goal.subGoals ?? []`, quick-add-task button.
- `src/components/life/Tasks.tsx` — goal chip, overdue badge.
- `src/components/life/BucketList.tsx` — "Promote to goal" action.
- `src/components/life/Dashboard.tsx` — overdue/due-today indicators.
- `src/components/life/AppShell.tsx` — header search input.
- `src/components/life/ExportImport.tsx` — "Clear all data" item.

No backend, no new dependencies.
