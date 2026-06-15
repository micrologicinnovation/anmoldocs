import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Store, FileText, Upload } from "lucide-react";
import { formatDate } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inward/")({
  component: VendorsPage,
});

// Initialize the Backblaze B2 S3 Client
const b2Client = new S3Client({
  endpoint: import.meta.env.VITE_B2_ENDPOINT,
  region: import.meta.env.VITE_B2_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_B2_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_B2_SECRET_KEY,
  },
});

type VendorRow = {
  id: string;
  name: string;
  bill_count: number;
  last_upload: string | null;
};

async function fetchVendors(): Promise<VendorRow[]> {
  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, name")
    .order("name");
  if (error) throw error;
  const { data: docs } = await supabase
    .from("documents")
    .select("vendor_id, uploaded_at")
    .not("vendor_id", "is", null);
  const map = new Map<string, { count: number; last: string | null }>();
  (docs ?? []).forEach((d) => {
    if (!d.vendor_id) return;
    const cur = map.get(d.vendor_id) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || d.uploaded_at > cur.last) cur.last = d.uploaded_at;
    map.set(d.vendor_id, cur);
  });
  return (vendors ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    bill_count: map.get(v.id)?.count ?? 0,
    last_upload: map.get(v.id)?.last ?? null,
  }));
}

function VendorsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["vendors"], queryFn: fetchVendors });
  const filtered = (data ?? []).filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Item Inward</h1>
          <p className="text-muted-foreground mt-1">Vendors you purchase raw material from.</p>
        </div>
        <div className="flex gap-2">
          <UploadInwardChallanDialog />
          <AddVendorDialog />
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors..." className="pl-9" />
      </div>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground text-sm">No vendors found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v.id}
              to="/inward/$vendorId"
              params={{ vendorId: v.id }}
              className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Store className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{v.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="size-3.5" />
                    {v.bill_count} {v.bill_count === 1 ? "bill" : "bills"}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Last upload: {v.last_upload ? formatDate(v.last_upload) : "—"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AddVendorDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name required");
      const { error } = await supabase.from("vendors").insert({ name: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor added");
      setName("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4 mr-1" /> Add Vendor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Vendor Name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shubham International" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Adding..." : "Add Vendor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadInwardChallanDialog() {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const qc = useQueryClient();

  // Fetch orders to populate the dropdown
  const { data: orders } = useQuery({
    queryKey: ["orders-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, po_number, parties(name)");
      if (error) throw error;
      return data;
    },
    enabled: open, // Only fetch when dialog is open
  });

  const mut = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error("Please select an order.");
      if (!docNumber.trim()) throw new Error("Challan number is required.");
      if (!file) throw new Error("Please select a file to upload.");

      // 1. Prepare File Path
      const fileExt = file.name.split('.').pop();
      const filePath = `inward_challans/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // 2. Upload file to Backblaze B2 via S3 API
      await b2Client.send(
        new PutObjectCommand({
          Bucket: import.meta.env.VITE_B2_BUCKET,
          Key: filePath,
          Body: file,
          ContentType: file.type,
        })
      );

      // 3. Insert record into Supabase Database
      const { error: dbError } = await supabase.from("documents").insert({
        kind: "inward_challan",
        order_id: orderId,
        doc_number: docNumber.trim(),
        doc_date: new Date().toISOString().split('T')[0],
        file_name: file.name,
        storage_path: filePath, // Saving the exact path we pushed to B2
        mime_type: file.type,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Challan uploaded to B2 successfully");
      setOrderId("");
      setDocNumber("");
      setFile(null);
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary"><Upload className="size-4 mr-1" /> Upload Challan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Inward Challan</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Select Order</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={orderId} 
              onChange={(e) => setOrderId(e.target.value)}
              required
            >
              <option value="" disabled>-- Select an Order --</option>
              {orders?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.po_number} ({o.parties?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Challan Number</Label>
            <Input 
              value={docNumber} 
              onChange={(e) => setDocNumber(e.target.value)} 
              placeholder="e.g. CH-9921" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Document File</Label>
            <Input 
              type="file" 
              accept=".pdf,image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              required 
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Uploading to B2..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}