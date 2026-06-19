import { t as supabase } from "./client-CLJYXxXG.js";
import { t as Button } from "./button-DRsC1qZi.js";
import { n as Input, t as Label } from "./label-CmIE8x5o.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-DFjnKMNx.js";
import { r as formatDate } from "./storage-BE-cx-0x.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Plus, Search, Store, Upload } from "lucide-react";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
//#region src/routes/_authenticated/inward.index.tsx?tsr-split=component
var b2Client = new S3Client({
	endpoint: "https://s3.us-east-005.backblazeb2.com",
	region: "us-east-005",
	credentials: {
		accessKeyId: "0052d45d79a0a7f0000000001",
		secretAccessKey: "K005kyO1LB28AyFxfj5cK/tjhHeIFjY"
	}
});
async function fetchVendors() {
	const { data: vendors, error } = await supabase.from("vendors").select("id, name").order("name");
	if (error) throw error;
	const { data: docs } = await supabase.from("documents").select("vendor_id, uploaded_at").not("vendor_id", "is", null);
	const map = /* @__PURE__ */ new Map();
	(docs ?? []).forEach((d) => {
		if (!d.vendor_id) return;
		const cur = map.get(d.vendor_id) ?? {
			count: 0,
			last: null
		};
		cur.count += 1;
		if (!cur.last || d.uploaded_at > cur.last) cur.last = d.uploaded_at;
		map.set(d.vendor_id, cur);
	});
	return (vendors ?? []).map((v) => ({
		id: v.id,
		name: v.name,
		bill_count: map.get(v.id)?.count ?? 0,
		last_upload: map.get(v.id)?.last ?? null
	}));
}
function VendorsPage() {
	const [q, setQ] = useState("");
	const { data, isLoading } = useQuery({
		queryKey: ["vendors"],
		queryFn: fetchVendors
	});
	const filtered = (data ?? []).filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Item Inward"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-muted-foreground mt-1",
					children: "Vendors you purchase raw material from."
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ jsx(UploadInwardChallanDialog, {}), /* @__PURE__ */ jsx(AddVendorDialog, {})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative max-w-md",
				children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search vendors...",
					className: "pl-9"
				})]
			}),
			isLoading ? /* @__PURE__ */ jsx("div", {
				className: "text-muted-foreground text-sm",
				children: "Loading vendors..."
			}) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "text-muted-foreground text-sm",
				children: "No vendors found."
			}) : /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: filtered.map((v) => /* @__PURE__ */ jsxs(Link, {
					to: "/inward/$vendorId",
					params: { vendorId: v.id },
					className: "group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center",
							children: /* @__PURE__ */ jsx(Store, { className: "size-5" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-semibold truncate",
								children: v.name
							}), /* @__PURE__ */ jsxs("div", {
								className: "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ jsx(FileText, { className: "size-3.5" }),
									v.bill_count,
									" ",
									v.bill_count === 1 ? "bill" : "bills"
								]
							})]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-4 pt-4 border-t text-xs text-muted-foreground",
						children: ["Last upload: ", v.last_upload ? formatDate(v.last_upload) : "—"]
					})]
				}, v.id))
			})
		]
	});
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
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs(Button, { children: [/* @__PURE__ */ jsx(Plus, { className: "size-4 mr-1" }), " Add Vendor"] })
		}), /* @__PURE__ */ jsxs(DialogContent, { children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Add Vendor" }) }), /* @__PURE__ */ jsxs("form", {
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			className: "space-y-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ jsx(Label, { children: "Vendor Name" }), /* @__PURE__ */ jsx(Input, {
					autoFocus: true,
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "e.g. Shubham International"
				})]
			}), /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, {
				type: "submit",
				disabled: mut.isPending,
				children: mut.isPending ? "Adding..." : "Add Vendor"
			}) })]
		})] })]
	});
}
function UploadInwardChallanDialog() {
	const [open, setOpen] = useState(false);
	const [orderId, setOrderId] = useState("");
	const [docNumber, setDocNumber] = useState("");
	const [file, setFile] = useState(null);
	const qc = useQueryClient();
	const { data: orders } = useQuery({
		queryKey: ["orders-dropdown"],
		queryFn: async () => {
			const { data, error } = await supabase.from("orders").select("id, po_number, parties(name)");
			if (error) throw error;
			return data;
		},
		enabled: open
	});
	const mut = useMutation({
		mutationFn: async () => {
			if (!orderId) throw new Error("Please select an order.");
			if (!docNumber.trim()) throw new Error("Challan number is required.");
			if (!file) throw new Error("Please select a file to upload.");
			const fileExt = file.name.split(".").pop();
			const filePath = `inward_challans/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
			await b2Client.send(new PutObjectCommand({
				Bucket: "factory-docs",
				Key: filePath,
				Body: file,
				ContentType: file.type
			}));
			const { error: dbError } = await supabase.from("documents").insert({
				kind: "inward_challan",
				order_id: orderId,
				doc_number: docNumber.trim(),
				doc_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
				file_name: file.name,
				storage_path: filePath,
				mime_type: file.type
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
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs(Button, {
				variant: "secondary",
				children: [/* @__PURE__ */ jsx(Upload, { className: "size-4 mr-1" }), " Upload Challan"]
			})
		}), /* @__PURE__ */ jsxs(DialogContent, { children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Upload Inward Challan" }) }), /* @__PURE__ */ jsxs("form", {
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			className: "space-y-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ jsx(Label, { children: "Select Order" }), /* @__PURE__ */ jsxs("select", {
						className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						value: orderId,
						onChange: (e) => setOrderId(e.target.value),
						required: true,
						children: [/* @__PURE__ */ jsx("option", {
							value: "",
							disabled: true,
							children: "-- Select an Order --"
						}), orders?.map((o) => /* @__PURE__ */ jsxs("option", {
							value: o.id,
							children: [
								o.po_number,
								" (",
								o.parties?.name,
								")"
							]
						}, o.id))]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ jsx(Label, { children: "Challan Number" }), /* @__PURE__ */ jsx(Input, {
						value: docNumber,
						onChange: (e) => setDocNumber(e.target.value),
						placeholder: "e.g. CH-9921",
						required: true
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ jsx(Label, { children: "Document File" }), /* @__PURE__ */ jsx(Input, {
						type: "file",
						accept: ".pdf,image/*",
						onChange: (e) => setFile(e.target.files?.[0] || null),
						required: true
					})]
				}),
				/* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, {
					type: "submit",
					disabled: mut.isPending,
					children: mut.isPending ? "Uploading to B2..." : "Upload"
				}) })
			]
		})] })]
	});
}
//#endregion
export { VendorsPage as component };
