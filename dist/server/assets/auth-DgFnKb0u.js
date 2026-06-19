import { t as supabase } from "./client-CLJYXxXG.js";
import { n as cn, t as Button } from "./button-DRsC1qZi.js";
import { n as Input, t as Label } from "./label-CmIE8x5o.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { FileText } from "lucide-react";
//#region src/components/ui/card.tsx
var Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
//#endregion
//#region src/routes/auth.tsx?tsr-split=component
function AuthPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) navigate({
				to: "/home",
				replace: true
			});
		});
	}, [navigate]);
	async function signIn(e) {
		e.preventDefault();
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		setLoading(false);
		if (error) return toast.error(error.message);
		navigate({
			to: "/home",
			replace: true
		});
	}
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-muted/30 p-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-md space-y-6",
			children: [/* @__PURE__ */ jsxs(Link, {
				to: "/",
				className: "flex items-center justify-center gap-2 text-foreground",
				children: [/* @__PURE__ */ jsx("div", {
					className: "size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center",
					children: /* @__PURE__ */ jsx(FileText, { className: "size-5" })
				}), /* @__PURE__ */ jsx("span", {
					className: "text-xl font-semibold tracking-tight",
					children: "Factory Documents"
				})]
			}), /* @__PURE__ */ jsxs(Card, {
				className: "p-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "space-y-4 mb-6",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "text-2xl font-bold tracking-tight text-center",
						children: "Sign in"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground text-center",
						children: "Enter your email and password to access your account."
					})]
				}), /* @__PURE__ */ jsxs("form", {
					onSubmit: signIn,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsx(Field, {
							label: "Email",
							type: "email",
							value: email,
							onChange: setEmail
						}),
						/* @__PURE__ */ jsx(Field, {
							label: "Password",
							type: "password",
							value: password,
							onChange: setPassword
						}),
						/* @__PURE__ */ jsx(Button, {
							type: "submit",
							className: "w-full",
							disabled: loading,
							children: loading ? "Signing in..." : "Sign in"
						})
					]
				})]
			})]
		})
	});
}
function Field({ label, type, value, onChange }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ jsx(Label, { children: label }), /* @__PURE__ */ jsx(Input, {
			type,
			value,
			onChange: (e) => onChange(e.target.value),
			required: true,
			autoComplete: type === "password" ? "current-password" : "email"
		})]
	});
}
//#endregion
export { AuthPage as component };
