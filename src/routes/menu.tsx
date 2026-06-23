import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listDishes } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR, useCart } from "@/lib/cart-store";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["public", "dishes"], queryFn: () => listDishes() });

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Annapurna Palace" },
      { name: "description", content: "Explore our authentic Indian menu and pre-order dishes for pickup or dine-in." },
      { property: "og:title", content: "Menu — Annapurna Palace" },
      { property: "og:description", content: "Authentic Indian dishes. Pre-order for pickup or dine-in." },
    ],
  }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Not found</div></SiteLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  const add = useCart((s) => s.add);
  const count = useCart((s) => s.count());
  const cats = Array.from(new Set(data.map((d) => d.category)));

  return (
    <SiteLayout>
      <PageHeader kicker="Restaurant" title="Our Menu" subtitle="Authentic flavors, crafted with care. Add items to your cart and pre-order ahead of your visit." />
      <div className="container mx-auto max-w-7xl px-4 pb-20">
        {count > 0 && (
          <div className="sticky top-20 z-40 mb-6 flex justify-end">
            <Link to="/preorder">
              <Button className="bg-maroon text-background hover:bg-maroon/90 shadow-lg">
                <ShoppingBag className="mr-2 h-4 w-4" /> Review Cart ({count})
              </Button>
            </Link>
          </div>
        )}
        {cats.map((cat) => (
          <section key={cat} className="mb-12">
            <h2 className="font-display text-3xl text-ink border-b border-gold/30 pb-2 mb-6">{cat}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.filter((d) => d.category === cat).map((d) => (
                <Card key={d.id} className="overflow-hidden border-gold/20 flex flex-col">
                  <div className="aspect-[5/3] overflow-hidden">
                    <img src={d.image_url ?? ""} alt={d.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-display text-lg text-ink">{d.name}</h3>
                      <div className="text-gold font-semibold whitespace-nowrap">{formatINR(Number(d.price))}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{d.description}</p>
                    <Button
                      size="sm" variant="outline"
                      className="mt-3 border-gold/40 hover:bg-gold hover:text-ink"
                      onClick={() => { add({ dish_id: d.id, name: d.name, price: Number(d.price), image_url: d.image_url }); toast.success(`Added ${d.name}`); }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add to Pre-Order
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SiteLayout>
  );
}