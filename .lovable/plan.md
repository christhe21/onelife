# Survival Mode

## Goal
Add a separate `/survival` experience for days when planning and goal management feel overwhelming. It will not use goals, milestones, ranks, points, or AI generation. It will provide a calm daily protocol for mental stability, physical readiness, sustainable work, recovery, and practical emergency preparedness.

The experience will be framed around realistic resilience and health—not predictions about AI, combat preparation, punishment, or medical diagnosis.

## Experience

### 1. Separate mode and route
- Add a dedicated `/survival` route with its own focused layout and route-specific page metadata.
- Add a clear mode switch between the regular workspace and Survival Mode on desktop and mobile.
- Keep the regular goal system unchanged; Survival Mode data and completion do not affect goals, ranks, or points.
- Preserve the existing monochrome light/dark design, while reducing navigation and visual noise in this mode.

### 2. Daily protocol
The first screen will answer “What should I do now?” with a short, ordered protocol:
1. **Check in** — sleep, energy, mood, stress, pain/limitations, and time spent outdoors.
2. **Stabilize** — breathing, meditation, grounding, screen break, or social connection.
3. **Strengthen** — movement, mobility, strength/cardio, hydration, food, and daylight.
4. **Work sustainably** — choose a realistic work target, use breaks, and set a shutdown time.
5. **Prepare calmly** — small practical readiness actions such as contacts, supplies, documents, and basic first aid planning.
6. **Close the day** — reflection, journal notes, and tomorrow’s recovery needs.

Only the current section and the next recommended action will be visually prominent. Users can expand the full day when wanted.

### 3. Hard rules without punitive mechanics
- Seed a small set of editable, evidence-informed defaults rather than generating routines with AI.
- Each rule has an area, plain-language instruction, minimum or range, schedule, enabled state, and completion state.
- Users can add, edit, reorder, pause, or restore default rules.
- Missed rules remain neutral records; there will be no lost points, shame copy, escalating alerts, or unsafe “push through” behavior.
- Daily targets will use ranges and recovery-aware language. The app will not prescribe individualized medical, exercise, sleep, or nutrition treatment.

### 4. Detailed journal and history
- Add one daily entry containing sleep duration/quality, mood, energy, stress, movement/training, outdoors, meditation, focused work, breaks, hydration/nutrition check, social contact, pain/limitations, rule completion, and free-form reflection.
- Show a compact day history and simple weekly trends for consistency and balance.
- Include an optional “reduce today” state so illness, injury, severe fatigue, or overload can switch the protocol to rest, basic care, and seeking appropriate help.
- Avoid competitive streak pressure; show consistency factually and allow missed days without resetting identity or progress.

### 5. Four protocol areas
- **Mind stability:** meditation, grounding, reflection, screen boundaries, learning, and social connection.
- **Body readiness:** sleep, mobility, strength, cardio, food, hydration, daylight, outdoors, and recovery.
- **Work and recovery:** sustainable work ranges, planned breaks, an end-of-day boundary, and rest.
- **Emergency readiness:** practical, non-combat checklists for contacts, documents, supplies, communications, evacuation awareness, and basic first-aid preparation.

### 6. Guidance and safety boundaries
- Provide concise general guidance with clear ranges rather than a single universal answer for sleep, work, exercise, or meditation.
- Ask users to adapt for age, disability, illness, injury, caregiving, employment, and clinician advice.
- Pain, very low mood, panic, prolonged sleep problems, or feeling unsafe will surface calm guidance to stop demanding activity and contact an appropriate professional, trusted person, or local emergency service.
- Emergency readiness will not include weapons, fighting instruction, doomsday countdowns, or claims that a specific catastrophe is certain.

## Data design
Create a separate normalized Survival Mode model, stored as an optional top-level slice in the existing per-user app snapshot so current local use, account sync, backup, restore, and clear-data behavior continue to work.

Core records:
- `SurvivalRule` — category, instruction, target type/range, schedule, order, enabled state, and safety notes.
- `SurvivalDay` — date, check-in metrics, rule completion map, journal, reduced-day state, and timestamps.
- `PreparednessItem` — practical checklist item, category, status, review date, and notes.
- `SurvivalPreferences` — enabled defaults, reminder choices, work/recovery ranges, and display preferences.

Add defensive normalization and versioning for old saved data. Keep this model independent from Goal, Task, Subtask, Someday, recurrence, points, and AI schemas. For the first version, store it in the existing synced snapshot; no new database table is required.

## Technical implementation
- Add a focused Survival layout and reusable sections for protocol, rule editing, journal, history, and preparedness.
- Extend the shared data provider with isolated Survival actions and normalization rather than mixing Survival records into goal/task functions.
- Reuse existing accessible controls, date/time inputs, dialogs, reminders, theme tokens, keyboard focus styles, and cloud/local persistence.
- Use deterministic calculations for daily summaries and weekly trends; make no network or AI request to use the mode.
- Add reminders only when explicitly enabled, using the existing notification system.
- Ensure mobile layouts, keyboard operation, reduced motion, readable light/dark contrast, empty states, and long-text handling.

## Validation
- Verify mode switching, direct `/survival` access, refresh persistence, account sync, backup/restore, and clear-all-data behavior.
- Test rule creation/editing/pausing, one entry per calendar day, reduced-day handling, historical entries, and timezone boundaries.
- Check desktop and mobile layouts in light and dark modes.
- Confirm Survival data never creates goals, awards points, invokes AI, or affects ranks.
