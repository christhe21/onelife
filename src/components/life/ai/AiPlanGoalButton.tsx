import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiGoalPlannerDialog } from "./AiGoalPlannerDialog";

interface Props {
  defaultSkill?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function AiPlanGoalButton({
  defaultSkill,
  label = "Plan with AI",
  size = "sm",
  variant = "outline",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> {label}
      </Button>
      <AiGoalPlannerDialog open={open} onOpenChange={setOpen} defaultSkill={defaultSkill} />
    </>
  );
}
