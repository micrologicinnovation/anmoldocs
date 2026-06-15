import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, Upload, Eye, Download, Trash2, FileText } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { uploadDocumentFile, getSignedUrl, deleteStorageFile, formatDate } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inward/$vendorId")({
  component: VendorDetailPage,
});

function VendorDetailPage() {
  const { vendorId } = Route.useParams();
  const vendorQ = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("id", vendorId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const billsQ = useQuery({
    queryKey: ["vendor-bills", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("doc_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [preview, setPreview] = useState<{ path: string; mime: string; name: string } | null>(null);

  return (
    <div className="space-y-6">
      <Link to="/inward" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to vendors
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Vendor</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{vendorQ.data?.name ?? "..."}</h1>
        </div>
        <UploadBillDialog vendorId={vendorId} />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold">Uploaded Bills</div>
          <div className="text-sm text-muted-foreground">{billsQ.data?.length ?? 0} total</div>
        </div>
        {billsQ.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : (billsQ.data ?? []).length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            No bills uploaded yet.
          </div>
        ) : (
          <ul className="divide-y">
            {billsQ.data!.map((b) => (
              <li key={b.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">Bill #{b.doc_number || "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Bill date: {formatDate(b.doc_date)} · Uploaded: {formatDate(b.uploaded_at)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setPreview({ path: b.storage_path, mime: b.mime_type, name: b.file_name })}>
                    <Eye className="size-4 mr-1" /> View
                  </Button>
                  <DownloadBtn path={b.storage_path} name={b.file_name} />
                  <DeleteBtn id={b.id} path={b.storage_path} queryKey={["vendor-bills", vendorId]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DocumentPreviewModal
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        storagePath={preview?.path ?? null}
        mimeType={preview?.mime ?? null}
        fileName={preview?.name ?? null}
      />
    </div>
  );
}

function DownloadBtn({ path, name }: { path: string; name: string }) {
  async function go() {
    try {
      const url = await getSignedUrl(path, { download: name });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return <Button size="sm" variant="outline" onClick={go}><Download className="size-4 mr-1" /> Download</Button>;
}

function DeleteBtn({ id, path, queryKey }: { id: string; path: string; queryKey: unknown[] }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      await deleteStorageFile(path);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this document?")) mut.mutate(); }}>
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}

function UploadBillDialog({ vendorId }: { vendorId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file");
      const path = await uploadDocumentFile(file, `vendors/${vendorId}`);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("documents").insert({
        kind: "bill",
        vendor_id: vendorId,
        doc_number: billNumber.trim() || null,
        doc_date: billDate,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || "application/octet-stream",
        uploaded_by: userRes.user?.id ?? null,
      });
      if (error) {
        await deleteStorageFile(path);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-bills", vendorId] });
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Bill uploaded");
      setFile(null);
      setBillNumber("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="lg" onClick={() => setOpen(true)}><Upload className="size-4 mr-2" /> Upload New Bill</Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Bill</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bill Number</Label>
              <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="INV-1234" />
            </div>
            <div className="space-y-2">
              <Label>Bill Date</Label>
              <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} required />
            </div>
          </div>
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>Change</Button>
            </div>
          ) : (
            <UploadDropzone onFile={setFile} disabled={mut.isPending} />
          )}
          <DialogFooter>
            <Button type="submit" disabled={!file || mut.isPending}>
              {mut.isPending ? "Uploading..." : "Upload Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}