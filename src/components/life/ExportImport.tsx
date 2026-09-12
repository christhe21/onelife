import { useRef, useState } from "react";
import { Download, Upload, Database, Table2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { exportSpreadsheet } from "@/lib/spreadsheet";
import { toast } from "sonner";

export function ExportImport() {
  const { exportJSON, importJSON, clearAll, goals, tasks, bucketList, skills } = useAppData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const hasData = goals.length + tasks.length + bucketList.length > 0;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (hasData) setPendingFile(f);
    else doImport(f);
  };

  const doImport = async (f: File) => {
    try {
      await importJSON(f);
      toast.success("Backup restored");
    } catch (err) {
      toast.error("That file couldn't be read: " + (err as Error).message);
    }
  };

  const doSpreadsheet = () => {
    try {
      exportSpreadsheet({ goals, tasks, bucketList, skills });
      toast.success("Spreadsheet downloaded");
    } catch {
      toast.error("Couldn't create the spreadsheet");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            title="Backup, restore and export"
            aria-label="Backup, restore and export"
          >
            <Database className="h-[1.15rem] w-[1.15rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={doSpreadsheet}>
            <Table2 className="mr-2 h-4 w-4" />
            Export to spreadsheet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Backup / Restore</DropdownMenuLabel>
          <DropdownMenuItem onClick={exportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Save a backup file
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Restore from backup…
          </DropdownMenuItem>
          {hasData && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmClear(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all data
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every goal, task and someday idea. Save a backup first if you
              might want them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAll();
                toast.success("All data cleared");
              }}
            >
              Clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything you have now will be replaced with the contents of the file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const f = pendingFile;
                setPendingFile(null);
                if (f) await doImport(f);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
