import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
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
  childCount: number;
  expanded: boolean;
}

const RING = { skill: 200, goal: 360, task: 500, sub: 600 };

export function MindMapCanvas() {
  const { skills, goals, tasks } = useAppData();
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(0.85);
  const [fullscreen, setFullscreen] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => {
    // default: root + all skills expanded; goals/tasks collapsed
    const s = new Set<string>(["root"]);
    return s;
  });
  // ensure all skills auto-expand on first render once data is in
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (skills.length === 0) return;
    initRef.current = true;
    setOpen((prev) => {
      const n = new Set(prev);
      skills.forEach((sk) => n.add(`s_${sk.id}`));
      return n;
    });
  }, [skills]);

  const dragging = useRef<{ x: number; y: number } | null>(null);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const expandAll = () => {
    const n = new Set<string>(["root"]);
    skills.forEach((sk) => n.add(`s_${sk.id}`));
    goals.forEach((g) => n.add(`g_${g.id}`));
    tasks.forEach((t) => n.add(`t_${t.id}`));
    setOpen(n);
  };
  const collapseAll = () => setOpen(new Set<string>(["root"]));

  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: { from: string; to: string; color: string; depth: number }[] = [];

    const activeSkills = skills.filter((s) => goals.some((g) => g.skill === s.id));
    const rootExpanded = open.has("root");
    nodes.push({
      id: "root",
      label: "You",
      x: 0,
      y: 0,
      r: 38,
      color: "hsl(var(--primary))",
      kind: "root",
      childCount: activeSkills.length,
      expanded: rootExpanded,
    });

    if (!rootExpanded) return { nodes, links };

    const skillCount = Math.max(activeSkills.length, 1);
    activeSkills.forEach((sk, i) => {
      const a = (i / skillCount) * Math.PI * 2 - Math.PI / 2;
      const sx = Math.cos(a) * RING.skill;
      const sy = Math.sin(a) * RING.skill;
      const skillGoals = goals.filter((g) => g.skill === sk.id);
      const skillExpanded = open.has(`s_${sk.id}`);
      nodes.push({
        id: `s_${sk.id}`,
        label: sk.label,
        x: sx,
        y: sy,
        r: 28,
        color: sk.color,
        kind: "skill",
        parent: "root",
        childCount: skillGoals.length,
        expanded: skillExpanded,
      });
      links.push({ from: "root", to: `s_${sk.id}`, color: sk.color, depth: 1 });

      if (!skillExpanded) return;
      const sectorHalf = Math.PI / skillCount;
      skillGoals.forEach((g, gi) => {
        const span = Math.max(skillGoals.length - 1, 1);
        const ga = a + ((gi / span) - 0.5) * sectorHalf * 0.95;
        const gx = Math.cos(ga) * RING.goal;
        const gy = Math.sin(ga) * RING.goal;
        const gTasks = tasks.filter((t) => t.goalId === g.id);
        const goalExpanded = open.has(`g_${g.id}`);
        nodes.push({
          id: `g_${g.id}`,
          label: g.title,
          x: gx,
          y: gy,
          r: 22,
          color: sk.color,
          kind: "goal",
          parent: `s_${sk.id}`,
          childCount: gTasks.length,
          expanded: goalExpanded,
        });
        links.push({ from: `s_${sk.id}`, to: `g_${g.id}`, color: sk.color, depth: 2 });

        if (!goalExpanded) return;
        const tSpan = Math.max(gTasks.length - 1, 1);
        const tSectorHalf = sectorHalf / Math.max(skillGoals.length, 1);
        gTasks.forEach((t, ti) => {
          const ta = ga + ((ti / tSpan) - 0.5) * tSectorHalf * 0.95;
          const txp = Math.cos(ta) * RING.task;
          const typ = Math.sin(ta) * RING.task;
          const sub = t.subtasks ?? [];
          const taskExpanded = open.has(`t_${t.id}`);
          nodes.push({
            id: `t_${t.id}`,
            label: t.title,
            x: txp,
            y: typ,
            r: 15,
            color: sk.color,
            kind: "task",
            parent: `g_${g.id}`,
            childCount: sub.length,
            expanded: taskExpanded,
          });
          links.push({ from: `g_${g.id}`, to: `t_${t.id}`, color: sk.color, depth: 3 });

          if (!taskExpanded) return;
          const sSpan = Math.max(sub.length - 1, 1);
          sub.forEach((s, si) => {
            const sa = ta + ((si / sSpan) - 0.5) * (tSectorHalf / Math.max(gTasks.length, 1)) * 0.95;
            const sxx = Math.cos(sa) * RING.sub;
            const syy = Math.sin(sa) * RING.sub;
            nodes.push({
              id: `st_${s.id}`,
              label: s.title,
              x: sxx,
              y: syy,
              r: 10,
              color: sk.color,
              kind: "subtask",
              parent: `t_${t.id}`,
              childCount: 0,
              expanded: true,
            });
            links.push({ from: `t_${t.id}`, to: `st_${s.id}`, color: sk.color, depth: 4 });
          });
        });
      });
    });

    return { nodes, links };
  }, [skills, goals, tasks, open]);

  const findNode = (id: string) => nodes.find((n) => n.id === id);

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = { x: e.clientX - tx, y: e.clientY - ty };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setTx(e.clientX - dragging.current.x);
    setTy(e.clientY - dragging.current.y);
  };
  const onUp = () => {
    dragging.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.2, Math.min(3, s * factor)));
  };
  const reset = () => {
    setTx(0);
    setTy(0);
    setScale(0.85);
  };

  // ESC exits fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const containerCls = fullscreen
    ? "fixed inset-0 z-50 bg-background p-3 flex flex-col"
    : "relative";
  const canvasCls = fullscreen
    ? "relative flex-1 w-full cursor-grab touch-none overflow-hidden rounded-lg border bg-muted/10 active:cursor-grabbing"
    : "relative h-[70vh] w-full cursor-grab touch-none overflow-hidden rounded-lg border bg-muted/10 active:cursor-grabbing";

  return (
    <div className={containerCls}>
      {/* top controls */}
      <div className={`flex items-center justify-between gap-2 ${fullscreen ? "mb-2" : "mb-2"}`}>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={collapseAll}>
            <ChevronsDownUp className="mr-1 h-3.5 w-3.5" />Collapse
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={expandAll}>
            <ChevronsUpDown className="mr-1 h-3.5 w-3.5" />Expand
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs"
          onClick={() => setFullscreen((f) => !f)}
        >
          {fullscreen ? <Minimize2 className="mr-1 h-3.5 w-3.5" /> : <Maximize2 className="mr-1 h-3.5 w-3.5" />}
          {fullscreen ? "Exit" : "Fullscreen"}
        </Button>
      </div>

      <div
        className={canvasCls}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onWheel={onWheel}
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <svg
          className="absolute left-1/2 top-1/2 select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center",
          }}
          width="1600"
          height="1600"
          viewBox="-800 -800 1600 1600"
        >
          <defs>
            <radialGradient id="root-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            </radialGradient>
            <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* curved links */}
          {links.map((l, i) => {
            const a = findNode(l.from);
            const b = findNode(l.to);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            // pull control point toward parent for an organic arc
            const cx = (a.x + mx) / 2;
            const cy = (a.y + my) / 2;
            const w = Math.max(0.8, 2.6 - l.depth * 0.5);
            return (
              <path
                key={i}
                d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                fill="none"
                stroke={l.color}
                strokeOpacity={0.45}
                strokeWidth={w}
                strokeLinecap="round"
              />
            );
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const interactive = n.childCount > 0;
            const labelW = Math.min(180, Math.max(60, n.label.length * 6.6));
            const labelH = 16;
            const labelY = n.r + 8;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                style={{ cursor: interactive ? "pointer" : "default" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (interactive) toggle(n.id);
                }}
                className="transition-transform hover:scale-110"
              >
                <circle
                  r={n.r}
                  fill={n.kind === "root" ? "url(#root-grad)" : n.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  fillOpacity={n.kind === "subtask" ? 0.7 : 0.92}
                  filter="url(#node-shadow)"
                />
                {/* collapsed badge */}
                {interactive && !n.expanded && (
                  <g transform={`translate(${n.r * 0.7},${-n.r * 0.7})`}>
                    <circle r={9} fill="hsl(var(--background))" stroke={n.color} strokeWidth={1.5} />
                    <text textAnchor="middle" dy="3" style={{ fontSize: 9, fontWeight: 600 }} fill={n.color}>
                      +{n.childCount}
                    </text>
                  </g>
                )}
                {/* label pill */}
                <g transform={`translate(${-labelW / 2}, ${labelY})`}>
                  <rect
                    width={labelW}
                    height={labelH}
                    rx={labelH / 2}
                    fill="hsl(var(--background))"
                    fillOpacity={0.92}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.8}
                  />
                  <text
                    x={labelW / 2}
                    y={labelH / 2 + 3.5}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: n.kind === "root" ? 11 : 10, fontWeight: n.kind === "root" || n.kind === "skill" ? 600 : 500 }}
                  >
                    {n.label.length > 26 ? n.label.slice(0, 25) + "…" : n.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* floating toolbar */}
        <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-lg border bg-background/90 p-1 shadow-md backdrop-blur">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setScale((s) => Math.min(3, s * 1.2))} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setScale((s) => Math.max(0.2, s * 0.8))} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={reset} title="Reset view">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setFullscreen((f) => !f)} title="Fullscreen">
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* zoom indicator */}
        <div className="absolute bottom-3 left-3 rounded-md border bg-background/90 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Tap a node to expand/collapse · drag to pan · scroll or pinch to zoom
      </p>
    </div>
  );
}
