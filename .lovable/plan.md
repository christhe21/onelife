# Plan

## 1. Confirm-delete dialog for goals

In `src/components/life/Goals.tsx`, wrap the goal delete trash button (line ~376) with an `AlertDialog` from `@/components/ui/alert-dialog`.

- Title: "Delete this goal?"
- Description: "This will permanently remove the goal, its milestones, tasks and scheduled blocks. This can't be undone."
- Actions: **Cancel** (secondary) and **Delete goal** (destructive variant) → calls `deleteGoal(goal.id)`.
- Apply the same pattern to the inner trash button at line ~449 (sub-goal / milestone delete) for consistency — title "Delete this milestone?".

No business-logic changes — `deleteGoal` in `app-data.tsx` stays the same.

## 2. New Welcome / Home screen

Replace the current behavior in `src/routes/index.tsx` where `!settings.onboardedAt` immediately renders `<Onboarding />`. Instead, render a new `<Welcome />` screen as the default landing for **every** user (onboarded or not).

### New file: `src/components/life/Welcome.tsx`

A marketing-style intro screen, mobile-first, no app chrome. Sections:

1. **Hero** — Sparkles logo, "Life Manager", tagline ("Plan your life like you plan your week").
2. **What it is** — one short paragraph explaining the app.
3. **What's inside** — 5 feature cards with icon + title + 1-line description:
   - **Skills** — life areas (Career, Health, Faith…) that color-code everything.
   - **Goals** — meaningful outcomes with a target date.
   - **Milestones (sub-goals)** — checkpoints on the way to a goal.
   - **Tasks & sub-tasks** — concrete actions you tick off.
   - **Today & Calendar** — schedule blocks and see your day.
4. **CTAs** — two buttons:
   - **Start onboarding** → opens the existing `<Onboarding />` flow.
   - **Go to dashboard** → enters the app shell directly (skips onboarding; if user is not yet onboarded, sets `settings.onboardedAt` to "skipped" so the Welcome screen still remains the front door but the app no longer redirects).

### Routing / state changes in `src/routes/index.tsx`

- Add new local state: `view: "welcome" | "onboarding" | "app"`, default `"welcome"`.
- Remove the `if (!settings.onboardedAt) return <Onboarding />` gate.
- Render:
  - `view === "welcome"` → `<Welcome onOnboard={() => setView("onboarding")} onDashboard={() => setView("app")} />`
  - `view === "onboarding"` → `<Onboarding />` (when its finish handler fires, set `view = "app"`).
  - `view === "app"` → existing `<AppShell>` tree.
- Add a "Home" entry point: a small Home icon button in `AppShell`'s header (or a new tab) that sets `view` back to `"welcome"`, so the user can revisit it.

### Onboarding finish hook

`Onboarding`'s `finish()` currently only writes `settings.onboardedAt`. Add an optional `onFinish?: () => void` prop so `index.tsx` can flip `view` to `"app"` after onboarding completes (also call it from "Skip setup").

## Files touched

- `src/components/life/Goals.tsx` — wrap two trash buttons with `AlertDialog`.
- `src/components/life/Welcome.tsx` — new file.
- `src/components/life/Onboarding.tsx` — add optional `onFinish` prop, call it from `finish()` and the Skip button.
- `src/routes/index.tsx` — add `view` state, render Welcome by default, route between Welcome / Onboarding / App.
- `src/components/life/AppShell.tsx` — add a small "Home" button that calls a passed-in `onHome` prop (wired from `index.tsx`).

No data-model changes, no migrations.
