# AI planning coach for OneLife

Add Lovable AI to three places: onboarding (a short interview that produces your first goal), goal creation (describe an outcome, get a full milestone/task/subtask plan), and task creation (break a task into subtasks).

## 1. AI onboarding interview

New step inserted in the onboarding flow (`welcome → areas → start → …`) as a third "Start mode" option: **Plan with AI**.

- The AI asks one question at a time (5-7 questions max), conversational, like a coach: what do you want to change, why now, deadline, weekly time available, current level, obstacles.
- The user answers in free text (with quick-reply chips when the AI offers options).
- When the interview has enough signal, the AI returns a structured plan: goal title, description/why, life area, target date, 3-6 milestones with dates, 5-12 tasks (with priority, due date, milestone link), optional subtasks with weekly hours.
- A review screen shows the proposed hierarchy with edit/delete per row, then "Create it" writes everything through the existing `addGoal` / `addSubGoal` / `addTask`.
- Skippable at every point; if AI fails or credits run out, the existing Blank / Template / Explore modes still work and the error is shown plainly.

## 2. AI goal planner (in-app)

- "Plan with AI" button on the Goals page and inside the create-goal wizard.
- Input: a sentence plus optional deadline and hours/week; output: the same structured plan, shown in the same review screen component before anything is saved.
- Existing goals get "Suggest milestones" / "Suggest next tasks", which propose additions only (never rewrite what exists) and respect the goal's date bounds.

## 3. AI task breakdown

- "Break down with AI" in the task wizard and on a task row: returns 3-8 subtasks with titles, deadlines clamped inside the parent task window, and suggested weekly hours.
- Shown as checkable suggestions; the user accepts all or a subset.

## Shared behaviour

- Dates are always clamped into valid ranges (today ≤ milestone ≤ goal target) before saving, matching current wizard rules.
- Every task the AI generates is attached to a milestone, keeping the Task → Milestone → Goal rule.
- All AI output is a proposal — nothing is written to your data until you confirm.
- Nothing is stored server-side; the interview transcript lives in component state for the session only.

## Technical notes

- Server boundary: `src/lib/ai-gateway.server.ts` (gateway provider helper) plus `src/lib/ai-plan.functions.ts` exposing `createServerFn` endpoints: `interviewTurn`, `generateGoalPlan`, `suggestMilestones`, `suggestTasks`, `breakdownTask`. `LOVABLE_API_KEY` read inside handlers only.
- Model: `google/gemini-3.7-flash` via the Lovable AI Gateway with the AI SDK (`ai`, `@ai-sdk/openai-compatible`).
- Structured output via `Output.object` with small, constraint-free zod schemas (limits stated in the prompt, clamped in code), wrapped in a `NoObjectGeneratedError` guard with a graceful fallback.
- Interview state: full message history resent each turn; the model returns `{ nextQuestion | done, quickReplies, draftPlan }`.
- New UI: `src/components/life/ai/AiInterview.tsx`, `AiPlanReview.tsx`, `AiBreakdownDialog.tsx`; wired into `Onboarding.tsx`, `CreateGoalWizard.tsx`, `NewGoalWizard.tsx`, `NewTaskWizard.tsx`, `SubtaskFormDialog.tsx`, `Goals.tsx`.
- Gateway errors surfaced in-UI per status contract (429/5xx retry with backoff; 402/403 show the message and stop). Provision `LOVABLE_API_KEY` if missing.
- Update `Onboarding.test.tsx` for the added start mode; mock the server functions.
