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
import { Switch } from "@/components/ui/switch";
import { CalendarClock } from "lucide-react";
import { DatePicker } from "@/components/ui/pickers/DatePicker";
import { RecurrenceEditor } from "@/components/life/RecurrenceEditor";
import { type RecurrenceRule } from "@/lib/recurrence";
import { TimePicker } from "@/components/ui/pickers/TimePicker";
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
  endDate: string; // deadline (required) — plain YYYY-MM-DD
  /** Optional calendar block start (ISO local, YYYY-MM-DDTHH:mm:ss). */
  scheduledStart?: string;
  /** Optional calendar block end (ISO local, YYYY-MM-DDTHH:mm:ss). */
  scheduledEnd?: string;
  /** Optional advanced repeat rule. */
  recurrenceRule?: RecurrenceRule;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<SubtaskDraft>;
  onSubmit: (draft: SubtaskDraft) => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function timeFromIso(iso?: string) {
  if (!iso || iso.length < 16) return "";
  return iso.slice(11, 16); // HH:mm
}

function combine(dateYmd: string, hhmm: string) {
  if (!dateYmd || !hhmm) return undefined;
  return `${dateYmd}T${hhmm}:00`;
}

export function SubtaskFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title = "New subtask",
  minDate,
  maxDate,
}: Props) {
  const [form, setForm] = useState<SubtaskDraft>({
    title: "",
    description: "",
    priority: "medium",
    endDate: addDaysIso(1),
  });
  const [rule, setRule] = useState<RecurrenceRule | null>(null);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        priority: initial?.priority ?? "medium",
        endDate: initial?.endDate ?? addDaysIso(1),
        scheduledStart: initial?.scheduledStart,
        scheduledEnd: initial?.scheduledEnd,
      });
      setRule(initial?.recurrenceRule ?? null);
      const hasSched = !!(initial?.scheduledStart && initial?.scheduledEnd);
      setScheduleOn(hasSched);
      setStartTime(timeFromIso(initial?.scheduledStart) || "09:00");
      setEndTime(timeFromIso(initial?.scheduledEnd) || "10:00");
    }
  }, [
    open,
    initial?.title,
    initial?.description,
    initial?.priority,
    initial?.endDate,
    initial?.scheduledStart,
    initial?.scheduledEnd,
  ]);

  const dateOutOfRange =
    !!form.endDate &&
    ((!!minDate && form.endDate < minDate) || (!!maxDate && form.endDate > maxDate));
  const timeInvalid = scheduleOn && (!startTime || !endTime || startTime >= endTime);
  const valid =
    form.title.trim().length > 0 && form.endDate.length > 0 && !dateOutOfRange && !timeInvalid;

  const save = () => {
    if (!valid) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      priority: form.priority,
      endDate: form.endDate,
      scheduledStart: scheduleOn ? combine(form.endDate, startTime) : undefined,
      scheduledEnd: scheduleOn ? combine(form.endDate, endTime) : undefined,
      recurrenceRule: rule ?? undefined,
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
              <DatePicker
                min={minDate}
                max={maxDate}
                value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })}
              />
              {dateOutOfRange && (
                <p className="mt-1 text-[11px] text-destructive">
                  Must be {minDate ? `on/after ${minDate}` : ""}
                  {minDate && maxDate ? " and " : ""}
                  {maxDate ? `on/before ${maxDate}` : ""}.
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs">Repeats</Label>
            <RecurrenceEditor
              value={rule}
              onChange={setRule}
              referenceDate={form.endDate}
              maxDate={maxDate}
              className="mt-1.5"
            />
          </div>

          <div className="rounded-xl border bg-card/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  Schedule on calendar
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Reserve a time block on the deadline day.
                </div>
              </div>
              <Switch checked={scheduleOn} onCheckedChange={setScheduleOn} />
            </div>
            {scheduleOn && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start</Label>
                  <TimePicker value={startTime} onChange={setStartTime} />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <TimePicker value={endTime} onChange={setEndTime} />
                </div>
                {timeInvalid && (
                  <p className="col-span-2 text-[11px] text-destructive">
                    End time must be after start time.
                  </p>
                )}
              </div>
            )}
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
