import { useRef, useState } from "react";
import { Camera, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/app-data";
import type { BookPriority, BookShelf } from "@/lib/plugins-data";
import { barcodeScanSupported, cleanIsbn, lookupIsbn, readIsbnFromImage } from "@/lib/isbn";

export function AddBookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addBook } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [shelf, setShelf] = useState<BookShelf>("queue");
  const [priority, setPriority] = useState<BookPriority>("medium");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setIsbn("");
    setTitle("");
    setAuthor("");
    setPages("");
    setCoverUrl(undefined);
    setShelf("queue");
    setPriority("medium");
  };

  const fill = async (value: string) => {
    const code = cleanIsbn(value);
    if (!code) return;
    setBusy(true);
    try {
      const found = await lookupIsbn(code);
      if (!found) {
        toast.error("No book found for that number. You can still type the details in.");
        return;
      }
      if (found.title) setTitle(found.title);
      if (found.author) setAuthor(found.author);
      if (found.pageCount) setPages(String(found.pageCount));
      setCoverUrl(found.coverUrl);
      toast.success("Book details filled in.");
    } catch {
      toast.error("Could not reach the book lookup service.");
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const code = await readIsbnFromImage(file);
      if (!code) {
        toast.error("No barcode found in that photo. Try again closer and in good light.");
        return;
      }
      setIsbn(code);
      await fill(code);
    } catch {
      toast.error("This browser can't read barcodes from photos — type the number instead.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    if (!title.trim()) {
      toast.error("Give the book a title.");
      return;
    }
    const pageCount = Number(pages);
    addBook({
      title: title.trim(),
      author: author.trim() || undefined,
      isbn: isbn ? cleanIsbn(isbn) : undefined,
      coverUrl,
      pageCount: Number.isFinite(pageCount) && pageCount > 0 ? Math.round(pageCount) : undefined,
      shelf,
      priority,
    });
    toast.success(`"${title.trim()}" added to your library.`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
          <DialogDescription>
            Scan the barcode on the back, enter the ISBN, or type the details yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="book-isbn">ISBN</Label>
            <div className="flex gap-2">
              <Input
                id="book-isbn"
                inputMode="numeric"
                placeholder="9780143127550"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void fill(isbn)}
                disabled={busy || !isbn.trim()}
                aria-label="Look up ISBN"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void onPhoto(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <Camera className="mr-2 h-4 w-4" /> Scan barcode with camera
            </Button>
            {!barcodeScanSupported() && (
              <p className="text-xs text-muted-foreground">
                Scanning needs a recent Chrome or Android browser. Otherwise type the number above.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="book-title">Title</Label>
              <Input id="book-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-author">Author</Label>
              <Input id="book-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-pages">Pages</Label>
              <Input
                id="book-pages"
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-shelf">Shelf</Label>
              <Select value={shelf} onValueChange={(v) => setShelf(v as BookShelf)}>
                <SelectTrigger id="book-shelf">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="queue">Want to read</SelectItem>
                  <SelectItem value="reading">Reading now</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as BookPriority)}>
                <SelectTrigger id="book-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {coverUrl && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <img src={coverUrl} alt="" className="h-20 w-14 rounded object-cover" />
              <p className="text-xs text-muted-foreground">Cover found from the ISBN.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Add book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
