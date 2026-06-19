import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, Plus, Search, ClipboardList, Trash2, 
  Upload, Eye, Download, FileText, Receipt, ScrollText 
} from "lucide-react";
import { toast } from "sonner";
import { uploadDocumentFile, getSignedUrl, deleteStorageFile, formatDate } from "@/lib/storage";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentPreviewModal } from "@/components/document-preview-modal";

export const Route = createFileRoute("/_authenticated/inward/$vendorId/")({
  component: VendorDashboardPage,
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
};

function VendorDashboardPage() {
  const { vendorId } = Route.useParams();
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const [preview, setPreview] = useState<{ path: string; mime: string; name: string } | null>(null);

  // 1. Fetch Vendor Details
  const vendorQ = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("id", vendorId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch Purchase Orders
  const ordersQ = useQuery({
    queryKey: ["vendor-orders", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // 3. Fetch Direct Documents (Where order_id is null)
  const directDocsQ = useQuery({
    queryKey: ["vendor-direct-docs", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("vendor_id", vendorId)
        .is("order_id", null) // ONLY fetch docs not linked to an order
        .order("doc_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  const deleteOrderMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", vendorId] });
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Order deleted successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredOrders = (ordersQ.data ?? []).filter((o) => o.po_number.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <Link to="/inward" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="size-4" /> Back to vendors
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Vendor Dashboard</div>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">{vendorQ.data?.name ?? "..."}</h1>
          </div>
        </div>
      </div>

      {/* SECTION 1: DIRECT DOCUMENTS */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-lg">BILLS</div>
            <div className="text-sm text-muted-foreground">Bills and challans not linked to a specific order</div>
          </div>
          <div className="flex gap-2">
            <UploadDirectDocDialog vendorId={vendorId} kind="inward_challan" />
            <UploadDirectDocDialog vendorId={vendorId} kind="bill" />
          </div>
        </div>
        
        {directDocsQ.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading documents...</div>
        ) : (directDocsQ.data ?? []).length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            No direct documents yet.
          </div>
        ) : (
          <ul className="divide-y">
            {directDocsQ.data!.map((b) => (
              <li key={b.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${b.kind === "bill" ? "bg-primary/10 text-primary" : "bg-foreground/10 text-foreground"}`}>
                  {b.kind === "bill" ? <Receipt className="size-5" /> : <ScrollText className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    <span className="capitalize">{b.kind.replace("_", " ")}</span>
                    {b.doc_number ? ` #${b.doc_number}` : ""}
                    <span className="text-muted-foreground font-normal truncate">— {b.file_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Date: {formatDate(b.doc_date)} · Uploaded: {formatDate(b.uploaded_at)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setPreview({ path: b.storage_path, mime: b.mime_type, name: b.file_name })}>
                    <Eye className="size-4 mr-1" /> View
                  </Button>
                  <DownloadBtn path={b.storage_path} name={b.file_name} />
                  <DeleteDocBtn id={b.id} path={b.storage_path} vendorId={vendorId} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className="border-border" />

      {/* SECTION 2: PURCHASE ORDERS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage documents linked to specific POs.</p>
          </div>
          <AddOrderDialog vendorId={vendorId} />
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order numbers..." className="pl-9" />
        </div>
        
        {ordersQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-card border rounded-xl p-10 text-center">
            No orders found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((o) => (
              <div key={o.id} className="group relative rounded-xl border bg-card transition-all hover:shadow-md hover:-translate-y-0.5">
                <Link
                  to="/inward/$vendorId/$orderId"
                  params={{ vendorId, orderId: o.id }}
                  className="block p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ClipboardList className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="font-semibold truncate">{o.po_number}</div>
                      <div className="text-xs text-muted-foreground mt-1">Created {formatDate(o.created_at)}</div>
                    </div>
                  </div>
                </Link>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Delete this order? All mapped documents will also be removed.")) {
                      deleteOrderMut.mutate(o.id);
                    }
                  }}
                  disabled={deleteOrderMut.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
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
    </div>
  );
}

// --- UTILITY COMPONENTS ---

function DownloadBtn({ path, name }: { path: string; name: string }) {
  async function go() {
    try {
      const url = await getSignedUrl(path, { download: name });
      window.location.href = url;
    } catch (e) { toast.error((e as Error).message); }
  }
  return <Button size="sm" variant="outline" onClick={go}><Download className="size-4 mr-1" /> Download</Button>;
}

function DeleteDocBtn({ id, path, vendorId }: { id: string; path: string; vendorId: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      await deleteStorageFile(path);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-direct-docs", vendorId] });
      toast.success("Document deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this document?")) mut.mutate(); }}>
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}

function UploadDirectDocDialog({ vendorId, kind }: { vendorId: string; kind: "bill" | "inward_challan" }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file");
      const path = await uploadDocumentFile(file, `vendors/${vendorId}`);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("documents").insert({
        kind,
        vendor_id: vendorId,
        order_id: null, // Explicitly null for direct docs
        doc_number: docNumber.trim() || null,
        doc_date: docDate,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || "application/octet-stream",
        uploaded_by: userRes.user?.id ?? null,
      });
      if (error) { await deleteStorageFile(path); throw error; }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-direct-docs", vendorId] });
      toast.success(`${kind === "bill" ? "Bill" : "Challan"} uploaded directly to vendor`);
      setFile(null);
      setDocNumber("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const label = kind === "bill" ? "Upload Bill" : "Upload Challan";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant={kind === "bill" ? "default" : "secondary"} onClick={() => setOpen(true)}>
        <Upload className="size-4 mr-2" /> {label}
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Direct {label}</DialogTitle></DialogHeader>
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

function AddOrderDialog({ vendorId }: { vendorId: string }) {
  const [open, setOpen] = useState(false);
  const [po, setPo] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const trimmed = po.trim();
      if (!trimmed) throw new Error("Order number required");
      const { error } = await supabase.from("orders").insert({ vendor_id: vendorId, po_number: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", vendorId] });
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Purchase Order created");
      setPo("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4 mr-1" /> New Order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Order Number</Label>
            <Input autoFocus value={po} onChange={(e) => setPo(e.target.value)} placeholder="PO-2026-001" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Creating..." : "Create Order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}