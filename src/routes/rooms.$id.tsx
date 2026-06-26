import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRoom, createRoomBooking } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/cart-store";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Check } from "lucide-react";
import { useEffect } from "react";
import { useAuthGate } from "@/hooks/use-auth-gate";

const qo = (id: string) => queryOptions({ queryKey: ["room", id], queryFn: () => getRoom({ data: { id } }) });

export const Route = createFileRoute("/rooms/$id")({
  head: () => ({
    meta: [
      { title: "Book Room — Annapurna Palace" },
      { name: "description", content: "Reserve your stay at Annapurna Palace." },
    ],
  }),
  loader: async ({ context, params }) => { await context.queryClient.ensureQueryData(qo(params.id)); },
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto py-24 text-center text-destructive">{error.message}</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto py-24 text-center">Room not found</div></SiteLayout>,
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data: room } = useSuspenseQuery(qo(id));
  const book = useServerFn(createRoomBooking);
  const { email, ensureAuth } = useAuthGate();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    guest_name: "", phone: "", email: "", notes: "",
    check_in: today, check_out: tomorrow, guests: 2,
  });
  const [done, setDone] = useState<{ reference: string; total: number } | null>(null);
  useEffect(() => { if (email && !form.email) setForm((f) => ({ ...f, email })); }, [email]);
  const mut = useMutation({
    mutationFn: () => book({ data: { ...form, room_id: id, guests: Number(form.guests) } }),
    onSuccess: (r) => { setDone(r as any); toast.success("Booking received!"); },
    onError: (e) => showError(e, "We couldn't complete your booking. Please try again."),
  });

  if (done) {
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-xl py-20 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gold/20 flex items-center justify-center">
            <Check className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-display text-4xl mt-6">Booking Confirmed</h1>
          <p className="text-muted-foreground mt-2">Your reference number is</p>
          <div className="text-2xl font-mono text-gold mt-2">{done.reference}</div>
          <p className="mt-6 text-sm text-muted-foreground">Estimated total: <strong>{formatINR(Number(done.total))}</strong> · Pay at hotel on arrival.</p>
          <p className="text-sm text-muted-foreground">We'll contact you on the provided phone/email to confirm.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/"><Button variant="outline">Back home</Button></Link>
            <Link to="/menu"><Button className="bg-gold text-ink hover:bg-gold/90">Pre-Order Dishes</Button></Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-6xl px-4 py-10 grid lg:grid-cols-2 gap-10">
        <div>
          <img src={room.image_url ?? ""} alt={room.name} className="rounded-lg w-full aspect-[4/3] object-cover" />
          <h1 className="font-display text-4xl mt-6 text-ink">{room.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-muted-foreground text-sm">
            <span className="text-gold font-semibold text-lg">{formatINR(Number(room.price_per_night))}/night</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />Up to {room.capacity}</span>
          </div>
          <p className="mt-4 text-foreground/80">{room.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {room.amenities.map((a) => <Badge key={a} variant="outline" className="border-gold/40">{a}</Badge>)}
          </div>
        </div>
        <Card className="p-6 border-gold/30 h-fit">
          <h2 className="font-display text-2xl">Book Your Stay</h2>
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!ensureAuth("Please sign in to book a room")) return; mut.mutate(); }}>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Check-in</Label><Input type="date" required min={today} value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
              <div><Label>Check-out</Label><Input type="date" required min={form.check_in} value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
            </div>
            <div><Label>Guests</Label><Input type="number" min={1} max={room.capacity} value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} /></div>
            <div><Label>Full Name</Label><Input required maxLength={100} value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input required type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Notes (optional)</Label><Textarea rows={3} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" disabled={mut.isPending} className="w-full bg-gold text-ink hover:bg-gold/90">
              {mut.isPending ? "Booking..." : "Reserve Room"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">No payment required online · Pay at hotel.</p>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}