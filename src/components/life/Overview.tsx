import { useRef, useState } from "react";
import { ChevronRight, Pencil, Network, ListTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";
import { MindMapCanvas } from "@/components/life/MindMapCanvas";

/**
 * Mindmap-style overview:
 *  - Skill (root) → Goals → Tasks
 *  - Single-tap toggles expand.
 *  - Long-press (500 ms) opens inline edit for the title of the node.
 */

type Mode = "view" | "edit";

function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<number | null>(null);
  const moved = useRef(false);
  const start = () => {
    moved.current = false;
    timer.current = window.setTimeout(() => {
      if (!moved.current) onLongPress();
    }, ms);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerMove: () => { moved.current = true; },
  };
}

function EditableLabel({
  value,
  onSave,
  className,
}: { value: string; onSave: (v: string) => void; className?: string }) {
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState(value);

  if (mode === "edit") {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onSave(draft.trim() || value); setMode("view"); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft.trim() || value); setMode("view"); }
            if (e.key === "Escape") { setDraft(value); setMode("view"); }
          }}
          className="h-7 w-56 text-sm"
        />
      </span>
    );
  }
  return (
    <span className={className} onDoubleClick={(e) => { e.stopPropagation(); setMode("edit"); }}>
      {value}
      <button
        type="button"
        className="ml-1 opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setMode("edit"); }}
        title="Edit"
      >
        <Pencil className="inline h-3 w-3" />
      </button>
    </span>
  );
}

export function Overview() {
  const { goals, tasks, skills, updateSkill, updateGoal, updateTask } = useAppData();
  const [openSkills, setOpenSkills] = useState<Set<string>>(new Set());
  const [openGoals, setOpenGoals] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"tree" | "map">("tree");

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else n.add(id);
    setter(n);
  };

  const goalsBySkill = (id: string) => goals.filter((g) => g.skill === id);
  const tasksByGoal = (id: string) => tasks.filter((t) => t.goalId === id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-base">
              {view === "tree" ? "Mindmap" : "Map view"}
            </CardTitle>
            <div className="flex items-center rounded-md border bg-background p-0.5">
              <Button
                size="sm"
                variant={view === "tree" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setView("tree")}
              >
                <ListTree className="mr-1 h-3.5 w-3.5" />Tree
              </Button>
              <Button
                size="sm"
                variant={view === "map" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setView("map")}
              >
                <Network className="mr-1 h-3.5 w-3.5" />Map
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {view === "tree"
              ? "Tap a node to expand. Long-press (or double-click) to rename."
              : "Drag to pan, scroll to zoom. Goals can link tasks directly or through sub-goals."}
          </p>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </div>

          {view === "map" ? (
            <MindMapCanvas />
          ) : (
            <div className="space-y-1">
              {skills.map((skill) => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  open={openSkills.has(skill.id)}
                  onToggle={() => toggle(openSkills, skill.id, setOpenSkills)}
                  onRename={(v) => updateSkill(skill.id, { label: v })}
                  goals={goalsBySkill(skill.id)}
                  openGoals={openGoals}
                  toggleGoal={(id) => toggle(openGoals, id, setOpenGoals)}
                  tasksByGoal={tasksByGoal}
                  updateGoal={updateGoal}
                  updateTask={updateTask}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SkillNodeProps {
  skill: { id: string; label: string; color: string };
  open: boolean;
  onToggle: () => void;
  onRename: (v: string) => void;
  goals: ReturnType<typeof useAppData>["goals"];
  openGoals: Set<string>;
  toggleGoal: (id: string) => void;
  tasksByGoal: (id: string) => ReturnType<typeof useAppData>["tasks"];
  updateGoal: ReturnType<typeof useAppData>["updateGoal"];
  updateTask: ReturnType<typeof useAppData>["updateTask"];
}

function SkillNode({
  skill, open, onToggle, onRename, goals, openGoals, toggleGoal, tasksByGoal, updateGoal, updateTask,
}: SkillNodeProps) {
  const longPress = useLongPress(() => {
    const next = prompt("Rename skill", skill.label);
    if (next && next.trim()) onRename(next.trim());
  });
  return (
    <div>
      <button
        type="button"
        className="group flex w-full select-none items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted/60"
        onClick={onToggle}
        {...longPress}
      >
        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: skill.color }} />
        <span className="font-medium">{skill.label}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {goals.length}
        </span>
      </button>
      {open && (
        <div className="ml-6 border-l border-border pl-3">
          {goals.length === 0 ? (
            <p className="py-2 text-xs italic text-muted-foreground">No goals yet.</p>
          ) : (
            goals.map((g) => {
              const tg = tasksByGoal(g.id);
              const gOpen = openGoals.has(g.id);
              return (
                <div key={g.id}>
                  <div
                    className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                    onClick={() => toggleGoal(g.id)}
                  >
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${gOpen ? "rotate-90" : ""}`} />
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: skill.color, opacity: 0.7 }} />
                    <EditableLabel value={g.title} onSave={(v) => updateGoal(g.id, { title: v })} />
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {tg.length} task{tg.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {gOpen && (
                    <div className="ml-5 border-l border-border/60 pl-3">
                      {tg.length === 0 ? (
                        <p className="py-1 text-xs italic text-muted-foreground">No linked tasks.</p>
                      ) : (
                        tg.map((t) => (
                          <div key={t.id} className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/60">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.done ? "bg-emerald-500" : "bg-slate-400"}`} />
                            <EditableLabel
                              className={t.done ? "line-through text-muted-foreground" : ""}
                              value={t.title}
                              onSave={(v) => updateTask(t.id, { title: v })}
                            />
                            {t.dueDate && <span className="ml-auto text-[10px] text-muted-foreground">{t.dueDate}</span>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

