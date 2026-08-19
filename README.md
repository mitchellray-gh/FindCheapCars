# AutoFind

AI-powered used car aggregation platform that scrapes listings from CarGurus, Cars.com, and AutoTrader, scores them for reliability and value, and presents them in a filterable dashboard — all under $15,000.

## Features

- **Multi-source scraping** — Pulls listings from CarGurus (JSON API), Cars.com, and AutoTrader (Playwright)
- **Composite scoring** — Each listing gets a reliability score (60%) and value score (40%) combined into a single rating
- **NHTSA VIN decoding** — Free VIN lookups for vehicle specs and recall data
- **Real-time filtering** — Filter by make, model, year, price, mileage, body style, drivetrain, tier, and minimum score
- **Sort and paginate** — Sort by score, price, mileage, year, or reliability across paginated results
- **Dark theme dashboard** — Stats bar, filter sidebar, image thumbnails, score badges, and detail pages
- **Responsive** — Works on desktop and mobile with a slide-out filter drawer

## Scoring System

### Reliability (0–100, weighted 60%)

| Factor | Max Points | Source |
|---|---|---|
| Base reliability | 35 | Pre-seeded Consumer Reports / JD Power ratings |
| Mileage vs expected | 25 | Age-adjusted mileage ratio |
| Title status | 15 | Clean > Rebuilt > Salvage |
| Ownership history | 15 | 1 owner = best |
| Accident history | 10 | From NHTSA recall data |

### Value (0–100, weighted 40%)

| Factor | Max Points | Source |
|---|---|---|
| Market comparison | 40 | Price vs average for same make/model/year/mileage bucket |
| Price-to-reliability ratio | 30 | Lower price + higher reliability = better |
| Service records | 15 | Number of documented services |
| Days on market | 15 | Longer listing = more negotiating power |

### Tiers

| Tier | Score Range |
|---|---|
| Top Pick | 80+ |
| Great Value | 65–79 |
| Worth Considering | 50–64 |
| Proceed with Caution | < 50 |

## Tech Stack

- **Frontend** — Next.js 15, React 19, Tailwind CSS
- **Backend** — Next.js API routes (serverless)
- **Database** — SQLite via sql.js + Drizzle ORM
- **Scraping** — CarGurus JSON API, Playwright for Cars.com/AutoTrader
- **Deployment** — Vercel-ready (monorepo)

## Project Structure

```
auto-find/
├── apps/
│   ├── api/              # Fastify server (legacy, used for local scraping)
│   └── web/              # Next.js app (frontend + API routes)
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/          # Next.js API route handlers
│       │   │   ├── listing/      # Listing detail page
│       │   │   └── page.tsx      # Dashboard
│       │   ├── components/       # UI components
│       │   └── lib/
│       │       ├── db/           # Schema, client, services
│       │       └── scoring/      # Reliability + value scoring
│       └── next.config.ts
├── packages/
│   ├── shared/           # TypeScript type definitions
│   ├── db/               # Drizzle schema + seed data
│   └── scraping/         # CarGurus, Cars.com, AutoTrader scrapers
├── vercel.json
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Seed Database

```bash
cd apps/web
npm run seed
```

This creates the SQLite database at `./data/autofind.db` with 56 reliability ratings and 3 source configs.

### Start Development

```bash
cd apps/web
DATABASE_PATH=../data/autofind.db npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scrape Listings

The dashboard starts empty. Trigger a scrape via the API:

```bash
# CarGurus (JSON API, fastest)
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"source":"cargurus","zipCode":"60601","maxPages":10,"maxPrice":15000}'

# All sources at once (cargurus + cars.com + autotrader)
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"source":"all","zipCode":"60601","maxPages":5,"maxPrice":15000}'

# Multiple zip codes for more results
curl -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" \
  -d '{"source":"cargurus","zipCode":"10001","maxPages":10,"maxPrice":15000}'

curl -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" \
  -d '{"source":"cargurus","zipCode":"90210","maxPages":10,"maxPrice":15000}'
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/scrape" -Method POST `
  -ContentType "application/json" `
  -Body '{"source":"cargurus","zipCode":"60601","maxPages":10,"maxPrice":15000}'
```

### Build for Production

```bash
cd apps/web
npm run build
```

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Set **Root Directory** to `apps/web`
5. Framework: **Next.js** (auto-detected)
6. Deploy

> **Note:** Vercel uses serverless functions so the SQLite database resets on cold starts. For production, swap the DB client to [Turso](https://turso.tech/) (libsql) or [Neon](https://neon.tech/) (Postgres) by setting a `DATABASE_URL` environment variable.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/listings` | List cars with filters (make, model, year, price, score, tier, etc.) |
| `GET` | `/api/listings/:id` | Single listing with score breakdown and Carfax summary |
| `GET` | `/api/stats` | Dashboard stats (total, avg score, tier distribution, top makes) |
| `GET` | `/api/makes` | Distinct makes in database |
| `GET` | `/api/models?make=X` | Models for a given make |
| `POST` | `/api/scrape` | Trigger a scrape job (source, zipCode, maxPages, maxPrice) |
| `GET` | `/api/scrape` | Recent scrape logs |

## Reliability Ratings

Pre-seeded for 56 make/model/year combinations from Consumer Reports and JD Power data, including:

Toyota, Honda, Mazda, Subaru, Hyundai, Kia, Nissan, Ford, Chevrolet, BMW, Mercedes-Benz, Chrysler, Volkswagen

Each rating covers both modern (2016–2024) and older (2012–2017) model year ranges with separate base scores.

## License

MIT
