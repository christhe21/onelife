import { useState, type ReactElement, cloneElement } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewGoalWizard } from "@/components/life/NewGoalWizard";

interface Props {
  defaultSkill?: string;
  trigger?: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewGoalButton({ defaultSkill, trigger, label = "New goal", size = "sm" }: Props) {
  const [open, setOpen] = useState(false);

  const triggerEl = trigger ? (
    cloneElement(trigger, {
      onClick: (e: React.MouseEvent) => {
        trigger.props.onClick?.(e);
        setOpen(true);
      },
    })
  ) : (
    <Button size={size} onClick={() => setOpen(true)}>
      <Plus className="mr-2 h-4 w-4" /> {label}
    </Button>
  );

  return (
    <>
      {triggerEl}
      <NewGoalWizard open={open} onOpenChange={setOpen} defaultSkill={defaultSkill} />
    </>
  );
}
