import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapOwner } from "@/lib/owner.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Annapurna Palace" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md py-16">
        <Card className="p-6 border-gold/30">
          <h1 className="font-display text-3xl text-center">Welcome</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Sign in to manage your bookings or hotel.</p>
          <Tabs defaultValue="customer" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="owner">Owner</TabsTrigger>
            </TabsList>
            <TabsContent value="customer"><CustomerAuth /></TabsContent>
            <TabsContent value="owner"><OwnerAuth /></TabsContent>
          </Tabs>
        </Card>
      </div>
    </SiteLayout>
  );
}

function CustomerAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-5 space-y-3" onSubmit={onSubmit}>
      {mode === "signup" && (
        <div><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
      )}
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" disabled={loading} className="w-full bg-gold text-ink hover:bg-gold/90">
        {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
      </Button>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="block w-full text-center text-xs text-muted-foreground hover:text-gold"
      >
        {mode === "signin" ? "New customer? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

function OwnerAuth() {
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
        const b = await bootstrap({ data: { email, password } });
        if (b.ok) {
          res = await supabase.auth.signInWithPassword({ email, password });
        }
      }
      if (res.error) throw res.error;
      toast.success("Welcome back");
      // Hard navigate so the new session is picked up by the auth gate
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-5 space-y-3" onSubmit={onSubmit}>
      <div><Label>Owner Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" disabled={loading} className="w-full bg-ink text-background hover:bg-ink/90">
        {loading ? "Signing in..." : "Owner Sign In"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">Restricted area for hotel management.</p>
    </form>
  );
}