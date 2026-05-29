import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, ChevronsDownUp, ChevronsUpDown, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data";

type Kind = "root" | "skill" | "goal" | "task" | "subtask";

interface Node {
  id: string;
  label: string;
  r: number; // size hint
  kind: Kind;
  parent?: string;
  childCount: number;
  expanded: boolean;
  fill: string;
  stroke: string;
}

const RING = { skill: 220, goal: 380, task: 520, sub: 620 };
const PALETTE = ["#bfe3d4", "#f7c9a8", "#f3a9a0", "#cdb8f0", "#f5d97a", "#a9d8f0"];
const ROOT_FILL = "#cdb8f0";
const PAPER = "#fdf8f0";
const INK = "#2d3f2a";
const STORAGE_KEY = "mindmap-positions-v1";

function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("mindmap-fonts")) return;
  const l = document.createElement("link");
  l.id = "mindmap-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Caveat:wght@700&display=swap";
  document.head.appendChild(l);
}

export function MindMapCanvas() {
  const { skills, goals, tasks, settings } = useAppData();
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(0.85);
  const [fullscreen, setFullscreen] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set<string>(["root"]));
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => ensureFonts(), []);

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current || skills.length === 0) return;
    initRef.current = true;
    setOpen((prev) => {
      const n = new Set(prev);
      skills.forEach((sk) => n.add(`s_${sk.id}`));
      return n;
    });
  }, [skills]);

  const panDrag = useRef<{ x: number; y: number } | null>(null);
  const nodeDrag = useRef<{ id: string; ox: number; oy: number; startClientX: number; startClientY: number; moved: boolean } | null>(null);

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

  // Seed positions (radial) + node metadata
  const { nodes, links, seeds } = useMemo(() => {
    const nodes: Node[] = [];
    const links: { from: string; to: string; depth: number; curl: number }[] = [];
    const seeds: Record<string, { x: number; y: number }> = {};

    const activeSkills = skills.filter((s) => goals.some((g) => g.skill === s.id));
    const rootExpanded = open.has("root");
    const rootLabel = settings.userName?.trim() ? settings.userName.trim().toUpperCase() : "MY LIFE";
    seeds["root"] = { x: 0, y: 0 };
    nodes.push({
      id: "root", label: rootLabel, r: 60, kind: "root",
      childCount: activeSkills.length, expanded: rootExpanded,
      fill: ROOT_FILL, stroke: INK,
    });
    if (!rootExpanded) return { nodes, links, seeds };

    const skillCount = Math.max(activeSkills.length, 1);
    activeSkills.forEach((sk, i) => {
      const a = (i / skillCount) * Math.PI * 2 - Math.PI / 2;
      seeds[`s_${sk.id}`] = { x: Math.cos(a) * RING.skill, y: Math.sin(a) * RING.skill };
      const skillGoals = goals.filter((g) => g.skill === sk.id);
      const skillExpanded = open.has(`s_${sk.id}`);
      const skFill = PALETTE[i % PALETTE.length];
      nodes.push({
        id: `s_${sk.id}`, label: sk.label, r: 44, kind: "skill", parent: "root",
        childCount: skillGoals.length, expanded: skillExpanded,
        fill: skFill, stroke: sk.color,
      });
      links.push({ from: "root", to: `s_${sk.id}`, depth: 1, curl: (i % 2 === 0 ? 1 : -1) });

      if (!skillExpanded) return;
      const sectorHalf = Math.PI / skillCount;
      skillGoals.forEach((g, gi) => {
        const span = Math.max(skillGoals.length - 1, 1);
        const ga = a + ((gi / span) - 0.5) * sectorHalf * 0.95;
        seeds[`g_${g.id}`] = { x: Math.cos(ga) * RING.goal, y: Math.sin(ga) * RING.goal };
        const gTasks = tasks.filter((t) => t.goalId === g.id);
        const goalExpanded = open.has(`g_${g.id}`);
        nodes.push({
          id: `g_${g.id}`, label: g.title, r: 36, kind: "goal", parent: `s_${sk.id}`,
          childCount: gTasks.length, expanded: goalExpanded,
          fill: PALETTE[(i + 2) % PALETTE.length], stroke: sk.color,
        });
        links.push({ from: `s_${sk.id}`, to: `g_${g.id}`, depth: 2, curl: (gi % 2 === 0 ? 1 : -1) });

        if (!goalExpanded) return;
        const tSpan = Math.max(gTasks.length - 1, 1);
        const tSectorHalf = sectorHalf / Math.max(skillGoals.length, 1);
        gTasks.forEach((t, ti) => {
          const ta = ga + ((ti / tSpan) - 0.5) * tSectorHalf * 0.95;
          seeds[`t_${t.id}`] = { x: Math.cos(ta) * RING.task, y: Math.sin(ta) * RING.task };
          const sub = t.subtasks ?? [];
          const taskExpanded = open.has(`t_${t.id}`);
          nodes.push({
            id: `t_${t.id}`, label: t.title, r: 28, kind: "task", parent: `g_${g.id}`,
            childCount: sub.length, expanded: taskExpanded,
            fill: PALETTE[(i + 4) % PALETTE.length], stroke: sk.color,
          });
          links.push({ from: `g_${g.id}`, to: `t_${t.id}`, depth: 3, curl: (ti % 2 === 0 ? 1 : -1) });

          if (!taskExpanded) return;
          const sSpan = Math.max(sub.length - 1, 1);
          sub.forEach((s, si) => {
            const sa = ta + ((si / sSpan) - 0.5) * (tSectorHalf / Math.max(gTasks.length, 1)) * 0.95;
            seeds[`st_${s.id}`] = { x: Math.cos(sa) * RING.sub, y: Math.sin(sa) * RING.sub };
            nodes.push({
              id: `st_${s.id}`, label: s.title, r: 22, kind: "subtask", parent: `t_${t.id}`,
              childCount: 0, expanded: true,
              fill: PALETTE[(i + 3) % PALETTE.length], stroke: sk.color,
            });
            links.push({ from: `t_${t.id}`, to: `st_${s.id}`, depth: 4, curl: (si % 2 === 0 ? 1 : -1) });
          });
        });
      });
    });

    return { nodes, links, seeds };
  }, [skills, goals, tasks, open, settings.userName]);

  const pos = (id: string) => positions[id] ?? seeds[id] ?? { x: 0, y: 0 };

  const persist = (next: Record<string, { x: number; y: number }>) => {
    setPositions(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const autoArrange = () => persist({});

  // Canvas pan
  const onCanvasDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (nodeDrag.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    panDrag.current = { x: e.clientX - tx, y: e.clientY - ty };
  };
  const onCanvasMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (nodeDrag.current) {
      const nd = nodeDrag.current;
      const dx = (e.clientX - nd.startClientX) / scale;
      const dy = (e.clientY - nd.startClientY) / scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) nd.moved = true;
      setPositions((prev) => ({ ...prev, [nd.id]: { x: nd.ox + dx, y: nd.oy + dy } }));
      return;
    }
    if (!panDrag.current) return;
    setTx(e.clientX - panDrag.current.x);
    setTy(e.clientY - panDrag.current.y);
  };
  const onCanvasUp = () => {
    if (nodeDrag.current) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch { /* ignore */ }
    }
    panDrag.current = null;
    nodeDrag.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.2, Math.min(3, s * factor)));
  };
  const reset = () => { setTx(0); setTy(0); setScale(0.85); };

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const onNodeDown = (e: React.PointerEvent<SVGGElement>, n: Node) => {
    e.stopPropagation();
    const p = pos(n.id);
    nodeDrag.current = { id: n.id, ox: p.x, oy: p.y, startClientX: e.clientX, startClientY: e.clientY, moved: false };
  };
  const onNodeClick = (e: React.MouseEvent, n: Node) => {
    e.stopPropagation();
    if (nodeDrag.current?.moved) return;
    if (n.childCount > 0) toggle(n.id);
  };

  const containerCls = fullscreen ? "fixed inset-0 z-50 bg-background p-3 flex flex-col" : "relative";
  const canvasCls = fullscreen
    ? "relative flex-1 w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing"
    : "relative h-[70vh] w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing";

  const labelFont = (kind: Kind) => {
    if (kind === "root") return { family: "'Patrick Hand', cursive", size: 26, weight: 700 };
    if (kind === "skill") return { family: "'Patrick Hand', cursive", size: 18, weight: 700 };
    if (kind === "goal") return { family: "'Patrick Hand', cursive", size: 16, weight: 700 };
    if (kind === "task") return { family: "'Patrick Hand', cursive", size: 14, weight: 700 };
    return { family: "'Patrick Hand', cursive", size: 13, weight: 700 };
  };

  // approximate glyph width for Patrick Hand at the given font size
  const measureWidth = (text: string, fontSize: number) => text.length * fontSize * 0.52;

  // returns half-width and half-height for a node based on its wrapped label
  const nodeBox = (kind: Kind, lines: string[], fontSize: number) => {
    const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
    const textW = measureWidth(" ".repeat(Math.max(longest, 4)), fontSize);
    const padX = kind === "root" ? 28 : kind === "skill" ? 22 : 18;
    const padY = kind === "root" ? 18 : 12;
    const lineH = fontSize + 4;
    const halfW = Math.max(54, textW / 2 + padX);
    const halfH = Math.max(28, (lines.length * lineH) / 2 + padY);
    return { halfW, halfH };
  };

  // Render helpers
  const renderShape = (n: Node, hovered: boolean, halfW: number, halfH: number) => {
    const baseProps = {
      fill: n.fill,
      stroke: n.stroke,
      strokeWidth: hovered ? 3 : 2,
      vectorEffect: "non-scaling-stroke" as const,
      style: { filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.08))" },
    };
    // Ellipses for root, skill, and goal (text fits in)
    if (n.kind === "root" || n.kind === "skill" || n.kind === "goal") {
      return <ellipse cx={0} cy={0} rx={halfW} ry={halfH} {...baseProps} />;
    }
    // Parallelograms for task and subtask
    const skew = halfH * 0.45;
    const points = [
      `${-halfW + skew},${-halfH}`,
      `${halfW + skew},${-halfH}`,
      `${halfW - skew},${halfH}`,
      `${-halfW - skew},${halfH}`,
    ].join(" ");
    return <polygon points={points} {...baseProps} />;
  };


  // wrap label into max 2 lines
  const wrap = (label: string, maxChars: number): string[] => {
    if (label.length <= maxChars) return [label];
    const words = label.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > maxChars) {
        if (cur) lines.push(cur);
        cur = w;
      } else cur = (cur + " " + w).trim();
      if (lines.length === 1 && (cur.length > maxChars)) break;
    }
    if (cur) lines.push(cur);
    if (lines.length > 2) {
      lines.length = 2;
      lines[1] = lines[1].slice(0, maxChars - 1) + "…";
    }
    return lines;
  };

  return (
    <div className={containerCls}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={collapseAll}>
            <ChevronsDownUp className="mr-1 h-3.5 w-3.5" />Collapse
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={expandAll}>
            <ChevronsUpDown className="mr-1 h-3.5 w-3.5" />Expand
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={autoArrange}>
            <Shuffle className="mr-1 h-3.5 w-3.5" />Auto-arrange
          </Button>
        </div>
        <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? <Minimize2 className="mr-1 h-3.5 w-3.5" /> : <Maximize2 className="mr-1 h-3.5 w-3.5" />}
          {fullscreen ? "Exit" : "Fullscreen"}
        </Button>
      </div>

      <div
        className={canvasCls}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        onPointerLeave={onCanvasUp}
        onWheel={onWheel}
        style={{
          background: `${PAPER} radial-gradient(circle at 20% 30%, rgba(0,0,0,0.025) 0 1px, transparent 1px) 0 0/18px 18px`,
        }}
      >
        <svg
          className="absolute left-1/2 top-1/2 select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center",
            shapeRendering: "geometricPrecision",
          }}
          width="1800"
          height="1800"
          viewBox="-900 -900 1800 1800"
        >
          <defs>
            <marker id="mm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={INK} />
            </marker>
          </defs>

          {/* arrows */}
          {links.map((l, i) => {
            const a = pos(l.from);
            const b = pos(l.to);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            // shorten end so arrow doesn't overlap shape
            const pad = 38;
            const ex = b.x - (dx / len) * pad;
            const ey = b.y - (dy / len) * pad;
            const sx = a.x + (dx / len) * pad * 0.7;
            const sy = a.y + (dy / len) * pad * 0.7;
            // wavy control point
            const mx = (sx + ex) / 2 + (-dy / len) * 30 * l.curl;
            const my = (sy + ey) / 2 + (dx / len) * 30 * l.curl;
            const w = Math.max(1.2, 2.4 - l.depth * 0.3);
            return (
              <path
                key={i}
                d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                fill="none"
                stroke={INK}
                strokeOpacity={0.75}
                strokeWidth={w}
                strokeLinecap="round"
                markerEnd="url(#mm-arrow)"
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const p = pos(n.id);
            const interactive = n.childCount > 0;
            const hovered = hoverId === n.id;
            const font = labelFont(n.kind);
            const maxChars = n.kind === "root" ? 14 : n.kind === "skill" ? 14 : n.kind === "goal" ? 18 : n.kind === "task" ? 20 : 18;
            const lines = wrap(n.label, maxChars);
            const lineH = font.size + 2;
            const startY = -((lines.length - 1) * lineH) / 2 + font.size / 3;
            const { halfW, halfH } = nodeBox(n.kind, lines, font.size);
            const badgeX = halfW * (n.kind === "task" || n.kind === "subtask" ? 0.95 : 0.85);
            const badgeY = -halfH * 0.85;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                style={{ cursor: interactive ? "pointer" : "grab", touchAction: "none" }}
                onPointerDown={(e) => onNodeDown(e, n)}
                onPointerEnter={() => setHoverId(n.id)}
                onPointerLeave={() => setHoverId((id) => (id === n.id ? null : id))}
                onClick={(e) => onNodeClick(e, n)}
              >
                {renderShape(n, hovered, halfW, halfH)}
                {interactive && !n.expanded && (
                  <g transform={`translate(${badgeX},${badgeY})`} style={{ pointerEvents: "none" }}>
                    <circle r={11} fill={PAPER} stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    <text textAnchor="middle" dy="3.5" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 11, fontWeight: 700 }} fill={INK}>
                      +{n.childCount}
                    </text>
                  </g>
                )}
                <text
                  textAnchor="middle"
                  fill={INK}
                  style={{
                    fontFamily: font.family,
                    fontSize: font.size,
                    fontWeight: font.weight,
                    pointerEvents: "none",
                    userSelect: "none",
                    paintOrder: "stroke",
                    stroke: n.fill,
                    strokeWidth: 3,
                    strokeLinejoin: "round",
                  }}
                >
                  {lines.map((ln, i) => (
                    <tspan key={i} x={0} y={startY + i * lineH}>{ln}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>

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

        <div className="absolute bottom-3 left-3 rounded-md border bg-background/90 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Drag nodes to rearrange · tap to expand/collapse · drag empty space to pan · scroll to zoom
      </p>
    </div>
  );
}
