# OnChainIn

**Event operations + Cardano-verified attendance**

Hackathon rebuild of [EventOS](https://github.com/SOURABREDDY394/eventos) UI/flows with a **Cardano Preprod** proof layer (Mesh.js).

## Product story

```text
Create event → Participants apply → Organizer approves
→ QR / manual / Cardano check-in → Certificates → Public proof
```

Roles:

- **Organizer** — create events, approve apps, check-in desk, volunteers, sponsors, budget, certificates  
- **Participant** — browse, apply, tickets, certificates, passport  
- **Volunteer** — apply for roles, tasks, leaderboard, proof  
- **Sponsor** — discover events, submit interest  

## Cardano layer

- Mesh.js wallet connect (Lace, Eternl, Nami, …)
- On-chain check-in: self-transfer + metadata label `674`
- Attendance records store `tx_hash` + explorer link
- No private keys stored

## Stack

| Layer | Tech |
|-------|------|
| UI | EventOS design (React, Tailwind, Radix/shadcn) |
| State | localStorage store (demo-ready, no Supabase required) |
| Chain | Mesh.js + Cardano Preprod |
| Optional | Blockfrost / Supabase env vars if you add remote sync |

## Quick start

```bash
npm install
cp .env.example .env   # then fill Supabase + optional Blockfrost
npm run dev
```

Open `http://localhost:3000`.

### Multi-user online (required for shared use)

See **[MULTI_USER_SETUP.md](./MULTI_USER_SETUP.md)** — 5 minutes:

1. Create free [Supabase](https://supabase.com) project  
2. Run `supabase/migrations/001_onchainin_multiuser.sql` in SQL Editor  
3. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`  
4. Restart app → badge **Online · multi-user**  
5. Deploy to Vercel with the same env vars  

Without Supabase the app still works **local-only** (one browser).

### Demo login

1. **Login** → your name + username + role (Participant / Organizer / …)  
2. Create events, apply, approve, check in  
3. Other users with the same Supabase project see the same data  

### On-chain check-in (Cardano)

1. Lace wallet on **Preprod** + [faucet](https://docs.cardano.org/cardano-testnets/tools/faucet)  
2. Approved ticket → **Connect Wallet** → **Check In On-Chain**  
3. Sign → explorer link  

### Env

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CARDANO_NETWORK=preprod
VITE_BLOCKFROST_PROJECT_ID=preprodXXXXXXXX
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Deploy

Vercel/Netlify: build `npm run build`, output `dist`. SPA rewrite → `index.html`.

## Credits

UI & product model adapted from **EventOS** by [SOURABREDDY394](https://github.com/SOURABREDDY394/eventos).  
Cardano proof layer: **OnChainIn** (IndiaCodex'26).
