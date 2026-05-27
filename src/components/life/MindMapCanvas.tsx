import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  kind: "root" | "skill" | "goal" | "task" | "subtask";
  parent?: string;
}

const SKILL_RING = 180;
const GOAL_RING = 320;
const TASK_RING = 440;
const SUB_RING = 540;

export function MindMapCanvas() {
  const { skills, goals, tasks } = useAppData();
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: { from: string; to: string; color: string }[] = [];
    nodes.push({ id: "root", label: "You", x: 0, y: 0, r: 36, color: "hsl(var(--primary))", kind: "root" });

    const activeSkills = skills.filter((s) => goals.some((g) => g.skill === s.id));
    const skillCount = Math.max(activeSkills.length, 1);

    activeSkills.forEach((sk, i) => {
      const a = (i / skillCount) * Math.PI * 2 - Math.PI / 2;
      const sx = Math.cos(a) * SKILL_RING;
      const sy = Math.sin(a) * SKILL_RING;
      nodes.push({ id: `s_${sk.id}`, label: sk.label, x: sx, y: sy, r: 26, color: sk.color, kind: "skill", parent: "root" });
      links.push({ from: "root", to: `s_${sk.id}`, color: sk.color });

      const skillGoals = goals.filter((g) => g.skill === sk.id);
      const sectorHalf = Math.PI / skillCount;
      skillGoals.forEach((g, gi) => {
        const span = Math.max(skillGoals.length - 1, 1);
        const ga = a + ((gi / span) - 0.5) * sectorHalf * 0.9;
        const gx = Math.cos(ga) * GOAL_RING;
        const gy = Math.sin(ga) * GOAL_RING;
        nodes.push({ id: `g_${g.id}`, label: g.title, x: gx, y: gy, r: 20, color: sk.color, kind: "goal", parent: `s_${sk.id}` });
        links.push({ from: `s_${sk.id}`, to: `g_${g.id}`, color: sk.color });

        const gTasks = tasks.filter((t) => t.goalId === g.id);
        const tSpan = Math.max(gTasks.length - 1, 1);
        const tSectorHalf = sectorHalf / Math.max(skillGoals.length, 1);
        gTasks.forEach((t, ti) => {
          const ta = ga + ((ti / tSpan) - 0.5) * tSectorHalf * 0.9;
          const tx = Math.cos(ta) * TASK_RING;
          const ty = Math.sin(ta) * TASK_RING;
          nodes.push({ id: `t_${t.id}`, label: t.title, x: tx, y: ty, r: 14, color: sk.color, kind: "task", parent: `g_${g.id}` });
          links.push({ from: `g_${g.id}`, to: `t_${t.id}`, color: sk.color });

          const sub = t.subtasks ?? [];
          const sSpan = Math.max(sub.length - 1, 1);
          sub.forEach((s, si) => {
            const sa = ta + ((si / sSpan) - 0.5) * (tSectorHalf / Math.max(gTasks.length, 1)) * 0.9;
            const sxx = Math.cos(sa) * SUB_RING;
            const syy = Math.sin(sa) * SUB_RING;
            nodes.push({
              id: `st_${s.id}`,
              label: s.title,
              x: sxx,
              y: syy,
              r: 9,
              color: sk.color,
              kind: "subtask",
              parent: `t_${t.id}`,
            });
            links.push({ from: `t_${t.id}`, to: `st_${s.id}`, color: sk.color });
          });
        });
      });
    });

    return { nodes, links };
  }, [skills, goals, tasks]);

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = { x: e.clientX - tx, y: e.clientY - ty };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setTx(e.clientX - dragging.current.x);
    setTy(e.clientY - dragging.current.y);
  };
  const onUp = () => { dragging.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.25, Math.min(2.5, s * factor)));
  };
  const reset = () => { setTx(0); setTy(0); setScale(1); };

  const findNode = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="relative h-[70vh] w-full cursor-grab touch-none overflow-hidden rounded-lg border bg-muted/20 active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onWheel={onWheel}
      >
        <svg
          className="absolute left-1/2 top-1/2 select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center",
          }}
          width="1400"
          height="1400"
          viewBox="-700 -700 1400 1400"
        >
          {links.map((l, i) => {
            const a = findNode(l.from);
            const b = findNode(l.to);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={l.color}
                strokeOpacity={0.35}
                strokeWidth={1.2}
              />
            );
          })}
          {nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <circle
                r={n.r}
                fill={n.kind === "root" ? "hsl(var(--background))" : n.color}
                stroke={n.color}
                strokeWidth={n.kind === "root" ? 3 : 2}
                fillOpacity={n.kind === "subtask" ? 0.55 : 0.9}
              />
              <text
                y={n.r + 12}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: n.kind === "root" ? 14 : n.kind === "skill" ? 12 : 10 }}
              >
                {n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.25, s * 0.8))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={reset} title="Reset view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Drag to pan · scroll/pinch to zoom · skills → goals → tasks → sub-tasks
      </p>
    </div>
  );
}
