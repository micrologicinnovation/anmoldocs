import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Search, ClipboardList, Trash2, Upload, Eye, Download, FileText, Receipt, ScrollText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { uploadDocumentFile, getSignedUrl, deleteStorageFile, formatDate } from "@/lib/storage";
import { UploadDropzone } from "@/components/upload-dropzone";
import { DocumentPreviewModal } from "@/components/document-preview-modal";

export const Route = createFileRoute("/_authenticated/outward/$partyId/")({
  component: PartyDashboardPage,
});

type Doc = {
  id: string;
  kind: "bill" | "challan";
  doc_number: string | null;
  doc_date: string;
  uploaded_at: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  comments: string | null;
};

function PartyDashboardPage() {
  const { partyId } = Route.useParams();
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const [preview, setPreview] = useState<{ path: string; mime: string; name: string } | null>(null);
  const [editingOrder, setEditingOrder] = useState<{ id: string; po_number: string } | null>(null);
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);

  const partyQ = useQuery({
    queryKey: ["party", partyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("parties").select("*").eq("id", partyId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const ordersQ = useQuery({
    queryKey: ["party-orders", partyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("party_id", partyId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const directDocsQ = useQuery({
    queryKey: ["party-direct-docs", partyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("party_id", partyId).is("order_id", null).order("doc_date", { ascending: false });
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
      qc.invalidateQueries({ queryKey: ["party-orders", partyId] });
      qc.invalidateQueries({ queryKey: ["parties"] });
      toast.success("Order deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editOrderMut = useMutation({
    mutationFn: async ({ id, po_number }: { id: string; po_number: string }) => {
      const { error } = await supabase.from("orders").update({ po_number: po_number.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["party-orders", partyId] });
      toast.success("Order updated");
      setEditingOrder(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredOrders = (ordersQ.data ?? []).filter((o) => o.po_number.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-10">
      <div>
        <Link to="/outward" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="size-4" /> Back to parties
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Party Dashboard</div>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">{partyQ.data?.name ?? "..."}</h1>
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
            <UploadDirectDocDialog partyId={partyId} kind="challan" />
            <UploadDirectDocDialog partyId={partyId} kind="bill" />
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
              <li key={b.id} className="px-5 py-4 flex flex-wrap items-start gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${b.kind === "bill" ? "bg-primary/10 text-primary" : "bg-foreground/10 text-foreground"}`}>
                  {b.kind === "bill" ? <Receipt className="size-5" /> : <ScrollText className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    <span className="capitalize">{b.kind.replace("_", " ")}</span>
                    {b.doc_number ? ` #${b.doc_number}` : ""}
                    <span className="text-muted-foreground font-normal truncate">— {b.file_name}</span>
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
                  <DeleteDocBtn id={b.id} path={b.storage_path} partyId={partyId} />
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
          <AddOrderDialog partyId={partyId} />
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
                <Link to="/outward/$partyId/$orderId" params={{ partyId, orderId: o.id }} className="block p-5">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ClipboardList className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-16">
                      <div className="font-semibold truncate">{o.po_number}</div>
                      <div className="text-xs text-muted-foreground mt-1">Created {formatDate(o.created_at)}</div>
                    </div>
                  </div>
                </Link>
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setEditingOrder(o); }}>
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); if (confirm("Delete this order?")) deleteOrderMut.mutate(o.id); }}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentPreviewModal open={!!preview} onOpenChange={(o) => !o && setPreview(null)} storagePath={preview?.path ?? null} mimeType={preview?.mime ?? null} fileName={preview?.name ?? null} />
      {editingDoc && <EditDocDialog doc={editingDoc} onClose={() => setEditingDoc(null)} queryKey={["party-direct-docs", partyId]} />}
      
      {/* EDIT ORDER DIALOG */}
      <Dialog open={!!editingOrder} onOpenChange={(o) => !o && setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Order Details</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingOrder) editOrderMut.mutate(editingOrder); }} className="space-y-4">
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input autoFocus value={editingOrder?.po_number || ""} onChange={(e) => setEditingOrder(prev => prev ? { ...prev, po_number: e.target.value } : null)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editOrderMut.isPending}>{editOrderMut.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

export function EditDocDialog({ doc, onClose, queryKey }: { doc: Doc; onClose: () => void; queryKey: any[] }) {
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

function DeleteDocBtn({ id, path, partyId }: { id: string; path: string; partyId: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      await deleteStorageFile(path);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["party-direct-docs", partyId] });
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

function UploadDirectDocDialog({ partyId, kind }: { partyId: string; kind: "bill" | "challan" }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [comments, setComments] = useState("");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file");
      const path = await uploadDocumentFile(file, `parties/${partyId}`);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("documents").insert({
        kind,
        party_id: partyId,
        order_id: null,
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
      qc.invalidateQueries({ queryKey: ["party-direct-docs", partyId] });
      toast.success(`${kind === "bill" ? "Bill" : "Challan"} uploaded directly to party`);
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

function AddOrderDialog({ partyId }: { partyId: string }) {
  const [open, setOpen] = useState(false);
  const [po, setPo] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const trimmed = po.trim();
      if (!trimmed) throw new Error("Order number required");
      const { error } = await supabase.from("orders").insert({ party_id: partyId, po_number: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["party-orders", partyId] });
      qc.invalidateQueries({ queryKey: ["parties"] });
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