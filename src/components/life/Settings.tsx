import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Type } from "lucide-react";
import { toast } from "sonner";
import { useAppData, type TextScale, type ThemeMode, type ThemeColor } from "@/lib/app-data";
import { Palette, Moon } from "lucide-react";

const SCALES: { id: TextScale; label: string; size: string; px: number }[] = [
  { id: "sm", label: "Compact", size: "14px", px: 14 },
  { id: "base", label: "Default", size: "16px", px: 16 },
  { id: "lg", label: "Comfortable", size: "18px", px: 18 },
  { id: "xl", label: "Large", size: "20px", px: 20 },
];


const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const THEME_COLORS: { id: ThemeColor; label: string; primary: string; secondary: string }[] = [
  { id: "sage", label: "Sage & Cream", primary: "bg-[#7d9b76]", secondary: "bg-[#a8c0a0]" },
  { id: "ocean", label: "Ocean Blue", primary: "bg-[#2563eb]", secondary: "bg-[#93c5fd]" },
  { id: "sunset", label: "Sunset Coral", primary: "bg-[#f43f5e]", secondary: "bg-[#fda4af]" },
  { id: "lavender", label: "Lavender", primary: "bg-[#8b5cf6]", secondary: "bg-[#c4b5fd]" },
  { id: "monochrome", label: "Monochrome", primary: "bg-[#171717]", secondary: "bg-[#a3a3a3]" },
];

const SPECIAL_THEMES: { id: ThemeColor; label: string; primary: string; secondary: string }[] = [
  { id: "frieren", label: "Frieren (Beyond Journey's End)", primary: "bg-[#f1eee4]", secondary: "bg-[#4da8a3]" },
];

export function SettingsView() {
  const { settings, updateSettings } = useAppData();
  const current: TextScale = settings.textScale ?? "base";
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [name, setName] = useState(settings.userName ?? "");
  const [lead, setLead] = useState<number>(settings.reminderLeadMinutes ?? 10);

  useEffect(() => setName(settings.userName ?? ""), [settings.userName]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") {
      updateSettings({ notificationsEnabled: true });
      new Notification("Reminders are on", { body: "You'll be notified before scheduled tasks." });
    } else {
      updateSettings({ notificationsEnabled: false });
      toast.error("Permission denied. Enable it in your browser site settings.");
    }
  };

  const disableNotifications = () => {
    updateSettings({ notificationsEnabled: false });
    toast.success("Reminders paused");
  };

  const previewSamples = useMemo(
    () => [
      { tag: "Heading", className: "text-2xl font-semibold font-display" },
      { tag: "Body", className: "text-base" },
      { tag: "Small", className: "text-xs text-muted-foreground" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateSettings({ themeMode: m.id })}
                  className={
                    "flex flex-col items-center gap-1 rounded-xl border p-2 transition " +
                    ((settings.themeMode ?? "system") === m.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Color Theme</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateSettings({ themeColor: c.id })}
                  className={
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition " +
                    ((settings.themeColor ?? "sage") === c.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border shadow-sm">
                    <div className={`h-full w-1/2 ${c.primary}`} />
                    <div className={`h-full w-1/2 ${c.secondary}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-foreground">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Special Themes</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SPECIAL_THEMES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateSettings({ themeColor: c.id })}
                  className={
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition " +
                    ((settings.themeColor ?? "sage") === c.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border shadow-sm">
                    <div className={`h-full w-1/2 ${c.primary}`} />
                    <div className={`h-full w-1/2 ${c.secondary}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-foreground">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4 text-primary" /> Text size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Adjusts the base font size used across the app. All text scales with this setting.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SCALES.map((s) => (
              <button
                key={s.id}
                onClick={() => updateSettings({ textScale: s.id })}
                className={
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition " +
                  (current === s.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "hover:border-primary/40 hover:bg-muted/40")
                }
              >
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
                <span style={{ fontSize: s.size }} className="font-semibold">
                  Aa
                </span>
                <span className="text-[10px] text-muted-foreground">{s.size}</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Preview
            </p>
            <div className="space-y-1.5">
              {previewSamples.map((p) => (
                <div key={p.tag} className={p.className}>
                  {p.tag} — The quick brown fox jumps over the lazy dog.
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {settings.notificationsEnabled ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            Reminders & notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get a browser notification before tasks you've scheduled for today. Reminders fire while
            this tab is open — close-tab / background push isn't supported in this session-only
            build.
          </p>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="min-w-0">
              <Label className="text-sm">Enable browser notifications</Label>
              <p className="text-xs text-muted-foreground">
                Permission: <span className="font-medium">{permission}</span>
              </p>
            </div>
            <Switch
              checked={!!settings.notificationsEnabled && permission === "granted"}
              onCheckedChange={(v) => (v ? enableNotifications() : disableNotifications())}
              disabled={permission === "unsupported"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead">Remind me ahead of time (minutes)</Label>
              <Input
                id="lead"
                type="number"
                min={0}
                max={120}
                value={lead}
                onChange={(e) => setLead(Number(e.target.value))}
                onBlur={() =>
                  updateSettings({ reminderLeadMinutes: Math.max(0, Math.min(120, lead || 0)) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name (for greetings)</Label>
              <Input
                id="name"
                value={name}
                placeholder="e.g. Sam"
                onChange={(e) => setName(e.target.value)}
                onBlur={() => updateSettings({ userName: name.trim() || undefined })}
              />
            </div>
          </div>

          {permission !== "granted" && permission !== "unsupported" && (
            <Button onClick={enableNotifications} size="sm">
              <Bell className="mr-2 h-4 w-4" /> Request notification permission
            </Button>
          )}

          <div className="rounded-xl border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Want real push reminders?</p>
            For notifications that fire even when this tab is closed, we'd need to enable Lovable
            Cloud and wire up scheduled server functions + Web Push. Ask and I'll set it up.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
