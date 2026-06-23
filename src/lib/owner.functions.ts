import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertOwner(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "owner",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const ownerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const sb = context.supabase;
    const [bookings, reservations, orders] = await Promise.all([
      sb.from("room_bookings").select("*, rooms(name)").order("created_at", { ascending: false }),
      sb.from("table_reservations").select("*").order("created_at", { ascending: false }),
      sb.from("pre_orders").select("*, pre_order_items(*)").order("created_at", { ascending: false }),
    ]);
    if (bookings.error) throw new Error(bookings.error.message);
    if (reservations.error) throw new Error(reservations.error.message);
    if (orders.error) throw new Error(orders.error.message);
    return {
      bookings: bookings.data ?? [],
      reservations: reservations.data ?? [],
      orders: orders.data ?? [],
    };
  });

export const updateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      table: z.enum(["room_bookings", "table_reservations", "pre_orders"]),
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    const { error } = await context.supabase
      .from(data.table)
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const ownerListRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data, error } = await context.supabase.from("rooms").select("*").order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const ownerListDishes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data, error } = await context.supabase.from("dishes").select("*").order("category");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const roomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).default(""),
  price_per_night: z.number().positive(),
  capacity: z.number().int().min(1).max(20),
  image_url: z.string().url().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  total_units: z.number().int().min(1).max(100),
  is_active: z.boolean().default(true),
});

export const upsertRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roomSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    const { error } = await context.supabase.from("rooms").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    const { error } = await context.supabase.from("rooms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const dishSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(1000).default(""),
  price: z.number().positive(),
  category: z.string().min(2).max(50),
  image_url: z.string().url().nullable().optional(),
  is_available: z.boolean().default(true),
});

export const upsertDish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => dishSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    const { error } = await context.supabase.from("dishes").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    const { error } = await context.supabase.from("dishes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bootstrapOwner = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(6) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Check if any owner already exists
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "owner")
      .limit(1);
    if (existing && existing.length > 0) {
      return { ok: false, reason: "owner_exists" };
    }
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      // Try to find existing user
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const found = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
      if (!found) throw new Error(error?.message ?? "Failed to create user");
      await supabaseAdmin.from("user_roles").insert({ user_id: found.id, role: "owner" });
      return { ok: true, reason: "linked_existing" };
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "owner" });
    return { ok: true, reason: "created" };
  });