import { GoldDivider } from "@/components/site-layout";

export function PageHeader({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center py-12 md:py-16">
      {kicker && <div className="text-xs uppercase tracking-[0.3em] text-gold">{kicker}</div>}
      <h1 className="font-display text-4xl md:text-6xl mt-2 text-ink">{title}</h1>
      {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
      <GoldDivider />
    </div>
  );
}