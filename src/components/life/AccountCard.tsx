import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cloud, CloudOff, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/lib/app-data";

export function AccountCard() {
  const { userId, signOut } = useAppData();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setEmail(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {userId ? <Cloud className="h-4 w-4 text-primary" /> : <CloudOff className="h-4 w-4" />}
          Account & sync
        </CardTitle>
        <CardDescription>
          {userId
            ? "Your goals, sub-goals, tasks, skills and bucket list are saved to your account."
            : "Sign in to keep your data private to you and synced across devices."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userId ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Signed in{email ? ` as ${email}` : ""}
            </p>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Sign in / Create account</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
