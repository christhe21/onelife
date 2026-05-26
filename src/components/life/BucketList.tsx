import { useState } from "react";
import { Plus, Trash2, Target, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppData, type BucketItem } from "@/lib/app-data";
import { toast } from "sonner";

function EditBucketDialog({ item }: { item: BucketItem }) {
  const { updateBucket } = useAppData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: item.title,
    notes: item.notes ?? "",
    targetYear: item.targetYear ? String(item.targetYear) : "",
  });
  const save = () => {
    if (!form.title.trim()) return;
    updateBucket(item.id, {
      title: form.title,
      notes: form.notes || undefined,
      targetYear: form.targetYear ? Number(form.targetYear) : undefined,
    });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit bucket item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Target year</Label>
            <Input type="number" value={form.targetYear} onChange={(e) => setForm({ ...form, targetYear: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BucketList() {
  const { bucketList, addBucket, toggleBucket, deleteBucket, addGoal } = useAppData();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [year, setYear] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    addBucket({
      title,
      notes: notes || undefined,
      targetYear: year ? Number(year) : undefined,
    });
    setTitle("");
    setNotes("");
    setYear("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Something I want to do..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-[200px] flex-1"
            />
            <Input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-28"
            />
            <Button onClick={submit}><Plus className="mr-2 h-4 w-4" />Add</Button>
          </div>
          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {bucketList.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Your bucket list is empty. Dream big.
        </CardContent></Card>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {bucketList.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <Checkbox
                  checked={b.achieved}
                  onCheckedChange={() => toggleBucket(b.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${b.achieved ? "line-through text-muted-foreground" : ""}`}>
                    {b.title}
                  </div>
                  {b.targetYear && (
                    <div className="text-xs text-muted-foreground">By {b.targetYear}</div>
                  )}
                  {b.notes && (
                    <div className="mt-1 text-xs text-muted-foreground">{b.notes}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {!b.achieved && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Promote to a goal"
                      onClick={() => {
                        const today = new Date().toISOString().slice(0, 10);
                        const target = b.targetYear
                          ? `${b.targetYear}-12-31`
                          : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
                        addGoal({
                          title: b.title,
                          description: b.notes,
                          skill: "life",
                          startDate: today,
                          targetDate: target,
                          status: "not_started",
                        });
                        toast.success(`"${b.title}" added as a goal`);
                      }}
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deleteBucket(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
