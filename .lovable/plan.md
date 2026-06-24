# Premium Upgrade Plan

A focused frontend pass — no schema or business-logic changes.

## 1. Mobile-tuned animations + skeletons
- Wrap heavy keyframes (`shimmer-gold`, `gradient-flow`, `tilt-3d`, `float`) in a `@media (min-width: 768px)` block so phones get static gold; keep `rise-in` + `fade-in` (cheap transforms only).
- Add GPU hints (`will-change: transform, opacity`) and shorten durations on `< md`.
- New `<LuxeSkeleton />` (shimmer over `bg-muted`) used on Menu, Rooms, Floor-plan, Dashboard lists while queries are pending.

## 2. Dark mode toggle
- `ThemeProvider` + `useTheme` (localStorage, system default) toggling `.dark` on `<html>`.
- Tune `.dark` tokens in `src/styles.css`: deep ink `#0E0B14` bg, ivory text, gold stays `#D9A441` (boosted L for contrast), maroon shifts to `#A23535`. Re-verify AA contrast on mobile.
- Gold animations preserved (gradient + shimmer use CSS vars).
- Toggle button (sun/moon) in header + mobile drawer.

## 3. Cart & Checkout flow
- Cart drawer (Sheet) opens from header cart icon — list items, qty steppers, subtotal, "Checkout".
- New route `/checkout`: mobile-first form (name, phone, email, pickup/dine-in toggle, notes), calls existing `createPreOrder` server fn, clears cart, navigates to confirmation.
- New route `/order/$reference`: confirmation screen with reference, items, total, ETA note, "Back to menu".

## 4. Reservation confirmation screen
- Replace inline success in `reserve.tsx` with a dedicated `/reservation/$reference` route showing table label, date/time, party size, guest name, reference.
- Buttons: **Cancel** (calls new `cancelTableReservation` server fn — sets status='cancelled', reference-gated, no auth) and **Reschedule** (returns to `/reserve?ref=…` prefilled).
- Reference stored in localStorage so the page survives refresh.

## 5. Luxury room details modal (mobile)
- On `/rooms`, tapping a card opens a full-screen `Dialog` (mobile) / large modal (desktop): hero image, swipeable gallery (extra images from `rooms.gallery` if present, fallback to single image), amenities chips, price, "Book this room" CTA → `/rooms/$id`.
- Uses existing `Carousel` shadcn component for gallery.

## 6. Premium polish
- New ornamental SVG dividers on hero + section headers.
- Soft noise overlay on dark mode.
- Buttons get unified `.btn-luxe` (gradient border + inner shadow).
- Cards lift on touch (`active:scale-[0.98]`) for mobile feedback.

## Technical notes
- New server fn: `cancelTableReservation({ reference })` in `src/lib/public.functions.ts` — no DB schema change, just sets `status='cancelled'` where reference matches (public, rate-limit-friendly).
- New files: `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/components/luxe-skeleton.tsx`, `src/components/cart-drawer.tsx`, `src/components/room-detail-modal.tsx`, `src/routes/checkout.tsx`, `src/routes/order.$reference.tsx`, `src/routes/reservation.$reference.tsx`.
- Edited: `src/styles.css`, `src/components/site-layout.tsx`, `src/routes/__root.tsx`, `src/routes/menu.tsx`, `src/routes/rooms.tsx`, `src/routes/reserve.tsx`, `src/lib/public.functions.ts`.

Approve and I'll implement in one pass.
