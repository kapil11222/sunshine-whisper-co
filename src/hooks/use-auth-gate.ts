import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Gate booking / ordering actions behind sign-in.
 * - `email` reflects the current Supabase session email (or null).
 * - `ensureAuth()` returns true when signed in; otherwise toasts, saves the
 *   current path as a redirect target, navigates to /auth, and returns false.
 */
export function useAuthGate() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const ensureAuth = (message = "Please sign in to continue") => {
    if (email) return true;
    toast.error(message);
    try { sessionStorage.setItem("ap-redirect-after-auth", pathname); } catch {}
    navigate({ to: "/auth" });
    return false;
  };

  return { email, ready, ensureAuth };
}