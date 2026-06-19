import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Building2, ClipboardList, Receipt, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/outward/")({
  component: PartiesPage,
});

function PartiesPage() {
  const [q, setQ] = useState("");
  const [editingParty, setEditingParty] = useState<{ id: string; name: string } | null>(null);
  
  const qc = useQueryClient();
  const partiesQ = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data: parties, error } = await supabase.from("parties").select("id, name").order("name");
      if (error) throw error;
      
      const { data: orders } = await supabase.from("orders").select("id, party_id").not("party_id", "is", null);
      const orderCounts = new Map<string, number>();
      const orderToParty = new Map<string, string>(); 
      
      (orders ?? []).forEach((o) => {
        if (o.party_id) {
          orderCounts.set(o.party_id, (orderCounts.get(o.party_id) ?? 0) + 1);
          orderToParty.set(o.id, o.party_id);
        }
      });
      
      // Fetching bills to count per party
      const { data: bills } = await supabase.from("documents").select("party_id, order_id").eq("kind", "bill");
      const billCounts = new Map<string, number>();
      
      (bills ?? []).forEach((b) => {
        const pId = b.party_id || (b.order_id ? orderToParty.get(b.order_id) : null);
        if (pId) {
          billCounts.set(pId, (billCounts.get(pId) ?? 0) + 1);
        }
      });
      
      return (parties ?? []).map((p) => ({ 
        ...p, 
        order_count: orderCounts.get(p.id) ?? 0,
        bill_count: billCounts.get(p.id) ?? 0 
      }));
    },
  });

  const editMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("parties").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties"] });
      toast.success("Party renamed");
      setEditingParty(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  
  const filtered = (partiesQ.data ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Item Outward</h1>
          <p className="text-muted-foreground mt-1">Parties you sell or send processed material to.</p>
        </div>
        <div className="flex gap-2">
          <AddPartyDialog />
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parties..." className="pl-9" />
      </div>
      {partiesQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading parties...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No parties found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/outward/$partyId"
              params={{ partyId: p.id }}
              className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 relative flex items-start gap-3"
            >
              <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <ClipboardList className="size-3.5" />
                    {p.order_count} {p.order_count === 1 ? "order" : "orders"}
                  </span>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <Receipt className="size-3.5" />
                    {p.bill_count} {p.bill_count === 1 ? "bill" : "bills"}
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault(); // Prevent navigating to the party dashboard
                  setEditingParty({ id: p.id, name: p.name });
                }}
              >
                <Pencil className="size-4 text-muted-foreground" />
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* EDIT PARTY DIALOG */}
      <Dialog open={!!editingParty} onOpenChange={(o) => !o && setEditingParty(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Party</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingParty) editMut.mutate(editingParty); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Party Name</Label>
              <Input autoFocus value={editingParty?.name || ""} onChange={(e) => setEditingParty(prev => prev ? { ...prev, name: e.target.value } : null)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editMut.isPending}>{editMut.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
        <DialogHeader><DialogTitle>Add Party</DialogTitle></DialogHeader>
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