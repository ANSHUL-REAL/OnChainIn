# Multi-user online setup (OnChainIn)

This makes **events, applications, check-ins, volunteers, etc. shared** across browsers and people — not only localStorage on one machine.

## Architecture

```text
User A browser  ─┐
User B browser  ─┼─→  Supabase (oci_store)  ← shared cloud DB
User C browser  ─┘         │
                           │ realtime + pull every 20s
Cardano Preprod ← Lace wallet (attendance proof txs)
```

## Step 1 — Supabase project (5 min)

1. Go to [https://supabase.com](https://supabase.com) → **New project**
2. Wait until the project is ready
3. Open **SQL Editor** → New query
4. Paste **all** of: `supabase/migrations/001_onchainin_multiuser.sql`
5. Click **Run** (success = table `oci_store` created)
6. **Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

### Optional: enable Realtime

**Database → Publications → supabase_realtime** → ensure `oci_store` is checked  
(SQL migration tries to add it automatically.)

## Step 2 — Local env

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_CARDANO_NETWORK=preprod
VITE_BLOCKFROST_PROJECT_ID=preprod...
```

Restart:

```bash
npm run dev
```

Badge in the UI should say **Online · multi-user** (green).

## Step 3 — Test multi-user

1. Browser A: Login as Organizer → create/publish an event  
2. Browser B (incognito or another device): Login as Participant → open **Events**  
3. You should see the same event (refresh if needed; sync is ~realtime / 20s)  
4. Participant applies → Organizer sees application after sync  
5. Cardano check-in still uses **Lace** (each user signs with their own wallet)

## Step 4 — Deploy online (Vercel)

1. Push repo to GitHub  
2. [vercel.com](https://vercel.com) → **Add New… → Project** → import `OnChainIn`  
3. Framework preset: **Vite**  
4. Build command: `npm run build` · Output directory: `dist`  
5. **Settings → Environment Variables** (Production + Preview), same as `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CARDANO_NETWORK` = `preprod`
   - `VITE_BLOCKFROST_PROJECT_ID` (optional)
6. **Deploy** → copy the `*.vercel.app` URL and share it  

`vercel.json` already rewrites SPA routes to `index.html`.

### Other free tools that help

| Service | Use for OnChainIn |
|---------|-------------------|
| **Supabase** | Shared multi-user data (required for online team demo) |
| **Vercel** | Host the website (recommended) |
| **Blockfrost** | Cardano Preprod API project id (optional) |
| **Lace wallet** | Sign attendance txs (each user installs locally) |
| **Cardano faucet** | Free Preprod test ADA |
| **GitHub** | Source code + Vercel auto-deploys on push |

You do **not** need Firebase, MongoDB, or a custom backend for the MVP — Supabase `oci_store` + Vercel is enough.

## What syncs

| Data | Multi-user |
|------|------------|
| Profiles | Yes |
| Events | Yes |
| Registrations / applications | Yes |
| Attendance (+ tx_hash) | Yes |
| Volunteer apps / tasks | Yes |
| Sponsors / budget / certificates | Yes |
| Login session (who you are) | Per browser |
| Wallet / private keys | Never (Lace only) |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Badge: **Local only** | Missing/invalid Supabase env; restart `npm run dev` |
| Badge: **Cloud error** | Run SQL migration; check URL/key; table `oci_store` |
| Other user doesn't see data | Click the cloud badge to force sync; wait 20s; check Realtime |
| RLS / permission denied | Re-run migration (open policies for demo) |

## Security note (hackathon MVP)

RLS policies are **open** (`using (true)`) so the demo works without complex auth.  
Before production: restrict write by user and hide the `service_role` key forever.

## Cardano still matters

Cloud = **shared app state**.  
Cardano = **immutable attendance proof**.  

Both together = usable multi-user product + blockchain credibility.
