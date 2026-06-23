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
  loader: ({ context }) => { context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Not found</div></SiteLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  return (
    <SiteLayout>
      <PageHeader kicker="Accommodations" title="Our Rooms & Suites" subtitle="Each room is appointed with traditional touches and modern comforts." />
      <div className="container mx-auto max-w-7xl px-4 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((r) => (
          <Card key={r.id} className="overflow-hidden border-gold/20 flex flex-col">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={r.image_url ?? ""} alt={r.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <h3 className="font-display text-xl text-ink">{r.name}</h3>
                <div className="text-gold font-semibold">{formatINR(Number(r.price_per_night))}<span className="text-xs text-muted-foreground">/night</span></div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Users className="h-3 w-3" /> Up to {r.capacity} guests
              </div>
              <p className="text-sm text-muted-foreground mt-3 flex-1">{r.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {r.amenities.slice(0, 4).map((a) => <Badge key={a} variant="outline" className="text-[10px] border-gold/30">{a}</Badge>)}
              </div>
              <Link to="/rooms/$id" params={{ id: r.id }} className="mt-4">
                <Button className="w-full bg-gold text-ink hover:bg-gold/90">Book This Room</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </SiteLayout>
  );
}