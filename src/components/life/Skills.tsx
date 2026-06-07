import { useState } from "react";
import { Plus, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data";
import { toast } from "sonner";

export function Skills() {
  const { skills, addSkill, updateSkill, deleteSkill, goals } = useAppData();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#10b981");

  const submit = () => {
    if (!label.trim()) return;
    addSkill({ label, color });
    setLabel("");
    setColor("#10b981");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">New skill name</Label>
            <Input
              placeholder="e.g. Mindfulness"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
            />
          </div>
          <Button onClick={submit}>
            <Plus className="mr-2 h-4 w-4" />
            Add skill
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-2">
        {skills.map((s) => {
          const inUse = goals.filter((g) => g.skill === s.id).length;
          return (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 py-4">
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => updateSkill(s.id, { color: e.target.value })}
                  className="h-9 w-10 cursor-pointer rounded-md border border-input bg-transparent p-1"
                  title="Change color"
                />
                <Input
                  value={s.label}
                  onChange={(e) => updateSkill(s.id, { label: e.target.value })}
                  className="flex-1"
                />
                <Badge variant="secondary" title="Goals using this skill">
                  <Palette className="mr-1 h-3 w-3" /> {inUse}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (inUse > 0) {
                      toast.error(
                        `Can't delete: ${inUse} goal${inUse === 1 ? "" : "s"} use this skill`,
                      );
                      return;
                    }
                    deleteSkill(s.id);
                  }}
                  title="Delete skill"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
