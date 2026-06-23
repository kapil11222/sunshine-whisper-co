import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createTableReservation } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/reserve")({
  head: () => ({
    meta: [
      { title: "Reserve a Table — Annapurna Palace" },
      { name: "description", content: "Reserve your table at Annapurna Palace restaurant for lunch, dinner, or special occasions." },
      { property: "og:title", content: "Reserve a Table — Annapurna Palace" },
      { property: "og:description", content: "Book your table at Annapurna Palace." },
    ],
  }),
  component: Page,
});

function Page() {
  const reserve = useServerFn(createTableReservation);
  const now = new Date(); now.setMinutes(0); now.setHours(now.getHours() + 2);
  const defaultDt = now.toISOString().slice(0, 16);
  const [form, setForm] = useState({ guest_name: "", phone: "", email: "", notes: "", reserved_at: defaultDt, party_size: 2 });
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const mut = useMutation({
    mutationFn: () => reserve({ data: { ...form, party_size: Number(form.party_size), reserved_at: new Date(form.reserved_at).toISOString() } }),
    onSuccess: (r) => { setDone(r as any); toast.success("Reservation received!"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (done) {
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-xl py-20 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gold/20 flex items-center justify-center"><Check className="h-8 w-8 text-gold" /></div>
          <h1 className="font-display text-4xl mt-6">Table Reserved</h1>
          <div className="text-2xl font-mono text-gold mt-3">{done.reference}</div>
          <p className="text-muted-foreground mt-4">We'll see you soon. Our team may call to confirm.</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader kicker="Restaurant" title="Reserve a Table" subtitle="Tell us when you'd like to dine and we'll have a table waiting." />
      <div className="container mx-auto max-w-xl px-4 pb-20">
        <Card className="p-6 border-gold/30">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date &amp; Time</Label><Input required type="datetime-local" value={form.reserved_at} onChange={(e) => setForm({ ...form, reserved_at: e.target.value })} /></div>
              <div><Label>Party Size</Label><Input required type="number" min={1} max={30} value={form.party_size} onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Name</Label><Input required maxLength={100} value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input required type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Special requests</Label><Textarea rows={3} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" disabled={mut.isPending} className="w-full bg-gold text-ink hover:bg-gold/90">{mut.isPending ? "Submitting..." : "Reserve Table"}</Button>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}