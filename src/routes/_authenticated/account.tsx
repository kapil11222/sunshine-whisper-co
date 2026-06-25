import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getMyActivity } from "@/lib/customer.functions";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/cart-store";
import { BedDouble, CalendarCheck, UtensilsCrossed, LifeBuoy } from "lucide-react";

const qo = queryOptions({ queryKey: ["account", "activity"], queryFn: () => getMyActivity() });

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Annapurna Palace" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Not found</div></SiteLayout>,
  component: AccountPage,
});

function AccountPage() {
  const { data } = useSuspenseQuery(qo);
  return (
    <SiteLayout>
      <PageHeader kicker="My Account" title="Your Bookings & Orders" subtitle="Everything you've booked or ordered with us, in one place." />
      <div className="container mx-auto max-w-6xl px-4 pb-20 space-y-8">
        <section>
          <SectionHeader title="Room Bookings" Icon={BedDouble} ctaTo="/rooms" ctaLabel="Browse rooms" />
          {data.rooms.length === 0 ? <Empty text="No room bookings yet." /> : (
            <div className="space-y-2">
              {data.rooms.map((r) => (
                <Card key={r.id} className="p-4 border-gold/20 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-lg text-ink dark:text-foreground">{(r as { rooms?: { name?: string } }).rooms?.name ?? "Room"}</div>
                    <div className="text-xs text-muted-foreground">#{r.reference} · {r.check_in} → {r.check_out} · {r.guests} guests</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold font-semibold">{formatINR(Number(r.total))}</div>
                    <Badge variant="outline" className="border-gold/40 text-[10px] uppercase">{r.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Table Reservations" Icon={CalendarCheck} ctaTo="/reserve" ctaLabel="Reserve a table" />
          {data.tables.length === 0 ? <Empty text="No table reservations yet." /> : (
            <div className="space-y-2">
              {data.tables.map((t) => (
                <Link key={t.id} to="/reservation/$reference" params={{ reference: t.reference }} className="block">
                  <Card className="p-4 border-gold/20 flex flex-wrap items-center justify-between gap-3 hover:border-gold/60 transition-colors">
                    <div>
                      <div className="font-display text-lg text-ink dark:text-foreground">{t.table_label ?? "Any table"} · party of {t.party_size}</div>
                      <div className="text-xs text-muted-foreground">#{t.reference} · {new Date(t.reserved_at).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline" className="border-gold/40 text-[10px] uppercase">{t.status}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Pre-Orders" Icon={UtensilsCrossed} ctaTo="/menu" ctaLabel="Browse menu" />
          {data.orders.length === 0 ? <Empty text="No menu pre-orders yet." /> : (
            <div className="space-y-2">
              {data.orders.map((o) => (
                <Link key={o.id} to="/order/$reference" params={{ reference: o.reference }} className="block">
                  <Card className="p-4 border-gold/20 flex flex-wrap items-center justify-between gap-3 hover:border-gold/60 transition-colors">
                    <div>
                      <div className="font-display text-lg text-ink dark:text-foreground capitalize">{o.mode.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground">#{o.reference} · {new Date(o.scheduled_for).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-semibold">{formatINR(Number(o.total))}</div>
                      <Badge variant="outline" className="border-gold/40 text-[10px] uppercase">{o.status}</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="My Support Tickets" Icon={LifeBuoy} ctaTo="/help" ctaLabel="Get help" />
          {data.tickets.length === 0 ? <Empty text="You haven't raised any tickets." /> : (
            <div className="space-y-2">
              {data.tickets.map((t) => (
                <Card key={t.id} className="p-4 border-gold/20">
                  <div className="flex justify-between gap-3">
                    <div className="font-medium">{t.subject}</div>
                    <Badge variant="outline" className="border-gold/40 text-[10px] uppercase">{t.status}</Badge>
                  </div>
                  {t.reply && <p className="mt-2 text-sm text-muted-foreground"><strong className="text-gold">Owner:</strong> {t.reply}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

function SectionHeader({ title, Icon, ctaTo, ctaLabel }: { title: string; Icon: React.ComponentType<{ className?: string }>; ctaTo: "/rooms" | "/reserve" | "/menu" | "/help"; ctaLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-2xl text-ink dark:text-foreground flex items-center gap-2"><Icon className="h-5 w-5 text-gold" /> {title}</h2>
      <Link to={ctaTo}><Button variant="outline" size="sm" className="border-gold/40">{ctaLabel}</Button></Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground italic">{text}</p>;
}