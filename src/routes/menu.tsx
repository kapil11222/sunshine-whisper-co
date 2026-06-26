import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listDishes } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { formatINR, useCart } from "@/lib/cart-store";
import { Plus, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { DishRowSkeleton } from "@/components/luxe-skeleton";

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
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(qo); },
  pendingComponent: () => (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-16 space-y-3">
        <div className="luxe-skeleton h-10 w-1/2 rounded mx-auto" />
        <div className="luxe-skeleton h-4 w-3/4 rounded mx-auto" />
        <div className="mt-8 space-y-2">{Array.from({ length: 6 }).map((_, i) => <DishRowSkeleton key={i} />)}</div>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Not found</div></SiteLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  const add = useCart((s) => s.add);
  const count = useCart((s) => s.count());
  const cats = Array.from(new Set(data.map((d) => d.category)));
  // pages: 0 = cover, 1..cats.length = category pages, cats.length+1 = back cover
  const totalPages = cats.length + 2;
  const [page, setPage] = useState(0);
  const next = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const prev = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-background to-gold/10 py-10 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          {count > 0 && (
            <div className="mb-6 flex justify-end">
              <Link to="/preorder">
                <Button className="bg-maroon text-background hover:bg-maroon/90 shadow-lg">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Review Cart ({count})
                </Button>
              </Link>
            </div>
          )}

          {/* 3D Menu Book */}
          <div className="relative mx-auto" style={{ perspective: "2200px" }}>
            <div
              className="relative mx-auto w-full max-w-[640px] aspect-[3/4] sm:aspect-[4/5]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Cover */}
              <BookPage index={0} current={page} zBase={totalPages}>
                <Cover />
              </BookPage>

              {/* Category pages */}
              {cats.map((cat, i) => {
                const dishes = data.filter((d) => d.category === cat);
                return (
                  <BookPage key={cat} index={i + 1} current={page} zBase={totalPages}>
                    <CategoryPage
                      cat={cat}
                      pageNo={i + 1}
                      total={cats.length}
                      dishes={dishes}
                      onAdd={(d) => {
                        add({ dish_id: d.id, name: d.name, price: Number(d.price), image_url: d.image_url });
                        toast.success(`Added ${d.name}`);
                      }}
                    />
                  </BookPage>
                );
              })}

              {/* Back cover */}
              <BookPage index={totalPages - 1} current={page} zBase={totalPages}>
                <BackCover count={count} />
              </BookPage>

              {/* Spine shadow */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/30 to-transparent rounded-l-lg" />
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button onClick={prev} disabled={page === 0} variant="outline" className="border-gold/40 hover:bg-gold hover:text-ink">
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="font-display text-ink/80 text-sm tabular-nums min-w-[80px] text-center">
                {page + 1} / {totalPages}
              </div>
              <Button onClick={next} disabled={page === totalPages - 1} className="bg-maroon text-background hover:bg-maroon/90">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function BookPage({
  index,
  current,
  zBase,
  children,
}: {
  index: number;
  current: number;
  zBase: number;
  children: React.ReactNode;
}) {
  const flipped = index < current;
  return (
    <div
      className="absolute inset-0 origin-left rounded-r-lg shadow-2xl"
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 900ms cubic-bezier(0.645, 0.045, 0.355, 1)",
        transform: flipped ? "rotateY(-180deg)" : "rotateY(0deg)",
        zIndex: flipped ? index : zBase - index,
      }}
    >
      {/* Front face */}
      <div
        className="absolute inset-0 rounded-r-lg overflow-hidden bg-background border border-gold/30"
        style={{ backfaceVisibility: "hidden" }}
      >
        {children}
      </div>
      {/* Back face (blank parchment) */}
      <div
        className="absolute inset-0 rounded-l-lg overflow-hidden bg-[#f3ead3] border border-gold/30"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      >
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(184,134,47,0.15),transparent_60%)]" />
      </div>
    </div>
  );
}

function Cover() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-maroon via-maroon to-[#5a1414] text-background flex flex-col items-center justify-center p-8 text-center relative">
      <div className="absolute inset-3 border-2 border-gold/60 rounded pointer-events-none" />
      <div className="absolute inset-5 border border-gold/30 rounded pointer-events-none" />
      <div className="text-gold font-display text-sm tracking-[0.4em] uppercase">Annapurna Palace</div>
      <h1 className="font-display text-5xl md:text-6xl text-background mt-4">Menu</h1>
      <div className="mt-3 text-gold font-display italic">— à la carte —</div>
      <div className="mt-10 text-background/80 text-sm max-w-xs">
        Authentic flavors, crafted with care. Turn the page to explore.
      </div>
      <div className="absolute bottom-6 text-gold/70 text-xs tracking-widest">EST. भोजन • स्वाद • आतिथ्य</div>
    </div>
  );
}

function BackCover({ count }: { count: number }) {
  return (
    <div className="h-full w-full bg-gradient-to-br from-maroon to-[#3b0d0d] text-background flex flex-col items-center justify-center p-8 text-center">
      <div className="font-display text-gold text-sm tracking-[0.4em] uppercase">Thank You</div>
      <h2 className="font-display text-4xl mt-3">Bon Appétit</h2>
      <p className="mt-4 text-background/80 text-sm max-w-xs">
        {count > 0 ? `${count} item${count > 1 ? "s" : ""} ready in your cart.` : "Add dishes from any page to pre-order."}
      </p>
      <Link to="/preorder" className="mt-8">
        <Button className="bg-gold text-ink hover:bg-gold/90">
          <ShoppingBag className="mr-2 h-4 w-4" /> Review Cart
        </Button>
      </Link>
    </div>
  );
}

function CategoryPage({
  cat,
  pageNo,
  total,
  dishes,
  onAdd,
}: {
  cat: string;
  pageNo: number;
  total: number;
  dishes: Array<{ id: string; name: string; description: string | null; price: number | string; image_url: string | null }>;
  onAdd: (d: any) => void;
}) {
  return (
    <div className="h-full w-full bg-[#fffbf2] bg-[radial-gradient(circle_at_15%_10%,rgba(184,134,47,0.08),transparent_55%)] p-6 sm:p-8 overflow-y-auto">
      <div className="flex items-baseline justify-between border-b border-gold/40 pb-2">
        <h2 className="font-display text-2xl sm:text-3xl text-maroon">{cat}</h2>
        <span className="text-xs text-ink/50 tracking-widest">{pageNo} / {total}</span>
      </div>
      <ul className="mt-4 divide-y divide-gold/20">
        {dishes.map((d, idx) => (
          <li
            key={d.id}
            className="group py-3 animate-fade-in"
            style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
          >
            <div className="flex gap-3 items-center rounded-md px-2 -mx-2 transition-all duration-300 hover:bg-gold/10">
              <Link
                to="/menu/$id"
                params={{ id: d.id }}
                className="flex gap-3 flex-1 min-w-0 items-center"
                aria-label={`View ${d.name}`}
              >
                {d.image_url ? (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gold/40 shadow-sm">
                    <img
                      src={d.image_url}
                      alt={d.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 rounded pointer-events-none" />
                  </div>
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded border border-gold/30 bg-gold/10 flex items-center justify-center text-gold/70 font-display text-xl">
                    {d.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-display text-lg text-ink truncate transition-colors group-hover:text-maroon">
                      {d.name}
                    </h3>
                    <div className="flex-1 border-b border-dotted border-ink/30 translate-y-[-4px]" />
                    <div className="text-gold font-semibold whitespace-nowrap font-display">
                      {formatINR(Number(d.price))}
                    </div>
                  </div>
                  {d.description && (
                    <p className="text-xs text-ink/60 mt-1 line-clamp-2 italic">{d.description}</p>
                  )}
                </div>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="border-gold/40 hover:bg-gold hover:text-ink self-center opacity-80 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(d); }}
                aria-label={`Add ${d.name} to cart`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}