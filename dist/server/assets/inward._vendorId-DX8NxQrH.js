import { t as supabase } from "./client-CLJYXxXG.js";
import { t as Route } from "./inward._vendorId-CHLWC0AN.js";
import { t as Button } from "./button-DRsC1qZi.js";
import { n as Input, t as Label } from "./label-CmIE8x5o.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-DFjnKMNx.js";
import { i as getSignedUrl, n as deleteStorageFile, o as uploadDocumentFile, r as formatDate } from "./storage-BE-cx-0x.js";
import { n as UploadDropzone, t as DocumentPreviewModal } from "./document-preview-modal-r-UB1i7l.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Download, Eye, FileText, Trash2, Upload } from "lucide-react";
//#region src/routes/_authenticated/inward.$vendorId.tsx?tsr-split=component
function VendorDetailPage() {
	const { vendorId } = Route.useParams();
	const vendorQ = useQuery({
		queryKey: ["vendor", vendorId],
		queryFn: async () => {
			const { data, error } = await supabase.from("vendors").select("*").eq("id", vendorId).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const billsQ = useQuery({
		queryKey: ["vendor-bills", vendorId],
		queryFn: async () => {
			const { data, error } = await supabase.from("documents").select("*").eq("vendor_id", vendorId).order("doc_date", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const [preview, setPreview] = useState(null);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs(Link, {
				to: "/inward",
				className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground",
				children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "size-4" }), " Back to vendors"]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm uppercase tracking-wider text-muted-foreground",
					children: "Vendor"
				}), /* @__PURE__ */ jsx("h1", {
					className: "text-3xl font-semibold tracking-tight mt-1",
					children: vendorQ.data?.name ?? "..."
				})] }), /* @__PURE__ */ jsx(UploadBillDialog, { vendorId })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border bg-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "px-5 py-4 border-b flex items-center justify-between",
					children: [/* @__PURE__ */ jsx("div", {
						className: "font-semibold",
						children: "Uploaded Bills"
					}), /* @__PURE__ */ jsxs("div", {
						className: "text-sm text-muted-foreground",
						children: [billsQ.data?.length ?? 0, " total"]
					})]
				}), billsQ.isLoading ? /* @__PURE__ */ jsx("div", {
					className: "p-6 text-sm text-muted-foreground",
					children: "Loading..."
				}) : (billsQ.data ?? []).length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "p-10 text-center text-muted-foreground",
					children: [/* @__PURE__ */ jsx(FileText, { className: "size-8 mx-auto mb-2 opacity-50" }), "No bills uploaded yet."]
				}) : /* @__PURE__ */ jsx("ul", {
					className: "divide-y",
					children: billsQ.data.map((b) => /* @__PURE__ */ jsxs("li", {
						className: "px-5 py-4 flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "size-10 rounded-lg bg-muted flex items-center justify-center shrink-0",
								children: /* @__PURE__ */ jsx(FileText, { className: "size-5 text-muted-foreground" })
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "font-medium truncate",
									children: ["Bill #", b.doc_number || "—"]
								}), /* @__PURE__ */ jsxs("div", {
									className: "text-xs text-muted-foreground mt-0.5",
									children: [
										"Bill date: ",
										formatDate(b.doc_date),
										" · Uploaded: ",
										formatDate(b.uploaded_at)
									]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex gap-1",
								children: [
									/* @__PURE__ */ jsxs(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setPreview({
											path: b.storage_path,
											mime: b.mime_type,
											name: b.file_name
										}),
										children: [/* @__PURE__ */ jsx(Eye, { className: "size-4 mr-1" }), " View"]
									}),
									/* @__PURE__ */ jsx(DownloadBtn, {
										path: b.storage_path,
										name: b.file_name
									}),
									/* @__PURE__ */ jsx(DeleteBtn, {
										id: b.id,
										path: b.storage_path,
										queryKey: ["vendor-bills", vendorId]
									})
								]
							})
						]
					}, b.id))
				})]
			}),
			/* @__PURE__ */ jsx(DocumentPreviewModal, {
				open: !!preview,
				onOpenChange: (o) => !o && setPreview(null),
				storagePath: preview?.path ?? null,
				mimeType: preview?.mime ?? null,
				fileName: preview?.name ?? null
			})
		]
	});
}
function DownloadBtn({ path, name }) {
	async function go() {
		try {
			const url = await getSignedUrl(path, { download: name });
			window.location.href = url;
		} catch (e) {
			toast.error(e.message);
		}
	}
	return /* @__PURE__ */ jsxs(Button, {
		size: "sm",
		variant: "outline",
		onClick: go,
		children: [/* @__PURE__ */ jsx(Download, { className: "size-4 mr-1" }), " Download"]
	});
}
function DeleteBtn({ id, path, queryKey }) {
	const qc = useQueryClient();
	const mut = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("documents").delete().eq("id", id);
			if (error) throw error;
			await deleteStorageFile(path);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey });
			toast.success("Deleted");
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsx(Button, {
		size: "sm",
		variant: "ghost",
		onClick: () => {
			if (confirm("Delete this document?")) mut.mutate();
		},
		children: /* @__PURE__ */ jsx(Trash2, { className: "size-4 text-destructive" })
	});
}
function UploadBillDialog({ vendorId }) {
	const [open, setOpen] = useState(false);
	const [file, setFile] = useState(null);
	const [billNumber, setBillNumber] = useState("");
	const [billDate, setBillDate] = useState(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const qc = useQueryClient();
	const mut = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error("Choose a file");
			const path = await uploadDocumentFile(file, `vendors/${vendorId}`);
			const { data: userRes } = await supabase.auth.getUser();
			const { error } = await supabase.from("documents").insert({
				kind: "bill",
				vendor_id: vendorId,
				doc_number: billNumber.trim() || null,
				doc_date: billDate,
				file_name: file.name,
				storage_path: path,
				mime_type: file.type || "application/octet-stream",
				uploaded_by: userRes.user?.id ?? null
			});
			if (error) {
				await deleteStorageFile(path);
				throw error;
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vendor-bills", vendorId] });
			qc.invalidateQueries({ queryKey: ["vendors"] });
			toast.success("Bill uploaded");
			setFile(null);
			setBillNumber("");
			setOpen(false);
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsxs(Button, {
			size: "lg",
			onClick: () => setOpen(true),
			children: [/* @__PURE__ */ jsx(Upload, { className: "size-4 mr-2" }), " Upload New Bill"]
		}), /* @__PURE__ */ jsxs(DialogContent, { children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Upload Bill" }) }), /* @__PURE__ */ jsxs("form", {
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			className: "space-y-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, { children: "Bill Number" }), /* @__PURE__ */ jsx(Input, {
							value: billNumber,
							onChange: (e) => setBillNumber(e.target.value),
							placeholder: "INV-1234"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, { children: "Bill Date" }), /* @__PURE__ */ jsx(Input, {
							type: "date",
							value: billDate,
							onChange: (e) => setBillDate(e.target.value),
							required: true
						})]
					})]
				}),
				file ? /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 rounded-lg border p-3",
					children: [
						/* @__PURE__ */ jsx(FileText, { className: "size-5 text-muted-foreground" }),
						/* @__PURE__ */ jsxs("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-sm font-medium truncate",
								children: file.name
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground",
								children: [(file.size / 1024).toFixed(0), " KB"]
							})]
						}),
						/* @__PURE__ */ jsx(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							onClick: () => setFile(null),
							children: "Change"
						})
					]
				}) : /* @__PURE__ */ jsx(UploadDropzone, {
					onFile: setFile,
					disabled: mut.isPending
				}),
				/* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, {
					type: "submit",
					disabled: !file || mut.isPending,
					children: mut.isPending ? "Uploading..." : "Upload Bill"
				}) })
			]
		})] })]
	});
}
//#endregion
export { VendorDetailPage as component };
