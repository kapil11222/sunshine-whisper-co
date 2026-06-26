import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createPreOrder } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, useCart } from "@/lib/cart-store";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Minus } from "lucide-react";
import { useAuthGate } from "@/hooks/use-auth-gate";

export const Route = createFileRoute("/preorder")({
  head: () => ({
    meta: [
      { title: "Pre-Order — Annapurna Palace" },
      { name: "description", content: "Review your cart and place a pre-order for pickup or dine-in." },
    ],
  }),
  component: Page,
});

function Page() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const order = useServerFn(createPreOrder);
  const navigate = useNavigate();
  const { email, ensureAuth } = useAuthGate();
  const dt = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16);
  const [form, setForm] = useState({ guest_name: "", phone: "", email: "", notes: "", scheduled_for: dt, mode: "dine_in" as "dine_in" | "pickup" });
  useEffect(() => { if (email && !form.email) setForm((f) => ({ ...f, email })); }, [email]);

  const mut = useMutation({
    mutationFn: () =>
      order({
        data: {
          ...form,
          scheduled_for: new Date(form.scheduled_for).toISOString(),
          items: items.map((i) => ({ dish_id: i.dish_id, qty: i.qty })),
        },
      }),
    onSuccess: (r: any) => {
      const ref = r.reference as string;
      try {
        localStorage.setItem(`ap-order-${ref}`, JSON.stringify({
          reference: ref,
          total: r.total,
          mode: form.mode,
          scheduled_for: new Date(form.scheduled_for).toISOString(),
          guest_name: form.guest_name,
          items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        }));
      } catch {}
      clear();
      toast.success("Pre-order placed!");
      navigate({ to: "/order/$reference", params: { reference: ref } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (items.length === 0) {
    return (
      <SiteLayout>
        <PageHeader title="Your Cart is Empty" subtitle="Browse the menu and add dishes to get started." />
        <div className="text-center pb-20"><Link to="/menu"><Button className="bg-gold text-ink hover:bg-gold/90">Browse Menu</Button></Link></div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader kicker="Pre-Order" title="Review &amp; Confirm" subtitle="Choose dine-in or pickup time. Pay at the restaurant." />
      <div className="container mx-auto max-w-5xl px-4 pb-20 grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-gold/30">
          <h2 className="font-display text-2xl mb-4">Your Items</h2>
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.dish_id} className="flex items-center gap-3 border-b border-border pb-3">
                <img src={i.image_url ?? ""} alt={i.name} className="h-16 w-16 rounded object-cover" />
                <div className="flex-1">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-muted-foreground">{formatINR(i.price)} each</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(i.dish_id, Math.max(0, i.qty - 1))}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center">{i.qty}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(i.dish_id, i.qty + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
                <div className="w-20 text-right font-semibold">{formatINR(i.price * i.qty)}</div>
                <Button size="icon" variant="ghost" onClick={() => remove(i.dish_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-2">
            <div className="text-lg font-display">Subtotal</div>
            <div className="text-xl text-gold font-semibold">{formatINR(total)}</div>
          </div>
        </Card>
        <Card className="p-6 border-gold/30 h-fit">
          <h2 className="font-display text-2xl mb-4">Your Details</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!ensureAuth("Please sign in to place a pre-order")) return; mut.mutate(); }}>
            <div>
              <Label>Mode</Label>
              <Select value={form.mode} onValueChange={(v: any) => setForm({ ...form, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine_in">Dine In</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>When</Label><Input required type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} /></div>
            <div><Label>Name</Label><Input required maxLength={100} value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input required type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <Button type="submit" disabled={mut.isPending} className="w-full btn-luxe font-semibold h-12">{mut.isPending ? "Placing..." : `Place Pre-Order · ${formatINR(total)}`}</Button>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}