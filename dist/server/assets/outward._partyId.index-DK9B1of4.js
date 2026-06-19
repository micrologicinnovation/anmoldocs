import { t as supabase } from "./client-CLJYXxXG.js";
import { t as Route } from "./outward._partyId.index-CYcYVDN2.js";
import { t as Button } from "./button-DRsC1qZi.js";
import { n as Input, t as Label } from "./label-CmIE8x5o.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-DFjnKMNx.js";
import { r as formatDate } from "./storage-BE-cx-0x.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ClipboardList, Plus, Search } from "lucide-react";
//#region src/routes/_authenticated/outward.$partyId.index.tsx?tsr-split=component
function PartyOrdersPage() {
	const { partyId } = Route.useParams();
	const [q, setQ] = useState("");
	const partyQ = useQuery({
		queryKey: ["party", partyId],
		queryFn: async () => {
			const { data, error } = await supabase.from("parties").select("*").eq("id", partyId).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const ordersQ = useQuery({
		queryKey: ["party-orders", partyId],
		queryFn: async () => {
			const { data, error } = await supabase.from("orders").select("*").eq("party_id", partyId).order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const filtered = (ordersQ.data ?? []).filter((o) => o.po_number.toLowerCase().includes(q.toLowerCase()));
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs(Link, {
				to: "/outward",
				className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground",
				children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "size-4" }), " Back to parties"]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm uppercase tracking-wider text-muted-foreground",
					children: "Party"
				}), /* @__PURE__ */ jsx("h1", {
					className: "text-3xl font-semibold tracking-tight mt-1",
					children: partyQ.data?.name ?? "..."
				})] }), /* @__PURE__ */ jsx(AddOrderDialog, { partyId })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative max-w-md",
				children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search order numbers...",
					className: "pl-9"
				})]
			}),
			ordersQ.isLoading ? /* @__PURE__ */ jsx("div", {
				className: "text-sm text-muted-foreground",
				children: "Loading..."
			}) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "text-sm text-muted-foreground",
				children: "No orders yet."
			}) : /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: filtered.map((o) => /* @__PURE__ */ jsx(Link, {
					to: "/outward/$partyId/$orderId",
					params: {
						partyId,
						orderId: o.id
					},
					className: "group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center",
							children: /* @__PURE__ */ jsx(ClipboardList, { className: "size-5" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-semibold truncate",
								children: o.po_number
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground mt-1",
								children: ["Created ", formatDate(o.created_at)]
							})]
						})]
					})
				}, o.id))
			})
		]
	});
}
function AddOrderDialog({ partyId }) {
	const [open, setOpen] = useState(false);
	const [po, setPo] = useState("");
	const qc = useQueryClient();
	const mut = useMutation({
		mutationFn: async () => {
			const trimmed = po.trim();
			if (!trimmed) throw new Error("Order number required");
			const { error } = await supabase.from("orders").insert({
				party_id: partyId,
				po_number: trimmed
			});
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["party-orders", partyId] });
			qc.invalidateQueries({ queryKey: ["parties"] });
			toast.success("Order created");
			setPo("");
			setOpen(false);
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs(Button, { children: [/* @__PURE__ */ jsx(Plus, { className: "size-4 mr-1" }), " New Order"] })
		}), /* @__PURE__ */ jsxs(DialogContent, { children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "New Order" }) }), /* @__PURE__ */ jsxs("form", {
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			className: "space-y-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ jsx(Label, { children: "Order Number" }), /* @__PURE__ */ jsx(Input, {
					autoFocus: true,
					value: po,
					onChange: (e) => setPo(e.target.value),
					placeholder: "PO-2026-001"
				})]
			}), /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, {
				type: "submit",
				disabled: mut.isPending,
				children: mut.isPending ? "Creating..." : "Create Order"
			}) })]
		})] })]
	});
}
//#endregion
export { PartyOrdersPage as component };
