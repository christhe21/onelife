import * as React from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function parseYMD(v?: string): Date | undefined {
  if (!v) return undefined;
  const d = parse(v, "yyyy-MM-dd", new Date());
  return isNaN(d.getTime()) ? undefined : d;
}

function toYMD(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Pick a date",
  className,
  disabled,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseYMD(value);
  const minDate = parseYMD(min);
  const maxDate = parseYMD(max);

  const currentYear = new Date().getFullYear();
  const fromYear = minDate ? minDate.getFullYear() : currentYear - 20;
  const toYear = maxDate ? maxDate.getFullYear() : currentYear + 20;
  const fromMonth = minDate ? startOfMonth(minDate) : undefined;
  const toMonth = maxDate ? startOfMonth(maxDate) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(toYMD(d));
              setOpen(false);
            }
          }}
          defaultMonth={selected ?? minDate}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          fromMonth={fromMonth}
          toMonth={toMonth}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

