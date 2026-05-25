## 1. JSON template download

Add a third button next to Export / Import in the header: **Template**.

Clicking it downloads `life-manager-template.json` containing a fully-populated example payload with at least **two entries per array** and every optional field filled in, so an AI agent (or you, offline) can use it as a schema reference.

Template shape (same as Export, so Import accepts it as-is):

```json
{
  "version": 1,
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "goals": [
    {
      "id": "example-goal-1",
      "title": "Learn TypeScript",
      "description": "Become proficient in advanced TS patterns",
      "skill": "technical",
      "startDate": "2026-01-01",
      "targetDate": "2026-06-30",
      "status": "in_progress",
      "currentActivity": "Reading the handbook, chapter 4",
      "manualProgress": 25,
      "subGoals": [
        { "id": "sg-1", "title": "Finish handbook", "targetDate": "2026-03-01", "done": false },
        { "id": "sg-2", "title": "Build a typed CLI", "targetDate": "2026-05-15", "done": false }
      ]
    },
    {
      "id": "example-goal-2",
      "title": "Run a 10K",
      "description": "Train consistently for a 10K race",
      "skill": "health",
      "startDate": "2026-02-01",
      "targetDate": "2026-08-01",
      "status": "not_started",
      "currentActivity": "Buying running shoes",
      "subGoals": [
        { "id": "sg-3", "title": "Run 3K nonstop", "targetDate": "2026-03-15", "done": false },
        { "id": "sg-4", "title": "Run 5K nonstop", "targetDate": "2026-05-15", "done": false }
      ]
    }
  ],
  "tasks": [
    { "id": "t-1", "title": "Draft project outline", "dueDate": "2026-01-10", "priority": "high",   "done": false, "goalId": "example-goal-1" },
    { "id": "t-2", "title": "Buy running shoes",    "dueDate": "2026-02-05", "priority": "medium", "done": false, "goalId": "example-goal-2" }
  ],
  "bucketList": [
    { "id": "b-1", "title": "See the northern lights", "notes": "Ideally from Norway",  "targetYear": 2027, "achieved": false },
    { "id": "b-2", "title": "Publish a book",          "notes": "Short story collection", "targetYear": 2030, "achieved": false }
  ]
}
```

A `SKILL_IDS` comment block won't fit in JSON, so the dropdown in `ExportImport` will also offer a **"Skills reference"** menu item that downloads `skills-reference.json` listing all valid `skill` IDs (`life`, `technical`, `health`, `creative`, `financial`, `social`, `career`, `learning`) with labels — useful when prompting an AI agent.

Implementation: add `downloadTemplate()` and `downloadSkillsReference()` helpers in `src/lib/app-data.tsx`, and convert the two header buttons into a compact action group (Export / Import / Template via dropdown) in `ExportImport.tsx`.

## 2. UI rework via design directions

The current UI is functional but plain — default shadcn cards, flat header, no visual hierarchy on the dashboard, mobile-cramped tabs.

Flow:

1. Capture a screenshot of the current Dashboard + Goals view in the live preview.
2. Ask three visual-preference questions in one round (palette, type pair, layout) — answers lock the design tokens.
3. Generate 3 rendered design directions for the app shell + dashboard + goal card, all sharing the locked tokens but varying composition / density / emphasis.
4. Show the 3 prototypes back as a `prototype` question — you pick one.
5. Implement the chosen direction: update `src/styles.css` tokens, restyle `index.tsx` header/tabs, `Dashboard.tsx` summary cards and skill groups, and `Goals.tsx` goal card + timeline. No logic changes — purely presentational.

Mobile (your current 384px viewport) gets explicit attention: tabs become a scrollable row or icon strip, header actions collapse into the dropdown, goal cards go single-column with a tighter timeline.

## Out of scope

- No changes to data model, storage, or import/export logic beyond adding the template download.
- No new features (no recurring tasks, no reminders, etc.).
