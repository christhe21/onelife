import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccountCard } from "./AccountCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Type, Music, Upload, Star, Mail, Palette, User } from "lucide-react";
import { InstallAppButton } from "@/components/marketing/InstallAppButton";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useAppData,
  type TextScale,
  type ThemeMode,
  type ThemeColor,
  CORE_SKILLS,
} from "@/lib/app-data";
import { usePushReminders } from "@/hooks/use-push";
import { useAuth } from "@/hooks/use-auth";
import { getSkillPoints, getSkillTitle, getOverallRank } from "@/lib/rank";
import { RankLadderDialog } from "@/components/life/RankLadderDialog";
import { celebrate } from "@/lib/celebrate";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  isNativeApp,
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  nativeShowNotification,
} from "@/lib/native-bridge";

/** Two sizes only — anything larger broke layouts, so it was removed. */
const SCALES: { id: TextScale; label: string; size: string }[] = [
  { id: "base", label: "Default", size: "16px" },
  { id: "lg", label: "Comfortable", size: "18px" },
];

const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const THEME_COLORS: { id: ThemeColor; label: string; primary: string; secondary: string }[] = [
  { id: "monochrome", label: "Monochrome", primary: "bg-[#171717]", secondary: "bg-[#a3a3a3]" },
  { id: "ocean", label: "Ocean Blue", primary: "bg-[#2563eb]", secondary: "bg-[#93c5fd]" },
  { id: "sunset", label: "Sunset Coral", primary: "bg-[#f43f5e]", secondary: "bg-[#fda4af]" },
  { id: "lavender", label: "Lavender", primary: "bg-[#8b5cf6]", secondary: "bg-[#c4b5fd]" },
  { id: "frieren", label: "Frieren", primary: "bg-[#f1eee4]", secondary: "bg-[#4da8a3]" },
];

export function SettingsView() {
  const { settings, updateSettings, goals, tasks, skills, updateSubGoal } = useAppData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        updateSettings({ profileImage: dataUrl });
        toast.success("Profile picture updated");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const overallPoints = useMemo(() => {
    return skills.reduce((total, skill) => {
      return total + getSkillPoints(goals, tasks, skill.id, settings.starredSkillId);
    }, 0);
  }, [goals, tasks, skills, settings.starredSkillId]);

  const overallRank = getOverallRank(overallPoints);

  // Older sessions may hold "sm" or "xl"; both collapse into the two we keep.
  const current: TextScale = settings.textScale === "lg" || settings.textScale === "xl" ? "lg" : "base";

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    () =>
      getNativeNotificationPermission() ??
      (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
  );
  const [name, setName] = useState(settings.userName ?? "");
  const [lead, setLead] = useState<number>(settings.reminderLeadMinutes ?? 10);

  useEffect(() => setName(settings.userName ?? ""), [settings.userName]);

  const push = usePushReminders();
  const { isAuthenticated } = useAuth();

  const enableNotifications = async () => {
    if (isNativeApp()) {
      const p = await requestNativeNotificationPermission();
      setPermission(p);
      if (p === "granted") {
        updateSettings({ notificationsEnabled: true });
        nativeShowNotification("Reminders are on", "You'll be notified before scheduled tasks.");
      } else {
        updateSettings({ notificationsEnabled: false });
        toast.error("Permission denied. Enable it in your device's app settings.");
      }
      return;
    }
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

  const sendDueMilestones = async () => {
    if (!settings.emailRemindersEnabled) {
      toast.error("Email check-ins are turned off.");
      return;
    }
    if (!settings.email) {
      toast.error("Add an email address first.");
      return;
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dueMilestones: {
      id: string;
      goalId: string;
      title: string;
      goalTitle: string;
      targetDate: string;
    }[] = [];

    for (const goal of goals) {
      if (goal.status === "completed") continue;
      for (const sg of goal.subGoals) {
        if (!sg.done && sg.targetDate === todayStr && sg.lastEmailReminderSent !== todayStr) {
          dueMilestones.push({
            id: sg.id,
            goalId: goal.id,
            title: sg.title,
            goalTitle: goal.title,
            targetDate: sg.targetDate!,
          });
        }
      }
    }

    if (dueMilestones.length === 0) {
      toast.success("Nothing is due for a check-in right now.");
      return;
    }

    try {
      const response = await fetch("/api/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: settings.email, milestones: dueMilestones }),
      });
      if (!response.ok) {
        toast.error("Couldn't send the check-in email");
        return;
      }
      const data = await response.json();
      if (data.sentCount > 0) {
        dueMilestones.forEach((m) => {
          updateSubGoal(m.goalId, m.id, { lastEmailReminderSent: todayStr });
        });
        toast.success(`Sent ${data.sentCount} check-in${data.sentCount > 1 ? "s" : ""}.`);
      } else {
        toast.success("Nothing is due for a check-in right now.");
      }
    } catch {
      toast.error("Couldn't send the check-in email");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Account & profile ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Account & profile
          </CardTitle>
          <CardDescription>Your name, picture, rank and life areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountCard />

          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20">
                {settings.profileImage ? (
                  <AvatarImage src={settings.profileImage} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {settings.userName?.[0] ?? "?"}
                  </AvatarFallback>
                )}
              </Avatar>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Change
              </Button>
            </div>
            <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold">
                  {settings.userName || "Adventurer"}
                </h3>
                <RankLadderDialog>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Rank: <span className="font-semibold text-primary">{overallRank}</span> ·{" "}
                    {overallPoints} pts
                  </button>
                </RankLadderDialog>
              </div>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  placeholder="e.g. Sam"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => updateSettings({ userName: name.trim() || undefined })}
                />
              </div>
              <InstallAppButton size="sm" className="rounded-full px-5" />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Life areas
            </Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {skills.map((skill) => {
                const points = getSkillPoints(goals, tasks, skill.id, settings.starredSkillId);
                const title = getSkillTitle(points);
                const isCore = CORE_SKILLS.includes(skill.id);
                const isStarred = settings.starredSkillId === skill.id;

                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{skill.label}</span>
                        {isStarred && (
                          <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] uppercase text-primary-foreground">
                            3x
                          </span>
                        )}
                      </div>
                      <span className="block truncate text-xs text-muted-foreground">
                        {title} · {points} pts
                      </span>
                    </div>
                    {!isCore && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        aria-label={isStarred ? "Remove focus area" : "Make this a focus area"}
                        title={isStarred ? "Remove focus area" : "Focus area — earns 3x points"}
                        onClick={() => {
                          if (isStarred) {
                            updateSettings({ starredSkillId: undefined });
                            toast.success("Focus removed");
                          } else {
                            updateSettings({ starredSkillId: skill.id });
                            toast.success(`${skill.label} is now your focus area`);
                            celebrate("task");
                          }
                        }}
                      >
                        <Star
                          className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
          <CardDescription>Light or dark, colours, text size and sound</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Light or dark</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateSettings({ themeMode: m.id })}
                  className={
                    "flex items-center justify-center rounded-xl border p-2 text-sm font-medium transition " +
                    ((settings.themeMode ?? "system") === m.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Colours</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateSettings({ themeColor: c.id })}
                  className={
                    "flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition " +
                    ((settings.themeColor ?? "monochrome") === c.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border shadow-sm">
                    <div className={`h-full w-1/2 ${c.primary}`} />
                    <div className={`h-full w-1/2 ${c.secondary}`} />
                  </div>
                  <span className="min-w-0 truncate text-xs font-medium text-foreground">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Type className="h-4 w-4 text-primary" /> Text size
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {SCALES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateSettings({ textScale: s.id })}
                  className={
                    "flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition " +
                    (current === s.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <span className="text-sm font-medium">{s.label}</span>
                  <span style={{ fontSize: s.size }} className="font-semibold leading-none">
                    Aa
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="min-w-0">
              <Label className="flex items-center gap-2 text-sm">
                <Music className="h-4 w-4 text-primary" /> Completion sound & confetti
              </Label>
              <p className="text-xs text-muted-foreground">
                Plays when you finish a task, milestone or goal.
              </p>
            </div>
            <Switch
              checked={settings.frierenSfx ?? true}
              onCheckedChange={(v) => updateSettings({ frierenSfx: v })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => celebrate("task")}>
              Hear it
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Reminders ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {settings.notificationsEnabled ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            Reminders
          </CardTitle>
          <CardDescription>Nudges before scheduled work and milestone check-ins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="min-w-0">
              <Label className="text-sm">Notifications on this device</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="lead">Remind me this many minutes ahead</Label>
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

          <div className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-sm">Reminders when the app is closed</Label>
                <p className="text-xs text-muted-foreground">
                  {!isAuthenticated
                    ? "Sign in to receive reminders on your devices."
                    : !push.supported
                      ? "This device can't receive these."
                      : push.registered
                        ? "This device is registered."
                        : "Turn on to get reminders even when the app is shut."}
                </p>
              </div>
              <Switch
                checked={push.registered}
                disabled={!isAuthenticated || !push.supported || push.busy}
                onCheckedChange={async (v) => {
                  if (v) {
                    const ok = await push.enable();
                    if (ok) {
                      updateSettings({ notificationsEnabled: true });
                      toast.success("Reminders enabled on this device");
                    } else {
                      toast.error("Couldn't enable reminders on this device");
                    }
                  } else {
                    await push.disable();
                    toast.success("Turned off for this device");
                  }
                }}
              />
            </div>
            {push.registered && (
              <Button
                variant="outline"
                size="sm"
                disabled={push.busy}
                onClick={async () => {
                  const res = await push.test();
                  if (res && res.sent > 0) toast.success(`Test sent to ${res.sent} device(s)`);
                  else toast.error("Test notification could not be delivered");
                }}
              >
                <Bell className="mr-2 h-4 w-4" /> Send a test
              </Button>
            )}
          </div>

          <div className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" /> Email check-in on milestone dates
                </Label>
                <p className="text-xs text-muted-foreground">
                  A short email on the day a milestone is due.
                </p>
              </div>
              <Switch
                checked={!!settings.emailRemindersEnabled}
                onCheckedChange={(v) => updateSettings({ emailRemindersEnabled: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={settings.email ?? ""}
                onChange={(e) => updateSettings({ email: e.target.value.trim() || undefined })}
              />
            </div>
            <Button variant="outline" size="sm" onClick={sendDueMilestones}>
              <Mail className="mr-2 h-4 w-4" /> Send today's check-ins
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
