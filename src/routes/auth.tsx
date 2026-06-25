import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapOwner } from "@/lib/owner.functions";
import { lovable } from "@/integrations/lovable";
import { useState } from "react";
import { toast } from "sonner";

export const OWNER_EMAIL = "kapilkjadhav3231@gmail.com";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Annapurna Palace" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function isOwner(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === OWNER_EMAIL;
}

function AuthPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapOwner);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const finish = (em: string) => {
    if (isOwner(em)) {
      window.location.href = "/dashboard";
    } else {
      navigate({ to: "/account" });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const em = email.trim();
      // Owner — try sign-in, bootstrap if missing
      if (isOwner(em)) {
        let res = await supabase.auth.signInWithPassword({ email: em, password });
        if (res.error) {
          const b = await bootstrap({ data: { email: em, password } });
          if (b.ok) res = await supabase.auth.signInWithPassword({ email: em, password });
        }
        if (res.error) throw res.error;
        toast.success("Welcome back, Owner");
        finish(em);
        return;
      }
      // Customer — try sign-in, fall back to creating the account
      const signIn = await supabase.auth.signInWithPassword({ email: em, password });
      if (signIn.error) {
        const msg = signIn.error.message?.toLowerCase() ?? "";
        const looksMissing = msg.includes("invalid") || msg.includes("credentials") || msg.includes("not found");
        if (!looksMissing) throw signIn.error;
        const signUp = await supabase.auth.signUp({
          email: em,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (signUp.error) throw signUp.error;
        // After auto-confirm signup, signIn typically works
        const after = await supabase.auth.signInWithPassword({ email: em, password });
        if (after.error) {
          toast.success("Account created — please sign in.");
          return;
        }
        toast.success("Welcome! Account created.");
      } else {
        toast.success("Welcome back");
      }
      finish(em);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      finish(data.user?.email ?? "");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md py-16 px-4">
        <Card className="p-6 border-gold/30">
          <h1 className="font-display text-3xl text-center">Welcome</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Sign in to book rooms, reserve tables, and track your orders.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={onGoogle}
            className="w-full mt-6 h-11 border-gold/40 gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 7.1 29.5 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5.4 0 10.3-2 14-5.3l-6.5-5.3c-2 1.5-4.6 2.6-7.5 2.6-5.3 0-9.7-3.4-11.3-8L6.1 33.6C9.5 39.4 16.2 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.5 5.3C41.7 35.9 45 30.4 45 24c0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex-1 h-px bg-gold/20" /> or <span className="flex-1 h-px bg-gold/20" />
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gold text-ink hover:bg-gold/90 h-11">
              {loading ? "Please wait…" : "Login"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              New here? We'll create your account automatically.
            </p>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}