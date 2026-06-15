import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SubtaskDraft {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  endDate: string; // deadline (required)
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<SubtaskDraft>;
  onSubmit: (draft: SubtaskDraft) => void;
  title?: string;
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SubtaskFormDialog({ open, onOpenChange, initial, onSubmit, title = "New subtask" }: Props) {
  const [form, setForm] = useState<SubtaskDraft>({
    title: "",
    description: "",
    priority: "medium",
    endDate: addDaysIso(1),
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        priority: initial?.priority ?? "medium",
        endDate: initial?.endDate ?? addDaysIso(1),
      });
    }
  }, [open, initial?.title, initial?.description, initial?.priority, initial?.endDate]);

  const valid = form.title.trim().length > 0 && form.endDate.length > 0;

  const save = () => {
    if (!valid) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      priority: form.priority,
      endDate: form.endDate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-md flex-col gap-3 overflow-x-hidden overflow-y-auto rounded-2xl p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to get done?"
            />
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notes, context, links"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as SubtaskDraft["priority"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-1 flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid} className="w-full sm:w-auto">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
