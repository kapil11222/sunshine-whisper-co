import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createTableReservation, listOccupiedTables } from "@/lib/public.functions";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, MapPin, Users } from "lucide-react";
import { FloorPlan, TABLES } from "@/components/floor-plan";

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
  const fetchOccupied = useServerFn(listOccupiedTables);
  const now = new Date(); now.setMinutes(0); now.setHours(now.getHours() + 2);
  const defaultDt = now.toISOString().slice(0, 16);
  const [form, setForm] = useState({ guest_name: "", phone: "", email: "", notes: "", reserved_at: defaultDt, party_size: 2 });
  const [tableId, setTableId] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const reservedIso = useMemo(() => new Date(form.reserved_at).toISOString(), [form.reserved_at]);
  const occQuery = useQuery({
    queryKey: ["occupied-tables", reservedIso],
    queryFn: () => fetchOccupied({ data: { reserved_at: reservedIso } }),
    staleTime: 30_000,
  });
  const occupied = useMemo(() => new Set((occQuery.data ?? []).map((r: any) => r.table_label)), [occQuery.data]);
  const occupiedDetails = useMemo(() => {
    const m = new Map<string, any>();
    (occQuery.data ?? []).forEach((r: any) => m.set(r.table_label, r));
    return m;
  }, [occQuery.data]);

  const selectedTable = TABLES.find((t) => t.id === tableId);

  const mut = useMutation({
    mutationFn: () => reserve({ data: {
      ...form,
      party_size: Number(form.party_size),
      reserved_at: reservedIso,
      table_label: tableId,
    } }),
    onSuccess: (r) => { setDone(r as any); toast.success("Reservation received!"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (done) {
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-xl py-20 text-center animate-fade-in">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-gold to-gold-soft flex items-center justify-center shadow-[0_0_40px_rgba(184,134,47,0.5)] animate-pulse-glow"><Check className="h-10 w-10 text-ink" /></div>
          <h1 className="font-display text-4xl mt-6">Table Reserved</h1>
          {tableId && <p className="text-gold mt-2 font-medium">Table {tableId} — {selectedTable?.label}</p>}
          <div className="text-2xl font-mono text-gold mt-3">{done.reference}</div>
          <p className="text-muted-foreground mt-4">We'll see you soon. Our team may call to confirm.</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader kicker="Restaurant" title="Reserve Your Table" subtitle="Pick your exact table from our floor plan, then tell us when you'd like to dine." />
      <div className="container mx-auto max-w-6xl px-4 pb-20 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* Floor plan */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Choose your table</h2>
            {tableId && selectedTable && (
              <div className="text-sm flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/40 animate-scale-in">
                <MapPin className="h-3.5 w-3.5 text-gold" />
                <span className="font-medium">{selectedTable.label}</span>
                <span className="text-muted-foreground">· {selectedTable.seats} seats</span>
              </div>
            )}
          </div>
          <FloorPlan
            selected={tableId}
            occupied={occupied}
            occupiedDetails={occupiedDetails}
            onSelect={(id) => {
              const t = TABLES.find((x) => x.id === id);
              setTableId(id);
              if (t && form.party_size > t.seats) {
                setForm((f) => ({ ...f, party_size: t.seats }));
              }
            }}
          />
          {occQuery.isLoading && <p className="text-xs text-muted-foreground">Checking table availability…</p>}
        </div>

        {/* Booking form */}
        <Card className="p-6 border-gold/30 h-fit lg:sticky lg:top-24 bg-gradient-to-br from-card to-secondary/40 shadow-[var(--shadow-elegant)]">
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (!tableId) { toast.error("Please pick a table on the floor plan first"); return; }
            mut.mutate();
          }}>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date &amp; Time</Label><Input required type="datetime-local" value={form.reserved_at} onChange={(e) => setForm({ ...form, reserved_at: e.target.value })} /></div>
              <div>
                <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Party Size</Label>
                <Input required type="number" min={1} max={selectedTable?.seats ?? 30} value={form.party_size} onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })} />
                {selectedTable && <p className="text-[10px] text-muted-foreground mt-1">Max {selectedTable.seats} at this table</p>}
              </div>
            </div>
            <div><Label>Name</Label><Input required maxLength={100} value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input required type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Special requests</Label><Textarea rows={3} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button
              type="submit"
              disabled={mut.isPending || !tableId}
              className="w-full text-ink font-semibold tracking-wide shimmer-gold border border-gold/60 shadow-[0_8px_24px_-8px_rgba(184,134,47,0.6)]"
              style={{ background: "var(--gradient-gold)" }}
            >
              {mut.isPending ? "Reserving…" : tableId ? `Reserve ${selectedTable?.label}` : "Select a table to continue"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center pt-1">Pay at hotel · No card required</p>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}