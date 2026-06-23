import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listDishes, listRooms } from "@/lib/public.functions";
import { SiteLayout, GoldDivider } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/cart-store";
import logo from "@/assets/logo.png";
import { BedDouble, UtensilsCrossed, CalendarCheck, Sparkles } from "lucide-react";

const roomsQO = queryOptions({ queryKey: ["public", "rooms"], queryFn: () => listRooms() });
const dishesQO = queryOptions({ queryKey: ["public", "dishes"], queryFn: () => listDishes() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Annapurna Palace — Hotel & Restaurant" },
      { name: "description", content: "Stay, dine, and celebrate at Annapurna Palace. Book rooms, reserve tables, and pre-order authentic Indian cuisine." },
      { property: "og:title", content: "Annapurna Palace — Hotel & Restaurant" },
      { property: "og:description", content: "Luxury stays and authentic Indian dining. Book rooms, reserve tables, and pre-order meals online." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(roomsQO),
      context.queryClient.ensureQueryData(dishesQO),
    ]);
  },
  errorComponent: ErrorBoundary,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Not found.</div></SiteLayout>,
  component: Home,
});

function ErrorBoundary({ error }: { error: Error }) {
  return <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>;
}

function Home() {
  const { data: rooms } = useSuspenseQuery(roomsQO);
  const { data: dishes } = useSuspenseQuery(dishesQO);
  const featuredRooms = rooms.slice(0, 3);
  const featuredDishes = dishes.slice(0, 6);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grain">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-secondary to-background" />
        <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, var(--gold) 0, transparent 40%), radial-gradient(circle at 80% 70%, var(--maroon) 0, transparent 40%)" }} />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gold/25 blur-3xl animate-pulse-glow -z-10" aria-hidden />
        <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-maroon/25 blur-3xl animate-pulse-glow -z-10" aria-hidden />
        <div className="container mx-auto max-w-7xl px-4 py-14 md:py-28 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold mb-4 px-3 py-1.5 rounded-full border border-gold/40 glass-gold">
              <Sparkles className="h-3 w-3" /> Heritage · Hospitality · Cuisine
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[1.05] text-ink">
              A taste of <span className="text-gold italic">tradition</span>,<br />
              a stay to <span className="text-maroon italic">remember</span>.
            </h1>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-lg">
              Welcome to Annapurna Palace — where royal comfort meets the warmth of authentic Indian dining.
            </p>
            <div className="mt-7 sm:mt-8 flex flex-wrap gap-3">
              <Link to="/rooms" className="flex-1 sm:flex-none min-w-[160px]">
                <Button size="lg" className="w-full shimmer-gold text-ink border border-gold/60 font-semibold h-12">Book a Room</Button>
              </Link>
              <Link to="/reserve" className="flex-1 sm:flex-none min-w-[160px]">
                <Button size="lg" variant="outline" className="w-full border-ink text-ink hover:bg-ink hover:text-background h-12">Reserve a Table</Button>
              </Link>
              <Link to="/menu" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full text-ink hover:text-gold h-12">Pre-Order Menu →</Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div><div className="font-display text-2xl text-ink">25+</div>Heritage rooms</div>
              <div className="h-8 w-px bg-gold/30" />
              <div><div className="font-display text-2xl text-ink">120+</div>Signature dishes</div>
              <div className="h-8 w-px bg-gold/30" />
              <div><div className="font-display text-2xl text-ink">4.9★</div>Guest rating</div>
            </div>
          </div>
          <div className="relative flex items-center justify-center animate-rise" style={{ perspective: "1400px", animationDelay: "150ms" }}>
            <div className="absolute inset-0 -z-10 rounded-full gradient-flow opacity-50 blur-3xl" aria-hidden />
            <div className="absolute inset-6 -z-10 rounded-full border border-gold/40 animate-ornament" aria-hidden />
            <div className="absolute inset-16 -z-10 rounded-full border border-gold/20 animate-ornament" style={{ animationDelay: "1s" }} aria-hidden />
            <img src={logo} alt="Annapurna Palace" className="max-w-[280px] sm:max-w-md w-full drop-shadow-2xl tilt-3d animate-float" />
          </div>
        </div>
      </section>

      {/* Quick services */}
      <section className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: BedDouble, title: "Stay With Us", desc: "Heritage rooms & royal suites", to: "/rooms" },
            { icon: CalendarCheck, title: "Reserve a Table", desc: "Lunch, dinner, family gatherings", to: "/reserve" },
            { icon: UtensilsCrossed, title: "Pre-Order Dishes", desc: "Order ahead, dine or take away", to: "/menu" },
          ].map((s) => (
            <Link key={s.to} to={s.to}>
              <Card className="luxe-card p-6 border-gold/20 hover:border-gold/60 h-full bg-gradient-to-br from-card to-secondary/40">
                <s.icon className="h-8 w-8 text-gold mb-3" />
                <div className="font-display text-xl text-ink">{s.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured rooms */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Accommodations</div>
          <h2 className="font-display text-4xl md:text-5xl mt-2">Our Signature Rooms</h2>
          <GoldDivider />
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {featuredRooms.map((r) => (
            <Card key={r.id} className="luxe-card overflow-hidden border-gold/20 group">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={r.image_url ?? ""} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="font-display text-xl text-ink">{r.name}</div>
                  <div className="text-gold font-semibold">{formatINR(Number(r.price_per_night))}<span className="text-xs text-muted-foreground">/night</span></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
                <Link to="/rooms/$id" params={{ id: r.id }}>
                  <Button variant="outline" size="sm" className="mt-4 w-full border-gold/40 text-ink hover:bg-gold hover:text-ink">View &amp; Book</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured dishes */}
      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">From Our Kitchen</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Signature Dishes</h2>
            <GoldDivider />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {featuredDishes.map((d) => (
              <Card key={d.id} className="luxe-card overflow-hidden border-gold/20">
                <div className="aspect-[5/3] overflow-hidden">
                  <img src={d.image_url ?? ""} alt={d.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="font-display text-lg text-ink">{d.name}</div>
                    <div className="text-gold font-semibold">{formatINR(Number(d.price))}</div>
                  </div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{d.category}</div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/menu"><Button size="lg" className="bg-gold text-ink hover:bg-gold/90"><UtensilsCrossed className="mr-2 h-4 w-4" />See Full Menu</Button></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-5xl px-4 py-20 text-center">
        <Sparkles className="h-8 w-8 text-gold mx-auto" />
        <h2 className="font-display text-3xl md:text-5xl mt-4">Plan your visit today</h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Whether it's a family weekend, a quiet dinner, or a grand celebration — Annapurna Palace is ready to host you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/rooms"><Button size="lg" className="shimmer-gold text-ink border border-gold/60 font-semibold">Book a Room</Button></Link>
          <Link to="/reserve"><Button size="lg" variant="outline" className="border-ink text-ink hover:bg-ink hover:text-background">Reserve a Table</Button></Link>
        </div>
      </section>
    </SiteLayout>
  );
}
