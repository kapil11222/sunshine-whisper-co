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
      table_label: z.string().trim().min(1).max(20).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    // Prevent double-booking the same table within a 2h window
    if (data.table_label) {
      const at = new Date(data.reserved_at).getTime();
      const from = new Date(at - 2 * 3600_000).toISOString();
      const to = new Date(at + 2 * 3600_000).toISOString();
      const { data: clash } = await sb
        .from("table_reservations")
        .select("id")
        .eq("table_label", data.table_label)
        .neq("status", "cancelled")
        .gte("reserved_at", from)
        .lte("reserved_at", to)
        .limit(1);
      if (clash && clash.length > 0) {
        throw new Error("That table is already booked for this time. Please pick another.");
      }
    }
    const { data: row, error } = await sb
      .from("table_reservations")
      .insert({
        guest_name: data.guest_name,
        phone: data.phone,
        email: data.email,
        reserved_at: data.reserved_at,
        party_size: data.party_size,
        notes: data.notes,
        table_label: data.table_label ?? null,
      })
      .select("reference")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listOccupiedTables = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ reserved_at: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const at = new Date(data.reserved_at).getTime();
    const from = new Date(at - 2 * 3600_000).toISOString();
    const to = new Date(at + 2 * 3600_000).toISOString();
    const { data: rows, error } = await sb
      .from("table_reservations")
      .select("table_label,guest_name,party_size,reserved_at,status")
      .neq("status", "cancelled")
      .not("table_label", "is", null)
      .gte("reserved_at", from)
      .lte("reserved_at", to);
    if (error) throw new Error(error.message);
    // Strip guest names from public response — only return label + masked initial
    return (rows ?? []).map((r) => ({
      table_label: r.table_label as string,
      party_size: r.party_size,
      reserved_at: r.reserved_at,
      initial: (r.guest_name?.[0] ?? "•").toUpperCase(),
    }));
  });

export const cancelTableReservation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ reference: z.string().trim().min(3).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: row, error } = await sb
      .from("table_reservations")
      .update({ status: "cancelled" })
      .eq("reference", data.reference)
      .select("reference,status")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Reservation not found");
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