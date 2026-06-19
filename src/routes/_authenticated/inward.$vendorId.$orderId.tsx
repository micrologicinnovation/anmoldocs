import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, Upload, Eye, Download, Trash2, FileText, Receipt, ScrollText, Pencil } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { uploadDocumentFile, getSignedUrl, deleteStorageFile, formatDate } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inward/$vendorId/$orderId")({
  component: VendorOrderDocumentsPage,
});

type Doc = {
  id: string;
  kind: "bill" | "inward_challan";
  doc_number: string | null;
  doc_date: string;
  uploaded_at: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  comments: string | null;
};

function VendorOrderDocumentsPage() {
  const { vendorId, orderId } = Route.useParams();

  const orderQ = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const docsQ = useQuery({
    queryKey: ["order-docs", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("order_id", orderId)
        .order("doc_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Doc[]>();
    (docsQ.data ?? []).forEach((d) => {
      const k = d.doc_date;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [docsQ.data]);

  const [preview, setPreview] = useState<{ path: string; mime: string; name: string } | null>(null);
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);

  return (
    <div className="space-y-6">
      <Link to="/inward/$vendorId" params={{ vendorId }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to orders
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Purchase Order</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{orderQ.data?.po_number ?? "..."}</h1>
        </div>
        <div className="flex gap-2">
          <UploadDocDialog orderId={orderId} kind="inward_challan" vendorId={vendorId} />
          <UploadDocDialog orderId={orderId} kind="bill" vendorId={vendorId} />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold">Documents</div>
          <div className="text-sm text-muted-foreground">{docsQ.data?.length ?? 0} total</div>
        </div>
        {docsQ.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            No documents yet. Upload a received challan or bill.
          </div>
        ) : (
          <div className="divide-y">
            {grouped.map(([date, docs]) => (
              <div key={date}>
                <div className="px-5 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatDate(date)}
                </div>
                <ul className="divide-y">
                  {docs.map((b) => (
                    <li key={b.id} className="px-5 py-4 flex flex-wrap items-start gap-3">
                      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${b.kind === "bill" ? "bg-primary/10 text-primary" : "bg-foreground/10 text-foreground"}`}>
                        {b.kind === "bill" ? <Receipt className="size-5" /> : <ScrollText className="size-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          <span className="capitalize">{b.kind.replace("_", " ")}</span>
                          {b.doc_number ? ` #${b.doc_number}` : ""} <span className="text-muted-foreground font-normal">— {b.file_name}</span>
                        </div>
                        {b.comments && (
                          <div className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md border inline-block w-full">
                            {b.comments}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Date: {formatDate(b.doc_date)} · Uploaded: {formatDate(b.uploaded_at)}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Button size="sm" variant="outline" onClick={() => setPreview({ path: b.storage_path, mime: b.mime_type, name: b.file_name })}>
                          <Eye className="size-4 mr-1" /> View
                        </Button>
                        <DownloadBtn path={b.storage_path} name={b.file_name} />
                        <Button size="sm" variant="ghost" onClick={() => setEditingDoc(b)}>
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteBtn id={b.id} path={b.storage_path} orderId={orderId} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentPreviewModal 
        open={!!preview} 
        onOpenChange={(o) => !o && setPreview(null)} 
        storagePath={preview?.path ?? null} 
        mimeType={preview?.mime ?? null} 
        fileName={preview?.name ?? null} 
      />
      
      {/* Edit Document Dialog */}
      {editingDoc && (
        <EditDocDialog 
          doc={editingDoc} 
          onClose={() => setEditingDoc(null)} 
          queryKey={["order-docs", orderId]} 
        />
      )}
    </div>
  );
}

// --- UTILITY COMPONENTS ---

function EditDocDialog({ doc, onClose, queryKey }: { doc: Doc; onClose: () => void; queryKey: any[] }) {
  const [num, setNum] = useState(doc.doc_number || "");
  const [date, setDate] = useState(doc.doc_date);
  const [com, setCom] = useState(doc.comments || "");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").update({
        doc_number: num.trim() || null,
        doc_date: date,
        comments: com.trim() || null,
      }).eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Document updated");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Document Details</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Document Number</Label>
              <Input value={num} onChange={(e) => setNum(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comments</Label>
            <Input value={com} onChange={(e) => setCom(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DownloadBtn({ path, name }: { path: string; name: string }) {
  async function go() {
    try {
      const url = await getSignedUrl(path, { download: name });
      window.location.href = url;
    } catch (e) { toast.error((e as Error).message); }
  }
  return <Button size="sm" variant="outline" onClick={go}><Download className="size-4 mr-1" /> Download</Button>;
}

function DeleteBtn({ id, path, orderId }: { id: string; path: string; orderId: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      await deleteStorageFile(path);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order-docs", orderId] });
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

function UploadDocDialog({ orderId, vendorId, kind }: { orderId: string; vendorId: string; kind: "bill" | "inward_challan" }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [comments, setComments] = useState("");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file");
      const path = await uploadDocumentFile(file, `orders/${orderId}`);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("documents").insert({
        kind,
        order_id: orderId,
        vendor_id: vendorId, // Including vendor_id to make general tracking easier
        doc_number: docNumber.trim() || null,
        doc_date: docDate,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || "application/octet-stream",
        uploaded_by: userRes.user?.id ?? null,
        comments: comments.trim() || null,
      });
      if (error) { await deleteStorageFile(path); throw error; }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order-docs", orderId] });
      toast.success(`${kind === "bill" ? "Bill" : "Challan"} uploaded`);
      setFile(null);
      setDocNumber("");
      setComments("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const label = kind === "bill" ? "Upload Bill" : "Upload Challan";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="lg" variant={kind === "bill" ? "default" : "secondary"} onClick={() => setOpen(true)}>
        <Upload className="size-4 mr-2" /> {label}
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{kind === "bill" ? "Bill" : "Challan"} Number</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="e.g. 1234" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comments (Optional)</Label>
            <Input 
              value={comments} 
              onChange={(e) => setComments(e.target.value)} 
              placeholder="Add any extra info or notes here..." 
            />
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
              {mut.isPending ? "Uploading..." : label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}