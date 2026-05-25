import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppData } from "@/lib/app-data";
import { toast } from "sonner";

export function ExportImport() {
  const { exportJSON, importJSON, goals, tasks, bucketList } = useAppData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const hasData = goals.length + tasks.length + bucketList.length > 0;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (hasData) {
      setPendingFile(f);
    } else {
      doImport(f);
    }
  };

  const doImport = async (f: File) => {
    try {
      await importJSON(f);
      toast.success("Data imported");
    } catch (err) {
      toast.error("Invalid file: " + (err as Error).message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportJSON}>
        <Download className="mr-2 h-4 w-4" /> Export
      </Button>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" /> Import
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onFile}
      />
      <AlertDialog open={!!pendingFile} onOpenChange={(o) => !o && setPendingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current data?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing will overwrite all goals, tasks, and bucket-list items in this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingFile) await doImport(pendingFile);
                setPendingFile(null);
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
