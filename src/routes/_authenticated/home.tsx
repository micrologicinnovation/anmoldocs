import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground mt-1">Choose where you want to go.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <BigCard
          to="/inward"
          title="Item Inward"
          subtitle="Raw material received from vendors. Upload and find vendor bills."
          icon={<ArrowDownToLine className="size-7" />}
          tone="primary"
        />
        <BigCard
          to="/outward"
          title="Item Outward"
          subtitle="Material sent to processing parties. Store challans & bills by order."
          icon={<ArrowUpFromLine className="size-7" />}
          tone="accent"
        />
      </div>
    </div>
  );
}

function BigCard({ to, title, subtitle, icon, tone }: { to: string; title: string; subtitle: string; icon: React.ReactNode; tone: "primary" | "accent" }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className={`mb-6 inline-flex size-14 items-center justify-center rounded-xl ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
        {icon}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground">
        Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}