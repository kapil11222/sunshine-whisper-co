import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, Phone, Mail, MapPin, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Home" },
  { to: "/rooms", label: "Rooms" },
  { to: "/menu", label: "Menu" },
  { to: "/reserve", label: "Reserve Table" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCart((s) => s.count());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl flex items-center justify-between px-4 py-3 gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Annapurna Palace" className="h-12 w-12 rounded-full bg-ink object-contain" />
            <div className="hidden sm:block leading-tight">
              <div className="font-display text-xl font-semibold tracking-wide text-ink">Annapurna Palace</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Hotel &amp; Restaurant</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gold",
                  pathname === n.to ? "text-gold" : "text-foreground/80",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/preorder">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingBag className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-gold text-ink text-[10px] font-semibold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Button>
            </Link>
            {email ? (
              <div className="hidden md:flex items-center gap-1">
                <span className="text-xs text-muted-foreground max-w-[140px] truncate" title={email}>{email}</span>
                <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
              </div>
            ) : (
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" aria-label="Sign in"><User className="h-4 w-4 mr-1" />Sign In</Button>
              </Link>
            )}
            <Link to="/rooms" className="hidden md:inline-flex">
              <Button size="sm" className="bg-gold text-ink hover:bg-gold/90">Book Now</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border/60 bg-background">
            <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "py-2 text-sm font-medium",
                    pathname === n.to ? "text-gold" : "text-foreground/80",
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-ink text-background/90">
        <div className="container mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-12 w-12 rounded-full bg-ink object-contain" />
              <div>
                <div className="font-display text-lg text-gold">Annapurna Palace</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-background/60">Hotel &amp; Restaurant</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-background/70">
              Where tradition meets comfort. Authentic flavors and gracious hospitality, all under one roof.
            </p>
          </div>
          <div>
            <div className="font-display text-gold text-lg mb-3">Explore</div>
            <ul className="space-y-2 text-sm">
              {nav.map((n) => (
                <li key={n.to}><Link to={n.to} className="hover:text-gold">{n.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-display text-gold text-lg mb-3">Contact</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> +91 99xxxxxx21</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> annupuranpalace@gmail.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Annapurna Palace, India</li>
            </ul>
          </div>
          <div>
            <div className="font-display text-gold text-lg mb-3">Owner</div>
            <p className="text-sm text-background/70 mb-3">Manage bookings, reservations and orders.</p>
            <Link to="/auth"><Button variant="outline" size="sm" className="bg-transparent border-gold text-gold hover:bg-gold hover:text-ink">Sign In</Button></Link>
          </div>
        </div>
        <div className="border-t border-background/10 py-4 text-center text-xs text-background/50">
          © {new Date().getFullYear()} Annapurna Palace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 my-6", className)}>
      <span className="h-px w-12 bg-gold/40" />
      <span className="h-2 w-2 rotate-45 bg-gold" />
      <span className="h-px w-12 bg-gold/40" />
    </div>
  );
}