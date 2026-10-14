/** Life Editor board state: card positions, free shapes and free connectors. */
export type ShapeKind = "box" | "circle" | "note" | "text";

export interface EditorShape {
  id: string;
  kind: ShapeKind;
  label: string;
  x: number;
  y: number;
}

export interface EditorEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface EditorState {
  positions: Record<string, { x: number; y: number }>;
  shapes: EditorShape[];
  edges: EditorEdge[];
}

export const createDefaultEditorState = (): EditorState => ({ positions: {}, shapes: [], edges: [] });

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function normalizeEditorState(raw: unknown): EditorState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const positions: EditorState["positions"] = {};
  if (r.positions && typeof r.positions === "object") {
    for (const [k, v] of Object.entries(r.positions as Record<string, unknown>)) {
      const p = v as { x?: unknown; y?: unknown };
      if (p && typeof p === "object") positions[k] = { x: num(p.x), y: num(p.y) };
    }
  }
  const kinds: ShapeKind[] = ["box", "circle", "note", "text"];
  const shapes = Array.isArray(r.shapes)
    ? (r.shapes as Record<string, unknown>[])
        .filter((s) => s && typeof s.id === "string")
        .map((s) => ({
          id: s.id as string,
          kind: kinds.includes(s.kind as ShapeKind) ? (s.kind as ShapeKind) : "box",
          label: typeof s.label === "string" ? s.label : "",
          x: num(s.x),
          y: num(s.y),
        }))
    : [];
  const edges = Array.isArray(r.edges)
    ? (r.edges as Record<string, unknown>[])
        .filter((e) => e && typeof e.id === "string" && typeof e.source === "string" && typeof e.target === "string")
        .map((e) => ({
          id: e.id as string,
          source: e.source as string,
          target: e.target as string,
          label: typeof e.label === "string" ? e.label : undefined,
        }))
    : [];
  return { positions, shapes, edges };
}
