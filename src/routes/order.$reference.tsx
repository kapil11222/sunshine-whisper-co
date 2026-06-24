import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/cart-store";

type Saved = {
  reference: string;
  total: number;
  mode: "dine_in" | "pickup";
  scheduled_for: string;
  guest_name: string;
  items: Array<{ name: string; qty: number; price: number }>;
};

export const Route = createFileRoute("/order/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.reference} — Annapurna Palace` },
      { name: "description", content: "Your pre-order confirmation." },
    ],
  }),
  component: Page,
});

function Page() {
  const { reference } = Route.useParams();
  const [data, setData] = useState<Saved | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ap-order-${reference}`);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [reference]);

  const dt = data ? new Date(data.scheduled_for) : null;

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12 sm:py-16 animate-rise">
        <Card className="border-gold/40 overflow-hidden bg-gradient-to-br from-card to-secondary/40 shadow-[var(--shadow-elegant)]">
          <div className="bg-gradient-to-r from-maroon to-[#5a1414] p-6 sm:p-8 text-center text-background relative">
            <div className="absolute inset-3 border border-gold/40 rounded pointer-events-none" />
            <div className="mx-auto h-16 w-16 rounded-full glass-gold flex items-center justify-center mb-3 animate-pulse-glow">
              <Check className="h-7 w-7 text-ink" />
            </div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold">Order placed</div>
            <h1 className="font-display text-3xl sm:text-4xl mt-1">Thank you{data ? `, ${data.guest_name.split(" ")[0]}` : ""}</h1>
            <div className="mt-3 inline-block px-4 py-1.5 rounded-full glass-gold font-mono text-ink text-sm">{reference}</div>
          </div>
          <div className="p-6 sm:p-8 space-y-4">
            {data && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gold" />
                  <span className="font-medium">{data.mode === "pickup" ? "Pickup" : "Dine in"}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{dt?.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="rounded-lg border border-gold/30 divide-y divide-gold/15">
                  {data.items.map((i, k) => (
                    <div key={k} className="flex justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{i.name}</div>
                        <div className="text-xs text-muted-foreground">{i.qty} × {formatINR(i.price)}</div>
                      </div>
                      <div className="font-semibold whitespace-nowrap">{formatINR(i.price * i.qty)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-gold/5">
                    <div className="font-display text-lg">Total</div>
                    <div className="font-display text-lg text-gold">{formatINR(Number(data.total))}</div>
                  </div>
                </div>
              </>
            )}
            <p className="text-[12px] text-muted-foreground text-center pt-1">
              Pay at the restaurant when you arrive. We'll have everything ready.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/menu"><Button variant="outline" className="w-full h-12 border-gold/40">Back to menu</Button></Link>
              <Link to="/"><Button className="btn-luxe w-full h-12 font-semibold"><ShoppingBag className="h-4 w-4 mr-1.5" /> Home</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </SiteLayout>
  );
}