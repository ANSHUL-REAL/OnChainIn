# OnChainIn

**Event operations + Cardano-verified attendance**

Create events (with AI), manage applications, run QR/wallet check-in on **Cardano Preprod**, and issue certificates that can prove attendance on-chain.

---

## What it does

| Role | You can… |
|------|----------|
| **Organizer** | AI create event · approve people · check-in desk · volunteers · sponsors · budget · certificates |
| **Participant** | Browse · apply · tickets · Cardano check-in · certificates · proof passport |
| **Volunteer** | Apply for roles · tasks · leaderboard · proof |
| **Sponsor** | Discover events · submit interest · impact summary |

```text
Create event → Apply → Approve → Check-in (QR / Lace) → Certificate → Verify
```

---

## Quick start (local)

```bash
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:3000**

Without Supabase the app still works **on this browser only** (localStorage).

---

## Go multi-user online (Supabase + Vercel)

Full guide: **[MULTI_USER_SETUP.md](./MULTI_USER_SETUP.md)**

### 1) Supabase (shared database) — ~5 min

1. Create a free project at [supabase.com](https://supabase.com)
2. **SQL Editor** → paste & run  
   `supabase/migrations/001_onchainin_multiuser.sql`
3. **Settings → API** → copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
4. Put them in `.env` (see `.env.example`)
5. Restart `npm run dev`  
   Header badge should say **Online · multi-user**

### 2) Vercel (public website)

1. Push this repo to GitHub  
2. [vercel.com](https://vercel.com) → **Import** this repo  
3. Framework: **Vite** · Build: `npm run build` · Output: `dist`  
4. Add the **same env vars** as `.env`  
5. Deploy → share the URL  

`vercel.json` already rewrites SPA routes to `index.html`.

### 3) Cardano check-in (optional but core for demos)

1. Install **Lace** (or another CIP-30 wallet)  
2. Switch wallet network to **Preprod**  
3. Get test ADA from the [Preprod faucet](https://docs.cardano.org/cardano-testnets/tools/faucet)  
4. Optional: [Blockfrost](https://blockfrost.io) Preprod project → `VITE_BLOCKFROST_PROJECT_ID`  
5. On event day: participant opens **Tickets** → connect wallet → **Check in on-chain**

### 4) Env reference

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CARDANO_NETWORK=preprod
VITE_BLOCKFROST_PROJECT_ID=preprodXXXXXXXX
```

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` + `ANON_KEY` | For multi-user | Shared events/apps/check-ins |
| `VITE_CARDANO_NETWORK` | Recommended | `preprod` for demos |
| `VITE_BLOCKFROST_PROJECT_ID` | Optional | Chain queries via Blockfrost |

---

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19 · Vite · Tailwind · Mesh.js |
| App data | localStorage + optional **Supabase** (`oci_store`) |
| Chain | Cardano **Preprod** · Mesh · metadata label `674` |
| Hosting | **Vercel** (or any static host of `dist`) |

---

## Scripts

```bash
npm run dev      # local
npm run build    # production bundle → dist/
npm run preview  # preview production build
```

---

## Project layout (important folders)

```text
src/pages/          # Home, auth, dashboards, verify
src/lib/cardano.ts  # Wallet + on-chain check-in
src/lib/cloudSync.ts# Supabase multi-user sync
supabase/migrations # SQL to run once in Supabase
public/logo.png     # Brand mark
```

---

## Demo login

1. **Sign up / Sign in** with any name + username + role  
2. Organizer creates an event (or AI create)  
3. Participant applies → organizer approves  
4. Check-in on event day → issue certificate → open verify link  

---

## Credits

**Made with love ❤️ by team RAGNAROK**

- [ANSHUL-REAL](https://github.com/ANSHUL-REAL)  
- [SOURABREDDY394](https://github.com/SOURABREDDY394)  
- Email: [editzera07@gmail.com](mailto:editzera07@gmail.com)
