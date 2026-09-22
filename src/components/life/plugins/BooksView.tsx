import { useMemo, useState } from "react";
import { BookOpen, Bookmark, CalendarPlus, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/lib/app-data";
import {
  bookProgress,
  sortBooks,
  totalMinutesRead,
  type Book,
  type BookPriority,
  type BookShelf,
} from "@/lib/plugins-data";
import { AddBookDialog } from "./AddBookDialog";
import { cn } from "@/lib/utils";

const SHELF_LABEL: Record<BookShelf, string> = {
  reading: "Reading now",
  queue: "Want to read",
  finished: "Finished",
};

export function BooksView() {
  const { books } = useAppData();
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | BookShelf>("all");

  const list = useMemo(() => {
    const sorted = sortBooks(books.books);
    return filter === "all" ? sorted : sorted.filter((b) => b.shelf === filter);
  }, [books.books, filter]);

  const reading = books.books.filter((b) => b.shelf === "reading").length;
  const finished = books.books.filter((b) => b.shelf === "finished").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Books</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {books.books.length} in your library · {reading} reading · {finished} finished
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add book
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No books here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Scan a barcode or type a title to start your library.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add your first book
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}

      <AddBookDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const {
    updateBook,
    deleteBook,
    setBookmark,
    addReadingSession,
    toggleReadingSession,
    deleteReadingSession,
  } = useAppData();
  const [page, setPage] = useState(String(book.currentPage));
  const [planning, setPlanning] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("20:00");
  const [minutes, setMinutes] = useState("30");

  const pct = bookProgress(book);
  const minutesRead = totalMinutesRead(book);
  const upcoming = [...book.sessions].sort((a, b) => a.date.localeCompare(b.date));

  const commitPage = (value: number) => {
    setBookmark(book.id, value);
    setPage(String(value));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex gap-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            className="h-28 w-20 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-semibold">{book.title}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {book.author || "Unknown author"}
                {book.pageCount ? ` · ${book.pageCount} pages` : ""}
                {minutesRead > 0 ? ` · ${minutesRead} min read` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={book.priority === "high" ? "default" : "secondary"}
                className="text-[10px] capitalize"
              >
                {book.priority}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${book.title}`}
                onClick={() => deleteBook(book.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5" /> Bookmark
              </span>
              <span>
                {book.pageCount ? `page ${book.currentPage} of ${book.pageCount}` : `page ${book.currentPage}`}
                {" · "}
                {pct}%
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            {book.pageCount ? (
              <Slider
                value={[Math.min(book.currentPage, book.pageCount)]}
                max={book.pageCount}
                step={1}
                onValueChange={(v) => commitPage(v[0] ?? 0)}
                aria-label={`Bookmark page for ${book.title}`}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  className="h-9 w-24"
                  inputMode="numeric"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  aria-label={`Bookmark page for ${book.title}`}
                />
                <Button size="sm" variant="outline" onClick={() => commitPage(Number(page) || 0)}>
                  Save bookmark
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={book.shelf}
              onValueChange={(v) => updateBook(book.id, { shelf: v as BookShelf })}
            >
              <SelectTrigger className="h-9 w-[150px]" aria-label={`Shelf for ${book.title}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["reading", "queue", "finished"] as BookShelf[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SHELF_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={book.priority}
              onValueChange={(v) => updateBook(book.id, { priority: v as BookPriority })}
            >
              <SelectTrigger className="h-9 w-[130px]" aria-label={`Priority for ${book.title}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High priority</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setPlanning((v) => !v)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Plan reading time
            </Button>
          </div>

          {planning && (
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor={`d-${book.id}`} className="text-xs">
                  Date
                </Label>
                <Input
                  id={`d-${book.id}`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`t-${book.id}`} className="text-xs">
                  Start
                </Label>
                <Input
                  id={`t-${book.id}`}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`m-${book.id}`} className="text-xs">
                  Minutes
                </Label>
                <Input
                  id={`m-${book.id}`}
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    addReadingSession(book.id, {
                      date,
                      startTime: time,
                      minutes: Math.max(5, Number(minutes) || 30),
                    });
                    setPlanning(false);
                  }}
                >
                  Add session
                </Button>
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <ul className="space-y-1.5">
              {upcoming.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => toggleReadingSession(book.id, s.id)}
                    aria-label={`Mark reading session on ${s.date} done`}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  <span className={cn("flex-1", s.done && "text-muted-foreground line-through")}>
                    {s.date}
                    {s.startTime ? ` at ${s.startTime}` : ""} · {s.minutes} min
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Remove reading session"
                    onClick={() => deleteReadingSession(book.id, s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
