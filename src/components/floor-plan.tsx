import floorplan from "@/assets/floorplan.png.asset.json";
import { cn } from "@/lib/utils";

export type TableSpot = {
  id: string;
  label: string;
  seats: number;
  type: "booth" | "vip" | "family" | "veg" | "premium";
  x: number; // % from left
  y: number; // % from top
};

// Coordinates hand-mapped from the Annapurna Palace floor plan.
export const TABLES: TableSpot[] = [
  // Booths (left column, green sofas) — 6 seats
  { id: "B1", label: "Booth 1", seats: 6, type: "booth", x: 7,  y: 41 },
  { id: "B2", label: "Booth 2", seats: 6, type: "booth", x: 7,  y: 56 },
  { id: "B3", label: "Booth 3", seats: 6, type: "booth", x: 7,  y: 70 },
  // VIP / Premium (left middle, marble tables) — 2 seats
  { id: "V1", label: "VIP 1", seats: 2, type: "vip", x: 17, y: 41 },
  { id: "V2", label: "VIP 2", seats: 2, type: "vip", x: 17, y: 56 },
  { id: "V3", label: "VIP 3", seats: 2, type: "vip", x: 17, y: 70 },
  // Family dining — top row (4-seat)
  { id: "F1",  label: "Family 1",  seats: 4, type: "family", x: 30, y: 41 },
  { id: "F2",  label: "Family 2",  seats: 4, type: "family", x: 40, y: 41 },
  { id: "F3",  label: "Family 3",  seats: 4, type: "family", x: 50, y: 41 },
  { id: "F4",  label: "Family 4",  seats: 4, type: "family", x: 60, y: 41 },
  { id: "F5",  label: "Family 5",  seats: 4, type: "family", x: 70, y: 41 },
  // Family dining — middle row (4-seat)
  { id: "F6",  label: "Family 6",  seats: 4, type: "family", x: 30, y: 56 },
  { id: "F7",  label: "Family 7",  seats: 4, type: "family", x: 40, y: 56 },
  { id: "F8",  label: "Family 8",  seats: 4, type: "family", x: 50, y: 56 },
  { id: "F9",  label: "Family 9",  seats: 4, type: "family", x: 60, y: 56 },
  { id: "F10", label: "Family 10", seats: 4, type: "family", x: 70, y: 56 },
  // Right column tall — 6 seat
  { id: "P1", label: "Premium 1", seats: 6, type: "premium", x: 80, y: 41 },
  { id: "P2", label: "Premium 2", seats: 6, type: "premium", x: 80, y: 56 },
  // Veg dining — bottom 3 tables
  { id: "G1", label: "Veg 1", seats: 4, type: "veg", x: 36, y: 80 },
  { id: "G2", label: "Veg 2", seats: 4, type: "veg", x: 50, y: 80 },
  { id: "G3", label: "Veg 3", seats: 4, type: "veg", x: 64, y: 80 },
];

type Props = {
  selected: string | null;
  occupied: Set<string>;
  occupiedDetails?: Map<string, { initial: string; party_size: number; reserved_at: string }>;
  onSelect: (id: string) => void;
  isOwnerView?: boolean;
};

export function FloorPlan({ selected, occupied, occupiedDetails, onSelect, isOwnerView }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gold/30 shadow-[var(--shadow-elegant)] bg-card">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-gold/5 via-transparent to-maroon/10" />
      <div className="relative" style={{ perspective: "1400px" }}>
        <div className="relative tilt-3d transition-transform duration-700">
          <img
            src={floorplan.url}
            alt="Annapurna Palace floor plan with selectable tables"
            className="block w-full h-auto select-none"
            draggable={false}
          />
          {TABLES.map((t) => {
            const isTaken = occupied.has(t.id);
            const isSel = selected === t.id;
            const det = occupiedDetails?.get(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => !isTaken && onSelect(t.id)}
                disabled={isTaken && !isOwnerView}
                title={
                  isTaken
                    ? `${t.label} — Booked${det ? ` (party of ${det.party_size})` : ""}`
                    : `${t.label} — ${t.seats} seats`
                }
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 group",
                  "h-9 w-9 sm:h-11 sm:w-11 rounded-full",
                  "flex items-center justify-center text-[10px] sm:text-xs font-bold",
                  "transition-all duration-300",
                  "backdrop-blur-sm border-2 shadow-lg",
                  isTaken
                    ? "bg-destructive/85 border-destructive text-destructive-foreground cursor-not-allowed animate-pulse-soft"
                    : isSel
                      ? "bg-maroon border-gold text-background scale-125 ring-4 ring-gold/40 animate-pulse-glow"
                      : "bg-gold/90 border-gold text-ink hover:scale-125 hover:bg-gold hover:shadow-[0_0_24px_rgba(184,134,47,0.7)]",
                )}
                style={{ left: `${t.x}%`, top: `${t.y}%` }}
              >
                <span className="drop-shadow">{t.id}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs border-t border-gold/20 bg-background/60">
        <Legend swatch="bg-gold/90 border-gold" label="Available" />
        <Legend swatch="bg-maroon border-gold" label="Your pick" />
        <Legend swatch="bg-destructive/85 border-destructive" label="Booked" />
        <span className="ml-auto text-muted-foreground">Tap any table to reserve it</span>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-block h-4 w-4 rounded-full border-2", swatch)} />
      <span>{label}</span>
    </div>
  );
}