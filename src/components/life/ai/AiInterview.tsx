import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppData } from "@/lib/app-data";
import {
  generateGoalPlan,
  interviewTurn,
  type AiChatMessage,
  type AiGoalPlan,
} from "@/lib/ai-plan.functions";
import { AiPlanReview } from "./AiPlanReview";
import { commitAiPlan } from "./plan-commit";

interface Props {
  onDone: (goalId: string) => void;
  onCancel?: () => void;
  preferredSkill?: string;
}

export function AiInterview({ onDone, onCancel, preferredSkill }: Props) {
  const { skills, addGoal, addSubGoal, addTask, ensureDefaultMilestone } = useAppData();
  const ask = useServerFn(interviewTurn);
  const plan = useServerFn(generateGoalPlan);

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiGoalPlan | null>(null);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const buildPlan = async (history: AiChatMessage[]) => {
    setBusy(true);
    setError(null);
    try {
      const result = await plan({
        data: {
          brief: history.map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`).join("\n"),
          today,
          skills: skills.map((s) => ({ id: s.id, label: s.label })),
          preferredSkill,
        },
      });
      setDraft(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const turn = async (history: AiChatMessage[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ask({ data: { messages: history } });
      if (res.done || !res.question) {
        await buildPlan(history);
        return;
      }
      setMessages([...history, { role: "assistant", content: res.question }]);
      setQuickReplies(res.quickReplies ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void turn([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    const history: AiChatMessage[] = [...messages, { role: "user", content: value }];
    setMessages(history);
    setAnswer("");
    setQuickReplies([]);
    void turn(history);
  };

  if (draft) {
    return (
      <AiPlanReview
        plan={draft}
        onChange={setDraft}
        busy={busy}
        onRegenerate={() => void buildPlan(messages)}
        onConfirm={() => {
          const goalId = commitAiPlan(
            { addGoal, addSubGoal, addTask, ensureDefaultMilestone },
            draft,
          );
          onDone(goalId);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Plan with AI</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          a few quick questions
        </Badge>
      </div>

      <div
        ref={scrollRef}
        className="max-h-64 space-y-2 overflow-y-auto rounded-xl border bg-muted/30 p-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
              m.role === "assistant"
                ? "bg-card text-foreground"
                : "ml-auto bg-primary text-primary-foreground",
            )}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </div>
        )}
        {messages.length === 0 && !busy && !error && (
          <p className="text-xs text-muted-foreground">Starting the conversation…</p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}{" "}
          <button className="underline" onClick={() => void turn(messages)}>
            Try again
          </button>
        </div>
      )}

      {quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickReplies.map((q) => (
            <Button key={q} variant="outline" size="sm" onClick={() => send(q)} disabled={busy}>
              {q}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={answer}
          placeholder="Type your answer…"
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send(answer);
            }
          }}
          disabled={busy}
        />
        <Button
          size="icon"
          aria-label="Send answer"
          onClick={() => send(answer)}
          disabled={busy || !answer.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-between">
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {messages.filter((m) => m.role === "user").length >= 2 && (
          <Button variant="outline" size="sm" onClick={() => void buildPlan(messages)} disabled={busy}>
            Build my plan now
          </Button>
        )}
      </div>
    </div>
  );
}
