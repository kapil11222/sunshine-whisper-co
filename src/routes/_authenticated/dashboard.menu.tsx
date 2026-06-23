import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerListRooms, ownerListDishes, upsertRoom, upsertDish, deleteRoom, deleteDish } from "@/lib/owner.functions";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/cart-store";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const roomsQO = queryOptions({ queryKey: ["owner", "rooms"], queryFn: () => ownerListRooms() });
const dishesQO = queryOptions({ queryKey: ["owner", "dishes"], queryFn: () => ownerListDishes() });

export const Route = createFileRoute("/_authenticated/dashboard/menu")({
  head: () => ({ meta: [{ title: "Manage Menu & Rooms" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(roomsQO),
      context.queryClient.ensureQueryData(dishesQO),
    ]);
  },
  errorComponent: ({ error }) => <DashboardLayout title="Manage"><div className="text-destructive">{error.message}</div></DashboardLayout>,
  notFoundComponent: () => <DashboardLayout title="Manage">Not found</DashboardLayout>,
  component: Page,
});

function Page() {
  return (
    <DashboardLayout title="Manage Menu & Rooms">
      <Tabs defaultValue="dishes" className="w-full">
        <TabsList>
          <TabsTrigger value="dishes">Dishes</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>
        <TabsContent value="dishes"><DishesTab /></TabsContent>
        <TabsContent value="rooms"><RoomsTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function DishesTab() {
  const { data } = useSuspenseQuery(dishesQO);
  const qc = useQueryClient();
  const up = useServerFn(upsertDish);
  const del = useServerFn(deleteDish);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);

  const mut = useMutation({
    mutationFn: (d: any) => up({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "dishes"] }); qc.invalidateQueries({ queryKey: ["public", "dishes"] }); setOpen(false); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "dishes"] }); qc.invalidateQueries({ queryKey: ["public", "dishes"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-ink hover:bg-gold/90" onClick={() => setEdit(null)}><Plus className="h-4 w-4 mr-1" /> Add Dish</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit ? "Edit" : "New"} Dish</DialogTitle></DialogHeader>
            <DishForm initial={edit} onSubmit={(v) => mut.mutate(v)} loading={mut.isPending} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((d: any) => (
          <Card key={d.id} className="overflow-hidden">
            {d.image_url && <img src={d.image_url} alt={d.name} className="h-40 w-full object-cover" />}
            <div className="p-4">
              <div className="flex justify-between"><div className="font-display text-lg">{d.name}</div><div className="text-gold font-semibold">{formatINR(Number(d.price))}</div></div>
              <div className="text-xs text-muted-foreground">{d.category} · {d.is_available ? "Available" : "Hidden"}</div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { setEdit(d); setOpen(true); }}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (confirm("Delete?")) delMut.mutate(d.id); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DishForm({ initial, onSubmit, loading }: { initial: any; onSubmit: (v: any) => void; loading: boolean }) {
  const [f, setF] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    category: initial?.category ?? "Mains",
    image_url: initial?.image_url ?? "",
    is_available: initial?.is_available ?? true,
  });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, price: Number(f.price), image_url: f.image_url || null }); }}>
      <div><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price (₹)</Label><Input required type="number" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value as any })} /></div>
        <div><Label>Category</Label><Input required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
      </div>
      <div><Label>Image URL</Label><Input type="url" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} /></div>
      <div className="flex items-center gap-2"><Switch checked={f.is_available} onCheckedChange={(v) => setF({ ...f, is_available: v })} /><Label>Available</Label></div>
      <Button type="submit" disabled={loading} className="w-full bg-gold text-ink hover:bg-gold/90">{loading ? "Saving..." : "Save"}</Button>
    </form>
  );
}

function RoomsTab() {
  const { data } = useSuspenseQuery(roomsQO);
  const qc = useQueryClient();
  const up = useServerFn(upsertRoom);
  const del = useServerFn(deleteRoom);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);

  const mut = useMutation({
    mutationFn: (d: any) => up({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "rooms"] }); qc.invalidateQueries({ queryKey: ["public", "rooms"] }); setOpen(false); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "rooms"] }); qc.invalidateQueries({ queryKey: ["public", "rooms"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-ink hover:bg-gold/90" onClick={() => setEdit(null)}><Plus className="h-4 w-4 mr-1" /> Add Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit ? "Edit" : "New"} Room</DialogTitle></DialogHeader>
            <RoomForm initial={edit} onSubmit={(v) => mut.mutate(v)} loading={mut.isPending} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((r: any) => (
          <Card key={r.id} className="overflow-hidden">
            {r.image_url && <img src={r.image_url} alt={r.name} className="h-40 w-full object-cover" />}
            <div className="p-4">
              <div className="flex justify-between"><div className="font-display text-lg">{r.name}</div><div className="text-gold font-semibold">{formatINR(Number(r.price_per_night))}</div></div>
              <div className="text-xs text-muted-foreground">Capacity {r.capacity} · {r.total_units} units · {r.is_active ? "Active" : "Hidden"}</div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (confirm("Delete?")) delMut.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RoomForm({ initial, onSubmit, loading }: { initial: any; onSubmit: (v: any) => void; loading: boolean }) {
  const [f, setF] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price_per_night: initial?.price_per_night ?? 0,
    capacity: initial?.capacity ?? 2,
    image_url: initial?.image_url ?? "",
    amenities: (initial?.amenities ?? []).join(", "),
    total_units: initial?.total_units ?? 1,
    is_active: initial?.is_active ?? true,
  });
  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        ...f,
        price_per_night: Number(f.price_per_night),
        capacity: Number(f.capacity),
        total_units: Number(f.total_units),
        amenities: f.amenities.split(",").map((a: string) => a.trim()).filter(Boolean),
        image_url: f.image_url || null,
      });
    }}>
      <div><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Price/night</Label><Input required type="number" step="0.01" value={f.price_per_night} onChange={(e) => setF({ ...f, price_per_night: e.target.value as any })} /></div>
        <div><Label>Capacity</Label><Input required type="number" min={1} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value as any })} /></div>
        <div><Label>Units</Label><Input required type="number" min={1} value={f.total_units} onChange={(e) => setF({ ...f, total_units: e.target.value as any })} /></div>
      </div>
      <div><Label>Image URL</Label><Input type="url" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} /></div>
      <div><Label>Amenities (comma-separated)</Label><Input value={f.amenities} onChange={(e) => setF({ ...f, amenities: e.target.value })} /></div>
      <div className="flex items-center gap-2"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><Label>Active</Label></div>
      <Button type="submit" disabled={loading} className="w-full bg-gold text-ink hover:bg-gold/90">{loading ? "Saving..." : "Save"}</Button>
    </form>
  );
}