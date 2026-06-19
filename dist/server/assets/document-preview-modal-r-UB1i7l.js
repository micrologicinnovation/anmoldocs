import { n as cn } from "./button-DRsC1qZi.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-DFjnKMNx.js";
import { a as isAcceptedFile, i as getSignedUrl, t as ACCEPT_ATTR } from "./storage-BE-cx-0x.js";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { Upload } from "lucide-react";
//#region src/components/upload-dropzone.tsx
function UploadDropzone({ onFile, disabled }) {
	const [drag, setDrag] = useState(false);
	const ref = useRef(null);
	function handle(file) {
		if (!file) return;
		if (!isAcceptedFile(file)) {
			toast.error("Only PDF, JPG, PNG or WEBP files are allowed.");
			return;
		}
		if (file.size > 20 * 1024 * 1024) {
			toast.error("File too large (max 20MB).");
			return;
		}
		onFile(file);
	}
	return /* @__PURE__ */ jsxs("div", {
		onDragOver: (e) => {
			e.preventDefault();
			setDrag(true);
		},
		onDragLeave: () => setDrag(false),
		onDrop: (e) => {
			e.preventDefault();
			setDrag(false);
			handle(e.dataTransfer.files?.[0]);
		},
		onClick: () => !disabled && ref.current?.click(),
		className: `cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40"} ${disabled ? "opacity-50 pointer-events-none" : ""}`,
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "mx-auto mb-3 size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center",
				children: /* @__PURE__ */ jsx(Upload, { className: "size-6" })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "font-medium",
				children: "Drop file here or click to upload"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "text-sm text-muted-foreground mt-1",
				children: "PDF, JPG, PNG or WEBP — up to 20MB"
			}),
			/* @__PURE__ */ jsx("input", {
				ref,
				type: "file",
				className: "hidden",
				accept: ACCEPT_ATTR,
				onChange: (e) => handle(e.target.files?.[0])
			})
		]
	});
}
//#endregion
//#region src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
//#endregion
//#region src/components/document-preview-modal.tsx
function DocumentPreviewModal({ open, onOpenChange, storagePath, mimeType, fileName }) {
	const [url, setUrl] = useState(null);
	useEffect(() => {
		if (!open || !storagePath) {
			setUrl(null);
			return;
		}
		let active = true;
		getSignedUrl(storagePath).then((u) => {
			if (active) setUrl(u);
		});
		return () => {
			active = false;
		};
	}, [open, storagePath]);
	const isImage = mimeType?.startsWith("image/");
	const isPdf = mimeType === "application/pdf";
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0",
			children: [/* @__PURE__ */ jsx(DialogHeader, {
				className: "px-6 py-4 border-b",
				children: /* @__PURE__ */ jsx(DialogTitle, {
					className: "truncate",
					children: fileName ?? "Preview"
				})
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex-1 overflow-auto bg-muted/30 flex items-center justify-center",
				children: [
					!url && /* @__PURE__ */ jsx(Skeleton, { className: "w-2/3 h-2/3" }),
					url && isImage && /* @__PURE__ */ jsx("img", {
						src: url,
						alt: fileName ?? "",
						className: "max-w-full max-h-full object-contain"
					}),
					url && isPdf && /* @__PURE__ */ jsx("iframe", {
						src: url,
						className: "w-full h-full bg-white",
						title: fileName ?? "PDF"
					}),
					url && !isImage && !isPdf && /* @__PURE__ */ jsx("a", {
						href: url,
						target: "_blank",
						rel: "noreferrer",
						className: "underline",
						children: "Open file"
					})
				]
			})]
		})
	});
}
//#endregion
export { UploadDropzone as n, DocumentPreviewModal as t };
