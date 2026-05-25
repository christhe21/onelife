# Life Manager App — Plan

A single-page app to manage goals, sub-goals, tasks, and a bucket list — all stored in-memory for the session, with JSON export/import for persistence between visits.

## Core Principles
- **No login, no database, no localStorage.** All data lives in React state for the current session.
- **Export/Import JSON** is the only persistence: download a file, re-upload it next time to restore.
- **Skills taxonomy** categorizes every goal (Life, Technical, Health, Creative, Financial, Social, Career, Learning).

## Features

### 1. Goals & Sub-Goals
- Create a goal with: title, description, skill category, start date, target date, status (Not Started / In Progress / Completed).
- Each goal has **sub-goals** (milestones) with their own title, target date, and done/not-done state.
- **Progress %** auto-calculated from completed sub-goals (or manual override if no sub-goals).
- **Timeline view** per goal: horizontal bar from start → target date, with sub-goal markers placed by date.
- "What are you doing?" — a free-text *current activity / next step* field per goal.

### 2. Skills
- Predefined skill categories with icons and colors (Life, Technical, Health, Creative, Financial, Social, Career, Learning).
- Every goal must be tagged with one skill.
- Filter/group goals by skill on the dashboard.

### 3. Tasks (simple to-do)
- Flat task list with: title, target completion date, priority (Low/Med/High), done checkbox.
- Optionally link a task to a goal (dropdown).
- Sort by due date; overdue tasks highlighted.

### 4. Bucket List
- Separate simple list: title, optional notes, optional target year, checkbox for "achieved".
- No skill/timeline — intentionally lightweight.

### 5. Export / Import
- **Download button**: serializes `{ goals, tasks, bucketList, exportedAt, version }` to a JSON file (`life-manager-YYYY-MM-DD.json`).
- **Upload button**: file picker → validates JSON shape → **replaces** current session state with file contents.
- Confirmation dialog before overwriting existing in-session data on import.

## UI Structure
- **Top bar**: app title, Export button, Import button, session indicator ("Unsaved — export to keep your data").
- **Tabs**: Dashboard | Goals | Tasks | Bucket List.
  - **Dashboard**: summary cards (active goals, tasks due this week, bucket items), goals grouped by skill.
  - **Goals**: list with progress bars; click to open detail (sub-goals, timeline, current activity).
  - **Tasks**: table/list with quick-add input at top.
  - **Bucket List**: simple cards with checkboxes.

## Technical Notes
- React + Vite + Tailwind + shadcn/ui (already the project default).
- Single React Context (`AppDataProvider`) holds `{ goals, tasks, bucketList }` and exposes CRUD + `exportJSON()` / `importJSON(file)`.
- Types: `Goal`, `SubGoal`, `Task`, `BucketItem`, `Skill` (enum).
- Timeline rendered with a simple flex/absolute-positioned bar (no chart lib needed).
- File download via `Blob` + `URL.createObjectURL`; upload via hidden `<input type="file">`.
- Schema version field in export so future imports can migrate.
- Beforeunload warning when unsaved changes exist (since nothing persists).

## Out of Scope
- Auth, backend, cloud sync, recurring tasks, notifications, collaboration.
