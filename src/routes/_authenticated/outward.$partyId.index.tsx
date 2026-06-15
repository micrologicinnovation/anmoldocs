import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Search, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/outward/$partyId/")({
  component: PartyOrdersPage,
});

function PartyOrdersPage() {
  const { partyId } = Route.useParams();
  const [q, setQ] = useState("");

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
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("party_id", partyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (ordersQ.data ?? []).filter((o) => o.po_number.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <Link to="/outward" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to parties
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Party</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{partyQ.data?.name ?? "..."}</h1>
        </div>
        <AddOrderDialog partyId={partyId} />
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order numbers..." className="pl-9" />
      </div>
      {ordersQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to="/outward/$partyId/$orderId"
              params={{ partyId, orderId: o.id }}
              className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ClipboardList className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{o.po_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">Created {formatDate(o.created_at)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
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
      toast.success("Order created");
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
        <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
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