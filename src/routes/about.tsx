import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Award, Heart, Soup, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Annapurna Palace" },
      { name: "description", content: "The story behind Annapurna Palace — heritage hospitality and authentic Indian cuisine." },
      { property: "og:title", content: "About Annapurna Palace" },
      { property: "og:description", content: "Heritage hospitality and authentic Indian cuisine." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHeader kicker="Our Story" title="Welcome to Annapurna Palace" subtitle="Named after the goddess of nourishment, our home has been welcoming guests for generations." />
      <div className="container mx-auto max-w-5xl px-4 pb-20 space-y-10">
        <p className="text-lg text-foreground/80 text-center leading-relaxed">
          From hand-prepared spice blends to suites adorned with traditional motifs, every detail at Annapurna Palace honors the spirit of Indian hospitality — <em className="text-gold">Atithi Devo Bhava</em>, the guest is god.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Heart, title: "Family-run", desc: "Three generations of care" },
            { icon: Soup, title: "Authentic Kitchen", desc: "Heirloom recipes, slow-cooked" },
            { icon: Award, title: "Award-winning", desc: "Recognized hospitality" },
            { icon: Users, title: "200+ guests/day", desc: "Loved by locals & travelers" },
          ].map((f) => (
            <Card key={f.title} className="p-5 text-center border-gold/20">
              <f.icon className="h-8 w-8 text-gold mx-auto mb-2" />
              <div className="font-display text-lg">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
            </Card>
          ))}
        </div>
      </div>
    </SiteLayout>
  ),
});