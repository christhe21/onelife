# Connect Book Finder scanner to Books

## What you get
- A "Scan with Book Finder" button in the Books plugin opens https://goalweaver-book-finder.lovable.app in a new window.
- Books you scan there come straight back and land on your "Want to Read" shelf (title, author, pages, cover, ISBN). A short note confirms each book added; duplicates (same ISBN) are skipped.
- Only messages coming from the Book Finder address are accepted, so no other site can add books.

## Technical details
- New constant `BOOK_FINDER_URL` in `src/lib/isbn.ts`.
- Button opens `BOOK_FINDER_URL?return=<this app's origin>` via `window.open`.
- Books plugin listens for `window` `message` events; accepts only `event.origin === BOOK_FINDER_URL`, payload `{ type: "onelife.books", books: [{isbn,title,author,pages,coverUrl}] }` (also single `book`), validated before calling the existing add-book app-data action.
- Also supports return via URL (`/app?...#books=<base64 json>`) as a fallback when popups are blocked; parsed once, then cleared from the address bar.
- Small test for the payload validator (rejects wrong origin/shape, dedupes ISBN).
- The Book Finder app must send to this app's published and preview addresses; I'll list them so it can whitelist them.
