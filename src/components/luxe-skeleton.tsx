import { cn } from "@/lib/utils";

export function LuxeSkeleton({ className }: { className?: string }) {
  return <div className={cn("luxe-skeleton rounded-md", className)} />;
}

export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gold/20 bg-card">
      <LuxeSkeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <LuxeSkeleton className="h-5 w-2/3" />
        <LuxeSkeleton className="h-3 w-full" />
        <LuxeSkeleton className="h-3 w-5/6" />
        <LuxeSkeleton className="h-10 w-full rounded-md mt-2" />
      </div>
    </div>
  );
}

export function DishRowSkeleton() {
  return (
    <div className="flex gap-3 py-3 border-b border-gold/15">
      <LuxeSkeleton className="h-14 w-14 rounded" />
      <div className="flex-1 space-y-2">
        <LuxeSkeleton className="h-4 w-1/2" />
        <LuxeSkeleton className="h-3 w-3/4" />
      </div>
      <LuxeSkeleton className="h-8 w-12 self-center rounded" />
    </div>
  );
}