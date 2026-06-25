import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as { email?: string })?.email;
    if (!email) return { rooms: [], tables: [], orders: [], tickets: [] };
    const [rooms, tables, orders, tickets] = await Promise.all([
      supabaseAdmin
        .from("room_bookings")
        .select("id,reference,check_in,check_out,guests,total,status,created_at,rooms(name)")
        .eq("email", email)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("table_reservations")
        .select("id,reference,reserved_at,party_size,table_label,status,created_at")
        .eq("email", email)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("pre_orders")
        .select("id,reference,scheduled_for,mode,total,status,created_at")
        .eq("email", email)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("support_tickets")
        .select("id,subject,status,reply,created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);
    return {
      rooms: rooms.data ?? [],
      tables: tables.data ?? [],
      orders: orders.data ?? [],
      tickets: tickets.data ?? [],
    };
  });