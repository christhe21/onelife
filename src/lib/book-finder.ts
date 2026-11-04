/** Bridge to the external Book Finder scanner app. */
import { cleanIsbn } from "./isbn";

export const BOOK_FINDER_URL = "https://goalweaver-book-finder.lovable.app";
export const BOOK_FINDER_ORIGIN = new URL(BOOK_FINDER_URL).origin;

export interface IncomingBook {
  title: string;
  author?: string;
  isbn?: string;
  pageCount?: number;
  coverUrl?: string;
}

function parseOne(raw: unknown): IncomingBook | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim().slice(0, 300) : "";
  if (!title) return null;
  const pagesRaw = Number(r.pages ?? r.pageCount);
  const cover = typeof r.coverUrl === "string" && /^https:\/\//.test(r.coverUrl) ? r.coverUrl : undefined;
  const isbn = typeof r.isbn === "string" ? cleanIsbn(r.isbn) || undefined : undefined;
  return {
    title,
    author: typeof r.author === "string" ? r.author.trim().slice(0, 200) || undefined : undefined,
    isbn,
    pageCount: Number.isFinite(pagesRaw) && pagesRaw > 0 ? Math.round(pagesRaw) : undefined,
    coverUrl: cover,
  };
}

/** Validate a payload from Book Finder. Returns [] for anything not trusted or malformed. */
export function parseBookFinderPayload(
  origin: string,
  data: unknown,
  existingIsbns: Iterable<string> = [],
): IncomingBook[] {
  if (origin !== BOOK_FINDER_ORIGIN) return [];
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (d.type !== "onelife.books") return [];
  const list = Array.isArray(d.books) ? d.books : d.book ? [d.book] : [];
  const seen = new Set(Array.from(existingIsbns, (i) => cleanIsbn(i)));
  const out: IncomingBook[] = [];
  for (const item of list.slice(0, 50)) {
    const b = parseOne(item);
    if (!b) continue;
    if (b.isbn) {
      if (seen.has(b.isbn)) continue;
      seen.add(b.isbn);
    }
    out.push(b);
  }
  return out;
}

export function bookFinderLaunchUrl(returnOrigin: string): string {
  return `${BOOK_FINDER_URL}/?return=${encodeURIComponent(returnOrigin)}`;
}
