import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Suggestion = {
  id: string;
  text: string;
  source: string | null;
  created_at: string;
};

/** Private inbox for suggestions sent through the assistant — no email needed. */
export function SuggestionsInbox() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("suggestions")
      .select("id, text, source, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      toast.error("Couldn't load suggestions");
      return;
    }
    setItems(data ?? []);
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete that suggestion");
      return;
    }
    setItems((prev) => prev.filter((s) => s.id !== id));
    toast.success("Suggestion deleted");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4 text-primary" /> Suggestions inbox
        </CardTitle>
        <CardDescription>
          Ideas you send through the assistant land here — only you can see them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground">Sign in to read your suggestions.</p>
        ) : loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Open the assistant and use “Send a suggestion” to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((s) => (
              <li
                key={s.id}
                className="flex items-start gap-3 rounded-xl border bg-card p-3 text-card-foreground"
              >
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm">{s.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "d MMM yyyy, h:mm a")}
                    {s.source ? ` · via ${s.source}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Delete suggestion"
                  onClick={() => void remove(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {isAuthenticated && items.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
