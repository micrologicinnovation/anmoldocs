import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSignedUrl } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentPreviewModal({
  open,
  onOpenChange,
  storagePath,
  mimeType,
  fileName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  storagePath: string | null;
  mimeType: string | null;
  fileName: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !storagePath) { setUrl(null); return; }
    let active = true;
    getSignedUrl(storagePath).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [open, storagePath]);

  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="truncate">{fileName ?? "Preview"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center">
          {!url && <Skeleton className="w-2/3 h-2/3" />}
          {url && isImage && <img src={url} alt={fileName ?? ""} className="max-w-full max-h-full object-contain" />}
          {url && isPdf && <iframe src={url} className="w-full h-full bg-white" title={fileName ?? "PDF"} />}
          {url && !isImage && !isPdf && (
            <a href={url} target="_blank" rel="noreferrer" className="underline">Open file</a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}