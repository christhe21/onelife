import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import {
  createLovableAiGatewayProvider,
  describeAiError,
  PLANNING_MODEL,
  requireLovableApiKey,
} from "./ai-gateway.server";

/* ---------------------------------- types --------------------------------- */

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiPlanTaskSubtask {
  title: string;
  endDate?: string;
  hoursPerWeek?: number;
}
export interface AiPlanTask {
  title: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  milestone?: string;
  subtasks: AiPlanTaskSubtask[];
}
export interface AiGoalPlan {
  title: string;
  description: string;
  skill: string;
  targetDate: string;
  milestones: { title: string; date?: string }[];
  tasks: AiPlanTask[];
}

/* --------------------------------- schemas -------------------------------- */

const nullableString = z.string().nullable();

const planSchema = z.object({
  title: z.string(),
  description: z.string(),
  skill: z.string(),
  targetDate: z.string(),
  milestones: z.array(z.object({ title: z.string(), date: nullableString })),
  tasks: z.array(
    z.object({
      title: z.string(),
      dueDate: nullableString,
      priority: z.enum(["low", "medium", "high"]),
      milestone: nullableString,
      subtasks: z.array(
        z.object({
          title: z.string(),
          endDate: nullableString,
          hoursPerWeek: z.number().nullable(),
        }),
      ),
    }),
  ),
});

const interviewSchema = z.object({
  done: z.boolean(),
  question: nullableString,
  quickReplies: z.array(z.string()),
  summary: nullableString,
});

const listSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      date: nullableString,
      priority: z.enum(["low", "medium", "high"]).nullable(),
      hoursPerWeek: z.number().nullable(),
    }),
  ),
});

/* -------------------------------- utilities ------------------------------- */

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v: string | null | undefined) => (v && ISO.test(v) ? v : undefined);
const num = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

function transcriptText(messages: AiChatMessage[]) {
  return messages
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
    .join("\n")
    .slice(0, 8000);
}

async function run<T>(fn: (model: ReturnType<ReturnType<typeof createLovableAiGatewayProvider>>) => Promise<T>) {
  const gateway = createLovableAiGatewayProvider(requireLovableApiKey(), undefined, {
    structuredOutputs: true,
  });
  try {
    return await fn(gateway(PLANNING_MODEL));
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The AI returned an unexpected answer. Please try again.");
    }
    throw new Error(describeAiError(error));
  }
}

const COACH_SYSTEM = `You are the OneLife planning coach: warm, concrete, and brief.
You interview a person to understand ONE goal they want to achieve.
Ask exactly one question at a time, max 20 words, no preamble, no lists.
Cover in order: what they want to achieve, why now, a realistic deadline,
hours per week they can commit, their current level, and the biggest obstacle.
After 5-7 exchanges (or sooner if you already know enough), set done=true.
Provide 2-4 short quickReplies whenever plausible answers exist, otherwise an empty array.`;

const PLANNER_SYSTEM = `You are the OneLife planning coach. You turn an interview or a short description
into a realistic, actionable plan. Rules:
- 3 to 6 milestones, ordered, each with a date between today and the goal target date.
- 5 to 12 tasks; each task names the milestone it belongs to (use the exact milestone title).
- 0 to 4 subtasks per task, only where a task genuinely needs breaking down.
- All dates are ISO YYYY-MM-DD, never before today, never after the goal target date.
- Titles are short and action-first ("Run 3x per week", not "You should try running").
- Choose the single best life area id from the provided list.`;

/* ------------------------------ server actions ----------------------------- */

export const interviewTurn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return run(async (model) => {
      const { output } = await generateText({
        model,
        system: COACH_SYSTEM,
        output: Output.object({ schema: interviewSchema }),
        prompt:
          data.messages.length === 0
            ? "Start the interview with your first question."
            : `Conversation so far:\n${transcriptText(data.messages)}\n\nGive the next question, or finish.`,
      });
      return {
        done: output.done,
        question: output.question ?? undefined,
        quickReplies: output.quickReplies.slice(0, 4),
        summary: output.summary ?? undefined,
      };
    });
  });

const planInput = z.object({
  brief: z.string().min(1),
  today: z.string(),
  skills: z.array(z.object({ id: z.string(), label: z.string() })),
  preferredSkill: z.string().optional(),
  targetDate: z.string().optional(),
  hoursPerWeek: z.number().optional(),
});

export const generateGoalPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => planInput.parse(data))
  .handler(async ({ data }): Promise<AiGoalPlan> => {
    return run(async (model) => {
      const { output } = await generateText({
        model,
        system: PLANNER_SYSTEM,
        output: Output.object({ schema: planSchema }),
        prompt: [
          `Today is ${data.today}.`,
          data.targetDate ? `The user wants this done by ${data.targetDate}.` : "",
          data.hoursPerWeek ? `They can commit about ${data.hoursPerWeek} hours per week.` : "",
          `Available life area ids: ${data.skills.map((s) => `${s.id} (${s.label})`).join(", ")}.`,
          data.preferredSkill ? `Prefer the life area "${data.preferredSkill}" if it fits.` : "",
          "",
          "Input from the user:",
          data.brief,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      const allowed = new Set(data.skills.map((s) => s.id));
      const targetDate = clean(output.targetDate) ?? data.targetDate ?? data.today;
      return {
        title: output.title.trim() || "Untitled goal",
        description: output.description.trim(),
        skill: allowed.has(output.skill) ? output.skill : (data.preferredSkill ?? "life"),
        targetDate,
        milestones: output.milestones
          .filter((m) => m.title.trim())
          .slice(0, 8)
          .map((m) => ({ title: m.title.trim(), date: clean(m.date) })),
        tasks: output.tasks
          .filter((t) => t.title.trim())
          .slice(0, 16)
          .map((t) => ({
            title: t.title.trim(),
            dueDate: clean(t.dueDate),
            priority: t.priority,
            milestone: t.milestone?.trim() || undefined,
            subtasks: t.subtasks
              .filter((s) => s.title.trim())
              .slice(0, 6)
              .map((s) => ({
                title: s.title.trim(),
                endDate: clean(s.endDate),
                hoursPerWeek: num(s.hoursPerWeek),
              })),
          })),
      };
    });
  });

const suggestInput = z.object({
  kind: z.enum(["milestones", "tasks", "subtasks"]),
  today: z.string(),
  goalTitle: z.string(),
  goalDescription: z.string().optional(),
  targetDate: z.string().optional(),
  parentTitle: z.string().optional(),
  existing: z.array(z.string()).default([]),
});

export const suggestItems = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => suggestInput.parse(data))
  .handler(async ({ data }) => {
    const what =
      data.kind === "milestones"
        ? "3 to 6 milestones (checkpoints) for this goal"
        : data.kind === "tasks"
          ? "4 to 8 concrete next tasks for this goal"
          : "3 to 8 subtasks that break the task down";
    return run(async (model) => {
      const { output } = await generateText({
        model,
        system: PLANNER_SYSTEM,
        output: Output.object({ schema: listSchema }),
        prompt: [
          `Today is ${data.today}. Propose ${what}.`,
          `Goal: ${data.goalTitle}`,
          data.goalDescription ? `Context: ${data.goalDescription}` : "",
          data.parentTitle ? `Parent task: ${data.parentTitle}` : "",
          data.targetDate ? `Everything must be dated between today and ${data.targetDate}.` : "",
          data.existing.length
            ? `Do NOT repeat what already exists: ${data.existing.join("; ")}`
            : "",
          "Return short action-first titles with an ISO date each. Set priority for tasks, hoursPerWeek only for subtasks.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
      return output.items
        .filter((i) => i.title.trim())
        .slice(0, 10)
        .map((i) => ({
          title: i.title.trim(),
          date: clean(i.date),
          priority: i.priority ?? "medium",
          hoursPerWeek: num(i.hoursPerWeek),
        }));
    });
  });
