# Graha 🌙

**Vedic Astrology Engine** — Accurate birth chart calculations powered by Swiss Ephemeris. Sidereal (Nirayana) Vedic astrology with Lahiri Ayanamsa, planetary dignities, yogas, doshas, Navamsa D9, and remedies.

Built as a Turborepo monorepo with a Hono.js API backend and Next.js frontend.

---

## Architecture

```
graha/
├── apps/
│   ├── api/              ← Hono.js API (Vercel Edge Functions)
│   │   ├── src/
│   │   │   ├── index.ts          ← Entry, routes, auth middleware
│   │   │   ├── routes/           ← chart, prediction, profile
│   │   │   ├── lib/              ← ephemeris, ai, vedic, interpretations/
│   │   │   ├── db/               ← Drizzle + Neon client
│   │   │   └── types/            ← Internal types
│   │   └── vercel.json           ← Edge Function config
│   └── web/              ← Next.js 15 frontend (Vercel)
│       ├── src/app/
│       │   ├── page.tsx          ← Form + results + 5 detail tabs
│       │   ├── layout.tsx        ← Root layout + fonts
│       │   ├── providers.tsx     ← TanStack Query
│       │   └── api/[...path]/    ← API proxy (adds auth header server-side)
│       ├── next.config.js        ← Dev proxy rewrites
│       └── tailwind.config.js
├── packages/
│   └── shared/           ← Shared types (Planet, ZodiacSign, BirthChart, etc.)
├── turbo.json
└── package.json
```

## Tech Stack

| Layer             | Technology                                               |
| ----------------- | -------------------------------------------------------- |
| **Backend**       | Hono.js (Vercel Edge Functions)                          |
| **Ephemeris**     | Swiss Ephemeris C++ addon, Lahiri Ayanamsa (sidereal)    |
| **Frontend**      | Next.js 15 App Router, React 19                          |
| **Styling**       | Tailwind CSS, dark theme                                 |
| **Animations**    | Framer Motion                                            |
| **Data fetching** | TanStack Query                                           |
| **Database**      | Neon (serverless PostgreSQL) via Drizzle ORM             |
| **AI**            | Groq SDK (optional, language polish only)                |
| **Timezone**      | Luxon with IANA database (historical accuracy)           |
| **Security**      | Server-side proxy — API secret never reaches the browser |
| **Monorepo**      | Turborepo, pnpm workspaces                               |

## Features

- **Sidereal Vedic calculations** — Lahiri Ayanamsa, Placidus houses
- **Full planetary dignities** — exalted, moolatrikona, own, friendly, neutral, enemy, debilitated
- **108 planet-in-house rules** — career, relationships, health for every combination
- **108 planet-in-sign rules** — complete dignity mapping
- **144 house lord placements** — every lord-in-house combination
- **27 nakshatras** — full profiles with deity, symbol, shakti, and **pada (1–4)**
- **Yoga detection** — Gaja Kesari, Dhana, Raja, Vesi, Panchamahapurusha
- **Dosha detection** — Mangalik, Kaal Sarpa, Pitri
- **Navamsa D9 chart** — Vargottama, marriage analysis
- **Dashamsha D10 chart** — career/profession divisional chart (Parashara rule) with per-placement career interpretations, rendered as a third chart wheel
- **Shadbala core** — six-component planetary strength (Uchcha, Dig, Paksha, Cheshta, Drik, Naisargika) with documented formulas and an honest component breakdown
- **Vedic aspects** — Mars (4,7,8), Saturn (3,7,10), Jupiter (5,7,9)
- **Current Dasa** — Vimshottari Dasa engine: proper Ketu→Venus→…→Mercury 120-year cycle, real calendar dates for all 9 Mahadasas and their Antardasas (validated by `pnpm validate:dasa`, 33 assertions). The full timeline is returned as `chart.dasaTimeline`
- **Combustion detection** — planets weakened by Sun proximity
- **Remedies** — gemstones, mantras, actions per planet
- **Guna Milan matchmaking** — full 36-point Ashtakoota (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi) with classical exceptions, plus Mangal/Kuja dosha with cancellation rules, nakshatra Vedha, Rajju dosha, **and Lagna compatibility (Sri Lankan practice)**. Bilingual (English/Sinhala) labels, computed from Swiss Ephemeris positions. Validated by `pnpm validate:matchmaking` (42 rule assertions)
- **Panchanga (Sinhala almanac)** — daily sunrise/sunset, **Rahu Kala / Yama Kala / Gulika Kala** (the traditional inauspicious periods Sri Lankans avoid), Buddhist Era date, Sinhala month & weekday, day nakshatra (නැකත), and auspicious time windows. Computed from real ephemeris sunrise/sunset
- **Family chart vault** — no-login cloud storage for the whole family's birth charts (පවුලේ ජන්ම පත්‍ර). Charts are saved to Neon PostgreSQL under a **user-backup-able vault key** (`GRH-XXXX-XXXX-XXXX-XXXX`), listed/loaded/deleted from the header; loading restores the full chart + reading instantly (no recompute). Enter the same key on any device to restore the vault (survives browser data clears). First save shows a recovery-key modal
- **Historical timezone accuracy** — IANA database via luxon
- **API security** — server-side proxy, secret never exposed to the browser
- **Edge runtime** — instant cold starts, globally distributed

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 11+
- A [Groq API key](https://console.groq.com) (optional)

### Install

```bash
pnpm install
cp .env.example .env.local     # Edit with your keys
cp apps/web/.env.example apps/web/.env.local  # or create manually
```

### Environment Variables

**Root `.env.local`** (for the API):

| Variable                   | Required | Description                                     |
| -------------------------- | -------- | ----------------------------------------------- |
| `GROQ_API_KEY`             | No       | Groq API key for AI polish                      |
| `HF_TOKEN`                 | No       | Hugging Face token (fallback AI)                |
| `DATABASE_URL`             | No       | Neon PostgreSQL connection string               |
| `API_SECRET`               | No       | Shared secret for API auth (leave blank in dev) |
| `AXIOM_TOKEN`              | No       | Axiom API token for structured logging          |
| `UPSTASH_REDIS_REST_URL`   | No       | Upstash Redis REST URL for rate limiting        |
| `UPSTASH_REDIS_REST_TOKEN` | No       | Upstash Redis REST token for rate limiting      |

**`apps/web/.env.local`** (for the frontend proxy):

| Variable     | Required | Description                                       |
| ------------ | -------- | ------------------------------------------------- |
| `API_URL`    | No       | Backend URL (default: `http://localhost:3001`)    |
| `API_SECRET` | No       | Must match root `API_SECRET` (leave blank in dev) |

### Run locally

```bash
pnpm dev            # Both API + frontend
pnpm api:dev        # Hono at http://localhost:3001
pnpm web:dev        # Next.js at http://localhost:3000
```

The Next.js dev server proxies `/api/*` requests to the Hono backend (configured in `next.config.js` rewrites). In production, the proxy runs on Vercel Edge Runtime and forwards to the separate API project.

## API Endpoints

| Method   | Path                        | Description                                                                     |
| -------- | --------------------------- | ------------------------------------------------------------------------------- |
| `GET`    | `/`                         | API info                                                                        |
| `GET`    | `/health`                   | Health check + AI status                                                        |
| `POST`   | `/api/chart/compute`        | Compute birth chart from birth data                                             |
| `POST`   | `/api/prediction/interpret` | Full chart reading (rule engine + optional AI)                                  |
| `POST`   | `/api/prediction/daily`     | Daily prediction                                                                |
| `POST`   | `/api/match/compute`        | **Guna Milan matchmaking** — 36-point Ashtakoota + doshas + Lagna compatibility |
| `GET`    | `/api/panchanga`            | **Sinhala almanac** — Rahu/Yama/Gulika Kala, B.E. date, day nakshatra           |
| `POST`   | `/api/vault/charts`         | **Family chart vault** — save a computed chart (header `X-Family-Id`)           |
| `GET`    | `/api/vault/charts`         | List this family's saved charts                                                 |
| `GET`    | `/api/vault/charts/:id`     | Full chart + reading (instant reload)                                           |
| `DELETE` | `/api/vault/charts/:id`     | Remove a saved chart                                                            |
| `POST`   | `/api/profile/create`       | Create user profile                                                             |
| `GET`    | `/api/profile/:id`          | Get user profile                                                                |

### Example: Full interpretation (rule engine)

```bash
curl -X POST http://localhost:3001/api/prediction/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": "1995-06-15",
    "birthTime": "14:30",
    "latitude": 6.9271,
    "longitude": 79.8612,
    "aiMode": "off"
  }'
```

### Example: Guna Milan matchmaking (rule engine)

```bash
curl -X POST http://localhost:3001/api/match/compute \
  -H "Content-Type: application/json" \
  -d '{
    "boy":  { "birthDate": "1990-04-15", "birthTime": "10:30", "latitude": 6.9271, "longitude": 79.8612 },
    "girl": { "birthDate": "1992-11-03", "birthTime": "18:45", "latitude": 6.9271, "longitude": 79.8612 }
  }'
```

Returns the full 8-koota breakdown, total/36, verdict, and dosha analysis (Mangal, Nadi, Bhakoot, Vedha, Rajju) with classical exceptions applied.

### Validate the engines

The rule engines ship with validation suites covering every rule and invariant:

```bash
cd apps/api
pnpm validate:matchmaking   # 42 assertions — Ashtakoota + doshas
pnpm validate:dasa          # 33 assertions — Vimshottari cycle, dates, balances
pnpm validate:ephemeris     # 44 assertions — vs JPL Horizons, NASA phases, published almanac
pnpm validate:divisional    # 26 assertions — D10 table, Shadbala component anchors
```

### Accuracy verification (public reference sources)

The ephemeris suite verifies every core number against independent public
references: JPL Horizons (NASA) for geocentric planet positions, the NASA
6000-year moon-phase catalog for full/new moons, published equinox/solstice
instants, the ICRC/Indian Astronomical Ephemeris Lahiri ayanamsa anchors, and
published Colombo sunrise/sunset almanac values. Every fixture is documented
in `apps/api/scripts/validate-ephemeris.ts`.

The `aiMode` parameter controls AI usage:

- `"off"` — Pure rule-based Vedic reading (no AI)
- `"polish"` (default) — Rule-based + AI language polish
- `"full"` — AI generates everything (legacy)

### Quick reference — Sri Lankan cities

| City    | Latitude | Longitude |
| ------- | -------- | --------- |
| Colombo | 6.9271   | 79.8612   |
| Kandy   | 7.2906   | 80.6337   |
| Galle   | 6.0535   | 80.2210   |
| Jaffna  | 9.6615   | 80.0255   |

## Security

The API is protected by a shared secret that never reaches the browser:

```
Browser → Next.js Edge proxy → adds X-Graha-Secret header → Hono API
```

- The proxy runs on **Vercel Edge Runtime** (instant cold starts)
- The secret is set as a server-side environment variable (`API_SECRET`)
- The browser sends requests to its own domain (`/api/*`)
- Without the correct `X-Graha-Secret` header, the API returns `401`
- The `/health` endpoint is public (for monitoring)

In local development, leave `API_SECRET` blank to skip the check.

## Deployment

### Two Vercel projects (recommended for monorepos)

Vercel has built-in monorepo support. Connect your repo once, then add **two projects**
from the same repository. Vercel auto-detects the workspace config and installs
dependencies from the root `pnpm-lock.yaml`.

#### graha-api (Hono backend)

> **Note:** The API uses Swiss Ephemeris — a native C++ addon. It must run on
> **Node.js Serverless Functions** (not Edge Runtime). Vercel's Node.js runtime
> supports native addons compiled via node-gyp.

| Setting              | Value        |
| -------------------- | ------------ |
| **Root Directory**   | `apps/api`   |
| **Framework Preset** | Other        |
| **Build Command**    | `pnpm build` |
| **Output Directory** | `dist`       |

Environment variables: `GROQ_API_KEY`, `DATABASE_URL`, `API_SECRET`

#### graha-web (Next.js frontend)

| Setting              | Value        |
| -------------------- | ------------ |
| **Root Directory**   | `apps/web`   |
| **Framework Preset** | Next.js      |
| **Build Command**    | `pnpm build` |
| **Output Directory** | `.next`      |

#### Related Projects (auto-link preview environments)

In the web project's Vercel dashboard, the `apps/web/vercel.json` config sets
the Related Projects to the API project. Vercel automatically injects the API URL
as the `VERCEL_RELATED_PROJECTS` environment variable so preview deployments
always point to the correct API preview.

Environment variables for **graha-web**: `API_SECRET` (same value as API project)

## Database

The app works without a database (charts are computed on-the-fly). With
`DATABASE_URL` set (Neon PostgreSQL), the **family chart vault** is active.

```bash
cd apps/api
export DATABASE_URL="postgresql://..."   # or set in .env.local
drizzle-kit push                          # create/update tables (saved_charts, …)
```

Vault security model: the browser generates a random family key
(`GRH-XXXX-XXXX-XXXX-XXXX`) and sends it as the `X-Family-Id` header. The key
is a **bearer secret** — anyone holding it can access the vault, so the UI
prompts users to back it up (first-save modal + copy button) and to treat it
like a password. Entering the same key on another device restores the vault.

Storage policy:

- **25 charts per family max** — oldest are auto-removed when exceeded
- **12-month retention** — vaults not opened for a year are pruned
  (opportunistically, at most once per server-process hour, no cron)
- **200 KB payload guard** per saved chart

## License

MIT
