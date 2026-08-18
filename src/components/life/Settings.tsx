import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccountCard } from "./AccountCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Bell, BellOff, Type, Music, Volume2, Upload, Star, Mail } from "lucide-react";
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
import { celebrate } from "@/lib/celebrate";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
  isNativeApp,
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  nativeShowNotification,
} from "@/lib/native-bridge";
import { Palette, Moon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  {
    id: "frieren",
    label: "Frieren (Beyond Journey's End)",
    primary: "bg-[#f1eee4]",
    secondary: "bg-[#4da8a3]",
  },
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

  const current: TextScale = settings.textScale ?? "base";
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
    // Android shell: route through the native POST_NOTIFICATIONS permission.
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
      <AccountCard />

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile & Rank</CardTitle>
          <CardDescription>Your gamified journey and skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
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
                <Upload className="h-4 w-4 mr-2" /> Upload
              </Button>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold">{settings.userName || "Adventurer"}</h3>
              <p className="text-muted-foreground text-lg">
                Rank: <span className="font-semibold text-primary">{overallRank}</span> (
                {overallPoints} pts)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Your Skills
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => {
                const points = getSkillPoints(goals, tasks, skill.id, settings.starredSkillId);
                const title = getSkillTitle(points);
                const isCore = CORE_SKILLS.includes(skill.id);
                const isStarred = settings.starredSkillId === skill.id;

                return (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.label}</span>
                        {isCore && (
                          <span className="text-[10px] uppercase bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                            Core (2x)
                          </span>
                        )}
                        {isStarred && (
                          <span className="text-[10px] uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            Starred (3x)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {title} · {points} pts
                      </span>
                    </div>
                    {!isCore && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={
                          isStarred
                            ? "Unstar skill"
                            : "Star this custom skill for a 3x point multiplier!"
                        }
                        onClick={() => {
                          if (isStarred) {
                            updateSettings({ starredSkillId: undefined });
                            toast.success("Skill unstarred");
                          } else {
                            updateSettings({ starredSkillId: skill.id });
                            toast.success(`${skill.label} starred for 3x multiplier!`);
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
                    ((settings.themeColor ?? "monochrome") === c.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border shadow-sm">
                    <div className={`h-full w-1/2 ${c.primary}`} />
                    <div className={`h-full w-1/2 ${c.secondary}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-foreground">
                    {c.label}
                  </span>
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
                    ((settings.themeColor ?? "monochrome") === c.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "hover:border-primary/40 hover:bg-muted/40")
                  }
                >
                  <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border shadow-sm">
                    <div className={`h-full w-1/2 ${c.primary}`} />
                    <div className={`h-full w-1/2 ${c.secondary}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-foreground">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {settings.themeColor === "frieren" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="h-4 w-4 text-primary" /> Frieren chimes & confetti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Soft fantasy ambience and gentle chimes to mark each step of your journey. Audio
              starts after your first click or keypress on the page.
            </p>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="min-w-0">
                <Label className="text-sm">Completion chimes & confetti</Label>
                <p className="text-xs text-muted-foreground">
                  Plays when you finish a task, milestone, or quest.
                </p>
              </div>
              <Switch
                checked={settings.frierenSfx ?? true}
                onCheckedChange={(v) => updateSettings({ frierenSfx: v })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => celebrate("task")}>
                Test task chime
              </Button>
              <Button size="sm" variant="outline" onClick={() => celebrate("milestone")}>
                Test milestone
              </Button>
              <Button size="sm" variant="outline" onClick={() => celebrate("goal")}>
                Test quest finale
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Mail className="h-4 w-4 text-primary" /> Email check-in reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            On the target date of a milestone, receive an email check-in. This turns passive target
            dates into active accountability check-ins.
          </p>

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

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="min-w-0">
              <Label className="text-sm">Email me on milestone target dates</Label>
            </div>
            <Switch
              checked={!!settings.emailRemindersEnabled}
              onCheckedChange={(v) => updateSettings({ emailRemindersEnabled: v })}
            />
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!settings.emailRemindersEnabled) {
                  toast.error("Email reminders are disabled.");
                  return;
                }
                if (!settings.email) {
                  toast.error("Please set an email address first.");
                  return;
                }

                toast.info("Checking due milestones...");

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
                    if (
                      !sg.done &&
                      sg.targetDate === todayStr &&
                      sg.lastEmailReminderSent !== todayStr
                    ) {
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
                  toast.success("No milestones due for reminders right now.");
                  return;
                }

                try {
                  const response = await fetch("/api/send-reminders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: settings.email, milestones: dueMilestones }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    if (data.sentCount > 0) {
                      dueMilestones.forEach((m) => {
                        updateSubGoal(m.goalId, m.id, { lastEmailReminderSent: todayStr });
                      });
                      toast.success(`Successfully sent ${data.sentCount} reminder(s).`);
                    } else {
                      toast.success("No milestones due for reminders right now.");
                    }
                  } else {
                    toast.error("Failed to send reminders");
                  }
                } catch {
                  toast.error("Error triggering reminders");
                }
              }}
            >
              <Mail className="mr-2 h-4 w-4" /> Send today's due milestones
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Use this to manually test your email configuration and receive current due milestones.
            </p>
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
            Get notified before tasks you've scheduled. In-tab reminders work anywhere; enable push
            below to receive them even when the app is closed.
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

          <div className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-sm">Push reminders (works when the app is closed)</Label>
                <p className="text-xs text-muted-foreground">
                  {!isAuthenticated
                    ? "Sign in to receive reminders on your devices."
                    : !push.supported
                      ? "This device can't receive push notifications."
                      : push.registered
                        ? "This device is registered."
                        : "Register this device to get reminders sent from the server."}
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
                      toast.success("Push reminders enabled on this device");
                    } else {
                      toast.error("Couldn't enable push on this device");
                    }
                  } else {
                    await push.disable();
                    toast.success("Push reminders turned off for this device");
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
                <Bell className="mr-2 h-4 w-4" /> Send test notification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
