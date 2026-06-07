import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronsDownUp,
  ChevronsUpDown,
  Shuffle,
} from "lucide-react";
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

// Bright, saturated palette
const PALETTE = [
  "#A5B4FC",
  "#7DD3FC",
  "#5EEAD4",
  "#C4B5FD",
  "#FCA5A5",
  "#FDE68A",
  "#86EFAC",
  "#F0ABFC",
];
const ROOT_FILL = "#FCD34D";
const PAPER = "#fafbff";
const INK = "#1f2937";
const STORAGE_KEY = "mindmap-positions-v1";
// Layout constants for the radial non-overlap formula
const BASE_R = [0, 260, 460, 660, 860];
const MIN_ARC = 100; // px of arc length required per child center at any depth

// Darken a hex color so the border reads as a deeper shade of the fill
function darken(hex: string, amount = 0.4): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(full, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("mindmap-fonts")) return;
  const l = document.createElement("link");
  l.id = "mindmap-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap";
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
  const nodeDrag = useRef<{
    id: string;
    ox: number;
    oy: number;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  } | null>(null);

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

  // Seed positions via deterministic radial layout (no-overlap formula)
  const { nodes, links, seeds } = useMemo(() => {
    const nodes: Node[] = [];
    const links: { from: string; to: string; depth: number; curl: number }[] = [];
    const seeds: Record<string, { x: number; y: number }> = {};

    type Tree = {
      id: string;
      kind: Kind;
      label: string;
      parent?: string;
      childCount: number;
      expanded: boolean;
      fill: string;
      children: Tree[];
      depth: number;
      midAngle: number;
      sweep: number;
      leaves: number;
    };

    const activeSkills = skills.filter((s) => goals.some((g) => g.skill === s.id));
    const rootExpanded = open.has("root");
    const rootLabel = settings.userName?.trim()
      ? settings.userName.trim().toUpperCase()
      : "MY LIFE";

    const mk = (
      id: string,
      kind: Kind,
      label: string,
      fill: string,
      expanded: boolean,
      childCount: number,
      parent?: string,
    ): Tree => ({
      id,
      kind,
      label,
      parent,
      childCount,
      expanded,
      fill,
      children: [],
      depth: 0,
      midAngle: 0,
      sweep: 0,
      leaves: 1,
    });

    const root = mk("root", "root", rootLabel, ROOT_FILL, rootExpanded, activeSkills.length);
    if (rootExpanded) {
      activeSkills.forEach((sk, i) => {
        const skFill = PALETTE[i % PALETTE.length];
        const skillGoals = goals.filter((g) => g.skill === sk.id);
        const skillExpanded = open.has(`s_${sk.id}`);
        const skNode = mk(
          `s_${sk.id}`,
          "skill",
          sk.label,
          skFill,
          skillExpanded,
          skillGoals.length,
          "root",
        );
        root.children.push(skNode);
        if (!skillExpanded) return;
        skillGoals.forEach((g, gi) => {
          const gFill = PALETTE[(i + 2) % PALETTE.length];
          const gTasks = tasks.filter((t) => t.goalId === g.id);
          const goalExpanded = open.has(`g_${g.id}`);
          const gNode = mk(
            `g_${g.id}`,
            "goal",
            g.title,
            gFill,
            goalExpanded,
            gTasks.length,
            `s_${sk.id}`,
          );
          skNode.children.push(gNode);
          if (!goalExpanded) return;
          gTasks.forEach((t, ti) => {
            const tFill = PALETTE[(i + 4) % PALETTE.length];
            const sub = t.subtasks ?? [];
            const taskExpanded = open.has(`t_${t.id}`);
            const tNode = mk(
              `t_${t.id}`,
              "task",
              t.title,
              tFill,
              taskExpanded,
              sub.length,
              `g_${g.id}`,
            );
            gNode.children.push(tNode);
            if (!taskExpanded) return;
            sub.forEach((s) => {
              const sFill = PALETTE[(i + 3) % PALETTE.length];
              tNode.children.push(
                mk(`st_${s.id}`, "subtask", s.title, sFill, true, 0, `t_${t.id}`),
              );
            });
          });
        });
      });
    }

    // leaves count (collapsed = 1)
    const countLeaves = (n: Tree): number => {
      if (!n.expanded || n.children.length === 0) {
        n.leaves = 1;
        return 1;
      }
      n.leaves = n.children.reduce((s, c) => s + countLeaves(c), 0);
      return n.leaves;
    };
    countLeaves(root);

    // assign angle ranges starting at -π .. π
    const assign = (n: Tree, a0: number, a1: number, depth: number) => {
      n.depth = depth;
      n.midAngle = (a0 + a1) / 2;
      n.sweep = a1 - a0;
      if (!n.expanded || n.children.length === 0) return;
      const total = n.children.reduce((s, c) => s + c.leaves, 0) || 1;
      let a = a0;
      for (const c of n.children) {
        const sp = (a1 - a0) * (c.leaves / total);
        assign(c, a, a + sp, depth + 1);
        a += sp;
      }
    };
    assign(root, -Math.PI, Math.PI, 0);

    // determine per-depth radius: ensure arc length per child >= MIN_ARC
    const ringR = [...BASE_R];
    const visit = (n: Tree) => {
      if (n.depth > 0) {
        const need = MIN_ARC / Math.max(n.sweep, 0.001);
        if (need > (ringR[n.depth] ?? 0)) ringR[n.depth] = need;
      }
      n.children.forEach(visit);
    };
    visit(root);
    for (let d = 1; d < ringR.length; d++) {
      const min = (ringR[d - 1] ?? 0) + 160;
      const max = (ringR[d - 1] ?? 0) + 350;
      if ((ringR[d] ?? 0) < min) ringR[d] = min;
      if ((ringR[d] ?? 0) > max) ringR[d] = max;
    }

    // emit nodes + links + seed positions
    const emit = (n: Tree) => {
      if (n.depth === 0) {
        seeds[n.id] = { x: 0, y: 0 };
      } else {
        const R = ringR[n.depth] ?? BASE_R[BASE_R.length - 1];
        seeds[n.id] = { x: R * Math.cos(n.midAngle), y: R * Math.sin(n.midAngle) };
      }
      nodes.push({
        id: n.id,
        label: n.label,
        r: 40,
        kind: n.kind,
        parent: n.parent,
        childCount: n.childCount,
        expanded: n.expanded,
        fill: n.fill,
        stroke: n.fill,
      });
      n.children.forEach((c, idx) => {
        links.push({ from: n.id, to: c.id, depth: n.depth + 1, curl: idx % 2 === 0 ? 1 : -1 });
        emit(c);
      });
    };
    emit(root);

    return { nodes, links, seeds };
  }, [skills, goals, tasks, open, settings.userName]);

  const parentMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const n of nodes) {
      map.set(n.id, n.parent ?? null);
    }
    return map;
  }, [nodes]);

  const pos = (id: string) => {
    if (positions[id]) return positions[id];

    // Node isn't manually positioned. Traverse up to find the nearest ancestor
    // that has been manually positioned to apply its relative drag offset.
    let curr = parentMap.get(id);
    let offset = { x: 0, y: 0 };

    while (curr) {
      if (positions[curr] && seeds[curr]) {
        offset = {
          x: positions[curr].x - seeds[curr].x,
          y: positions[curr].y - seeds[curr].y,
        };
        break;
      }
      curr = parentMap.get(curr);
    }

    const base = seeds[id] ?? { x: 0, y: 0 };
    return { x: base.x + offset.x, y: base.y + offset.y };
  };

  const persist = (next: Record<string, { x: number; y: number }>) => {
    setPositions(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
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
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch {
        /* ignore */
      }
    }
    panDrag.current = null;
    nodeDrag.current = null;
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

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const onNodeDown = (e: React.PointerEvent<SVGGElement>, n: Node) => {
    e.stopPropagation();
    const p = pos(n.id);
    nodeDrag.current = {
      id: n.id,
      ox: p.x,
      oy: p.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
    };
  };
  const onNodeClick = (e: React.MouseEvent, n: Node) => {
    e.stopPropagation();
    if (nodeDrag.current?.moved) return;
    if (n.childCount > 0) toggle(n.id);
  };

  const containerCls = fullscreen
    ? "fixed inset-0 z-50 bg-background p-3 flex flex-col"
    : "relative";
  const canvasCls = fullscreen
    ? "relative flex-1 w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing"
    : "relative h-[70vh] w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing";

  const labelFont = (kind: Kind) => {
    const family = "'Manrope', ui-sans-serif, system-ui, sans-serif";
    if (kind === "root") return { family, size: 22, weight: 700 };
    if (kind === "skill") return { family, size: 16, weight: 700 };
    if (kind === "goal") return { family, size: 14, weight: 600 };
    if (kind === "task") return { family, size: 13, weight: 500 };
    return { family, size: 12, weight: 500 };
  };

  // approximate glyph width for Manrope at the given font size
  const measureWidth = (text: string, fontSize: number) => text.length * fontSize * 0.56;

  // returns half-width and half-height for a node based on its wrapped label
  const nodeBox = (kind: Kind, lines: string[], fontSize: number) => {
    const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
    const textW = measureWidth("M".repeat(Math.max(longest, 3)), fontSize);
    const padX = kind === "root" ? 24 : kind === "skill" ? 20 : 16;
    const padY = kind === "root" ? 16 : kind === "skill" ? 14 : 10;
    const lineH = fontSize + 4;
    const minHalfW = kind === "root" ? 60 : kind === "skill" ? 52 : 44;
    const minHalfH = kind === "root" ? 40 : kind === "skill" ? 36 : 22;
    const halfW = Math.max(minHalfW, textW / 2 + padX);
    const halfH = Math.max(minHalfH, (lines.length * lineH) / 2 + padY);
    return { halfW, halfH };
  };

  // Render helpers — circles/ellipses for root + skill, rounded rectangles otherwise
  const renderShape = (n: Node, hovered: boolean, halfW: number, halfH: number) => {
    const baseProps = {
      fill: n.fill,
      stroke: "none",
      strokeWidth: 0,
      vectorEffect: "non-scaling-stroke" as const,
      style: {
        filter: hovered
          ? "drop-shadow(0 6px 14px rgba(15,23,42,0.18))"
          : "drop-shadow(0 2px 6px rgba(15,23,42,0.12))",
      },
    };
    if (n.kind === "root" || n.kind === "skill") {
      // Skills are circle-like; root keeps a wider ellipse to fit the user's name
      const rx = n.kind === "skill" ? Math.max(halfW, halfH) : halfW;
      const ry = n.kind === "skill" ? Math.max(halfW, halfH) : halfH;
      return <ellipse cx={0} cy={0} rx={rx} ry={ry} {...baseProps} />;
    }
    const rxr = Math.min(14, halfH);
    return (
      <rect
        x={-halfW}
        y={-halfH}
        width={halfW * 2}
        height={halfH * 2}
        rx={rxr}
        ry={rxr}
        {...baseProps}
      />
    );
  };

  // wrap label into at most `maxLines` lines without truncating words when possible
  const wrap = (label: string, maxChars: number, maxLines = 3): string[] => {
    if (label.length <= maxChars) return [label];
    const words = label.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (next.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
        if (lines.length === maxLines - 1) {
          // last line: pack the rest, ellipsize only if it overflows badly
          const rest = words.slice(words.indexOf(w)).join(" ");
          if (rest.length <= maxChars * 1.4) {
            lines.push(rest);
          } else {
            lines.push(rest.slice(0, Math.floor(maxChars * 1.4) - 1) + "…");
          }
          return lines;
        }
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  return (
    <div className={containerCls}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={collapseAll}>
            <ChevronsDownUp className="mr-1 h-3.5 w-3.5" />
            Collapse
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={expandAll}>
            <ChevronsUpDown className="mr-1 h-3.5 w-3.5" />
            Expand
          </Button>
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={autoArrange}>
            <Shuffle className="mr-1 h-3.5 w-3.5" />
            Auto-arrange
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs"
          onClick={() => setFullscreen((f) => !f)}
        >
          {fullscreen ? (
            <Minimize2 className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="mr-1 h-3.5 w-3.5" />
          )}
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
            overflow: "visible",
          }}
          width="1800"
          height="1800"
          viewBox="-900 -900 1800 1800"
        >
          <defs>
            <marker
              id="mm-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
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
            // Show full label everywhere; wrap onto multiple lines and let the node box grow
            const displayLabel = n.label;
            const maxChars = n.kind === "root" ? 14 : n.kind === "skill" ? 14 : 18;
            const lines = wrap(displayLabel, maxChars, n.kind === "subtask" ? 2 : 3);

            const lineH = font.size + 2;
            const startY = -((lines.length - 1) * lineH) / 2 + font.size / 3;
            const { halfW, halfH } = nodeBox(n.kind, lines, font.size);
            const badgeX = halfW * 0.92;
            const badgeY = -halfH * 0.92;
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
                <title>{n.label}</title>
                {renderShape(n, hovered, halfW, halfH)}
                {interactive && !n.expanded && (
                  <g transform={`translate(${badgeX},${badgeY})`} style={{ pointerEvents: "none" }}>
                    <circle
                      r={10}
                      fill="#ffffff"
                      stroke={INK}
                      strokeOpacity={0.5}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      style={{ fontFamily: font.family, fontSize: 10, fontWeight: 700 }}
                      fill={INK}
                    >
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
                    letterSpacing: "-0.005em",
                  }}
                >
                  {lines.map((ln, i) => (
                    <tspan key={i} x={0} y={startY + i * lineH}>
                      {ln}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-lg border bg-background/90 p-1 shadow-md backdrop-blur">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.min(3, s * 1.2))}
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.max(0.2, s * 0.8))}
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={reset}
            title="Reset view"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setFullscreen((f) => !f)}
            title="Fullscreen"
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
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
