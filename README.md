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

| Layer | Technology |
|---|---|
| **Backend** | Hono.js (Vercel Edge Functions) |
| **Ephemeris** | Swiss Ephemeris C++ addon, Lahiri Ayanamsa (sidereal) |
| **Frontend** | Next.js 15 App Router, React 19 |
| **Styling** | Tailwind CSS, dark theme |
| **Animations** | Framer Motion |
| **Data fetching** | TanStack Query |
| **Database** | Neon (serverless PostgreSQL) via Drizzle ORM |
| **AI** | Groq SDK (optional, language polish only) |
| **Timezone** | Luxon with IANA database (historical accuracy) |
| **Security** | Server-side proxy — API secret never reaches the browser |
| **Monorepo** | Turborepo, pnpm workspaces |

## Features

- **Sidereal Vedic calculations** — Lahiri Ayanamsa, Placidus houses
- **Full planetary dignities** — exalted, moolatrikona, own, friendly, neutral, enemy, debilitated
- **108 planet-in-house rules** — career, relationships, health for every combination
- **108 planet-in-sign rules** — complete dignity mapping
- **144 house lord placements** — every lord-in-house combination
- **27 nakshatras** — full profiles with deity, symbol, shakti
- **Yoga detection** — Gaja Kesari, Dhana, Raja, Vesi, Panchamahapurusha
- **Dosha detection** — Mangalik, Kaal Sarpa, Pitri
- **Navamsa D9 chart** — Vargottama, marriage analysis
- **Vedic aspects** — Mars (4,7,8), Saturn (3,7,10), Jupiter (5,7,9)
- **Current Dasa** — Vimshottari Dasa calculation
- **Combustion detection** — planets weakened by Sun proximity
- **Remedies** — gemstones, mantras, actions per planet
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

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | No | Groq API key for AI polish |
| `HF_TOKEN` | No | Hugging Face token (fallback AI) |
| `DATABASE_URL` | No | Neon PostgreSQL connection string |
| `API_SECRET` | No | Shared secret for API auth (leave blank in dev) |

**`apps/web/.env.local`** (for the frontend proxy):

| Variable | Required | Description |
|---|---|---|
| `API_URL` | No | Backend URL (default: `http://localhost:3001`) |
| `API_SECRET` | No | Must match root `API_SECRET` (leave blank in dev) |

### Run locally

```bash
pnpm dev            # Both API + frontend
pnpm api:dev        # Hono at http://localhost:3001
pnpm web:dev        # Next.js at http://localhost:3000
```

The Next.js dev server proxies `/api/*` requests to the Hono backend (configured in `next.config.js` rewrites). In production, the proxy runs on Vercel Edge Runtime and forwards to the separate API project.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check + AI status |
| `POST` | `/api/chart/compute` | Compute birth chart from birth data |
| `POST` | `/api/prediction/interpret` | Full chart reading (rule engine + optional AI) |
| `POST` | `/api/prediction/daily` | Daily prediction |
| `POST` | `/api/profile/create` | Create user profile |
| `GET` | `/api/profile/:id` | Get user profile |

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

The `aiMode` parameter controls AI usage:
- `"off"` — Pure rule-based Vedic reading (no AI)
- `"polish"` (default) — Rule-based + AI language polish
- `"full"` — AI generates everything (legacy)

### Quick reference — Sri Lankan cities

| City | Latitude | Longitude |
|---|---|---|
| Colombo | 6.9271 | 79.8612 |
| Kandy | 7.2906 | 80.6337 |
| Galle | 6.0535 | 80.2210 |
| Jaffna | 9.6615 | 80.0255 |

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

Deploy as **two separate Vercel projects** with the **monorepo root** as the root directory
for both (so the lockfile at the root is found):

> ⚠️ **Important:** In each project's Vercel dashboard, set the **Install Command** to `pnpm install`
> so Vercel uses pnpm instead of npm. The root `vercel.json` also sets this.

### graha-api (Hono backend)

| Setting | Value |
|---|---|
| Root directory | `.` (monorepo root) |
| Framework | Other |
| Install command | `pnpm install` |
| Build command | `cd apps/api && pnpm build` |
| Output directory | `apps/api/dist` |

Environment variables: `GROQ_API_KEY`, `DATABASE_URL`, `API_SECRET`

### graha-web (Next.js frontend)

| Setting | Value |
|---|---|
| Root directory | `.` (monorepo root) |
| Framework | Next.js |
| Install command | `pnpm install` |
| Build command | `cd apps/web && pnpm build` |
| Output directory | `apps/web/.next` |

Environment variables: `API_URL` (deployed API URL, e.g. `https://graha-api.vercel.app`), `API_SECRET` (same value as API project)

## Database

The app works without a database (charts are computed on-the-fly). For persistence:

```bash
cd apps/api
pnpm db:push
```

Create a free Neon project at [neon.tech](https://neon.tech) and set `DATABASE_URL`.

## License

MIT
