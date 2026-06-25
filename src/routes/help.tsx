import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HelpChatbot } from "@/components/help-chatbot";
import { createTicketAuthed, createTicketAnon, listMyTickets } from "@/lib/support.functions";
import { supabase } from "@/integrations/supabase/client";
import { LifeBuoy, Mail, Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Annapurna Palace" },
      { name: "description", content: "Get help from our AI concierge or raise a support ticket. We respond within 24 hours." },
    ],
  }),
  component: HelpPage,
});

const FAQ = [
  { q: "How do I book a room?", a: "Browse Rooms, tap any room, fill the form. Pay-at-hotel — no online payment." },
  { q: "How do I reserve a table?", a: "Go to Reserve Table, pick date & time, tap your preferred table on our floor plan." },
  { q: "Can I pre-order food?", a: "Yes — choose dishes on the Menu, then check out for pickup or dine-in." },
  { q: "How do I cancel a booking?", a: "Open your reservation confirmation page and tap Cancel, or call +91 99xxxxxx21." },
];

function HelpPage() {
  const [authed, setAuthed] = useState<{ email: string | null; name: string | null } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) =>
      setAuthed({
        email: data.user?.email ?? null,
        name: (data.user?.user_metadata as { full_name?: string } | null)?.full_name ?? null,
      }),
    );
  }, []);
  const isAuthed = !!authed?.email;

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  useEffect(() => {
    if (authed?.email && !form.email) {
      setForm((f) => ({ ...f, email: authed.email ?? "", name: authed.name ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const submitAuthed = useServerFn(createTicketAuthed);
  const submitAnon = useServerFn(createTicketAnon);
  const listMine = useServerFn(listMyTickets);

  const mine = useQuery({
    queryKey: ["my-tickets", authed?.email],
    queryFn: () => listMine(),
    enabled: isAuthed,
  });

  const mut = useMutation({
    mutationFn: () =>
      isAuthed ? submitAuthed({ data: form }) : submitAnon({ data: form }),
    onSuccess: () => {
      toast.success("Ticket submitted — we'll respond within 24h.");
      setForm((f) => ({ ...f, subject: "", message: "" }));
      mine.refetch();
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not submit"),
  });

  return (
    <SiteLayout>
      <PageHeader kicker="Support" title="How can we help?" subtitle="Chat with our AI concierge, browse FAQs, or raise a ticket." />
      <div className="container mx-auto max-w-6xl px-4 pb-20 grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-5 border-gold/30">
            <h2 className="font-display text-2xl flex items-center gap-2"><MessageCircle className="h-5 w-5 text-gold" /> Frequently Asked</h2>
            <div className="mt-4 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group border border-gold/15 rounded-lg p-3 bg-secondary/40">
                  <summary className="cursor-pointer font-medium text-sm">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-gold/30">
            <h2 className="font-display text-2xl">Contact</h2>
            <div className="mt-3 space-y-2 text-sm text-foreground/80">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> +91 99xxxxxx21</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> annupuranpalace@gmail.com</p>
            </div>
          </Card>
        </div>

        <Card className="p-5 border-gold/30 h-fit">
          <h2 className="font-display text-2xl flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-gold" /> Raise a Ticket</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Name</Label><Input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Subject</Label><Input required maxLength={150} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Message</Label><Textarea required rows={5} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <Button type="submit" disabled={mut.isPending} className="w-full btn-luxe font-semibold h-11">
              {mut.isPending ? "Submitting…" : "Submit Ticket"}
            </Button>
          </form>

          {isAuthed && mine.data && mine.data.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gold/20">
              <h3 className="font-display text-lg mb-2">My Tickets</h3>
              <div className="space-y-2">
                {mine.data.map((t) => (
                  <div key={t.id} className="text-sm rounded-md border border-gold/15 p-3 bg-secondary/30">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{t.subject}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gold">{t.status}</span>
                    </div>
                    {t.reply && <p className="mt-2 text-muted-foreground"><strong className="text-gold">Reply:</strong> {t.reply}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
      <HelpChatbot />
    </SiteLayout>
  );
}