import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Quote, CalendarDays } from "lucide-react";
import { useAppData, type Task } from "@/lib/app-data";
import { cn } from "@/lib/utils";
import { useFrierenVocabulary } from "@/lib/frieren";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  onGoTasks?: () => void;
  onGoGoals?: () => void;
  onGoCalendar?: () => void;
}

const QUOTE = {
  text: "The future depends on what you do today.",
  author: "Mahatma Gandhi",
};

const FRIEREN_QUOTE = {
  text: "The greatest joy of magic lies in searching for it.",
  author: "Frieren",
};

export function Today({ onGoTasks, onGoGoals, onGoCalendar }: Props) {
  const { tasks, goals, skills, settings, toggleTask } = useAppData();
  const vocab = useFrierenVocabulary();
  const quote = vocab.isFrieren ? FRIEREN_QUOTE : QUOTE;
  const today = todayISO();
  const name = settings.userName?.trim();

  const { dueToday, pending } = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const due = open.filter((t) => t.dueDate === today);
    const over = open.filter((t) => t.dueDate && t.dueDate < today);
    const unscheduled = open.filter((t) => !t.dueDate);

    // Sort logic or other filtering if needed. For now, pending = overdue + unscheduled.
    const pendingTasks = [...over, ...unscheduled];

    return { dueToday: due, pending: pendingTasks };
  }, [tasks, today]);

  const goalOf = (id?: string) => goals.find((g) => g.id === id);
  const skillOf = (g?: { skill: string }) => skills.find((s) => s.id === g?.skill);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const allEmpty = dueToday.length === 0 && pending.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">
            {greeting}
            {name ? `, ${name}` : ""}
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {onGoCalendar && (
          <Button onClick={onGoCalendar} size="sm" variant="outline" className="shrink-0">
            <CalendarDays className="mr-2 h-4 w-4" />
            See today's schedule
          </Button>
        )}
      </div>

      {/* Quote Section */}
      <Card className="bg-primary/5 border-primary/10 overflow-hidden relative">
        <div className="absolute top-4 left-4 text-primary/20">
          <Quote className="w-12 h-12" />
        </div>
        <CardContent className="pt-8 pb-6 px-8 relative z-10 text-center">
          <p className="text-lg md:text-xl font-medium font-display italic text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            "{quote.text}"
          </p>
          <p className="mt-4 text-sm font-semibold text-primary/80 uppercase tracking-widest">
            — {quote.author}
          </p>
        </CardContent>
      </Card>

      {allEmpty ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {vocab.isFrieren
                ? "A quiet day. Rest, and prepare for what lies ahead."
                : `You don't have any ${vocab.tasks.toLowerCase()} for today. Time to relax or plan ahead!`}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {onGoTasks && (
                <Button variant="default" onClick={onGoTasks}>
                  Open {vocab.task.toLowerCase()} list <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {onGoGoals && (
                <Button variant="outline" onClick={onGoGoals}>
                  Go to {vocab.goals.toLowerCase()}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Daily Tasks Section */}
          <Card className="h-fit min-w-0">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daily {vocab.tasks}</CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {dueToday.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {dueToday.length > 0 ? (
                <div className="space-y-4">
                  <TaskGroup
                    items={dueToday}
                    goalOf={goalOf}
                    skillOf={skillOf}
                    onToggle={toggleTask}
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No tasks due today.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks Section */}
          <Card className="h-fit min-w-0">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-muted-foreground">
                  Pending {vocab.tasks}
                </CardTitle>
                <Badge variant="outline" className="rounded-full">
                  {pending.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {pending.length > 0 ? (
                <div className="space-y-4">
                  <TaskGroup
                    items={pending}
                    goalOf={goalOf}
                    skillOf={skillOf}
                    onToggle={toggleTask}
                    showOverdueHighlight
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No pending tasks. You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  items,
  goalOf,
  skillOf,
  onToggle,
  showOverdueHighlight,
}: {
  items: Task[];
  goalOf: (id?: string) => { title: string; skill: string } | undefined;
  skillOf: (g?: { skill: string }) => { color: string; label: string } | undefined;
  onToggle: (id: string) => void;
  showOverdueHighlight?: boolean;
}) {
  const byGoal = new Map<string, Task[]>();
  for (const t of items) {
    const key = t.subGoalId ?? "__none__";
    if (!byGoal.has(key)) byGoal.set(key, []);
    byGoal.get(key)!.push(t);
  }

  const today = todayISO();

  return (
    <div className="space-y-5">
      {Array.from(byGoal.entries()).map(([key, ts]) => {
        const g = key === "__none__" ? undefined : goalOf(key);
        const sk = skillOf(g);
        return (
          <div key={key} className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground min-w-0">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: sk?.color ?? "#888" }}
              />
              <span className="truncate">{g?.title ?? "No specific goal"}</span>
            </div>
            <ul className="space-y-2">
              {ts.map((t) => {
                const isOverdue = showOverdueHighlight && t.dueDate && t.dueDate < today;
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "group flex w-full min-w-0 items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md",
                      isOverdue ? "border-destructive/30 bg-destructive/5" : "",
                    )}
                  >
                    <Checkbox
                      className="h-5 w-5 rounded-md"
                      checked={t.done}
                      onCheckedChange={() => onToggle(t.id)}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className={cn(
                          "truncate font-medium text-sm leading-tight",
                          t.done && "line-through text-muted-foreground",
                          isOverdue && !t.done && "text-destructive",
                        )}
                      >
                        {t.title}
                      </span>
                      {(t.dueDate || t.priority === "high") && (
                        <div className="flex gap-2 mt-1 items-center">
                          {t.priority === "high" && (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1 text-[9px] rounded-sm uppercase tracking-widest font-bold"
                            >
                              High Priority
                            </Badge>
                          )}
                          {t.dueDate && (
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                isOverdue ? "text-destructive" : "text-muted-foreground",
                              )}
                            >
                              {isOverdue ? "Overdue" : "Due"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
