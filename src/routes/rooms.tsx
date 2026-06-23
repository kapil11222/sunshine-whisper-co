import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listRooms } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/cart-store";
import { Users } from "lucide-react";

const qo = queryOptions({ queryKey: ["public", "rooms"], queryFn: () => listRooms() });

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms — Annapurna Palace" },
      { name: "description", content: "Browse heritage rooms, royal suites, and family rooms at Annapurna Palace and book your stay." },
      { property: "og:title", content: "Rooms — Annapurna Palace" },
      { property: "og:description", content: "Browse heritage rooms, royal suites, and family rooms at Annapurna Palace." },
    ],
  }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Not found</div></SiteLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  return (
    <SiteLayout>
      <PageHeader kicker="Accommodations" title="Our Rooms & Suites" subtitle="Each room is appointed with traditional touches and modern comforts." />
      <div className="container mx-auto max-w-7xl px-4 pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {data.map((r, i) => (
          <Card
            key={r.id}
            className="luxe-card overflow-hidden border-gold/20 flex flex-col group bg-gradient-to-b from-card to-secondary/40 animate-rise"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={r.image_url ?? ""} alt={r.name} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent opacity-80" />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-gold text-[10px] font-semibold uppercase tracking-wider text-ink">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {r.capacity} guests</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <h3 className="font-display text-2xl text-background drop-shadow-lg">{r.name}</h3>
                <div className="text-right text-background drop-shadow">
                  <div className="text-gold font-semibold leading-none">{formatINR(Number(r.price_per_night))}</div>
                  <div className="text-[10px] text-background/80">per night</div>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1 line-clamp-3">{r.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {r.amenities.slice(0, 4).map((a) => <Badge key={a} variant="outline" className="text-[10px] border-gold/40 text-ink/80">{a}</Badge>)}
              </div>
              <Link to="/rooms/$id" params={{ id: r.id }} className="mt-4">
                <Button className="w-full shimmer-gold text-ink border border-gold/60 font-semibold h-11">Book This Room →</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </SiteLayout>
  );
}