import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Target,
  ListChecks,
  Sparkles,
  Menu,
  X,
  Palette,
  Network,
  CalendarCheck,
  CalendarDays,
  Home,
  Settings as SettingsIcon,
  Store,
} from "lucide-react";
import { ExportImport } from "@/components/life/ExportImport";
import { FrierenAmbience } from "@/components/life/FrierenAmbience";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemedIcon, type FrierenIconKey } from "@/lib/frieren-icons";

const TAB_TO_ICON_KEY: Partial<Record<TabId, FrierenIconKey>> = {
  goals: "goal",
  tasks: "task",
  skills: "skill",
  today: "today",
  calendar: "calendar",
  settings: "settings",
};



export type TabId =
  | "dashboard"
  | "today"
  | "calendar"
  | "overview"
  | "goals"
  | "tasks"
  | "bucket"
  | "skills"
  | "settings"
  | "marketplace";

const NAV: { id: TabId; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Overview & progress" },
  { id: "today", label: "Today", icon: CalendarCheck, hint: "What to focus on today" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, hint: "Your scheduled tasks" },
  { id: "overview", label: "Overview", icon: Network, hint: "Mindmap of skills, goals & tasks" },
  { id: "goals", label: "Goals", icon: Target, hint: "Goals & sub-goals" },
  { id: "tasks", label: "Tasks", icon: ListChecks, hint: "To-do list & focus schedule" },
  { id: "bucket", label: "Bucket list", icon: Sparkles, hint: "Lifetime wishes" },
  { id: "skills", label: "Skills", icon: Palette, hint: "Customize skill areas & colors" },
  { id: "settings", label: "Settings", icon: SettingsIcon, hint: "Text size, reminders, profile" },
  { id: "marketplace", label: "Marketplace", icon: Store, hint: "Community goals" },
];

interface Props {
  tab: TabId;
  onTab: (t: TabId) => void;
  children: ReactNode;
  stats: { goals: number; tasks: number; bucket: number };
  onHome?: () => void;
}

export function AppShell({ tab, onTab, children, stats, onHome }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = NAV.find((n) => n.id === tab)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FrierenAmbience />
      <div className="flex">

        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
          <Brand />
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={item.id === tab}
                onClick={() => onTab(item.id)}
                count={countFor(item.id, stats)}
              />
            ))}
          </nav>
          <SidebarFooter />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ThemedTabIcon id={active.id} fallback={active.icon} className="h-4 w-4 text-primary" />
                  <h1 className="font-display text-lg font-semibold tracking-tight">
                    {active.label}
                  </h1>
                </div>
                <p className="truncate text-xs text-muted-foreground">{active.hint}</p>
              </div>
              {onHome && (
                <Button size="icon" variant="ghost" onClick={onHome} aria-label="Home" title="Home">
                  <Home className="h-5 w-5" />
                </Button>
              )}
              <ExportImport />
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
          </main>

          <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground lg:px-8">
            Session-only. Export to keep your data; import to restore it.
          </footer>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between">
              <Brand />
              <Button
                size="icon"
                variant="ghost"
                className="mr-2"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={item.id === tab}
                  onClick={() => {
                    onTab(item.id);
                    setMobileOpen(false);
                  }}
                  count={countFor(item.id, stats)}
                />
              ))}
            </nav>
            <SidebarFooter />
          </aside>
        </div>
      )}
    </div>
  );
}

function countFor(id: TabId, s: Props["stats"]) {
  if (id === "goals") return s.goals;
  if (id === "tasks") return s.tasks;
  if (id === "bucket") return s.bucket;
  return undefined;
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display text-sm font-semibold leading-tight">Life Manager</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Session workspace
        </div>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
      Data stays in this browser tab.
      <br />
      Export to save · Import to restore.
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
  count,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <ThemedTabIcon
        id={item.id}
        fallback={item.icon}
        className={cn("h-4 w-4", active ? "" : "text-muted-foreground group-hover:text-foreground")}
      />
      <span className="flex-1 text-left">{item.label}</span>

      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ThemedTabIcon({
  id,
  fallback,
  className,
}: {
  id: TabId;
  fallback: typeof Menu;
  className?: string;
}) {
  const key = TAB_TO_ICON_KEY[id];
  const Icon = useThemedIcon(fallback, key ?? "goal");
  // If no Frieren mapping for this tab, useThemedIcon will still return fallback when not in Frieren.
  // When in Frieren but no key, fall back to the default icon.
  const Final = key ? Icon : fallback;
  return <Final className={className} />;
}

