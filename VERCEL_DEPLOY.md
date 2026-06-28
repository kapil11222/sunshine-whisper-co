# Deploying Annapurna Palace

## Fix: "supabaseUrl is required" on Publish

This error means the build process didn't see `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` at build time.

### On Lovable (Publish button)
1. Open the **Cloud** panel → click **Refresh** / reconnect Lovable Cloud.
2. Wait for the preview to rebuild cleanly (no console errors).
3. Click **Publish** again.

Your `.env` file is committed to the repo, so the keys ship with every
build. The error is almost always a stale env injection that a refresh
fixes.

## Deploying to Vercel

This project is a TanStack Start app (SSR). It builds for Cloudflare
Workers by default. To deploy to Vercel:

### 1. Push the repo to GitHub
Use the **GitHub** button in Lovable to connect a repo, then push.

### 2. Import the repo on Vercel
- Framework preset: **Other** (Vercel auto-detects Vite).
- Build command: `bun run build` (or `npm run build`).
- Output directory: `.output/public`
- Install command: `bun install` (or `npm install`).

### 3. Add Environment Variables in Vercel
Project → Settings → Environment Variables — add these for **Production**
and **Preview**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://qipvvgnqggendnacxufg.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | *(copy from `.env`)* |
| `VITE_SUPABASE_PROJECT_ID` | `qipvvgnqggendnacxufg` |
| `SUPABASE_URL` | same as above |
| `SUPABASE_PUBLISHABLE_KEY` | same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `LOVABLE_API_KEY` | *(copy from Lovable Cloud → Secrets)* |

> The `SUPABASE_SERVICE_ROLE_KEY` is **not** available on Lovable Cloud.
> If you need privileged server operations on Vercel, generate a service
> role key from a self-hosted Supabase project and add it as
> `SUPABASE_SERVICE_ROLE_KEY`.

### 4. Switch SSR target (one-time)
TanStack Start uses Nitro for SSR. The default preset in this project is
Cloudflare Workers. To deploy on Vercel, set the preset before building
by adding this build env var in Vercel:

```
NITRO_PRESET=vercel
```

Then redeploy. Vercel will produce serverless functions for SSR and
server functions automatically.

### 5. Common gotchas
- **404 on refresh**: Vercel handles TanStack routes via Nitro output —
  no `vercel.json` rewrites needed if `NITRO_PRESET=vercel` is set.
- **Auth redirects**: in Supabase Auth → URL Configuration, add your
  Vercel domain to **Site URL** and **Redirect URLs**.
- **Google OAuth**: add the Vercel domain to allowed origins in the
  Google Cloud Console.