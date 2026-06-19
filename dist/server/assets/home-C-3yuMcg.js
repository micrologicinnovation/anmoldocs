import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine } from "lucide-react";
//#region src/routes/_authenticated/home.tsx?tsr-split=component
function HomePage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
			className: "text-3xl font-semibold tracking-tight",
			children: "Welcome"
		}), /* @__PURE__ */ jsx("p", {
			className: "text-muted-foreground mt-1",
			children: "Choose where you want to go."
		})] }), /* @__PURE__ */ jsxs("div", {
			className: "grid gap-5 md:grid-cols-2",
			children: [/* @__PURE__ */ jsx(BigCard, {
				to: "/inward",
				title: "Item Inward",
				subtitle: "Raw material received from vendors. Upload and find vendor bills.",
				icon: /* @__PURE__ */ jsx(ArrowDownToLine, { className: "size-7" }),
				tone: "primary"
			}), /* @__PURE__ */ jsx(BigCard, {
				to: "/outward",
				title: "Item Outward",
				subtitle: "Material sent to processing parties. Store challans & bills by order.",
				icon: /* @__PURE__ */ jsx(ArrowUpFromLine, { className: "size-7" }),
				tone: "accent"
			})]
		})]
	});
}
function BigCard({ to, title, subtitle, icon, tone }) {
	return /* @__PURE__ */ jsxs(Link, {
		to,
		className: "group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-0.5",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: `mb-6 inline-flex size-14 items-center justify-center rounded-xl ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`,
				children: icon
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "text-2xl font-semibold tracking-tight",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-muted-foreground",
				children: subtitle
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground",
				children: ["Open ", /* @__PURE__ */ jsx(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-0.5" })]
			})
		]
	});
}
//#endregion
export { HomePage as component };
