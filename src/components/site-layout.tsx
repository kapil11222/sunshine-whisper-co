import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, Phone, Mail, MapPin, User, LogOut, X, Home, BedDouble, UtensilsCrossed, CalendarCheck, Sparkles } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Announcement marquee */}
      <div className="bg-ink text-background/80 text-[11px] overflow-hidden border-b border-gold/20">
        <div className="flex whitespace-nowrap animate-marquee py-1.5">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-10 px-6 shrink-0">
              <span className="inline-flex items-center gap-2"><Sparkles className="h-3 w-3 text-gold" /> Heritage rooms · royal suites · authentic Indian dining</span>
              <span className="inline-flex items-center gap-2"><Phone className="h-3 w-3 text-gold" /> +91 99xxxxxx21</span>
              <span className="inline-flex items-center gap-2"><Mail className="h-3 w-3 text-gold" /> annupuranpalace@gmail.com</span>
              <span className="inline-flex items-center gap-2 text-gold">Pay at hotel · No card required</span>
            </div>
          ))}
        </div>
      </div>

      <header className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-gold/30 shadow-[0_8px_24px_-16px_rgba(122,31,31,0.35)]"
          : "bg-background/60 backdrop-blur-md border-b border-transparent"
      )}>
        <div className="container mx-auto max-w-7xl flex items-center justify-between px-4 py-3 gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="relative">
              <span className="absolute inset-0 -m-1 rounded-full gradient-flow opacity-70 blur-md group-hover:opacity-100 transition" aria-hidden />
              <img src={logo} alt="Annapurna Palace" className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-ink object-contain ring-1 ring-gold/40" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base sm:text-xl font-semibold tracking-wide text-ink">Annapurna Palace</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-gold">Hotel &amp; Restaurant</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                data-active={pathname === n.to}
                className={cn(
                  "gold-link text-sm font-medium transition-colors hover:text-gold",
                  pathname === n.to ? "text-gold" : "text-foreground/80",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/preorder">
              <Button variant="ghost" size="sm" className="relative hover:text-gold">
                <ShoppingBag className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-gold text-ink text-[10px] font-semibold flex items-center justify-center animate-pulse-glow">
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
              <Button size="sm" className="shimmer-gold text-ink border border-gold/60 font-semibold">Book Now</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-10 w-10 p-0"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />
        <aside
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background border-l border-gold/30 shadow-2xl",
            "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            open ? "translate-x-0" : "translate-x-full",
            "flex flex-col",
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-gold/20">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 rounded-full bg-ink object-contain ring-1 ring-gold/40" />
              <div className="leading-tight">
                <div className="font-display text-lg text-ink">Annapurna Palace</div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-gold">Hotel &amp; Restaurant</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
            {nav.map((n, i) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={cn(
                  "animate-rise group flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg",
                  "border border-transparent transition-all",
                  pathname === n.to
                    ? "bg-gradient-to-r from-gold/20 to-transparent border-gold/40 text-ink"
                    : "text-ink/80 hover:bg-secondary hover:border-gold/30 hover:text-ink",
                )}
              >
                <span>{n.label}</span>
                <span className={cn(
                  "h-1.5 w-1.5 rotate-45 transition-all",
                  pathname === n.to ? "bg-gold scale-100" : "bg-gold/0 group-hover:bg-gold/60 group-hover:scale-100 scale-0",
                )} />
              </Link>
            ))}
          </nav>
          <div className="border-t border-gold/20 p-4 space-y-3">
            <Link to="/rooms" onClick={() => setOpen(false)}>
              <Button className="w-full shimmer-gold text-ink border border-gold/60 font-semibold h-11">Book a Room</Button>
            </Link>
            {email ? (
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs text-muted-foreground truncate" title={email}>{email}</span>
                <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-1" />Sign out
                </Button>
              </div>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full border-ink/30 text-ink h-11">
                  <User className="h-4 w-4 mr-2" />Sign In
                </Button>
              </Link>
            )}
            <div className="pt-2 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" /> +91 99xxxxxx21</div>
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> annupuranpalace@gmail.com</div>
            </div>
          </div>
        </aside>
      </div>

      <main className="flex-1">{children}</main>

      {/* Mobile bottom dock */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-pb">
        <div className="mx-3 mb-3 rounded-2xl glass-gold shadow-[0_20px_40px_-20px_rgba(122,31,31,0.4)]">
          <div className="grid grid-cols-5 px-1.5 py-1.5">
            {[
              { to: "/", icon: Home, label: "Home" },
              { to: "/rooms", icon: BedDouble, label: "Rooms" },
              { to: "/reserve", icon: CalendarCheck, label: "Table" },
              { to: "/menu", icon: UtensilsCrossed, label: "Menu" },
              { to: "/preorder", icon: ShoppingBag, label: "Cart" },
            ].map((d) => {
              const active = pathname === d.to;
              return (
                <Link key={d.to} to={d.to} className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium transition",
                  active ? "text-ink bg-gradient-to-b from-gold/40 to-gold/10" : "text-ink/70 hover:text-ink"
                )}>
                  <d.icon className={cn("h-5 w-5", active && "text-gold")} />
                  <span>{d.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <footer className="mt-16 pb-24 lg:pb-0 border-t border-border bg-ink text-background/90 relative overflow-hidden">
        <div className="absolute inset-x-0 -top-px h-px gradient-flow opacity-70" aria-hidden />
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