# OneLife — Go-to-Production Readiness Report

**Date**: July 11, 2026  
**Repo**: christhe21/onelife  
**Focus**: Functional E2E deep dive on Calendar, Goals/SubGoals, Tasks/SubTasks + broken components report. Recommendations for production.

## Executive Summary

**Overall Assessment**: The core end-to-end functionality is **solid and production-viable for personal / closed-beta use**. The app implements a clean hierarchical life-management model (Skill → Goal → SubGoal/Milestone → Task → SubTask) with strong local-first persistence, cascading completion logic, scheduling, auto-scheduling, calendar visualization, and data portability.

**Strengths**:
- Robust data layer (`src/lib/app-data.tsx`) with normalization, business rules, auto-complete cascades, hours tracking, and recurrence handling.
- Calendar (`CalendarView.tsx`) fully integrated: month/week/day views, drag-to-reschedule, recurring projections, heatmaps/streaks, ICS export, event details/actions.
- Goal/Task/SubTask wizards and forms allow full creation/editing flows.
- Marketplace import + auto-schedule works end-to-end.
- Android wrapper matches web parity (bundled assets).
- Tests, CI (web + Android debug APK), and docs are present.

**Gaps for Full Public Production**:
- No signed release builds / Play Store setup.
- Several documented placeholders, dead code, and minor UX inconsistencies (detailed below).
- Limited advanced recurrence (basic types only; no full RRULE/BYDAY UI).
- Pure client-side (no cloud sync; manual export/import for multi-device).
- Some notification and SFX logic duplication or incomplete.

**Recommendation**: Ready for personal use or small beta today. Address the "Known Issues" list + add signing for broader distribution. Estimated polish effort: 1-2 weeks focused work.

---

## Deep Dive: Functional E2E Flows

### 1. Goal Setting & Sub-Goals (Milestones)
- **Entry Points**: `NewGoalWizard.tsx` (multi-step dialog with templates, basics → milestones → tasks → subtasks), direct `addGoal` in data layer, Marketplace import.
- **Flow**: Basics (title, desc, skill, targetDate) → optional template pre-fill → add/edit milestones (targetDate clamped to goal window) → tasks → subtasks → persist via `addGoal` + `addSubGoal` + `addTask`.
- **Data Model** (`app-data.tsx`): `Goal` has `subGoals: SubGoal[]` (id, title, targetDate, done). `ensureDefaultMilestone` creates "General" if none.
- **Logic**: `toggleSubGoal` cascades completion to linked tasks/subs. Goal status auto-promotes to in_progress/completed based on subs/tasks. Progress computed from linked tasks or subs %.
- **Validation**: Milestone dates within goal [start, target].
- **Status**: Fully functional and connected. Wizards handle creation cleanly; editing via Goals.tsx / detail views.

### 2. Tasks & Sub-Tasks
- **Creation**: `NewTaskWizard.tsx`, inline in wizards, `AddToScheduleDialog`.
- **Hierarchy**: Task links via `subGoalId` (preferred) or `goalId` (for recurring/daily). `subtasks: SubTask[]`.
- **Features**:
  - Recurrence: none | daily | weekly | monthly | yearly (on both Task & SubTask).
  - Toggle: Completes subtasks cascade; recurring bumps dates instead of marking done.
  - Hours: planned/spent tracked; auto-updated on completion via `hoursBetween`.
  - Reschedule: Drag on calendar or dialog updates dates.
- **SubTask specifics**: Same-day start/end for scheduled blocks. `toggleSubtask` can complete parent task (non-recurring).
- **Auto-Schedule** (`autoScheduleTasks` pure fn): Sophisticated — 9am-9pm slots, avoids overlaps, splits long tasks (>3h) into ~2h daily subs, only schedules subs if parent has them, respects existing blocks. Used in marketplace import and `autoScheduleGoal`/`autoScheduleSkill`.
- **Status**: Excellent E2E integration. Core flows (create → schedule → complete → cascade) work reliably. Minor: Advanced recurrence (weekdays/biweekly/custom BYDAY) planned in .lovable/plan.md but current model uses simple Recurrence enum + basic projection in CalendarView.

### 3. Calendar Integration
- **Views**: Month (grid with heat + streak badges + event chips), Week (timeline grid), Day (hourly slots with now indicator).
- **Data Source**: useMemo aggregates scheduled Tasks (those with startDate && no subtasks) + all SubTasks with startDate. Projects recurring via `getProjectedEvents` (simple addDays/Weeks/etc up to 365 horizon).
- **Interactions**:
  - Click event → details dialog (parent goal/task, status, toggle done, unschedule, reschedule).
  - Drag chips/days → `rescheduleTask`/`rescheduleSubtask` (updates dates, toasts).
  - Drop on day → same.
  - Add button → `AddToScheduleDialog`.
  - Export .ics (uses `calendar-export.ts`).
- **Visuals**: Color by skill, done strikethrough/opacity, goal title context, mobile-optimized (dots vs full chips).
- **Streaks/Heat**: Computed from completed events per day; contiguous day logic.
- **Status**: Very polished and functional. Full round-trip from goal/task creation → scheduling → calendar visualization → reschedule/complete. Recurring projection works for basic patterns. Minor note: Projection doesn't handle complex rules yet.

### 4. Cross-Cutting & Data Flow
- **Persistence**: localStorage ("life-manager:v1"), robust normalize* fns on import (ID regen on append, date correction for subtasks, validation).
- **Cascades**: SubGoal done → linked tasks done; Task/SubTask done → spentHours bump on goal; Goal completion celebration.
- **Notifications**: use-notifications.ts + Android NotificationScheduler (AlarmManager). Some duplication noted.
- **Export/Import**: Full JSON roundtrip (versioned), ICS calendar export. Marketplace templates import with optional auto-schedule.
- **Android Parity**: Bundled WebView assets; native bridge for file save, notifications, permissions. Matches web exactly.

**Conclusion on E2E**: All major flows (create goal/milestones/tasks/subs → schedule on calendar → complete with cascades → export) are implemented, tested in CI (Vitest + Kotlin), and feel cohesive. No major disconnects or broken core paths found in code review.

---

## Broken / Incomplete Components Report

These are drawn from code inspection, ANDROID.md (known issues section), plan.md, and verification artifacts. No catastrophic breaks; mostly polish items.

### High Priority / User-Facing
1. **Placeholder / Incomplete Features** (from ANDROID.md & code):
   - Welcome video stub in `Welcome.tsx` (no actual video).
   - Frieren ambience music not implemented (`test-music.ts` references missing `src/lib/music.ts`; chimes are partial).
   - Milestone chime broken (remote Mixkit URL returns 403; task/goal chimes self-hosted OK).
2. **Duplicate Notification Logic**: `use-notifications.ts` (task start, ignores lead time) vs `use-app-settings.ts` + Android scheduler (honors reminderLeadMinutes). Can double-notify in browser.
3. **Dead / Unused Code**: `OnboardingWizard.tsx` (superseded by `Onboarding.tsx`); stale files like `dom.html`, `dom2.html`, `replace_css.patch`, `verification/verify_dashboard.py`.
4. **Advanced Recurrence Incomplete**: Model supports only basic `Recurrence` enum. .lovable/plan.md outlined presets (weekdays, biweekly, custom BYDAY + RRULE fields) and `recurrenceRule` optional on Task/SubTask — not fully implemented in UI/data or calendar projection.
5. **Missing UI for Some Data Functions**: `autoScheduleGoal` / `autoScheduleSkill` exposed in context but limited/no prominent UI button in Goals/Skills views (marketplace import uses it optionally).

### Medium / Polish
6. **Branding Inconsistency**: "Life Manager" (README, some headers, export filenames) vs "OneLife" (manifest, PWA, Android).
7. **Route/UI Quirks**: `/create-goal` may lack full AppShell sidebar in some flows (per plan). Some dialogs or views have minor layout nits on mobile.
8. **Android-Specific**:
   - System bar theme follows device, not in-app toggle.
   - Exact alarms need "Alarms & reminders" special permission (Android 14+); otherwise delayed.
   - No in-WebView notifications (by design; native replaces).
9. **Release Build Pipeline**: CI only produces debug APKs. No keystore/secrets for signed releases (commented in android.yml). No version bump automation.
10. **No Cloud Sync**: Pure local — multi-device requires manual JSON export/import. Privacy win but friction for some users.

### Low / Repo Hygiene
- Stale verification/ assets and old plan files.
- Some tests focus on specific wizards; broader E2E or accessibility coverage could expand.
- Frieren theme SFX partial.

**No evidence of** broken core logic, data corruption, failing cascades, calendar desync, or wizard persistence issues in the reviewed code.

---

## Recommendations & Next Steps for Production

1. **Immediate Polish (1 week)**:
   - Fix documented placeholders (video stub, music URLs or remove references).
   - Unify/ dedupe notification systems.
   - Clean dead code and stale files.
   - Add prominent "Auto-schedule this goal/skill" buttons in UI.
   - Extend recurrence minimally (add weekdays/biweekly presets + simple rule storage) or document limitations.
2. **Release Readiness**:
   - Set up signing keystore + GitHub secrets.
   - Uncomment/enable release job in `.github/workflows/android.yml`.
   - Bump versionCode/Name on APK changes; tag releases.
   - Add privacy policy, terms, and Play Store assets (screenshots from verification/ folder are good starting point).
3. **Enhancements**:
   - Optional cloud sync (e.g., via Supabase or simple backend) for multi-device.
   - Full advanced scheduling UI (or keep simple + note limitations).
   - Expand tests (playwright E2E? more a11y).
   - Improve onboarding/welcome with real content.
4. **Docs & Tracking**:
   - This GO_TO_PRODUCTION.md lives in repo root.
   - Create GitHub issues for tracked items (see below or separate PR).
   - Update README with production status badge or link to this doc.

**Risk Level**: Low for personal/ beta. Medium for public app store (needs signing + polish on listed items).

---

## Created Artifacts
- This `GO_TO_PRODUCTION.md` committed to main.
- Key issues opened in repo for tracking (see GitHub Issues tab).

**Next Action for Maintainer**: Review this doc, prioritize issues, and iterate. The foundation is excellent — just polish and ship!

---

*Generated with deep code review of app-data.tsx, CalendarView.tsx, NewGoalWizard.tsx, ANDROID.md, plan.md, and related components.*