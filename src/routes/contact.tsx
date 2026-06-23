import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Annapurna Palace" },
      { name: "description", content: "Get in touch with Annapurna Palace. Phone, email, and location." },
      { property: "og:title", content: "Contact Annapurna Palace" },
      { property: "og:description", content: "Phone, email, and location for bookings and inquiries." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHeader kicker="Get in Touch" title="Contact Us" subtitle="We'd love to hear from you for bookings, events, or any inquiries." />
      <div className="container mx-auto max-w-3xl px-4 pb-20 grid sm:grid-cols-2 gap-4">
        {[
          { icon: Phone, label: "Phone", value: "+91 99xxxxxx21" },
          { icon: Mail, label: "Email", value: "annupuranpalace@gmail.com" },
          { icon: MapPin, label: "Address", value: "Annapurna Palace, India" },
          { icon: Clock, label: "Hours", value: "7:00 AM — 11:00 PM" },
        ].map((c) => (
          <Card key={c.label} className="p-6 border-gold/20">
            <c.icon className="h-6 w-6 text-gold" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-3">{c.label}</div>
            <div className="text-lg font-medium mt-1 break-all">{c.value}</div>
          </Card>
        ))}
      </div>
    </SiteLayout>
  ),
});