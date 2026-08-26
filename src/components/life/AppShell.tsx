import { useEffect, useState, type ReactNode } from "react";
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
  Shield,
} from "lucide-react";
import { ExportImport } from "@/components/life/ExportImport";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/site";
import { BrandMark } from "@/components/marketing/BrandMark";
import { useThemedIcon, type FrierenIconKey } from "@/lib/frieren-icons";
import { useAppData } from "@/lib/app-data";
import { getRankProgress } from "@/lib/rank";
import { useRankUp } from "@/hooks/use-rank-up";

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

function RankChip({ onClick }: { onClick: () => void }) {
  const { totalPoints } = useAppData();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const p = getRankProgress(totalPoints ?? 0);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${p.rank} — ${(totalPoints ?? 0).toLocaleString("en-US")} points`}
      className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.97] hover:bg-accent sm:flex motion-reduce:active:scale-100"
    >
      <Shield className="h-3.5 w-3.5 text-primary" />
      <span className="max-w-[7rem] truncate">{p.rank}</span>
      <span className="text-muted-foreground">{(totalPoints ?? 0).toLocaleString("en-US")}</span>
    </button>
  );
}

export function AppShell({ tab, onTab, children, stats, onHome }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useRankUp();
  const active = NAV.find((n) => n.id === tab)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100]"
      >
        Skip to content
      </a>
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex xl:w-72">
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

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60">
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
                  <ThemedTabIcon
                    id={active.id}
                    fallback={active.icon}
                    className="h-4 w-4 text-primary"
                  />
                  <h1
                    data-tour="page-heading"
                    className="font-display text-lg font-semibold tracking-tight"
                  >
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
              <RankChip onClick={() => onTab("dashboard")} />
              <ExportImport />
            </div>
          </header>

          <main
            id="main-content"
            className="flex-1 overflow-x-hidden px-4 py-6 lg:px-10 lg:py-10 xl:px-12 xl:py-12 2xl:px-16"
          >
            <div className="mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
          </main>

          <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground lg:px-8">
            Session-only. Export to keep your data; import to restore it.
          </footer>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl animate-in slide-in-from-left duration-200 ease-out">
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
      <BrandMark className="h-9 w-9" />
      <div>
        <div className="font-display text-sm font-semibold leading-tight">{APP_NAME}</div>
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
      data-tour={`nav-${item.id}`}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.98] motion-reduce:active:scale-100",
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
  const Final = key ? Icon : fallback;
  return <Final className={className} />;
}
