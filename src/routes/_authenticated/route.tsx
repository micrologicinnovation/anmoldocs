import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Home, ArrowDownToLine, ArrowUpFromLine, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-background">
        <div className="px-5 py-5 flex items-center gap-2 border-b">
          <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <FileText className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">Factory Docs</div>
            <div className="text-xs text-muted-foreground">Document Manager</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <SideLink to="/home" icon={<Home className="size-4" />}>Home</SideLink>
          <SideLink to="/inward" icon={<ArrowDownToLine className="size-4" />}>Item Inward</SideLink>
          <SideLink to="/outward" icon={<ArrowUpFromLine className="size-4" />}>Item Outward</SideLink>
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b bg-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <span className="font-semibold">Factory Docs</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="size-4" /></Button>
        </header>
        <div className="md:hidden border-b bg-background px-2 py-2 flex gap-1 overflow-x-auto">
          <SideLink to="/home" icon={<Home className="size-4" />} compact>Home</SideLink>
          <SideLink to="/inward" icon={<ArrowDownToLine className="size-4" />} compact>Inward</SideLink>
          <SideLink to="/outward" icon={<ArrowUpFromLine className="size-4" />} compact>Outward</SideLink>
        </div>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SideLink({ to, icon, children, compact }: { to: string; icon: React.ReactNode; children: React.ReactNode; compact?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${compact ? "whitespace-nowrap" : ""}`}
      activeProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-accent text-foreground" }}
    >
      {icon}
      {children}
    </Link>
  );
}