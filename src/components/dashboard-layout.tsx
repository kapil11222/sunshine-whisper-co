import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, BedDouble, CalendarCheck, UtensilsCrossed, Menu as MenuIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { useState } from "react";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/rooms", label: "Room Bookings", icon: BedDouble },
  { to: "/dashboard/tables", label: "Table Reservations", icon: CalendarCheck },
  { to: "/dashboard/orders", label: "Pre-Orders", icon: UtensilsCrossed },
  { to: "/dashboard/menu", label: "Manage Menu", icon: MenuIcon },
] as const;

export function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={cn("fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logo} alt="" className="h-10 w-10 rounded-full bg-ink object-contain" />
          <div>
            <div className="font-display text-gold">Annapurna</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Owner Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = path === it.to;
            return (
              <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-gold text-ink font-semibold" : "hover:bg-sidebar-accent")}>
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Link to="/" className="block text-xs text-sidebar-foreground/70 hover:text-gold px-3">← Back to site</Link>
          <Button variant="outline" size="sm" className="w-full bg-transparent border-gold/50 text-gold hover:bg-gold hover:text-ink" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background sticky top-0 z-30">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen((o) => !o)}><MenuIcon className="h-4 w-4" /></Button>
          <h1 className="font-display text-2xl text-ink">{title}</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-secondary text-foreground",
    confirmed: "bg-gold/20 text-gold border border-gold/40",
    cancelled: "bg-destructive/15 text-destructive",
    completed: "bg-maroon/15 text-maroon",
  };
  return <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-medium", map[status] ?? "bg-secondary")}>{status}</span>;
}

export function StatusSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded border border-border bg-background px-2 py-1">
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}