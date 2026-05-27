import { useRef, useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";

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
          <CardTitle className="font-display text-base">Mindmap</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tap a node to expand. Long-press (or double-click) to rename.
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
        </CardContent>
      </Card>
    </div>
  );
}
