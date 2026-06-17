## 1. Fix Goals crash

**File:** `src/components/life/Goals.tsx`

`vocab.skills`, `vocab.goal`, `vocab.isFrieren`, `vocab.goals` are referenced at lines 599/620/626/628 but `vocab` is never defined → `ReferenceError` whenever those code paths render (skill filter dropdown / "New goal" button / empty state). In Frieren mode the empty-state branch is hit more often, which is why the user notices it there.

- Import `useFrierenVocabulary` from `@/lib/frieren` and call `const vocab = useFrierenVocabulary();` inside the component that owns those JSX nodes (the goals list view component near line ~590).
- Quick audit of other Frieren consumers (`Tasks.tsx`, `Today.tsx`, `EmptyStateHero.tsx`) to confirm `vocab` is defined wherever it's used.

## 2. Background music when Frieren theme is active

**Files:** new `src/components/life/FrierenAmbience.tsx`, `src/components/life/AppShell.tsx`, `src/lib/app-data.tsx` (settings), `src/components/life/Settings.tsx`

- Use a royalty-free fantasy/ambient track from a CC0 source (e.g. Pixabay / Free Music Archive). I'll embed a single short loop URL (Pixabay music CDN, ~1–2 MB, license: free for use). If the URL ever 404s, the player just stays silent.
- New `FrierenAmbience` component, mounted once in `AppShell`:
  - Renders an `<audio loop>` referencing the track URL.
  - Only mounts when `settings.themeColor === "frieren"` AND `settings.frierenMusic !== false`.
  - Autoplay is gated on first user gesture (browsers block silent autoplay): attach a one-shot `pointerdown`/`keydown` listener that calls `.play()`, then removes itself.
  - Volume defaults to `0.25`; respects a mute toggle from settings.
- Extend `Settings`: add a "Frieren ambience" card (only visible when theme is Frieren) with:
  - Toggle: Play background music (`frierenMusic`).
  - Slider: Volume (`frierenMusicVolume`, 0–100, default 25).
  - Toggle: Sound effects (`frierenSfx`, default on).
- Persist `frierenMusic`, `frierenMusicVolume`, `frierenSfx` in the existing settings store (`app-data.tsx`).

## 3. SFX + confetti on completion (Frieren only)

**Files:** new `src/lib/celebrate.ts`, edits in `src/components/life/Tasks.tsx`, `src/components/life/Goals.tsx`, plus the milestone-toggle path in `Goals.tsx`.

- Add `canvas-confetti` (~3 KB) via `bun add canvas-confetti @types/canvas-confetti`.
- `celebrate.ts` exports `celebrate(kind: "task" | "milestone" | "goal")`:
  - No-op unless `settings.themeColor === "frieren"` and `settings.frierenSfx !== false` (read from a small subscribe-to-localStorage helper to avoid having to wire React context everywhere; the store is already in localStorage).
  - Confetti scaling:
    - task → ~40 particles, 1 burst.
    - milestone → ~80 particles, 2 bursts.
    - goal → 150+ particles, 3 staggered bursts from both sides (classic Frieren-gold palette `#caa766`, `#f1eee4`, `#4da8a3`).
  - Plays an `<Audio>` chime from a royalty-free CDN URL per kind (`task.mp3`, `milestone.mp3`, `goal.mp3`). Cached in a module-level `Map<string, HTMLAudioElement>`; new instance is `.cloneNode()`'d per fire so overlapping plays work. Volume `0.4`.
- Call sites:
  - `Tasks.tsx`: when a task or subtask transitions from incomplete → complete, call `celebrate("task")`. Only on the off→on edge.
  - `Goals.tsx`: when a milestone is marked complete, `celebrate("milestone")`; when a whole goal is marked complete (or its progress hits 100%), `celebrate("goal")`.

## 4. Frieren-themed icon swap

**File:** new `src/lib/frieren-icons.tsx`, edits in `AppShell.tsx` (nav icons) and section headers in `Goals.tsx`, `Tasks.tsx`, `Skills.tsx`, `Today.tsx`, `Dashboard.tsx`.

- Curated lucide swap (frieren-on → right column):

  ```text
  Goals (Target)        → Sparkles
  Tasks (CheckSquare)   → ScrollText
  Milestones (Flag)     → MapPin
  Skills (Brain)        → BookOpen
  Streak (Flame)        → Footprints
  Today (Sun)           → Moon
  Calendar (Calendar)   → CalendarHeart
  Settings (Settings)   → Wand2
  Completed (CheckCircle)→ Star
  ```

- Implementation: `frieren-icons.tsx` exports `useThemedIcon(defaultIcon: LucideIcon, key: string): LucideIcon`. It reads `settings.themeColor` from `useAppData` and returns the Frieren-mapped icon when active, else the default.
  - Each consumer changes `<Target className="…" />` to `const GoalIcon = useThemedIcon(Target, "goal"); <GoalIcon className="…" />`.
- Keep all existing icon classes/sizes intact — only the glyph swaps.

## Out of scope

- Generating bespoke SVG art for icons (deferred; lucide swap only).
- Persisting/synchronizing music playback across route changes (single mount in AppShell is enough).
- New theme variants beyond Frieren.

## Technical notes

- Music + SFX URLs are external CDN links. We won't bundle audio files. If a URL fails to load, the player logs once and stays silent — no UI error toast (background ambience should never be intrusive).
- Confetti uses `requestAnimationFrame`; safe during SSR because the helper bails when `typeof window === "undefined"`.
- The SSR hydration warning currently in the logs is unrelated (it's about a stray `<section>` from an earlier render) and is not introduced or fixed by this plan.
