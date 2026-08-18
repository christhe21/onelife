import { useEffect, useMemo, useState } from "react";
import { Filter, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Goal, Skill } from "@/lib/app-data";

export type CalendarFilters = {
  skillIds: string[];
  goalIds: string[];
  subGoalIds: string[];
  priorities: string[];
  onlyIncomplete: boolean;
};

export const EMPTY_FILTERS: CalendarFilters = {
  skillIds: [],
  goalIds: [],
  subGoalIds: [],
  priorities: [],
  onlyIncomplete: false,
};

const STORE_KEY = "life-manager:calendar-filters";

export function filtersActiveCount(f: CalendarFilters) {
  return (
    f.skillIds.length +
    f.goalIds.length +
    f.subGoalIds.length +
    f.priorities.length +
    (f.onlyIncomplete ? 1 : 0)
  );
}

/** Persisted filter state (reads localStorage after hydration to stay SSR-safe). */
export function useCalendarFilters() {
  const [filters, setFilters] = useState<CalendarFilters>(EMPTY_FILTERS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CalendarFilters>;
      setFilters({
        skillIds: Array.isArray(parsed.skillIds) ? parsed.skillIds : [],
        goalIds: Array.isArray(parsed.goalIds) ? parsed.goalIds : [],
        subGoalIds: Array.isArray(parsed.subGoalIds) ? parsed.subGoalIds : [],
        priorities: Array.isArray(parsed.priorities) ? parsed.priorities : [],
        onlyIncomplete: !!parsed.onlyIncomplete,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  return [filters, setFilters] as const;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function Row({
  label,
  color,
  checked,
  onClick,
  indent,
}: {
  label: string;
  color?: string;
  checked: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
        indent && "pl-6",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      {color && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

export function CalendarFilterBar({
  filters,
  onChange,
  skills,
  goals,
  resultCount,
}: {
  filters: CalendarFilters;
  onChange: (f: CalendarFilters) => void;
  skills: Skill[];
  goals: Goal[];
  resultCount: number;
}) {
  const active = filtersActiveCount(filters);
  const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const subGoalById = useMemo(
    () => new Map(goals.flatMap((g) => g.subGoals.map((sg) => [sg.id, sg] as const))),
    [goals],
  );

  const chips: { key: string; label: string; clear: () => void }[] = [
    ...filters.skillIds.map((id) => ({
      key: `s${id}`,
      label: skillById.get(id)?.label ?? "Skill",
      clear: () => onChange({ ...filters, skillIds: toggle(filters.skillIds, id) }),
    })),
    ...filters.goalIds.map((id) => ({
      key: `g${id}`,
      label: goalById.get(id)?.title ?? "Goal",
      clear: () => onChange({ ...filters, goalIds: toggle(filters.goalIds, id) }),
    })),
    ...filters.subGoalIds.map((id) => ({
      key: `sg${id}`,
      label: subGoalById.get(id)?.title ?? "Milestone",
      clear: () => onChange({ ...filters, subGoalIds: toggle(filters.subGoalIds, id) }),
    })),
    ...filters.priorities.map((p) => ({
      key: `p${p}`,
      label: `${p} priority`,
      clear: () => onChange({ ...filters, priorities: toggle(filters.priorities, p) }),
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={active > 0 ? "default" : "outline"}
            className="h-8 gap-1.5"
            aria-label="Filters"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {active > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {active}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filters
            </span>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              Clear all
            </button>
          </div>

          <div className="flex items-center justify-between rounded-md px-2 py-2">
            <span className="text-sm">Only incomplete</span>
            <Switch
              checked={filters.onlyIncomplete}
              onCheckedChange={(v) => onChange({ ...filters, onlyIncomplete: v })}
            />
          </div>

          <Section title="Priority">
            {["high", "medium", "low"].map((p) => (
              <Row
                key={p}
                label={p[0]!.toUpperCase() + p.slice(1)}
                checked={filters.priorities.includes(p)}
                onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
              />
            ))}
          </Section>

          {skills.length > 0 && (
            <Section title="Skill">
              {skills.map((s) => (
                <Row
                  key={s.id}
                  label={s.label}
                  color={s.color}
                  checked={filters.skillIds.includes(s.id)}
                  onClick={() => onChange({ ...filters, skillIds: toggle(filters.skillIds, s.id) })}
                />
              ))}
            </Section>
          )}

          {goals.length > 0 && (
            <Section title="Goal / Milestone">
              {goals.map((g) => (
                <div key={g.id}>
                  <Row
                    label={g.title}
                    color={skillById.get(g.skill ?? "")?.color}
                    checked={filters.goalIds.includes(g.id)}
                    onClick={() => onChange({ ...filters, goalIds: toggle(filters.goalIds, g.id) })}
                  />
                  {g.subGoals.map((sg) => (
                    <Row
                      key={sg.id}
                      indent
                      label={sg.title}
                      checked={filters.subGoalIds.includes(sg.id)}
                      onClick={() =>
                        onChange({ ...filters, subGoalIds: toggle(filters.subGoalIds, sg.id) })
                      }
                    />
                  ))}
                </div>
              ))}
            </Section>
          )}
        </PopoverContent>
      </Popover>

      {chips.map((c) => (
        <Badge key={c.key} variant="secondary" className="h-7 gap-1 pl-2.5 pr-1 text-xs">
          <span className="max-w-[9rem] truncate">{c.label}</span>
          <button type="button" onClick={c.clear} aria-label={`Remove ${c.label} filter`}>
            <X className="h-3 w-3 opacity-70 hover:opacity-100" />
          </button>
        </Badge>
      ))}
      {filters.onlyIncomplete && (
        <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1 text-xs">
          Only incomplete
          <button
            type="button"
            onClick={() => onChange({ ...filters, onlyIncomplete: false })}
            aria-label="Remove incomplete filter"
          >
            <X className="h-3 w-3 opacity-70 hover:opacity-100" />
          </button>
        </Badge>
      )}
      {active > 0 && (
        <>
          <span className="text-xs text-muted-foreground tabular-nums">
            {resultCount} item{resultCount === 1 ? "" : "s"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear
          </Button>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 border-t border-border pt-2">
      <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
