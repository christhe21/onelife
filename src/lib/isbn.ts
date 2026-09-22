/** ISBN helpers: clean up input, read a barcode from a photo, look details up online. */

export interface IsbnLookupResult {
  isbn: string;
  title?: string;
  author?: string;
  pageCount?: number;
  coverUrl?: string;
}

export function cleanIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn(raw: string): boolean {
  const v = cleanIsbn(raw);
  return v.length === 10 || v.length === 13;
}

/** Look a book up on Open Library (no key required). */
export async function lookupIsbn(rawIsbn: string): Promise<IsbnLookupResult | null> {
  const isbn = cleanIsbn(rawIsbn);
  if (!isValidIsbn(isbn)) return null;
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title?: string;
    number_of_pages?: number;
    authors?: { key: string }[];
  };

  let author: string | undefined;
  const authorKey = data.authors?.[0]?.key;
  if (authorKey) {
    try {
      const ares = await fetch(`https://openlibrary.org${authorKey}.json`);
      if (ares.ok) {
        const adata = (await ares.json()) as { name?: string };
        author = adata.name;
      }
    } catch {
      /* author is optional */
    }
  }

  return {
    isbn,
    title: data.title,
    author,
    pageCount:
      typeof data.number_of_pages === "number" && data.number_of_pages > 0
        ? data.number_of_pages
        : undefined,
    coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
  };
}

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource | Blob) => Promise<{ rawValue: string }[]>;
};

export function barcodeScanSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

/** Read an ISBN barcode out of a photo. Returns null when nothing readable is found. */
export async function readIsbnFromImage(file: File): Promise<string | null> {
  const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) throw new Error("unsupported");
  const detector = new Ctor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
  const bitmap = await createImageBitmap(file);
  try {
    const found = await detector.detect(bitmap);
    for (const code of found) {
      const value = cleanIsbn(code.rawValue);
      if (isValidIsbn(value)) return value;
    }
    return null;
  } finally {
    bitmap.close?.();
  }
}
