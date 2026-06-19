import { t as supabase } from "./client-CLJYXxXG.js";
import { t as Button } from "./button-DRsC1qZi.js";
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, FileText, Home, LogOut } from "lucide-react";
//#region src/routes/_authenticated/route.tsx?tsr-split=component
function AuthenticatedLayout() {
	const router = useRouter();
	const queryClient = useQueryClient();
	async function signOut() {
		await queryClient.cancelQueries();
		queryClient.clear();
		await supabase.auth.signOut();
		router.navigate({
			to: "/auth",
			replace: true
		});
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen flex bg-muted/20",
		children: [/* @__PURE__ */ jsxs("aside", {
			className: "hidden md:flex w-60 shrink-0 flex-col border-r bg-background",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "px-5 py-5 flex items-center gap-2 border-b",
					children: [/* @__PURE__ */ jsx("div", {
						className: "size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center",
						children: /* @__PURE__ */ jsx(FileText, { className: "size-4" })
					}), /* @__PURE__ */ jsxs("div", {
						className: "leading-tight",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-semibold text-sm",
							children: "Factory Docs"
						}), /* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: "Document Manager"
						})]
					})]
				}),
				/* @__PURE__ */ jsxs("nav", {
					className: "flex-1 p-3 space-y-1",
					children: [
						/* @__PURE__ */ jsx(SideLink, {
							to: "/home",
							icon: /* @__PURE__ */ jsx(Home, { className: "size-4" }),
							children: "Home"
						}),
						/* @__PURE__ */ jsx(SideLink, {
							to: "/inward",
							icon: /* @__PURE__ */ jsx(ArrowDownToLine, { className: "size-4" }),
							children: "Item Inward"
						}),
						/* @__PURE__ */ jsx(SideLink, {
							to: "/outward",
							icon: /* @__PURE__ */ jsx(ArrowUpFromLine, { className: "size-4" }),
							children: "Item Outward"
						})
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "p-3 border-t",
					children: /* @__PURE__ */ jsxs(Button, {
						variant: "ghost",
						size: "sm",
						className: "w-full justify-start gap-2",
						onClick: signOut,
						children: [/* @__PURE__ */ jsx(LogOut, { className: "size-4" }), " Sign out"]
					})
				})
			]
		}), /* @__PURE__ */ jsxs("main", {
			className: "flex-1 min-w-0",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "md:hidden border-b bg-background px-4 py-3 flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("div", {
							className: "size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center",
							children: /* @__PURE__ */ jsx(FileText, { className: "size-4" })
						}), /* @__PURE__ */ jsx("span", {
							className: "font-semibold",
							children: "Factory Docs"
						})]
					}), /* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						size: "sm",
						onClick: signOut,
						children: /* @__PURE__ */ jsx(LogOut, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "md:hidden border-b bg-background px-2 py-2 flex gap-1 overflow-x-auto",
					children: [
						/* @__PURE__ */ jsx(SideLink, {
							to: "/home",
							icon: /* @__PURE__ */ jsx(Home, { className: "size-4" }),
							compact: true,
							children: "Home"
						}),
						/* @__PURE__ */ jsx(SideLink, {
							to: "/inward",
							icon: /* @__PURE__ */ jsx(ArrowDownToLine, { className: "size-4" }),
							compact: true,
							children: "Inward"
						}),
						/* @__PURE__ */ jsx(SideLink, {
							to: "/outward",
							icon: /* @__PURE__ */ jsx(ArrowUpFromLine, { className: "size-4" }),
							compact: true,
							children: "Outward"
						})
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "p-4 md:p-8 max-w-6xl mx-auto",
					children: /* @__PURE__ */ jsx(Outlet, {})
				})
			]
		})]
	});
}
function SideLink({ to, icon, children, compact }) {
	return /* @__PURE__ */ jsxs(Link, {
		to,
		className: `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${compact ? "whitespace-nowrap" : ""}`,
		activeProps: { className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-accent text-foreground" },
		children: [icon, children]
	});
}
//#endregion
export { AuthenticatedLayout as component };
