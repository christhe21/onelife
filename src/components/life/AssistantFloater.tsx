import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Lightbulb, Loader2, Mic, MicOff, PhoneOff, Sparkles, X, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/lib/app-data";
import { supabase } from "@/integrations/supabase/client";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { applyAssistantAction, buildAssistantContext, type AssistantApi } from "@/lib/assistant-actions";

const KEY = "onelife:assistant-visible";
const EVENT = "onelife:assistant-visibility";

export function useAssistantVisibility() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const read = () => setVisible(localStorage.getItem(KEY) !== "0");
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  const update = (v: boolean) => {
    localStorage.setItem(KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  };
  return [visible, update] as const;
}

type Line = { role: "user" | "assistant" | "action"; text: string };

export function AssistantFloater() {
  const data = useAppData();
  const api = useRef<AssistantApi>(data as unknown as AssistantApi);
  api.current = data as unknown as AssistantApi;
  const [visible, setVisible] = useAssistantVisibility();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (role: Line["role"], text: string) =>
    setLines((cur) => {
      const last = cur[cur.length - 1];
      if (last && last.role === role && role !== "action") return [...cur.slice(0, -1), { role, text: last.text + text }];
      return [...cur.slice(-60), { role, text }];
    });

  const onEvent = (e: LiveEvent) => {
    if (e.type === "session.input_transcript.delta" && typeof e.delta === "string") push("user", e.delta);
    else if (e.type === "session.output_transcript.delta" && typeof e.delta === "string") push("assistant", e.delta);
    else if (e.type === "app.assistant.action" && typeof e.action === "string") {
      try {
        const msg = applyAssistantAction(api.current, e.action, (e.args as Record<string, unknown>) ?? {});
        push("action", msg);
        toast.success(msg);
      } catch (err) {
        push("action", err instanceof Error ? err.message : "Couldn't apply that");
      }
    }
  };

  const voice = useLiveVoice({
    onEvent,
    getStartData: async () => {
      const { data: s } = await supabase.auth.getSession();
      return { token: s.session?.access_token ?? "", context: buildAssistantContext(api.current) };
    },
  });
  const idle = voice.status === "idle" || voice.status === "closed";
  const live = voice.status === "connected";

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const sendSuggestion = async () => {
    const text = suggestion.trim();
    if (!text) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSending(false);
      return toast.error("Sign in to send a suggestion");
    }
    const { error } = await supabase.from("suggestions").insert({ user_id: u.user.id, text, source: "app" });
    setSending(false);
    if (error) return toast.error("Couldn't send your suggestion");
    toast.success("Suggestion sent — thank you!");
    setSuggestion("");
    setSuggesting(false);
  };

  return (
    <>
      {/* audio must stay mounted for the whole call */}
      <audio ref={voice.audioRef} className="hidden" />

      {!visible && (
        <button
          onClick={() => setVisible(true)}
          aria-label="Show assistant"
          className="fixed bottom-24 right-0 z-40 flex h-12 w-6 items-center justify-center rounded-l-lg border border-r-0 border-border bg-card text-muted-foreground shadow-md hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {visible && !open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open voice assistant"
          className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30 [animation-duration:2.6s]" />
          <span className="absolute -inset-1 rounded-full border border-primary/30 animate-pulse" />
          {live ? <Mic className="relative h-6 w-6" /> : <Sparkles className="relative h-6 w-6" />}
        </button>
      )}

      {visible && open && (
        <div
          role="dialog"
          aria-label="Voice assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" /> Assistant
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setVisible(false);
                }}
                title="Hide to the side"
              >
                <EyeOff className="h-4 w-4" /> Hide
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Minimize">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={logRef} className="min-h-40 flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm">
            {lines.length === 0 && (
              <p className="text-muted-foreground">
                Tap the mic and say things like “Add a goal to learn Java by March”, “Add the book Atomic Habits” or
                “Mark my walk task done”.
              </p>
            )}
            {lines.map((l, i) => (
              <div
                key={i}
                className={
                  l.role === "user"
                    ? "ml-8 rounded-lg bg-muted px-3 py-2"
                    : l.role === "assistant"
                      ? "mr-8 rounded-lg border border-border px-3 py-2"
                      : "text-center text-xs text-muted-foreground"
                }
              >
                {l.text}
              </div>
            ))}
          </div>

          {voice.error && <p role="alert" className="px-4 pb-2 text-xs text-destructive">{voice.error}</p>}

          {suggesting ? (
            <div className="space-y-2 border-t border-border p-4">
              <Textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="What would make OneLife better for you?"
                rows={3}
                maxLength={4000}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSuggesting(false)}>Cancel</Button>
                <Button size="sm" onClick={sendSuggestion} disabled={sending || !suggestion.trim()}>
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />} Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 border-t border-border p-4">
              <Button variant="ghost" size="sm" onClick={() => setSuggesting(true)}>
                <Lightbulb className="h-4 w-4" /> Suggestion
              </Button>
              <div className="flex items-center gap-2">
                {voice.playbackBlocked && <Button size="sm" variant="outline" onClick={voice.resumePlayback}>Play voice</Button>}
                {live && (
                  <Button size="icon" variant="outline" onClick={() => voice.setMuted(!voice.muted)} aria-label={voice.muted ? "Unmute" : "Mute"}>
                    {voice.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                {idle ? (
                  <Button onClick={() => { setLines([]); voice.start(); }} className="rounded-full">
                    <Mic className="h-4 w-4" /> Talk
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={voice.stop} disabled={voice.status === "stopping"} className="rounded-full">
                    {voice.status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
                    {voice.status === "connecting" ? "Connecting" : "End"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function AssistantSettingsCard() {
  const [visible, setVisible] = useAssistantVisibility();
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div>
        <div className="font-medium">Voice assistant</div>
        <p className="text-sm text-muted-foreground">Show the floating assistant button.</p>
      </div>
      <Button variant="outline" onClick={() => setVisible(!visible)}>{visible ? "Hide" : "Show"}</Button>
    </div>
  );
}
