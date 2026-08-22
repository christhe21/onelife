import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startProductTour } from "@/components/life/ProductTour";

export function TourReplayCard() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4 text-primary" /> Product tour
        </CardTitle>
        <CardDescription>
          Replay the guided walkthrough of Dashboard, Calendar, Overview, and Settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => startProductTour()}>
          <Compass className="mr-2 h-4 w-4" /> Replay tutorial
        </Button>
      </CardContent>
    </Card>
  );
}
