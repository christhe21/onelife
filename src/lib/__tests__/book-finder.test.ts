import { describe, expect, it } from "vitest";
import { BOOK_FINDER_ORIGIN, parseBookFinderPayload } from "../book-finder";

describe("parseBookFinderPayload", () => {
  it("rejects messages from other sites", () => {
    expect(
      parseBookFinderPayload("https://evil.example", { type: "onelife.books", book: { title: "X" } }),
    ).toEqual([]);
  });
  it("accepts books from Book Finder and skips duplicate ISBNs", () => {
    const out = parseBookFinderPayload(
      BOOK_FINDER_ORIGIN,
      {
        type: "onelife.books",
        books: [
          { title: "Dune", isbn: "978-0441013593", pages: 412 },
          { title: "Dune again", isbn: "9780441013593" },
          { title: "Owned", isbn: "9780000000002" },
        ],
      },
      ["9780000000002"],
    );
    expect(out.map((b) => b.title)).toEqual(["Dune"]);
    expect(out[0].pageCount).toBe(412);
  });
});

import { decodeBookFinderHash } from "../book-finder";
describe("decodeBookFinderHash", () => {
  it("reads books from the return address", () => {
    const json = JSON.stringify({ type: "onelife.books", book: { title: "Dune" } });
    const hash = "#books=" + btoa(json);
    const out = parseBookFinderPayload(BOOK_FINDER_ORIGIN, decodeBookFinderHash(hash));
    expect(out.map((b) => b.title)).toEqual(["Dune"]);
  });
  it("ignores a broken address", () => {
    expect(decodeBookFinderHash("#books=%%%")).toBeNull();
  });
});
