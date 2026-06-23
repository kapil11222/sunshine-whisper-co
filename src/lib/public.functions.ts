import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listRooms = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("rooms")
    .select("id,name,description,price_per_night,capacity,image_url,amenities,total_units")
    .eq("is_active", true)
    .order("price_per_night", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getRoom = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: room, error } = await sb
      .from("rooms")
      .select("id,name,description,price_per_night,capacity,image_url,amenities,total_units")
      .eq("id", data.id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!room) throw new Error("Room not found");
    return room;
  });

export const listDishes = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("dishes")
    .select("id,name,description,price,category,image_url")
    .eq("is_available", true)
    .order("category", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const contactSchema = z.object({
  guest_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(200),
  notes: z.string().trim().max(500).default(""),
});

export const createRoomBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    contactSchema.extend({
      room_id: z.string().uuid(),
      check_in: z.string(),
      check_out: z.string(),
      guests: z.number().int().min(1).max(20),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: room, error: rErr } = await sb
      .from("rooms").select("price_per_night").eq("id", data.room_id).maybeSingle();
    if (rErr || !room) throw new Error("Room unavailable");
    const nights = Math.max(
      1,
      Math.round((new Date(data.check_out).getTime() - new Date(data.check_in).getTime()) / 86400000),
    );
    const total = Number(room.price_per_night) * nights;
    const { data: row, error } = await sb
      .from("room_bookings")
      .insert({
        room_id: data.room_id,
        guest_name: data.guest_name,
        phone: data.phone,
        email: data.email,
        check_in: data.check_in,
        check_out: data.check_out,
        guests: data.guests,
        notes: data.notes,
        total,
      })
      .select("reference,total")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createTableReservation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    contactSchema.extend({
      reserved_at: z.string(),
      party_size: z.number().int().min(1).max(30),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: row, error } = await sb
      .from("table_reservations")
      .insert({
        guest_name: data.guest_name,
        phone: data.phone,
        email: data.email,
        reserved_at: data.reserved_at,
        party_size: data.party_size,
        notes: data.notes,
      })
      .select("reference")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createPreOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    contactSchema.extend({
      scheduled_for: z.string(),
      mode: z.enum(["pickup", "dine_in"]),
      items: z
        .array(z.object({ dish_id: z.string().uuid(), qty: z.number().int().min(1).max(50) }))
        .min(1)
        .max(50),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const ids = data.items.map((i) => i.dish_id);
    const { data: dishes, error: dErr } = await sb
      .from("dishes").select("id,name,price").in("id", ids).eq("is_available", true);
    if (dErr) throw new Error(dErr.message);
    const byId = new Map(dishes?.map((d) => [d.id, d]) ?? []);
    if (byId.size !== ids.length) throw new Error("Some dishes are unavailable");
    let total = 0;
    const itemsRow = data.items.map((i) => {
      const dish = byId.get(i.dish_id)!;
      const lineTotal = Number(dish.price) * i.qty;
      total += lineTotal;
      return { dish_id: i.dish_id, dish_name: dish.name, qty: i.qty, price: dish.price };
    });
    const { data: order, error } = await sb
      .from("pre_orders")
      .insert({
        guest_name: data.guest_name,
        phone: data.phone,
        email: data.email,
        scheduled_for: data.scheduled_for,
        mode: data.mode,
        notes: data.notes,
        total,
      })
      .select("id,reference,total")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Failed");
    const { error: itemErr } = await sb
      .from("pre_order_items")
      .insert(itemsRow.map((it) => ({ ...it, pre_order_id: order.id })));
    if (itemErr) throw new Error(itemErr.message);
    return { reference: order.reference, total: order.total };
  });