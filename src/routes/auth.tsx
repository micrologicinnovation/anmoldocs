import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2 text-foreground">
          <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <FileText className="size-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Factory Documents</span>
        </Link>
        <Card className="p-6">
          <div className="space-y-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-center">Sign in</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email and password to access your account.
            </p>
          </div>
          <form onSubmit={signIn} className="space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required 
        autoComplete={type === "password" ? "current-password" : "email"} 
      />
    </div>
  );
}