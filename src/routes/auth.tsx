import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapOwner } from "@/lib/owner.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Owner Sign In — Annapurna Palace" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapOwner);
  const [email, setEmail] = useState("Kapilkjadhav3231@gmail.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        // Attempt to bootstrap the owner if this is the first run
        const b = await bootstrap({ data: { email, password } });
        if (b.ok) {
          res = await supabase.auth.signInWithPassword({ email, password });
        }
      }
      if (res.error) throw res.error;
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md py-20">
        <Card className="p-8 border-gold/30">
          <h1 className="font-display text-3xl text-center">Owner Sign In</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Restricted area for hotel management.</p>
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gold text-ink hover:bg-gold/90">{loading ? "Signing in..." : "Sign In"}</Button>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}