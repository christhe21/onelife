import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData, type Task } from "@/lib/app-data";

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  low: "bg-slate-200 text-slate-700",
  medium: "bg-amber-200 text-amber-800",
  high: "bg-red-200 text-red-800",
};

export function Tasks() {
  const { tasks, goals, addTask, toggleTask, deleteTask } = useAppData();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [goalId, setGoalId] = useState<string>("none");

  const submit = () => {
    if (!title.trim()) return;
    addTask({
      title,
      dueDate: dueDate || undefined,
      priority,
      goalId: goalId === "none" ? undefined : goalId,
    });
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setGoalId("none");
  };

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap gap-2 pt-6">
          <Input
            placeholder="New task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="min-w-[200px] flex-1"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-40"
          />
          <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Goal (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No goal</SelectItem>
              {goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={submit}><Plus className="mr-2 h-4 w-4" />Add</Button>
        </CardContent>
      </Card>

      {sorted.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No tasks yet.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => {
            const overdue = !t.done && t.dueDate && t.dueDate < today;
            const goal = goals.find((g) => g.id === t.goalId);
            return (
              <Card key={t.id} className={overdue ? "border-red-300" : ""}>
                <CardContent className="flex items-center gap-3 py-3">
                  <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {t.dueDate && (
                        <span className={overdue ? "text-red-600 font-medium" : ""}>
                          Due {t.dueDate}{overdue ? " (overdue)" : ""}
                        </span>
                      )}
                      {goal && <Badge variant="outline">{goal.title}</Badge>}
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_COLOR[t.priority]}`}>
                    {t.priority}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
