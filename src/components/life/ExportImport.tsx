import { useRef, useState } from "react";
import { Download, Upload, FileJson, ChevronDown, BookOpen, Trash2 } from "lucide-react";
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
import { useAppData, downloadTemplate, downloadSkillsReference } from "@/lib/app-data";
import { toast } from "sonner";

export function ExportImport() {
  const { exportJSON, importJSON, appendJSON, clearAll, goals, tasks, bucketList } = useAppData();
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
      toast.success("Data imported");
    } catch (err) {
      toast.error("Invalid file: " + (err as Error).message);
    }
  };

  const doAppend = async (f: File) => {
    try {
      const r = await appendJSON(f);
      toast.success(`Added ${r.goals} goals, ${r.tasks} tasks, ${r.bucket} bucket items`);
    } catch (err) {
      toast.error("Invalid file: " + (err as Error).message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            <FileJson className="mr-2 h-4 w-4" />
            Data
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Session data</DropdownMenuLabel>
          <DropdownMenuItem onClick={exportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Export current session
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import from JSON…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>For offline / AI use</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => { downloadTemplate(); toast.success("Template downloaded"); }}>
            <FileJson className="mr-2 h-4 w-4" />
            Download JSON template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { downloadSkillsReference(); toast.success("Skills reference downloaded"); }}>
            <BookOpen className="mr-2 h-4 w-4" />
            Download skills reference
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
              This permanently deletes all goals, tasks, and bucket-list items from this browser.
              Export first if you want a backup.
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
            <AlertDialogTitle>How should we import this file?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have goals, tasks, or bucket-list items in this session. Choose how to bring in the new data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={async () => {
                const f = pendingFile;
                setPendingFile(null);
                if (f) await doAppend(f);
              }}
              className="rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <div className="text-sm font-semibold">Append to existing</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the imported goals, tasks, and bucket items alongside what you already have. Nothing is removed.
              </p>
            </button>
            <button
              type="button"
              onClick={async () => {
                const f = pendingFile;
                setPendingFile(null);
                if (f) await doImport(f);
              }}
              className="rounded-xl border bg-card p-3 text-left transition hover:border-destructive hover:bg-destructive/5"
            >
              <div className="text-sm font-semibold text-destructive">Replace all data</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Overwrite all current goals, tasks, and bucket items with the contents of the file.
              </p>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
