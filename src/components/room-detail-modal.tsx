import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { formatINR } from "@/lib/cart-store";
import { Users, BedDouble, X, Sparkles } from "lucide-react";

type Room = {
  id: string;
  name: string;
  description: string | null;
  price_per_night: number | string;
  capacity: number;
  image_url: string | null;
  amenities: string[];
};

export function RoomDetailModal({ room, onOpenChange }: { room: Room | null; onOpenChange: (v: boolean) => void }) {
  const open = !!room;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-gold/40 bg-card max-h-[92vh] sm:max-h-[88vh] overflow-y-auto">
        {room && (
          <>
            <DialogTitle className="sr-only">{room.name}</DialogTitle>
            <DialogDescription className="sr-only">{room.description ?? ""}</DialogDescription>
            <div className="relative">
              <img src={room.image_url ?? ""} alt={room.name} className="w-full h-64 sm:h-80 object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 h-9 w-9 rounded-full glass-gold flex items-center justify-center"
                aria-label="Close"
              ><X className="h-4 w-4 text-ink" /></button>
              <div className="absolute bottom-4 left-5 right-5 text-background">
                <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">Annapurna Palace</div>
                <h2 className="font-display text-3xl sm:text-4xl drop-shadow-lg">{room.name}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-gold" />{room.capacity} guests</span>
                  <span className="inline-flex items-center gap-1"><BedDouble className="h-3 w-3 text-gold" />King bed</span>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">{room.description}</p>
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-gold mb-2 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Amenities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(room.amenities ?? []).map((a) => (
                    <Badge key={a} variant="outline" className="border-gold/40 text-ink/80 dark:text-foreground">{a}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-end justify-between border-t border-gold/20 pt-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">From</div>
                  <div className="font-display text-3xl text-gold">{formatINR(Number(room.price_per_night))}</div>
                  <div className="text-[10px] text-muted-foreground">per night · pay at hotel</div>
                </div>
                <Link to="/rooms/$id" params={{ id: room.id }} onClick={() => onOpenChange(false)}>
                  <Button className="btn-luxe font-semibold h-12 px-6">Book this room →</Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}