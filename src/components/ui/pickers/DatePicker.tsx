import * as React from "react";
import { format, parse, setMonth, setYear } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [pickerMode, setPickerMode] = React.useState<"day" | "month" | "year">("day");

  const selected = React.useMemo(() => parseYMD(value), [value]);
  const minDate = React.useMemo(() => parseYMD(min), [min]);
  const maxDate = React.useMemo(() => parseYMD(max), [max]);

  const [viewMonth, setViewMonth] = React.useState<Date>(() => selected || minDate || new Date());

  React.useEffect(() => {
    if (open) {
      setPickerMode("day");
      setViewMonth(selected || minDate || new Date());
    }
  }, [open, selected, minDate]);

  const currentYear = new Date().getFullYear();
  const fromYear = minDate ? minDate.getFullYear() : 1900;
  const toYear = maxDate ? maxDate.getFullYear() : currentYear + 70;
  const fromMonth = minDate ? startOfMonth(minDate) : undefined;
  const toMonth = maxDate ? startOfMonth(maxDate) : undefined;

  const handleMonthChange = (month: Date) => {
    setViewMonth(month);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewMonth((prev) => setMonth(prev, monthIndex));
    setPickerMode("day");
  };

  const handleYearSelect = (year: number) => {
    setViewMonth((prev) => setYear(prev, year));
    setPickerMode("day");
  };

  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      index: i,
      label: format(d, "MMM"),
      disabled:
        (minDate && setMonth(viewMonth, i) < startOfMonth(minDate)) ||
        (maxDate && setMonth(viewMonth, i) > startOfMonth(maxDate)),
    };
  });

  // Generate years
  const years = React.useMemo(() => {
    const arr = [];
    for (let y = fromYear; y <= toYear; y++) {
      arr.push(y);
    }
    return arr;
  }, [fromYear, toYear]);

  const yearGridRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (pickerMode === "year" && yearGridRef.current) {
      const selectedEl = yearGridRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center" });
      }
    }
  }, [pickerMode]);

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
        <div className="p-3 pb-0 flex items-center justify-between gap-1">
          <div className="flex gap-1 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-semibold text-sm hover:bg-muted"
              onClick={() => setPickerMode(pickerMode === "month" ? "day" : "month")}
            >
              {format(viewMonth, "MMMM")}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-semibold text-sm hover:bg-muted"
              onClick={() => setPickerMode(pickerMode === "year" ? "day" : "year")}
            >
              {format(viewMonth, "yyyy")}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </div>

          {pickerMode === "day" && (
            <div className="flex gap-1 items-center">
              <Button
                variant="outline"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={() => setViewMonth((prev) => setMonth(prev, prev.getMonth() - 1))}
                disabled={minDate ? startOfMonth(viewMonth) <= startOfMonth(minDate) : false}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={() => setViewMonth((prev) => setMonth(prev, prev.getMonth() + 1))}
                disabled={maxDate ? startOfMonth(viewMonth) >= startOfMonth(maxDate) : false}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {pickerMode === "day" && (
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(toYMD(d));
                setOpen(false);
              }
            }}
            month={viewMonth}
            onMonthChange={handleMonthChange}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            className={cn("p-3 pointer-events-auto [&_.rdp-caption]:hidden")}
            initialFocus
            disableNavigation
          />
        )}

        {pickerMode === "month" && (
          <div className="p-3 grid grid-cols-3 gap-2 w-[280px]">
            {months.map((m) => (
              <Button
                key={m.index}
                variant={viewMonth.getMonth() === m.index ? "default" : "ghost"}
                onClick={() => handleMonthSelect(m.index)}
                disabled={m.disabled}
              >
                {m.label}
              </Button>
            ))}
          </div>
        )}

        {pickerMode === "year" && (
          <div
            ref={yearGridRef}
            className="p-3 grid grid-cols-4 gap-2 w-[280px] h-[300px] overflow-y-auto"
          >
            {years.map((y) => (
              <Button
                key={y}
                variant={viewMonth.getFullYear() === y ? "default" : "ghost"}
                onClick={() => handleYearSelect(y)}
                data-selected={viewMonth.getFullYear() === y}
              >
                {y}
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
