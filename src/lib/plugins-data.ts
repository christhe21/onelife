export const PLUGINS_DATA_VERSION = 1;

export type PluginId = "books";

export interface PluginMeta {
  id: PluginId | string;
  name: string;
  tagline: string;
  description: string;
  /** Whether this plugin can be switched on today. */
  available: boolean;
}

/** Everything that can be plugged into the workspace. */
export const PLUGIN_CATALOG: PluginMeta[] = [
  {
    id: "books",
    name: "Books",
    tagline: "Your library, bookmarks and reading time",
    description:
      "Keep every book you own or plan to read, scan an ISBN to fill in the details, set priorities, save your bookmark and plan reading sessions.",
    available: true,
  },
  {
    id: "fitness",
    name: "Fitness log",
    tagline: "Workouts and body metrics",
    description: "Track sessions, sets and simple body measurements over time.",
    available: false,
  },
  {
    id: "finance",
    name: "Money",
    tagline: "Savings goals and spending habits",
    description: "Follow savings targets and recurring commitments alongside your goals.",
    available: false,
  },
  {
    id: "journal",
    name: "Journal",
    tagline: "A daily written record",
    description: "Longer-form notes, separate from tasks and goals.",
    available: false,
  },
];

export interface PluginsState {
  version: number;
  /** Ids of plugins the user switched on. */
  enabled: string[];
}

export function createDefaultPluginsState(): PluginsState {
  return { version: PLUGINS_DATA_VERSION, enabled: [] };
}

export function normalizePluginsState(raw: unknown): PluginsState {
  const r = (raw ?? {}) as Partial<PluginsState>;
  const known = new Set(PLUGIN_CATALOG.filter((p) => p.available).map((p) => p.id));
  const enabled = Array.isArray(r.enabled)
    ? Array.from(new Set(r.enabled.filter((id): id is string => typeof id === "string" && known.has(id))))
    : [];
  return { version: PLUGINS_DATA_VERSION, enabled };
}

/* ------------------------------ Books plugin ------------------------------ */

export const BOOKS_DATA_VERSION = 1;

export type BookShelf = "queue" | "reading" | "finished";
export type BookPriority = "low" | "medium" | "high";

export interface ReadingSession {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, local. */
  startTime?: string;
  minutes: number;
  pagesRead?: number;
  note?: string;
  done: boolean;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  coverUrl?: string;
  pageCount?: number;
  /** Bookmark: last page read. */
  currentPage: number;
  shelf: BookShelf;
  priority: BookPriority;
  notes?: string;
  addedAt: string;
  startedAt?: string;
  finishedAt?: string;
  sessions: ReadingSession[];
}

export interface BooksState {
  version: number;
  books: Book[];
}

export function createDefaultBooksState(): BooksState {
  return { version: BOOKS_DATA_VERSION, books: [] };
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;

function normalizeSession(raw: unknown, i: number): ReadingSession {
  const r = (raw ?? {}) as Partial<ReadingSession>;
  return {
    id: str(r.id) ?? `session-${i}-${Math.random().toString(36).slice(2, 8)}`,
    date: str(r.date) ?? new Date().toISOString().slice(0, 10),
    startTime: str(r.startTime),
    minutes: num(r.minutes) ?? 30,
    pagesRead: num(r.pagesRead),
    note: str(r.note),
    done: r.done === true,
  };
}

export function normalizeBook(raw: unknown, i = 0): Book {
  const r = (raw ?? {}) as Partial<Book>;
  const shelf: BookShelf = ["queue", "reading", "finished"].includes(r.shelf as string)
    ? (r.shelf as BookShelf)
    : "queue";
  const priority: BookPriority = ["low", "medium", "high"].includes(r.priority as string)
    ? (r.priority as BookPriority)
    : "medium";
  return {
    id: str(r.id) ?? `book-${i}-${Math.random().toString(36).slice(2, 8)}`,
    title: str(r.title) ?? "Untitled book",
    author: str(r.author),
    isbn: str(r.isbn),
    coverUrl: str(r.coverUrl),
    pageCount: num(r.pageCount),
    currentPage: num(r.currentPage) ?? 0,
    shelf,
    priority,
    notes: str(r.notes),
    addedAt: str(r.addedAt) ?? new Date().toISOString(),
    startedAt: str(r.startedAt),
    finishedAt: str(r.finishedAt),
    sessions: Array.isArray(r.sessions) ? r.sessions.map(normalizeSession) : [],
  };
}

export function normalizeBooksState(raw: unknown): BooksState {
  const r = (raw ?? {}) as Partial<BooksState>;
  return {
    version: BOOKS_DATA_VERSION,
    books: Array.isArray(r.books) ? r.books.map(normalizeBook) : [],
  };
}

/** Reading progress 0-100; falls back to shelf when the page count is unknown. */
export function bookProgress(b: Book): number {
  if (b.shelf === "finished") return 100;
  if (!b.pageCount || b.pageCount <= 0) return b.currentPage > 0 ? 50 : 0;
  return Math.max(0, Math.min(100, Math.round((b.currentPage / b.pageCount) * 100)));
}

const PRIORITY_WEIGHT: Record<BookPriority, number> = { high: 0, medium: 1, low: 2 };

/** Priority order: reading first, then priority, then progress. */
export function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const shelfRank = (x: Book) => (x.shelf === "reading" ? 0 : x.shelf === "queue" ? 1 : 2);
    if (shelfRank(a) !== shelfRank(b)) return shelfRank(a) - shelfRank(b);
    if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority])
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    return bookProgress(b) - bookProgress(a);
  });
}

export function totalMinutesRead(b: Book): number {
  return b.sessions.filter((s) => s.done).reduce((sum, s) => sum + (s.minutes || 0), 0);
}
