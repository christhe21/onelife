import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { Plus, Square, Circle, StickyNote, Type, Trash2, LayoutGrid, Target, Flag, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppData } from "@/lib/app-data";
import { useTheme } from "@/hooks/use-theme";
import type { EditorState, ShapeKind } from "@/lib/editor-data";
import { cn } from "@/lib/utils";

type Kind = "skill" | "goal" | "ms" | "task" | "shape";
interface CardData extends Record<string, unknown> {
  kind: Kind;
  label: string;
  color: string;
  done?: boolean;
  shape?: ShapeKind;
  onRename: (v: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const kindOf = (id: string) => id.split(":")[0] as Kind;
const rawId = (id: string) => id.slice(id.indexOf(":") + 1);
const today = () => new Date().toISOString().slice(0, 10);

function CardNode({ data, selected }: NodeProps<Node<CardData>>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const shape = data.kind === "shape" ? data.shape : undefined;
  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onRename(draft.trim());
    else setDraft(data.label);
  };
  return (
    <div
      onDoubleClick={() => {
        setDraft(data.label);
        setEditing(true);
      }}
      className={cn(
        "relative flex items-center justify-center text-center text-xs text-foreground transition-shadow",
        shape === "text"
          ? "min-w-[80px] bg-transparent px-2 py-1 text-sm font-medium"
          : shape === "circle"
            ? "h-24 w-24 rounded-full border-2 bg-card"
            : shape === "note"
              ? "min-h-[80px] w-36 rounded-sm border bg-accent p-2 shadow-sm"
              : "min-w-[140px] max-w-[200px] rounded-lg border-2 bg-card px-3 py-2",
        data.kind === "skill" && "font-display text-sm font-semibold",
        data.kind === "goal" && "font-semibold",
        data.done && "opacity-60 line-through",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
      style={shape ? undefined : { borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />
      {!shape && (
        <span
          className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: data.color }}
          aria-hidden
        />
      )}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(data.label);
              setEditing(false);
            }
            e.stopPropagation();
          }}
          className="nodrag w-full rounded bg-background px-1 text-xs outline-none"
        />
      ) : (
        <span className="break-words">{data.label || "Double-click to type"}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2" />
    </div>
  );
}

const nodeTypes = { card: CardNode };

function Editor() {
  const app = useAppData();
  const { goals, tasks, skills, editor, setEditor } = app;
  const { isDark } = useTheme();
  const rf = useReactFlow();
  const [selected, setSelected] = useState<string | null>(null);

  const skillColor = useCallback(
    (id: string) => skills.find((s) => s.id === id)?.color ?? "#94a3b8",
    [skills],
  );

  // ---------- Build graph from real data ----------
  const graph = useMemo(() => {
    type Raw = { id: string; parent?: string; data: Omit<CardData, "onRename"> };
    const raws: Raw[] = [];
    for (const s of skills) raws.push({ id: `skill:${s.id}`, data: { kind: "skill", label: s.label, color: s.color } });
    for (const g of goals) {
      const c = skillColor(g.skill);
      raws.push({ id: `goal:${g.id}`, parent: `skill:${g.skill}`, data: { kind: "goal", label: g.title, color: c, done: g.status === "completed" } });
      for (const m of g.subGoals)
        raws.push({ id: `ms:${m.id}`, parent: `goal:${g.id}`, data: { kind: "ms", label: m.title, color: c, done: m.done } });
    }
    const msGoal = new Map<string, string>();
    goals.forEach((g) => g.subGoals.forEach((m) => msGoal.set(m.id, g.id)));
    for (const t of tasks) {
      const parent = t.subGoalId && msGoal.has(t.subGoalId) ? `ms:${t.subGoalId}` : t.goalId ? `goal:${t.goalId}` : undefined;
      const gId = t.subGoalId ? msGoal.get(t.subGoalId) : t.goalId;
      const g = goals.find((x) => x.id === gId);
      raws.push({ id: `task:${t.id}`, parent, data: { kind: "task", label: t.title, color: g ? skillColor(g.skill) : "#94a3b8", done: t.done } });
    }
    const ids = new Set(raws.map((r) => r.id));
    // tidy tree auto-layout
    const children = new Map<string, string[]>();
    raws.forEach((r) => {
      if (r.parent && ids.has(r.parent)) children.set(r.parent, [...(children.get(r.parent) ?? []), r.id]);
    });
    const auto: Record<string, { x: number; y: number }> = {};
    let cursor = 0;
    const place = (id: string, depth: number): number => {
      const kids = children.get(id) ?? [];
      let x: number;
      if (!kids.length) {
        x = cursor;
        cursor += 190;
      } else {
        const xs = kids.map((k) => place(k, depth + 1));
        x = (xs[0] + xs[xs.length - 1]) / 2;
      }
      auto[id] = { x, y: depth * 140 };
      return x;
    };
    raws.filter((r) => !r.parent || !ids.has(r.parent)).forEach((r) => {
      place(r.id, r.data.kind === "task" ? 3 : r.data.kind === "goal" ? 1 : 0);
      cursor += 60;
    });
    const edges: Edge[] = raws
      .filter((r) => r.parent && ids.has(r.parent))
      .map((r) => ({ id: `link:${r.id}`, source: r.parent!, target: r.id, deletable: false, style: { stroke: r.data.color, strokeWidth: 1.5 } }));
    return { raws, auto, edges };
  }, [goals, tasks, skills, skillColor]);

  const rename = useCallback(
    (id: string, v: string) => {
      const k = kindOf(id);
      const r = rawId(id);
      if (k === "skill") app.updateSkill(r, { label: v });
      else if (k === "goal") app.updateGoal(r, { title: v });
      else if (k === "ms") {
        const g = goals.find((x) => x.subGoals.some((m) => m.id === r));
        if (g) app.updateSubGoal(g.id, r, { title: v });
      } else if (k === "task") app.updateTask(r, { title: v });
      else setEditor((cur) => ({ ...cur, shapes: cur.shapes.map((s) => (s.id === r ? { ...s, label: v } : s)) }));
    },
    [app, goals, setEditor],
  );

  const nodes: Node<CardData>[] = useMemo(() => {
    const real = graph.raws.map((r) => ({
      id: r.id,
      type: "card",
      position: editor.positions[r.id] ?? graph.auto[r.id],
      selected: selected === r.id,
      data: { ...r.data, onRename: (v: string) => rename(r.id, v) },
    }));
    const free = editor.shapes.map((s) => ({
      id: `shape:${s.id}`,
      type: "card",
      position: { x: s.x, y: s.y },
      selected: selected === `shape:${s.id}`,
      data: { kind: "shape" as Kind, shape: s.kind, label: s.label, color: "", onRename: (v: string) => rename(`shape:${s.id}`, v) },
    }));
    return [...real, ...free];
  }, [graph, editor, selected, rename]);

  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const edges: Edge[] = useMemo(
    () => [
      ...graph.edges,
      ...editor.edges
        .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
        .map((e) => ({ id: `free:${e.id}`, source: e.source, target: e.target, label: e.label, style: { strokeDasharray: "5 4" }, selected: selected === `free:${e.id}` })),
    ],
    [graph.edges, editor.edges, nodeIds, selected],
  );

  // ---------- Interactions ----------
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<CardData>>[]) => {
      for (const c of changes) {
        if (c.type === "select" && c.selected) setSelected(c.id);
        if (c.type === "remove") removeNode(c.id);
      }
      const moves = changes.filter((c) => c.type === "position" && c.position);
      if (moves.length)
        setEditor((cur) => {
          const next: EditorState = { ...cur, positions: { ...cur.positions }, shapes: [...cur.shapes] };
          for (const m of moves) {
            if (m.type !== "position" || !m.position) continue;
            if (kindOf(m.id) === "shape") next.shapes = next.shapes.map((s) => (s.id === rawId(m.id) ? { ...s, x: m.position!.x, y: m.position!.y } : s));
            else next.positions[m.id] = m.position;
          }
          return next;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setEditor, goals],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === "select" && c.selected) setSelected(c.id);
        if (c.type === "remove" && c.id.startsWith("free:"))
          setEditor((cur) => ({ ...cur, edges: cur.edges.filter((e) => e.id !== rawId(c.id)) }));
      }
    },
    [setEditor],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      const a = kindOf(c.source);
      const b = kindOf(c.target);
      if (a === "shape" || b === "shape") {
        setEditor((cur) => ({ ...cur, edges: [...cur.edges, { id: uid(), source: c.source!, target: c.target! }] }));
        return;
      }
      const pick = (k: Kind) => (a === k ? rawId(c.source!) : b === k ? rawId(c.target!) : undefined);
      const pair = new Set([a, b]);
      const has = (x: Kind, y: Kind) => pair.has(x) && pair.has(y) && pair.size === 2;
      if (has("skill", "goal")) app.updateGoal(pick("goal")!, { skill: pick("skill")! });
      else if (has("goal", "ms")) app.moveSubGoal(pick("ms")!, pick("goal")!);
      else if (has("ms", "task")) app.updateTask(pick("task")!, { subGoalId: pick("ms")!, goalId: undefined });
      else if (has("goal", "task")) app.updateTask(pick("task")!, { goalId: pick("goal")!, subGoalId: undefined });
      else {
        toast.error("That link isn't allowed. Connect Task → Milestone or Goal, Milestone → Goal, Goal → Skill.");
        return;
      }
      toast.success("Linked");
    },
    [app, setEditor],
  );

  function removeNode(id: string) {
    const k = kindOf(id);
    const r = rawId(id);
    if (k === "shape") {
      setEditor((cur) => ({
        ...cur,
        shapes: cur.shapes.filter((s) => s.id !== r),
        edges: cur.edges.filter((e) => e.source !== id && e.target !== id),
      }));
      return;
    }
    const label = nodes.find((n) => n.id === id)?.data.label ?? "this item";
    if (!window.confirm(`Delete "${label}"? This removes it from your plan.`)) return;
    if (k === "skill") app.deleteSkill(r);
    else if (k === "goal") app.deleteGoal(r);
    else if (k === "ms") {
      const g = goals.find((x) => x.subGoals.some((m) => m.id === r));
      if (g) app.deleteSubGoal(g.id, r);
    } else app.deleteTask(r);
    setSelected(null);
  }

  const center = () => {
    const el = document.querySelector(".react-flow");
    const rect = el?.getBoundingClientRect();
    return rf.screenToFlowPosition({ x: (rect?.left ?? 0) + (rect?.width ?? 600) / 2, y: (rect?.top ?? 0) + (rect?.height ?? 400) / 2 });
  };

  const addShape = (kind: ShapeKind) => {
    const p = center();
    const id = uid();
    setEditor((cur) => ({ ...cur, shapes: [...cur.shapes, { id, kind, label: kind === "text" ? "Text" : "", x: p.x, y: p.y }] }));
    setSelected(`shape:${id}`);
  };

  const selGoalId = selected && kindOf(selected) === "goal" ? rawId(selected) : undefined;
  const selMsId = selected && kindOf(selected) === "ms" ? rawId(selected) : undefined;

  const addGoal = () => {
    const skill = selected && kindOf(selected) === "skill" ? rawId(selected) : skills[0]?.id;
    if (!skill) return;
    const end = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    app.addGoal({ title: "New goal", skill, startDate: today(), targetDate: end, status: "not_started" });
  };
  const addMilestone = () => {
    const gid = selGoalId ?? goals[0]?.id;
    if (!gid) return toast.error("Add a goal first.");
    app.addSubGoal(gid, "New milestone");
  };
  const addTask = () => {
    if (!selMsId && !selGoalId && !goals.length) return toast.error("Add a goal first.");
    const sub = selMsId ?? (selGoalId ? undefined : goals[0]?.subGoals[0]?.id);
    app.addTask({ title: "New task", priority: "medium", subGoalId: sub, goalId: sub ? undefined : (selGoalId ?? goals[0]?.id) });
  };

  const autoLayout = () => {
    setEditor((cur) => ({ ...cur, positions: {} }));
    setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 50);
  };

  // ---------- Side panel ----------
  const sel = selected ? nodes.find((n) => n.id === selected) : undefined;
  const selTask = sel && kindOf(sel.id) === "task" ? tasks.find((t) => t.id === rawId(sel.id)) : undefined;
  const selFreeEdge = selected?.startsWith("free:") ? editor.edges.find((e) => e.id === rawId(selected)) : undefined;

  return (
    <div className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-lg border bg-background">
      <div className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-1 rounded-md border bg-card p-1 shadow-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={addGoal}><Target className="mr-2 h-4 w-4" />Goal</DropdownMenuItem>
            <DropdownMenuItem onClick={addMilestone}><Flag className="mr-2 h-4 w-4" />Milestone</DropdownMenuItem>
            <DropdownMenuItem onClick={addTask}><CheckSquare className="mr-2 h-4 w-4" />Task</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addShape("box")}><Square className="mr-2 h-4 w-4" />Box</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addShape("circle")}><Circle className="mr-2 h-4 w-4" />Circle</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addShape("note")}><StickyNote className="mr-2 h-4 w-4" />Sticky note</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addShape("text")}><Type className="mr-2 h-4 w-4" />Text</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="ghost" className="h-8" onClick={autoLayout} title="Tidy layout">
          <LayoutGrid className="mr-1 h-4 w-4" /> Tidy
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8"
          disabled={!selected || (selected.startsWith("link:"))}
          onClick={() => {
            if (!selected) return;
            if (selected.startsWith("free:")) onEdgesChange([{ type: "remove", id: selected }]);
            else removeNode(selected);
          }}
          title="Delete selected"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {(sel || selFreeEdge) && (
        <div className="absolute right-2 top-2 z-10 w-60 space-y-2 rounded-md border bg-card p-3 text-xs shadow-sm">
          {sel && (
            <>
              <p className="font-medium capitalize text-muted-foreground">
                {sel.data.kind === "ms" ? "Milestone" : sel.data.kind}
              </p>
              <Input
                key={sel.id}
                defaultValue={sel.data.label}
                onBlur={(e) => e.target.value.trim() && e.target.value !== sel.data.label && rename(sel.id, e.target.value.trim())}
                className="h-8 text-sm"
                aria-label="Title"
              />
              {selTask && (
                <>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selTask.done} onChange={(e) => app.updateTask(selTask.id, { done: e.target.checked })} />
                    Done
                  </label>
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Due date</span>
                    <Input type="date" value={selTask.dueDate ?? ""} onChange={(e) => app.updateTask(selTask.id, { dueDate: e.target.value || undefined })} className="h-8" />
                  </label>
                </>
              )}
              {sel.data.kind === "ms" && (() => {
                const g = goals.find((x) => x.subGoals.some((m) => m.id === rawId(sel.id)));
                const m = g?.subGoals.find((x) => x.id === rawId(sel.id));
                return g && m ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={m.done} onChange={(e) => app.updateSubGoal(g.id, m.id, { done: e.target.checked })} />
                    Done
                  </label>
                ) : null;
              })()}
            </>
          )}
          {selFreeEdge && (
            <label className="block space-y-1">
              <span className="text-muted-foreground">Connector label</span>
              <Input
                key={selFreeEdge.id}
                defaultValue={selFreeEdge.label ?? ""}
                onBlur={(e) => setEditor((cur) => ({ ...cur, edges: cur.edges.map((x) => (x.id === selFreeEdge.id ? { ...x, label: e.target.value || undefined } : x)) }))}
                className="h-8"
              />
            </label>
          )}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => setSelected(null)}
        colorMode={isDark ? "dark" : "light"}
        snapToGrid
        snapGrid={[10, 10]}
        fitView
        minZoom={0.1}
        deleteKeyCode={["Delete", "Backspace"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap pannable zoomable className="!hidden sm:!block" />
      </ReactFlow>
    </div>
  );
}

export default function LifeEditor() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
