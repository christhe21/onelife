import { useMemo, useState } from "react";
import {
  ExternalLink,
  Star,
  ShieldCheck,
  Clock,
  BookOpen,
  Lightbulb,
  ChevronRight,
  User,
  Search,
  LayoutGrid,
  List as ListIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MARKETPLACE_GOALS } from "@/data/marketplace";
import { MarketplaceGoalTemplate } from "@/lib/marketplace";

interface Props {
  onImport: (template: MarketplaceGoalTemplate) => void;
}

type ViewMode = "grid" | "list";

export function GoalMarketplace({ onImport }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceGoalTemplate | null>(null);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>("grid");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    MARKETPLACE_GOALS.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MARKETPLACE_GOALS.filter((t) => {
      if (activeTags.length > 0) {
        const has = activeTags.every((tag) => t.tags?.includes(tag));
        if (!has) return false;
      }
      if (!q) return true;
      const hay = [
        t.title,
        t.description,
        t.creatorName,
        t.skillName,
        t.difficulty ?? "",
        ...(t.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeTags]);

  const toggleTag = (tag: string) =>
    setActiveTags((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]));

  const handleContribute = () => {
    window.open(
      "https://github.com/lovable-dev/lovable/new/main/src/data/marketplace",
      "_blank",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Goal Marketplace</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Import community-curated goals complete with milestones, tasks, and schedules.
          </p>
        </div>
        <Button onClick={handleContribute} variant="outline" className="gap-2 self-start">
          <Star className="h-4 w-4" />
          Submit a Goal
        </Button>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search goals, tags, creators..."
              className="pl-9"
            />
          </div>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as ViewMode)}
            className="self-start"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const on = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTags([])}
                className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> clear
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No goals match your filters.
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onView={() => setSelectedTemplate(template)}
              onImport={() => onImport(template)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              onView={() => setSelectedTemplate(template)}
              onImport={() => onImport(template)}
            />
          ))}
        </div>
      )}

      <TemplateDialog
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onImport={(t) => {
          onImport(t);
          setSelectedTemplate(null);
        }}
      />
    </div>
  );
}

function TemplateCard({
  template,
  onView,
  onImport,
}: {
  template: MarketplaceGoalTemplate;
  onView: () => void;
  onImport: () => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="secondary" className="font-medium">
            {template.coverEmoji ? `${template.coverEmoji} ` : ""}
            {template.skillName}
          </Badge>
          {template.verified && (
            <Badge
              variant="outline"
              className="gap-1 border-primary/20 bg-primary/5 text-primary"
            >
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{template.title}</CardTitle>
        <CardDescription className="mt-2 line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{template.creatorName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{template.durationDays} Days</span>
          </div>
          {template.difficulty && (
            <span className="capitalize">{template.difficulty}</span>
          )}
        </div>
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Button variant="outline" className="w-full" onClick={onView}>
          View Details
        </Button>
        <Button className="w-full gap-2" onClick={onImport}>
          Use Goal
        </Button>
      </CardFooter>
    </Card>
  );
}

function TemplateRow({
  template,
  onView,
  onImport,
}: {
  template: MarketplaceGoalTemplate;
  onView: () => void;
  onImport: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {template.coverEmoji ? `${template.coverEmoji} ` : ""}
            {template.skillName}
          </Badge>
          <h3 className="truncate font-medium">{template.title}</h3>
          {template.verified && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified" />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {template.creatorName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.durationDays} days
          </span>
          {template.difficulty && <span className="capitalize">{template.difficulty}</span>}
          {template.tags?.slice(0, 4).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Button variant="outline" size="sm" onClick={onView}>
          View
        </Button>
        <Button size="sm" onClick={onImport}>
          Use
        </Button>
      </div>
    </div>
  );
}

function TemplateDialog({
  template,
  onClose,
  onImport,
}: {
  template: MarketplaceGoalTemplate | null;
  onClose: () => void;
  onImport: (template: MarketplaceGoalTemplate) => void;
}) {
  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 p-0">
        <div className="border-b p-6 pb-4">
          <DialogHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {template.coverEmoji ? `${template.coverEmoji} ` : ""}
                {template.skillName}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {template.durationDays} Days
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                By {template.creatorName}
              </span>
              {template.difficulty && (
                <span className="text-sm capitalize text-muted-foreground">
                  · {template.difficulty}
                </span>
              )}
            </div>
            <DialogTitle className="text-2xl">{template.title}</DialogTitle>
            <DialogDescription className="mt-2 text-base">{template.description}</DialogDescription>
            {template.tags && template.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {template.advice && (
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-primary">
                  <Lightbulb className="h-5 w-5" />
                  Creator's Advice
                </h4>
                <p className="text-sm leading-relaxed text-foreground/80">{template.advice}</p>
              </div>
            )}

            {template.resources.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  Learning Resources
                </h4>
                <ul className="space-y-2">
                  {template.resources.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {new URL(url).hostname.replace("www.", "")}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="mb-4 border-b pb-2 font-semibold">Structure Preview</h4>
              <div className="space-y-4">
                {template.subGoals.map((sg, i) => {
                  const subTasks = template.tasks.filter((t) => t.subGoalIndex === i);
                  return (
                    <div key={i} className="border-l-2 border-muted pl-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h5 className="text-sm font-medium">{sg.title}</h5>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Day {sg.dayOffset}
                        </span>
                      </div>
                      {sg.description && (
                        <p className="mb-1 text-xs text-muted-foreground">{sg.description}</p>
                      )}
                      <ul className="mt-1 space-y-1">
                        {subTasks.map((t, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {t.title}
                            {t.recurrence && t.recurrence !== "none" && (
                              <span className="italic opacity-70">({t.recurrence})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t bg-muted/30 p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onImport(template)}>Import This Goal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
