import { useState } from "react";
import {
  ExternalLink,
  Star,
  ShieldCheck,
  Clock,
  BookOpen,
  Lightbulb,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MARKETPLACE_GOALS } from "@/data/marketplace";
import { MarketplaceGoalTemplate } from "@/lib/marketplace";
import { useAppData } from "@/lib/app-data";
import { toast } from "sonner";

interface Props {
  onImport: (template: MarketplaceGoalTemplate) => void;
}

export function GoalMarketplace({ onImport }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceGoalTemplate | null>(null);

  const handleContribute = () => {
    // Open GitHub page to create a new JSON file
    const url = "https://github.com/lovable-dev/lovable/new/main/src/data/marketplace";
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">Goal Marketplace</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Import community-curated goals complete with milestones, tasks, and schedules.
          </p>
        </div>
        <Button onClick={handleContribute} variant="outline" className="gap-2">
          <Star className="h-4 w-4" />
          Submit a Goal
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETPLACE_GOALS.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="font-medium">
                  {template.skillName}
                </Badge>
                {template.verified && (
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 gap-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{template.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{template.creatorName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{template.durationDays} Days</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedTemplate(template)}
              >
                View Details
              </Button>
              <Button className="w-full gap-2" onClick={() => onImport(template)}>
                Use Goal
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <TemplateDialog
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onImport={(t) => {
          onImport(t);
          setSelectedTemplate(null);
        }}
      />
    </div>
  );
}

function TemplateDialog({
  template,
  onClose,
  onImport,
}: {
  template: MarketplaceGoalTemplate | null;
  onClose: () => void;
  onImport: (template: MarketplaceGoalTemplate) => void;
}) {
  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary">{template.skillName}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {template.durationDays} Days
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                By {template.creatorName}
              </span>
            </div>
            <DialogTitle className="text-2xl">{template.title}</DialogTitle>
            <DialogDescription className="text-base mt-2">{template.description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Advice Section */}
            {template.advice && (
              <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  Creator's Advice
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{template.advice}</p>
              </div>
            )}

            {/* Resources Section */}
            {template.resources.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  Learning Resources
                </h4>
                <ul className="space-y-2">
                  {template.resources.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1.5 w-fit"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {new URL(url).hostname.replace("www.", "")}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structure Preview */}
            <div>
              <h4 className="font-semibold mb-4 border-b pb-2">Structure Preview</h4>
              <div className="space-y-4">
                {template.subGoals.map((sg, i) => {
                  const subTasks = template.tasks.filter((t) => t.subGoalIndex === i);
                  return (
                    <div key={i} className="pl-4 border-l-2 border-muted">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{sg.title}</h5>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Day {sg.dayOffset}
                        </span>
                      </div>
                      <ul className="space-y-1 mt-1">
                        {subTasks.map((t, j) => (
                          <li
                            key={j}
                            className="text-xs text-muted-foreground flex items-center gap-2"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {t.title}
                            {t.recurrence && t.recurrence !== "none" && (
                              <span className="italic opacity-70">({t.recurrence})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onImport(template)}>Import This Goal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
