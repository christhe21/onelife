import { useEffect } from "react";
import { toast } from "sonner";
import { useAppData } from "@/lib/app-data";
import { BOOK_FINDER_ORIGIN, decodeBookFinderHash, parseBookFinderPayload } from "@/lib/book-finder";

/** Adds books Book Finder sent back through the address bar (used when pop-ups are blocked). */
export function BookFinderReturn() {
  const { books, addBook } = useAppData();
  useEffect(() => {
    const data = decodeBookFinderHash(window.location.hash);
    if (!data) return;
    // Clear the hash right away so a reload never adds the books twice.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    const isbns = books.books.map((b) => b.isbn ?? "").filter(Boolean);
    const incoming = parseBookFinderPayload(BOOK_FINDER_ORIGIN, data, isbns);
    for (const b of incoming) addBook({ ...b, shelf: "queue" });
    if (incoming.length) toast.success(`${incoming.length} book${incoming.length > 1 ? "s" : ""} added from Book Finder.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
