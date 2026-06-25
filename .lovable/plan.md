# Plan

## 1. Simplified Login Page (`src/routes/auth.tsx`)
- Remove the Sign In / Sign Up tab switcher. Render **only one Login form** (email + password). New users (any email except the owner) are auto-created on first login via Supabase `signUp` fallback when `signInWithPassword` returns "Invalid credentials".
- Add **Continue with Google** button using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback" })`. Enable the Google provider via `supabase--configure_social_auth`.
- After auth success: if email == `kapilkjadhav3231@gmail.com` → redirect to `/dashboard` (owner). Otherwise → `/account` (new customer dashboard).
- Keep the existing owner bootstrap (auto-grants `owner` role to that email on first sign-in).

## 2. Customer Dashboard (`/account`)
New public-authenticated route under `_authenticated/account.tsx` (visible to any signed-in user).
- **My Room Bookings** — list rows from `room_bookings` where `email = auth user email`.
- **My Table Reservations** — list rows from `table_reservations` where `email = auth user email`, with link to `/reservation/$reference`.
- **My Pre-Orders** — list rows from `pre_orders` where `email = auth user email`, with link to `/order/$reference`.
- **My Support Tickets** — list user's own tickets with status.
- New server fn `getMyActivity` in `src/lib/customer.functions.ts` using `requireSupabaseAuth` — joins by email from `context.claims.email`.

## 3. Help Page & Support Tickets (`/help`)
- New `support_tickets` table: `id, user_id, email, name, subject, message, status (open|in_progress|closed), reply, created_at, updated_at`. RLS: users see their own; owner role sees all. GRANTs for authenticated + service_role.
- `/help` route: public page with FAQ + **Raise a Ticket** form (subject, message). If signed in, prefills name/email; otherwise asks for them.
- Server fns: `createSupportTicket`, `listMyTickets`, `listAllTickets` (owner-only), `updateTicketStatus` (owner-only).
- Add **Support / Tickets** tab in owner dashboard (`/dashboard/tickets`) showing all tickets with status filter and reply/close actions.

## 4. AI Help Chatbot
- Floating chat widget (`src/components/help-chatbot.tsx`) shown on `/help` (and optionally on every page via SiteLayout). Uses AI SDK `useChat` with `DefaultChatTransport`.
- Backend: TanStack server route `src/routes/api/chat.ts` that streams via Lovable AI Gateway using `google/gemini-3-flash-preview` with a system prompt describing Annapurna Palace (menu categories, room types, contact, booking instructions).
- Provider helper: `src/lib/ai-gateway.server.ts` per the standard pattern.
- The chatbot can answer FAQs and direct users to `/rooms`, `/menu`, `/reserve`, or `/help` for ticket creation.

## 5. Navigation Updates
- Add **Help** + **My Account** links in `site-layout.tsx` header + mobile drawer/bottom dock.
- Add **Tickets** tab in `dashboard-layout.tsx` sidebar.

## Technical Details

**Files to create**
- `src/routes/_authenticated/account.tsx`
- `src/routes/_authenticated/dashboard.tickets.tsx`
- `src/routes/help.tsx`
- `src/routes/api/chat.ts`
- `src/components/help-chatbot.tsx`
- `src/lib/customer.functions.ts`
- `src/lib/support.functions.ts`
- `src/lib/ai-gateway.server.ts`
- Migration: `support_tickets` table + RLS + GRANTs

**Files to edit**
- `src/routes/auth.tsx` — single login form + Google button + role-based redirect
- `src/components/site-layout.tsx` — Help + Account links
- `src/components/dashboard-layout.tsx` — Tickets sidebar item
- `src/lib/owner.functions.ts` — `listAllTickets`, `updateTicketStatus`

**Auth flow**
- `signInWithPassword` → if error "Invalid login credentials" and email != owner → fallback `signUp({ email, password, options: { emailRedirectTo: window.location.origin } })` then sign in.
- Auto-confirm email signups must be enabled (via `configure_auth`) so customers don't need to verify email before reaching the dashboard.

**Google OAuth**
- `configure_social_auth(["google"])` — uses Lovable-managed credentials, no setup needed from user.
- Callback page: rely on existing `/auth` route to detect signed-in state and redirect by role.

**Owner detection helper** — `isOwnerEmail(email)` constant `kapilkjadhav3231@gmail.com` used in `/auth` post-login and `_authenticated/route.tsx` for default landing.

**AI chatbot**
- Server route returns `result.toUIMessageStreamResponse()`.
- Client renders `message.parts` as markdown.
- Composer stays focused after send.

Confirm and I'll build it end-to-end.
