import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cancelTableReservation } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Users, MapPin, X, RefreshCw, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

type Saved = {
  reference: string;
  table_label: string | null;
  reserved_at: string;
  party_size: number;
  guest_name: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export const Route = createFileRoute("/reservation/$reference")({
  head: ({ params }) => ({
    meta: [
      { title: `Reservation ${params.reference} — Annapurna Palace` },
      { name: "description", content: "Your table reservation confirmation at Annapurna Palace." },
    ],
  }),
  component: Page,
});

function Page() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const cancelFn = useServerFn(cancelTableReservation);
  const [data, setData] = useState<Saved | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ap-res-${reference}`);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [reference]);

  const mut = useMutation({
    mutationFn: () => cancelFn({ data: { reference } }),
    onSuccess: () => {
      setCancelled(true);
      toast.success("Reservation cancelled");
      try { localStorage.removeItem(`ap-res-${reference}`); } catch {}
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const reschedule = () => {
    if (data) {
      try { localStorage.setItem("ap-reschedule", JSON.stringify(data)); } catch {}
    }
    navigate({ to: "/reserve" });
  };

  const dt = data ? new Date(data.reserved_at) : null;

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12 sm:py-16 animate-rise">
        <Card className="border-gold/40 overflow-hidden bg-gradient-to-br from-card to-secondary/40 shadow-[var(--shadow-elegant)]">
          <div className="bg-gradient-to-r from-maroon to-[#5a1414] p-6 sm:p-8 text-center text-background relative">
            <div className="absolute inset-3 border border-gold/40 rounded pointer-events-none" />
            <div className="mx-auto h-16 w-16 rounded-full glass-gold flex items-center justify-center mb-3 animate-pulse-glow">
              {cancelled ? <X className="h-7 w-7 text-ink" /> : <Check className="h-7 w-7 text-ink" />}
            </div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold">
              {cancelled ? "Cancelled" : "Confirmed"}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl mt-1">
              {cancelled ? "Reservation Cancelled" : "Table Reserved"}
            </h1>
            <div className="mt-3 inline-block px-4 py-1.5 rounded-full glass-gold font-mono text-ink text-sm">
              {reference}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {data ? (
              <>
                <Row icon={<MapPin className="h-4 w-4" />} label="Table">
                  <span className="font-display text-xl text-gold">{data.table_label ?? "Any available"}</span>
                </Row>
                <Row icon={<Calendar className="h-4 w-4" />} label="When">
                  <div className="font-medium">{dt?.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                  <div className="text-sm text-muted-foreground">{dt?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                </Row>
                <Row icon={<Users className="h-4 w-4" />} label="Party">
                  {data.party_size} {data.party_size === 1 ? "guest" : "guests"} · {data.guest_name}
                </Row>
                {data.phone && <Row icon={<Phone className="h-4 w-4" />} label="Phone">{data.phone}</Row>}
                {data.email && <Row icon={<Mail className="h-4 w-4" />} label="Email">{data.email}</Row>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Reservation reference saved. Show this code at the restaurant.
              </p>
            )}

            {!cancelled ? (
              <div className="grid grid-cols-2 gap-3 pt-3">
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 h-12"
                  onClick={() => { if (confirm("Cancel this reservation?")) mut.mutate(); }}
                  disabled={mut.isPending}
                >
                  <X className="h-4 w-4 mr-1.5" /> {mut.isPending ? "Cancelling…" : "Cancel"}
                </Button>
                <Button onClick={reschedule} className="btn-luxe font-semibold h-12">
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Reschedule
                </Button>
              </div>
            ) : (
              <Link to="/reserve" className="block">
                <Button className="btn-luxe w-full font-semibold h-12">Book another table</Button>
              </Link>
            )}

            <p className="text-[11px] text-muted-foreground text-center pt-2">
              Pay at hotel · Our team may call to confirm
            </p>
          </div>
        </Card>
      </div>
    </SiteLayout>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="h-9 w-9 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}