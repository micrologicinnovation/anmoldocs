import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Factory, ClipboardList, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/outward/")({
  component: PartiesPage,
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

function PartiesPage() {
  const [q, setQ] = useState("");
  const partiesQ = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data: parties, error } = await supabase.from("parties").select("id, name").order("name");
      if (error) throw error;
      const { data: orders } = await supabase.from("orders").select("party_id");
      const counts = new Map<string, number>();
      (orders ?? []).forEach((o) => counts.set(o.party_id, (counts.get(o.party_id) ?? 0) + 1));
      return (parties ?? []).map((p) => ({ ...p, order_count: counts.get(p.id) ?? 0 }));
    },
  });
  const filtered = (partiesQ.data ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Item Outward</h1>
          <p className="text-muted-foreground mt-1">Processing parties you send material to.</p>
        </div>
        <div className="flex gap-2">
          <UploadOutwardChallanDialog />
          <AddPartyDialog />
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parties..." className="pl-9" />
      </div>
      {partiesQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No parties found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/outward/$partyId"
              params={{ partyId: p.id }}
              className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-lg bg-foreground text-background flex items-center justify-center">
                  <Factory className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClipboardList className="size-3.5" />
                    {p.order_count} {p.order_count === 1 ? "order" : "orders"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPartyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name required");
      const { error } = await supabase.from("parties").insert({ name: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties"] });
      toast.success("Party added");
      setName("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4 mr-1" /> Add Party</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Processing Party</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Party Name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wilco International" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Adding..." : "Add Party"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadOutwardChallanDialog() {
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
    enabled: open, 
  });

  const mut = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error("Please select an order.");
      if (!docNumber.trim()) throw new Error("Challan number is required.");
      if (!file) throw new Error("Please select a file to upload.");

      // 1. Prepare File Path (saving to a different folder for organization)
      const fileExt = file.name.split('.').pop();
      const filePath = `outward_challans/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // 2. Upload file to Backblaze B2
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
        kind: "challan", // Using the standard 'challan' enum for outward documents
        order_id: orderId,
        doc_number: docNumber.trim(),
        doc_date: new Date().toISOString().split('T')[0],
        file_name: file.name,
        storage_path: filePath, 
        mime_type: file.type,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Outward Challan uploaded successfully");
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
        <DialogHeader><DialogTitle>Upload Outward Challan</DialogTitle></DialogHeader>
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
              placeholder="e.g. OUT-4022" 
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