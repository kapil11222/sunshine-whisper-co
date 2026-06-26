import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listDishes } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { formatINR, useCart } from "@/lib/cart-store";
import { ChevronLeft, Plus, ShoppingBag, Utensils } from "lucide-react";
import { toast } from "sonner";
import { notFound } from "@tanstack/react-router";

const qo = queryOptions({ queryKey: ["public", "dishes"], queryFn: () => listDishes() });

export const Route = createFileRoute("/menu/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${(loaderData as any)?.dish?.name ?? "Dish"} — Annapurna Palace` },
      { name: "description", content: (loaderData as any)?.dish?.description ?? "Authentic Indian dish at Annapurna Palace." },
    ],
  }),
  loader: async ({ context, params }) => {
    const dishes = await context.queryClient.ensureQueryData(qo);
    const dish = dishes.find((d) => d.id === params.id);
    if (!dish) throw notFound();
    return { dish };
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-md py-24 text-center space-y-4">
          <h1 className="font-display text-3xl text-maroon">We hit a snag</h1>
          <p className="text-ink/70 text-sm">{error.message}</p>
          <Button onClick={() => { router.invalidate(); reset(); }} className="bg-gold text-ink hover:bg-gold/90">Try again</Button>
        </div>
      </SiteLayout>
    );
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container mx-auto max-w-md py-24 text-center space-y-4">
        <h1 className="font-display text-3xl text-maroon">Dish not found</h1>
        <Link to="/menu"><Button className="bg-gold text-ink hover:bg-gold/90">Back to Menu</Button></Link>
      </div>
    </SiteLayout>
  ),
  component: Page,
});

function Page() {
  const { dish } = Route.useLoaderData() as { dish: any };
  const { data: all } = useSuspenseQuery(qo);
  const add = useCart((s) => s.add);
  const count = useCart((s) => s.count());
  const related = all.filter((d) => d.category === dish.category && d.id !== dish.id).slice(0, 3);

  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-background to-gold/10 py-10 md:py-16 animate-fade-in">
        <div className="container mx-auto max-w-5xl px-4">
          <Link to="/menu" className="inline-flex items-center text-sm text-ink/60 hover:text-maroon transition-colors mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to menu
          </Link>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="relative overflow-hidden rounded-lg border border-gold/30 shadow-2xl group aspect-[4/5] bg-[#f3ead3]">
              {dish.image_url ? (
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gold/50">
                  <Utensils className="h-24 w-24" />
                </div>
              )}
              <div className="absolute inset-4 border border-gold/50 rounded pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-background">
                <div className="text-gold text-xs tracking-[0.3em] uppercase">{dish.category}</div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-gold text-xs tracking-[0.4em] uppercase font-display">Specialty</div>
                <h1 className="font-display text-4xl md:text-5xl text-maroon mt-2">{dish.name}</h1>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gold/40" />
                  <div className="font-display text-2xl text-gold">{formatINR(Number(dish.price))}</div>
                  <div className="h-px flex-1 bg-gold/40" />
                </div>
              </div>

              {dish.description && (
                <p className="text-ink/75 leading-relaxed italic font-display text-lg">"{dish.description}"</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="bg-maroon text-background hover:bg-maroon/90 flex-1"
                  onClick={() => {
                    add({ dish_id: dish.id, name: dish.name, price: Number(dish.price), image_url: dish.image_url });
                    toast.success(`Added ${dish.name} to your cart`);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
                {count > 0 && (
                  <Link to="/preorder" className="flex-1">
                    <Button size="lg" variant="outline" className="border-gold/40 hover:bg-gold hover:text-ink w-full">
                      <ShoppingBag className="mr-2 h-4 w-4" /> Review Cart ({count})
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl text-maroon mb-5">More from {dish.category}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/menu/$id"
                    params={{ id: r.id }}
                    className="group block rounded-lg border border-gold/30 bg-[#fffbf2] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {r.image_url && (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={r.image_url} alt={r.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-display text-lg text-ink truncate">{r.name}</div>
                      <div className="text-gold text-sm">{formatINR(Number(r.price))}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}