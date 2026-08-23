# Website + onboarding overhaul

Restructure the public site so it sells OneLife clearly, and cut the setup flow down so a new person reaches a useful dashboard in under a minute.

## Marketing site

**New page set**

```text
/            Home — restructured
/features    Features — regrouped around jobs, not modules
/how-it-works  NEW — the Skill > Goal > Milestone > Task > Calendar story, one screen per stage
/about       About — sharper positioning
/app         Workspace (unchanged)
```

**Home, resequenced**
1. Hero: tighter headline, one-line pitch, primary "Start free" + secondary "See how it works", plus a small trust line (free, open source, web + Android).
2. Product shot immediately under the hero — currently the screenshot sits too far down; the first screen should show the real app.
3. "The problem" strip: three short lines on why goal apps fail (goals with no dates, tasks with no parent, plans that never hit a calendar).
4. "How it works" — 5 stages, each with a mini visual, linking to /how-it-works.
5. Feature highlights — 6 cards, each linking into the matching /features section.
6. Screenshot gallery: dashboard, calendar, mindmap, ranks in a switchable tab strip instead of one static image.
7. FAQ (6 questions: is it free, do I need an account, does my data sync, is there a mobile app, can I import templates, is it open source).
8. Closing CTA band.

**Features page**: regroup the current module list into four outcome sections — Plan it, Schedule it, See it, Stay with it — each with its screenshot, bullet list, and an anchor id so home cards can deep-link.

**How it works (new)**: five numbered stages, alternating text/visual, ending with a CTA into onboarding.

**About**: who built it and why, the philosophy, current status (free, feedback welcome), GitHub link.

**Chrome**: header gains the "How it works" link and switches to a clearer mobile sheet; footer gains a three-column layout (product / project / links).

## Onboarding wizard

Today the flow is 9 steps (welcome, name, overview, areas, template, goal, milestones, tasks, done). Restructure to 5:

```text
1. Welcome + name      merged; name is optional, Enter continues
2. Pick your life areas  (with a "skip, use defaults" option)
3. Choose a starting point  template gallery OR blank goal OR "just explore"
4. Shape the goal      title + target date, and milestones/tasks inline on the same screen
                       (template picks arrive pre-filled and editable)
5. Done                short recap + "Enter dashboard"
```

Also:
- "Just explore" seeds a small demo goal so the dashboard is never empty, with a one-click "clear demo data" chip on the dashboard.
- Every step is skippable except the starting point; a persistent "Skip setup" link exits to the dashboard.
- Progress bar shows 5 stops with labels instead of "Step n of 9".
- Back/Next bar becomes sticky on mobile with larger tap targets; content area scrolls independently.
- Keyboard: Enter advances, Escape asks to skip.

## Product tour

- Cut from 18 steps to 8 (dashboard, rank, today, calendar views as one step, overview, goals, tasks, settings).
- Invite dialog gets three choices: Take the tour / Not now / Never.
- Tour tooltip gains a step dots row and a "Skip tour" that is always visible.

## Path from site to app

- "Start free" always opens onboarding; "Open app" goes straight to the workspace and only falls back to onboarding when there is no data.
- After onboarding finishes, land on the dashboard with the newly created goal highlighted, then offer the tour.
- Empty dashboard/calendar/tasks states get a real illustration + one clear next action instead of bare text.

## Technical notes

- New route `src/routes/how-it-works.tsx` with its own `head()` (title, description, og:title, og:description, canonical); existing routes keep theirs, home keeps the JSON-LD.
- New marketing components: `SectionHeading`, `ShotTabs` (screenshot switcher), `FaqAccordion` (shadcn accordion), `StepStrip`; `SiteHeader`/`SiteFooter` updated in place.
- `src/components/life/Onboarding.tsx` step machine reduced to the 5 stages above; existing goal/milestone/task creation calls in `app-data` are reused unchanged.
- `src/lib/product-tour.ts` step list trimmed; `ProductTour.tsx` gains the "Never" option persisted alongside the existing completion flag.
- All colors via existing semantic tokens; no new palette work.
