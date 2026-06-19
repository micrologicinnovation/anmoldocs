import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Store, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inward/")({
  component: VendorsPage,
});

function VendorsPage() {
  const [q, setQ] = useState("");
  const vendorsQ = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data: vendors, error } = await supabase.from("vendors").select("id, name").order("name");
      if (error) throw error;
      
      // Fetch orders to get the count per vendor
      const { data: orders } = await supabase.from("orders").select("vendor_id").not("vendor_id", "is", null);
      const counts = new Map<string, number>();
      (orders ?? []).forEach((o) => {
        if (o.vendor_id) {
          counts.set(o.vendor_id, (counts.get(o.vendor_id) ?? 0) + 1);
        }
      });
      
      return (vendors ?? []).map((v) => ({ ...v, order_count: counts.get(v.id) ?? 0 }));
    },
  });
  
  const filtered = (vendorsQ.data ?? []).filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Item Inward</h1>
          <p className="text-muted-foreground mt-1">Vendors you purchase raw material from.</p>
        </div>
        <div className="flex gap-2">
          <AddVendorDialog />
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors..." className="pl-9" />
      </div>
      {vendorsQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No vendors found.</div>
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
                    <ClipboardList className="size-3.5" />
                    {v.order_count} {v.order_count === 1 ? "order" : "orders"}
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