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
  const { exportJSON, importJSON, clearAll, goals, tasks, bucketList } = useAppData();
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
        </DropdownMenuContent>
      </DropdownMenu>

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
