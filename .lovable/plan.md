# Annapurna Palace — Hotel & Restaurant Website

A warm-ivory & gold luxury site with full booking, reservation, and pre-order flows, plus an owner dashboard. All "payments" handled as pay-at-hotel.

## Brand & Design

- Palette: ivory `#FFFBF2`, ink `#1A1A22`, gold `#B8862F`, maroon `#7A1F1F`.
- Fonts: Cormorant Garamond (display serif) + Inter (body), loaded via `<link>` in `__root.tsx`.
- Tokens defined in `src/styles.css` via `@theme` (HSL/OKLCH). All components use semantic tokens — no hardcoded colors.
- Ornate gold dividers, soft shadows, generous whitespace. Logo (uploaded) used in header & footer.
- Currency: ₹ (INR).
- Contact shown site-wide: +91 99xxxxxx21 · annupuranpalace@gmail.com.

## Public site (routes)

```
/                  Home — hero w/ logo, intro, featured rooms, signature dishes, CTA
/rooms             Browse rooms, filter by guests/dates, check availability → book
/rooms/$id         Room detail + booking form
/menu              Restaurant menu by category, add to pre-order cart
/reserve           Table reservation form (date, time, party size, notes)
/preorder          Cart review + place pre-order (pickup or dine-in time)
/about             Story / amenities
/contact           Contact details + inquiry form
/auth              Owner login (email/password)
/_authenticated/dashboard          Overview: today's bookings, reservations, orders
/_authenticated/dashboard/rooms    Manage room bookings + room inventory
/_authenticated/dashboard/tables   Manage table reservations
/_authenticated/dashboard/orders   Manage pre-orders, update status
/_authenticated/dashboard/menu     Add/edit/delete dishes & rooms
```

## Owner login

Lovable Cloud (Supabase) email/password auth. Seed account: `Kapilkjadhav3231@gmail.com` / `123456` created via the auth admin API in a one-time setup function. Role-based access using a `user_roles` table + `has_role()` security-definer function; only `owner` role can access `/dashboard/*`.

## Data model (Lovable Cloud)

- `rooms` — id, name, description, price_per_night, capacity, image_url, amenities, total_units
- `room_bookings` — id, room_id, guest_name, phone, email, check_in, check_out, guests, status (pending/confirmed/cancelled), notes
- `dishes` — id, name, description, price, category, image_url, is_available
- `pre_orders` — id, guest_name, phone, email, scheduled_for, mode (pickup/dine_in), status, total, notes
- `pre_order_items` — id, pre_order_id, dish_id, qty, price
- `table_reservations` — id, guest_name, phone, email, reserved_at, party_size, status, notes
- `user_roles` — (user_id, role) with `app_role` enum (`owner`)

RLS: public `INSERT` allowed on bookings/orders/reservations (so guests don't need accounts); public `SELECT` on `rooms` and `dishes` only. All read/update/delete by owners gated via `has_role(auth.uid(),'owner')`. Proper GRANTs added per public-schema rules.

## Guest flows

1. **Room booking**: pick dates → see available rooms → fill guest details → submit. Confirmation screen with reference ID. (No payment; pay at hotel.)
2. **Table reservation**: date + time slot + party size + contact → submit.
3. **Pre-order**: browse `/menu`, add dishes to a local cart (zustand), open `/preorder` → choose pickup/dine-in time → submit. Server computes totals.

Validation everywhere with zod + react-hook-form. Phone/email length limits.

## Owner dashboard

- KPI cards: today's check-ins, today's reservations, pending orders, revenue (sum of confirmed).
- Tabs/tables (shadcn `Table` + `Tabs`) listing each entity with filters (status, date range), inline status updates (confirm / cancel / mark complete).
- Menu manager: CRUD dishes with image URL + availability toggle.
- Room manager: CRUD rooms.
- Sidebar nav (shadcn sidebar) with collapsible state, active highlighting.

## Tech notes

- TanStack Start + TanStack Query. Loaders use `ensureQueryData`; components use `useSuspenseQuery`.
- Server functions in `src/lib/*.functions.ts` — public ones use server publishable client (anon SELECT on rooms/dishes); owner ones use `requireSupabaseAuth` + `has_role` check.
- One-time admin server fn `bootstrapOwner` (protected behind a setup secret) creates the seed owner; runs once.
- Every route with a loader sets `errorComponent` + `notFoundComponent`; root sets `notFoundComponent` and `defaultErrorComponent`.
- Per-route `head()` with unique title/description/OG.

## Build order

1. Enable Lovable Cloud + create schema (tables, enums, RLS, GRANTs, `has_role`).
2. Design tokens, fonts, logo asset, root layout + header/footer.
3. Public pages: Home, Rooms (+detail), Menu, Reserve, Pre-order, About, Contact.
4. Auth page + `_authenticated` layout + seed owner.
5. Owner dashboard (overview, rooms, tables, orders, menu/room CRUD).
6. Seed sample rooms + dishes via migration.
7. SEO meta per route, sitemap-ready titles.

Pay-at-hotel only; Stripe can be added later if you want.
