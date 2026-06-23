import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerOverview } from "@/lib/owner.functions";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/cart-store";
import { BedDouble, CalendarCheck, UtensilsCrossed, TrendingUp } from "lucide-react";

const qo = queryOptions({ queryKey: ["owner", "overview"], queryFn: () => ownerOverview() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Annapurna Palace" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <DashboardLayout title="Dashboard"><div className="text-destructive">{error.message}</div></DashboardLayout>,
  notFoundComponent: () => <DashboardLayout title="Dashboard">Not found</DashboardLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  const today = new Date().toISOString().slice(0, 10);
  const todaysCheckins = data.bookings.filter((b: any) => b.check_in === today).length;
  const todaysReservations = data.reservations.filter((r: any) => r.reserved_at?.slice(0, 10) === today).length;
  const pendingOrders = data.orders.filter((o: any) => o.status === "pending").length;
  const revenue = data.bookings.filter((b: any) => b.status === "confirmed" || b.status === "completed").reduce((s: number, b: any) => s + Number(b.total ?? 0), 0)
    + data.orders.filter((o: any) => o.status === "completed").reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

  const cards = [
    { icon: BedDouble, label: "Today's Check-ins", val: todaysCheckins, to: "/dashboard/rooms" },
    { icon: CalendarCheck, label: "Today's Reservations", val: todaysReservations, to: "/dashboard/tables" },
    { icon: UtensilsCrossed, label: "Pending Orders", val: pendingOrders, to: "/dashboard/orders" },
    { icon: TrendingUp, label: "Confirmed Revenue", val: formatINR(revenue) },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Wrap: any = c.to ? Link : "div";
          const props = c.to ? { to: c.to } : {};
          return (
            <Wrap key={c.label} {...props}>
              <Card className="p-5 border-gold/20 hover:border-gold/60 transition">
                <c.icon className="h-5 w-5 text-gold" />
                <div className="text-xs uppercase tracking-wide text-muted-foreground mt-3">{c.label}</div>
                <div className="text-2xl font-display mt-1">{c.val}</div>
              </Card>
            </Wrap>
          );
        })}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Recent Bookings</h3>
          {data.bookings.slice(0, 5).map((b: any) => (
            <div key={b.id} className="flex justify-between text-sm border-b py-2 last:border-0">
              <span>{b.guest_name} · {(b as any).rooms?.name}</span><span className="text-muted-foreground">{b.check_in}</span>
            </div>
          ))}
          {data.bookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Recent Reservations</h3>
          {data.reservations.slice(0, 5).map((r: any) => (
            <div key={r.id} className="flex justify-between text-sm border-b py-2 last:border-0">
              <span>{r.guest_name} · {r.party_size} guests</span><span className="text-muted-foreground">{new Date(r.reserved_at).toLocaleString()}</span>
            </div>
          ))}
          {data.reservations.length === 0 && <p className="text-sm text-muted-foreground">No reservations yet.</p>}
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-lg mb-3">Recent Pre-Orders</h3>
          {data.orders.slice(0, 5).map((o: any) => (
            <div key={o.id} className="flex justify-between text-sm border-b py-2 last:border-0">
              <span>{o.guest_name} · {o.mode}</span><span className="text-gold">{formatINR(Number(o.total))}</span>
            </div>
          ))}
          {data.orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
        </Card>
      </div>
    </DashboardLayout>
  );
}