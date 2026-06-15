import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { isAcceptedFile, ACCEPT_ATTR } from "@/lib/storage";
import { toast } from "sonner";

export function UploadDropzone({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function handle(file?: File | null) {
    if (!file) return;
    if (!isAcceptedFile(file)) {
      toast.error("Only PDF, JPG, PNG or WEBP files are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB).");
      return;
    }
    onFile(file);
  }

  return (
    <div
      onDragOver={(e: DragEvent) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      onClick={() => !disabled && ref.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="mx-auto mb-3 size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Upload className="size-6" />
      </div>
      <div className="font-medium">Drop file here or click to upload</div>
      <div className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG or WEBP — up to 20MB</div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept={ACCEPT_ATTR}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handle(e.target.files?.[0])}
      />
    </div>
  );
}