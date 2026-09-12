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
import { cn } from "@/lib/utils";
import { useAppData, type Task } from "@/lib/app-data";
import { useTheme } from "@/hooks/use-theme";

type Kind = "root" | "skill" | "goal" | "milestone" | "task" | "subtask";

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

// Fallback palette when a skill has no color set
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
const UNLINKED_FILL = "#cbd5e1"; // gray only for genuinely unlinked nodes

const STORAGE_KEY = "mindmap-positions-v1";

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

// Pick black or white text based on the perceived luminance of a hex fill
function inkOn(hex: string): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.length >= 6
        ? h.slice(0, 6)
        : "888888";
  const num = parseInt(full, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  // Rec. 709 relative luminance
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#111827" : "#f9fafb";
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
  const { isDark } = useTheme();
  const ink = isDark ? "#e5e7eb" : "#1f2937"; // text-gray-200 : text-gray-800
  // Softer dark-grey for edges/arrows so they don't read as harsh black.
  const edge = isDark ? "#9ca3af" : "#4b5563"; // gray-400 : gray-600

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

  // Resolve a skill id → color from the live skills palette (same path goals use).
  // Lookup at render time so nodes stay in sync if a goal's skill ever changes.
  const skillColor = (skillId?: string | null, fallbackIndex = 0): string => {
    if (skillId) {
      const found = skills.find((s) => s.id === skillId);
      if (found?.color) return found.color;
    }
    return PALETTE[fallbackIndex % PALETTE.length];
  };

  // For a task: goalId first; else walk subGoalId → parent goal → skill.
  // Returns undefined only when the task is genuinely unlinked.
  const resolveTaskSkillId = (t: Task): string | undefined => {
    if (t.goalId) {
      const g = goals.find((gg) => gg.id === t.goalId);
      if (g?.skill) return g.skill;
    }
    if (t.subGoalId) {
      const g = goals.find((gg) => gg.subGoals?.some((sg) => sg.id === t.subGoalId));
      if (g?.skill) return g.skill;
    }
    return undefined;
  };

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
        // Prefer the skill's own color from the palette; fall back to index
        const skFill = skillColor(sk.id, i);
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
        skillGoals.forEach((g) => {
          // Goal color = its skill field looked up against the skills palette
          const gFill = skillColor(g.skill, i);
          const gMilestones = g.subGoals ?? [];
          const goalExpanded = open.has(`g_${g.id}`);
          const gNode = mk(
            `g_${g.id}`,
            "goal",
            g.title,
            gFill,
            goalExpanded,
            gMilestones.length,
            `s_${sk.id}`,
          );
          skNode.children.push(gNode);
          if (!goalExpanded) return;
          gMilestones.forEach((m) => {
            // Milestone inherits the parent goal's skill color
            const mFill = gFill;
            const mTasks = tasks.filter((t) => t.subGoalId === m.id);
            const mExpanded = open.has(`m_${m.id}`);
            const mNode = mk(
              `m_${m.id}`,
              "milestone",
              m.title,
              mFill,
              mExpanded,
              mTasks.length,
              `g_${g.id}`,
            );
            gNode.children.push(mNode);
            if (!mExpanded) return;
            mTasks.forEach((t) => {
              // Task under a milestone: same skill color as the goal (lookup at render time)
              const tFill = skillColor(g.skill, i);
              const tExpanded = open.has(`t_${t.id}`);
              const tNode = mk(
                `t_${t.id}`,
                "task",
                t.title,
                tFill,
                tExpanded,
                t.subtasks.length,
                `m_${m.id}`,
              );
              mNode.children.push(tNode);
              if (!tExpanded) return;
              t.subtasks.forEach((st) => {
                tNode.children.push(
                  mk(`st_${st.id}`, "subtask", st.title, "#f1f5f9", false, 0, `t_${t.id}`),
                );
              });
            });
          });
        });
      });
      // Attach tasks without a subGoalId (daily/standing or general) to the Root.
      // Color them by resolving goalId → goal.skill (or subGoalId if present).
      // Only genuinely unlinked tasks stay gray.
      const unlinkedTasks = tasks.filter((t) => !t.subGoalId);
      unlinkedTasks.forEach((t) => {
        const skillId = resolveTaskSkillId(t);
        const tFill = skillId ? skillColor(skillId) : UNLINKED_FILL;
        const taskExpanded = open.has(`t_${t.id}`);
        const tNode = mk(
          `t_${t.id}`,
          "task",
          t.title,
          tFill,
          taskExpanded,
          t.subtasks.length,
          "root",
        );
        root.children.push(tNode);
        if (!taskExpanded) return;
        t.subtasks.forEach((s) => {
          tNode.children.push(
            mk(`st_${s.id}`, "subtask", s.title, "#f1f5f9", true, 0, `t_${t.id}`),
          );
        });
      });
    }

    // ── Layered tidy-tree layout ────────────────────────────────────────
    // Every level sits on its own row; x is packed from subtree widths so
    // siblings never overlap and parents centre over their children.
    const nodeWidth = (kind: Kind, label: string) => {
      const base =
        kind === "root" ? 240 : kind === "skill" ? 190 : kind === "subtask" ? 170 : 200;
      const est = Math.min(300, Math.max(base, label.length * 8 + 48));
      return est;
    };
    const H_GAP = 26;
    const ROW_H = (depth: number) => (depth === 0 ? 150 : depth === 1 ? 140 : 130);

    // Pass 1: measure subtree widths (post-order).
    const widthOf = new Map<string, number>();
    const measure = (n: Tree): number => {
      const own = nodeWidth(n.kind, n.label);
      if (!n.expanded || n.children.length === 0) {
        widthOf.set(n.id, own);
        return own;
      }
      const kids = n.children.reduce((s, c) => s + measure(c), 0) + H_GAP * (n.children.length - 1);
      const w = Math.max(own, kids);
      widthOf.set(n.id, w);
      return w;
    };
    measure(root);

    // Pass 2: assign positions (pre-order), children packed left→right inside
    // the parent's own subtree band, parent centred over that band.
    const place = (n: Tree, left: number, y: number, depth: number) => {
      n.depth = depth;
      const band = widthOf.get(n.id) ?? nodeWidth(n.kind, n.label);
      const cx = left + band / 2;
      seeds[n.id] = { x: cx, y };
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
      if (!n.expanded || n.children.length === 0) return;

      const kidsWidth =
        n.children.reduce((s, c) => s + (widthOf.get(c.id) ?? 0), 0) +
        H_GAP * (n.children.length - 1);
      let cursor = cx - kidsWidth / 2;
      const childY = y + ROW_H(depth);
      n.children.forEach((c, idx) => {
        const w = widthOf.get(c.id) ?? 0;
        links.push({ from: n.id, to: c.id, depth: depth + 1, curl: idx % 2 === 0 ? 1 : -1 });
        place(c, cursor, childY, depth + 1);
        cursor += w + H_GAP;
      });
    };
    place(root, 0, 0, 0);

    // Centre the whole tree on the root so panning starts sensibly.
    const rootX = seeds["root"]?.x ?? 0;
    for (const id of Object.keys(seeds)) seeds[id]!.x -= rootX;

    return { nodes, links, seeds };
    // skillColor / resolveTaskSkillId close over skills & goals; include them
  }, [skills, goals, tasks, open, settings.userName]);


  const parentMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const n of nodes) {
      map.set(n.id, n.parent ?? null);
    }
    return map;
  }, [nodes]);

  // id → fill so edges can match the target node's skill color
  const fillById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) m.set(n.id, n.fill);
    return m;
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

  /** Canvas box sized to the laid-out tree (plus any dragged nodes). */
  const viewBox = useMemo(() => {
    const pts = nodes.map((n) => {
      const p = positions[n.id] ?? seeds[n.id] ?? { x: 0, y: 0 };
      return p;
    });
    if (pts.length === 0) return { x: -600, y: -400, w: 1200, h: 800 };
    const pad = 220;
    const minX = Math.min(...pts.map((p) => p.x)) - pad;
    const maxX = Math.max(...pts.map((p) => p.x)) + pad;
    const minY = Math.min(...pts.map((p) => p.y)) - pad;
    const maxY = Math.max(...pts.map((p) => p.y)) + pad;
    return {
      x: minX,
      y: minY,
      w: Math.max(600, maxX - minX),
      h: Math.max(400, maxY - minY),
    };
  }, [nodes, positions, seeds]);


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

  /** Keyboard equivalents for pointer panning / zooming the canvas. */
  const onCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 120 : 40;
    switch (e.key) {
      case "ArrowLeft":
        setTx((v) => v + step);
        break;
      case "ArrowRight":
        setTx((v) => v - step);
        break;
      case "ArrowUp":
        setTy((v) => v + step);
        break;
      case "ArrowDown":
        setTy((v) => v - step);
        break;
      case "+":
      case "=":
        setScale((sc) => Math.min(3, sc * 1.2));
        break;
      case "-":
        setScale((sc) => Math.max(0.2, sc * 0.8));
        break;
      case "0":
        reset();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const containerCls = fullscreen
    ? "fixed inset-0 z-50 bg-background p-3 flex flex-col"
    : "relative";
  const canvasCls = fullscreen
    ? "relative flex-1 w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing"
    : "relative h-[70vh] w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing";

  const labelFont = (kind: Kind) => {
    const family =
      "'Google Sans', 'Google Sans Text', 'Open Sans', 'Segoe UI', ui-sans-serif, system-ui, sans-serif";
    if (kind === "root") return { family, size: 22, weight: 700 };
    if (kind === "skill") return { family, size: 16, weight: 700 };
    if (kind === "goal") return { family, size: 14, weight: 600 };
    if (kind === "milestone") return { family, size: 13, weight: 600 };
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
            Tidy layout
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
        className={cn(
          canvasCls,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        role="application"
        aria-label="Mind map canvas. Arrow keys pan, plus and minus zoom, 0 resets."
        tabIndex={0}
        onKeyDown={onCanvasKeyDown}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        onPointerLeave={onCanvasUp}
        onWheel={onWheel}
        style={{
          background: `hsl(var(--card)) radial-gradient(circle at 20% 30%, hsl(var(--foreground) / 0.05) 0 1px, transparent 1px) 0 0/18px 18px`,
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
          width={viewBox.w}
          height={viewBox.h}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
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
              <path d="M0,0 L10,5 L0,10 z" fill={edge} />
            </marker>
          </defs>

          {/* orthogonal connectors: down out of the parent, across, down into the child */}
          {links.map((l, i) => {
            const a = pos(l.from);
            const b = pos(l.to);
            const startPad = 34;
            const endPad = 34;
            const sy = a.y + startPad;
            const ey = b.y - endPad;
            const midY = sy + Math.max(18, (ey - sy) / 2);
            const r = Math.min(14, Math.abs(b.x - a.x) / 2, Math.abs(midY - sy) || 14);
            const dir = b.x >= a.x ? 1 : -1;
            const d =
              Math.abs(b.x - a.x) < 2
                ? `M ${a.x} ${sy} L ${b.x} ${ey}`
                : `M ${a.x} ${sy} L ${a.x} ${midY - r} Q ${a.x} ${midY} ${a.x + r * dir} ${midY} ` +
                  `L ${b.x - r * dir} ${midY} Q ${b.x} ${midY} ${b.x} ${midY + r} L ${b.x} ${ey}`;
            const w = Math.max(1.2, 2.2 - l.depth * 0.25);
            const linkColor = fillById.get(l.to) ?? edge;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={linkColor}
                strokeOpacity={0.8}
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
                tabIndex={interactive ? 0 : -1}
                role={interactive ? "button" : undefined}
                aria-expanded={interactive ? n.expanded : undefined}
                aria-label={
                  interactive
                    ? `${n.label}, ${n.childCount} children. Press Enter to ${n.expanded ? "collapse" : "expand"}.`
                    : n.label
                }
                onKeyDown={(e) => {
                  if (!interactive) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(n.id);
                  }
                }}
              >
                <title>{n.label}</title>
                {renderShape(n, hovered, halfW, halfH)}
                {interactive && !n.expanded && (
                  <g transform={`translate(${badgeX},${badgeY})`} style={{ pointerEvents: "none" }}>
                    <circle
                      r={10}
                      fill={isDark ? "#1f2937" : "#ffffff"}
                      stroke={ink}
                      strokeOpacity={0.5}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      style={{ fontFamily: font.family, fontSize: 10, fontWeight: 700 }}
                      fill={ink}
                    >
                      +{n.childCount}
                    </text>
                  </g>
                )}
                <text
                  textAnchor="middle"
                  fill={n.kind === "root" || n.fill ? inkOn(n.fill) : ink}
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
        Tap a card to expand or collapse · drag empty space to pan · scroll to zoom · Tidy layout undoes any dragging
      </p>
    </div>
  );
}
