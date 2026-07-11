# Graha 🌙

**Vedic Astrology Engine** — Accurate birth chart calculations powered by Swiss Ephemeris. Sidereal (Nirayana) Vedic astrology with Lahiri Ayanamsa, planetary dignities, yogas, doshas, Navamsa D9, and remedies.

Built as a Turborepo monorepo with a Hono.js API backend and Next.js frontend.

---

## Architecture

```
graha/
├── apps/
│   ├── api/              ← Hono.js API server (Vercel Edge)
│   │   ├── src/
│   │   │   ├── index.ts          ← App entry, routes, Vercel adapter
│   │   │   ├── routes/           ← chart, prediction, profile endpoints
│   │   │   ├── lib/              ← ephemeris, ai, vedic, interpretations/
│   │   │   ├── db/               ← Drizzle schema + Neon client
│   │   │   └── types/            ← Internal type definitions
│   │   └── public/               ← Legacy vanilla frontend
│   └── web/              ← Next.js 15 App Router frontend
│       └── src/app/
│           ├── page.tsx          ← Main page (form + results + tabs)
│           ├── layout.tsx        ← Root layout
│           ├── providers.tsx     ← TanStack Query provider
│           └── globals.css       ← Tailwind + dark theme
├── packages/
│   └── shared/           ← Shared TypeScript types
│       └── src/index.ts         ← Planet, ZodiacSign, BirthChart, API types
├── turbo.json            ← Turborepo pipeline
└── package.json          ← Workspace root
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Hono.js (Vercel Edge Functions) |
| **Ephemeris** | Swiss Ephemeris (C++ native addon, Lahiri Ayanamsa) |
| **Frontend** | Next.js 15 App Router, React 19 |
| **Styling** | Tailwind CSS, dark theme |
| **Animations** | Framer Motion |
| **Data fetching** | TanStack Query |
| **Database** | Neon (serverless PostgreSQL) via Drizzle ORM |
| **AI** | Groq SDK (optional, for polish layer) |
| **Monorepo** | Turborepo, pnpm workspaces |

## Features

- **Sidereal Vedic calculations** — Lahiri Ayanamsa, Placidus houses
- **Full planetary dignities** — exaltation, moolatrikona, own, friendly, neutral, enemy, debilitation
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
- **Historical timezone accuracy** — luxon with IANA database

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 11+
- A [Groq API key](https://console.groq.com) (optional, for AI polish)

### Install

```bash
# Clone and install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your GROQ_API_KEY and DATABASE_URL
```

### Run locally

```bash
# Start both API and frontend
pnpm dev

# Or individually:
pnpm api:dev   # Hono API at http://localhost:3001
pnpm web:dev   # Next.js at http://localhost:3000
```

### Environment Variables

See `.env.example` for all available variables:

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | No | Groq API key for AI polish |
| `HF_TOKEN` | No | Hugging Face token (fallback AI) |
| `DATABASE_URL` | No | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | No | API URL for frontend (default: `http://localhost:3001`) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check + AI status |
| `POST` | `/api/chart/compute` | Compute birth chart from birth data |
| `POST` | `/api/prediction/interpret` | Full chart reading (rule engine + optional AI) |
| `POST` | `/api/prediction/daily` | Daily prediction |
| `POST` | `/api/profile/create` | Create user profile |
| `GET` | `/api/profile/:id` | Get user profile |

### Example: Compute a chart

```bash
curl -X POST http://localhost:3001/api/chart/compute \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": "1995-06-15",
    "birthTime": "14:30",
    "latitude": 6.9271,
    "longitude": 79.8612,
    "timezone": "Asia/Colombo"
  }'
```

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

## Deployment

### Vercel

This monorepo deploys as **two separate Vercel projects**:

1. **graha-api** — Root directory: `apps/api`, Framework: Other
2. **graha-web** — Root directory: `apps/web`, Framework: Next.js

Set environment variables in the Vercel dashboard for each project.

## Database

The app works without a database (charts and readings are computed on-the-fly). For persistence:

1. Create a free Neon project at [neon.tech](https://neon.tech)
2. Set `DATABASE_URL` in `.env.local`
3. Push the schema:

```bash
cd apps/api
pnpm db:push
```

## License

MIT
