# WorldScope — Global Data Intelligence

WorldScope is a full-stack web application for exploring, visualising and comparing
public country data. It aggregates a pinned country catalogue, World Bank indicators
and Open-Meteo weather forecasts behind a single, documented REST API, with Redis
caching and graceful degradation when a provider is unavailable.

The project is a portfolio piece focused on the modern JavaScript/TypeScript
ecosystem: React 19, NestJS, Prisma, PostgreSQL and Redis in a pnpm monorepo. It
contains no authentication and no third-party API keys are required.

![Node 24](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)
![pnpm 12](https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![License MIT](https://img.shields.io/badge/license-MIT-blue)

> **Status:** Phase 3 (web client) is implemented. Typecheck, lint and the production
> build pass. Unit/E2E test suites and CI workflows are not written yet (Phase 4/5),
> and the API + web integration has not yet been smoke-tested end to end against a
> running database in the development environment used for this build. See
> [Roadmap](#roadmap) and [Known limitations](#known-limitations).

## Screenshot

A real screenshot/GIF is still **pending**. To add it:

1. Start the stack (see [Quick start](#quick-start)).
2. Open `http://localhost:5173`, visit the dashboard, explore, country detail and
   compare pages.
3. Capture at 1440×900 and save as `docs/images/dashboard.png`.
4. Replace this paragraph with `![WorldScope dashboard](docs/images/dashboard.png)`.

## Features

**Dashboard**

- Global totals: countries, regions, subregions and population (with the latest
  available year).
- Population distribution by region and the six most populous countries.
- Loading, error and empty states.

**Explore**

- Paginated country list (20 per page, up to 100).
- Debounced search by common or official name.
- Region and subregion filters, sortable by name, population, area or density.
- Filter state kept in the URL so views are shareable.

**Country detail**

- Name, official/native name, flag, capital, region, subregion, languages,
  currencies, area, coordinates and income level.
- Population and density with the reference year.
- Twelve years of World Bank indicators (5–30 configurable), rendered as a
  theme-aware line chart with a screen-reader summary.
- Current weather and seven-day forecast for the capital, or a documented
  "unavailable" reason when coordinates are missing.
- Border navigation and source/retrieval timestamps.

**Compare**

- Two to four countries selected by ISO alpha-3 code, encoded in `?codes=BRA,USA`.
- Side-by-side table for population, area, density and economic indicators.
- Unit-safe comparisons: each metric keeps a single unit and shows its reference
  year, and a note explains that years can differ between countries.
- Bar chart for the selected indicator, plus save/delete of comparisons.

**Library**

- Anonymous favourites and saved comparisons scoped by a browser-generated
  `x-client-id` header.
- Delete actions and re-open of saved comparisons.
- Empty, loading and error states.

**UX and platform**

- Responsive layout, keyboard navigation, skip link and focus-visible styles.
- Light/dark theme persisted in `localStorage`, applied before first paint.
- Number, area, date and indicator formatting through shared helpers.
- English UI with a typed translation dictionary ready for new locales.
- Documented REST API with Swagger UI at `/api/docs`.

## Tech stack

| Layer          | Technology                                                                 | Role                                                          |
| -------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Monorepo       | pnpm workspaces                                                            | Deterministic installs, shared scripts and workspace packages  |
| Language       | TypeScript 6 (`strict`)                                                    | End-to-end type safety                                        |
| API            | NestJS 12                                                                  | Modules, DTO validation, Swagger, exception filtering         |
| ORM            | Prisma 6                                                                   | Typed access to the two user-owned tables and migrations      |
| Database       | PostgreSQL 17.12 (Alpine)                                                  | Favourites and saved comparisons only                         |
| Cache          | Redis 8.8 (Alpine) with in-memory fallback                                 | Catalogue/indicator/weather caching, dependency health        |
| Web            | React 19, Vite 8, React Router 7                                           | SPA routing and production bundling                           |
| Data fetching  | TanStack Query 5                                                           | Server-state caching, retries and request cancellation        |
| Styling        | Tailwind CSS 4, Radix primitives, CVA                                      | shadcn-style components without generated boilerplate         |
| Charts         | Apache ECharts 6 via `echarts-for-react`                                   | Bar and line visualisations with theme-aware colours          |
| Forms/validation | React Hook Form + Zod (API side uses class-validator DTOs)               | Input validation on both sides                                |
| Quality        | ESLint 10, Prettier 3, Jest 30 (API), Vitest 5 + Testing Library (web), Playwright (planned) | Static analysis and automated tests |
| Infrastructure | Docker Compose + multi-stage Dockerfiles, Podman-compatible                | Local PostgreSQL/Redis and production-style containers         |

Versions are pinned in `package.json` files and `pnpm-lock.yaml`; container images
are pinned in `docker-compose.yml`.

## Architecture

```mermaid
flowchart LR
    User[User browser] --> Web["React SPA<br/>Vite + TanStack Query"]
    Web -->|"/api/v1 (JSON)"| API["NestJS API<br/>validation, rate limit, Swagger"]
    API --> Cache[("Redis cache<br/>catalogue 24h · indicators 24h · weather 30min")]
    API --> DB[("PostgreSQL<br/>favourites + saved comparisons")]
    API --> Catalog["mledoze/countries<br/>pinned commit"]
    API --> Flags["flagcdn.com<br/>PNG/SVG flags"]
    API --> WB["World Bank API<br/>5 indicator series"]
    API --> OM["Open-Meteo<br/>capital weather"]
```

The browser never calls third-party providers directly. The API normalises provider
payloads into the shared contracts in `packages/shared`, caches successful responses
in Redis, and returns source metadata (`name`, `url`, `retrievedAt`) plus a `cached`
flag so the UI can show provenance. Provider failures are isolated: a failed weather
call, for example, still returns a country profile with `unavailableReason`, and the
exception filter maps upstream `ProviderError`s to HTTP 502.

## Project structure

```text
worldscope/
├── apps/
│   ├── api/
│   │   ├── prisma/                # schema + SQL migrations
│   │   ├── src/
│   │   │   ├── cache/             # Redis client with in-memory fallback
│   │   │   ├── common/            # HTTP client, filters, errors, decorators
│   │   │   ├── compare/           # cross-country metrics
│   │   │   ├── comparisons/       # saved comparisons (anonymous)
│   │   │   ├── config/            # env parsing and validation
│   │   │   ├── countries/         # list, detail, indicators, weather
│   │   │   ├── favorites/         # favourite countries (anonymous)
│   │   │   ├── health/            # dependency + liveness probes
│   │   │   ├── overview/          # dashboard aggregates
│   │   │   └── providers/         # catalogue, World Bank, Open-Meteo
│   │   └── test/                  # Jest config (specs pending)
│   └── web/
│       └── src/
│           ├── components/        # UI primitives, layout, charts, domain
│           ├── lib/               # API client, i18n, theme, formatting
│           ├── pages/             # dashboard, explore, country, compare, library, 404
│           └── test/              # Vitest setup
├── packages/
│   └── shared/                    # API contracts, constants, indicator definitions
├── infrastructure/docker/         # multi-stage API/web Dockerfiles + nginx config
├── docs/                          # planned: architecture, development, API examples
├── docker-compose.yml
├── CHANGELOG.md
├── .env.example
└── pnpm-workspace.yaml
```

`apps/web/e2e/` and `docs/` do not exist yet; the corresponding scripts are part
of the Phase 4/5 roadmap.

## Requirements

- Linux (developed on Linux Mint/Ubuntu), macOS or WSL2.
- **Node.js 24.22.3** (`.nvmrc`); the `engines` field allows `>=24.0.0 <25`.
- **pnpm 12.23.0** via Corepack (`corepack enable`).
- **Docker Engine + Compose v2** *or* **Podman + podman-compose**. Either one is
  enough; the commands below show both.
- ~2 GB free disk for images, dependencies and the database volume.

With NVM:

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@12.23.0 --activate
node --version   # v24.22.3
pnpm --version   # 12.23.0
```

## Quick start

```bash
git clone <URL_DO_REPOSITORIO>
cd worldscope
cp .env.example .env

pnpm install

# Option A — Docker
docker compose up -d postgres redis

# Option B — Podman
podman compose up -d postgres redis

pnpm db:generate
pnpm db:migrate     # first run creates the tables from prisma/migrations
pnpm dev            # API on :3000, web on :5173
```

Open `http://localhost:5173` for the app and `http://localhost:3000/api/docs` for
Swagger UI. The web dev server proxies `/api` to `http://127.0.0.1:3000` (override
with `API_PROXY_TARGET`).

> `docker compose down -v` / `podman compose down -v` **deletes the volumes** and
> therefore all local favourites and saved comparisons. Use `down` without `-v`
> to keep the data.

## Using Podman instead of Docker

The compose file uses only portable features (named volumes, health checks,
`127.0.0.1` port bindings), so it works with Podman's Compose implementations.

```bash
# Ubuntu/Debian/Linux Mint
sudo apt update
sudo apt install -y podman podman-compose

# Start only the data services (development mode)
podman-compose up -d postgres redis
podman-compose ps

# Or, with the Compose provider installed (podman >= 4.7 + docker-compose/podman-compose):
podman compose up -d postgres redis
podman ps
```

Full-stack containers:

```bash
podman compose up -d --build     # or: podman-compose up -d --build
podman compose logs -f api
podman compose down              # add -v to erase volumes
```

Notes:

- Rootless Podman can bind host ports 5432/6379 and 3000/8080 (all above 1024).
  If a port is taken, change `POSTGRES_HOST_PORT` / `REDIS_HOST_PORT` in `.env`.
- Rootless containers stop when the user session ends unless lingering is enabled:
  `loginctl enable-linger "$USER"`.
- If `podman compose` reports a missing provider, install `podman-compose` and use
  that binary, or install the `docker-compose` plugin as the provider.
- The API and web containers talk to `postgres` and `redis` over the internal
  `worldscope` network; the host `.env` URLs use `127.0.0.1` for host-run dev.

## Environment configuration

Copy `.env.example` to `.env` and adjust as needed. The root `.env` is consumed by
the API, the Prisma CLI and Docker Compose; it is ignored by Git.

| Variable                     | Default                                  | Purpose                                              |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`                   | `development`                            | Enables production-only behavior (trust proxy, etc.) |
| `API_PORT`                   | `3000`                                   | NestJS listen port                                   |
| `WEB_PORT`                   | `5173`                                   | Vite dev server port                                 |
| `WEB_ORIGIN`                 | `http://localhost:5173`                  | Comma-separated allowed CORS origins                 |
| `DATABASE_URL`               | `postgresql://worldscope:worldscope_dev@127.0.0.1:5432/worldscope?schema=public` | Prisma connection string |
| `REDIS_URL`                  | `redis://127.0.0.1:6379`                 | Cache connection                                     |
| `POSTGRES_USER/PASSWORD/DB`  | `worldscope` / `worldscope_dev` / `worldscope` | Container credentials                          |
| `POSTGRES_HOST_PORT`         | `5432`                                   | Loopback host port for PostgreSQL                    |
| `REDIS_HOST_PORT`            | `6379`                                   | Loopback host port for Redis                         |
| `COUNTRY_CATALOG_BASE_URL`   | pinned mledoze/countries commit          | Country catalogue source                             |
| `FLAG_CDN_BASE_URL`          | `https://flagcdn.com`                    | Flag image CDN                                       |
| `WORLD_BANK_BASE_URL`        | `https://api.worldbank.org/v2`           | Indicators source                                    |
| `OPEN_METEO_BASE_URL`        | `https://api.open-meteo.com/v1`          | Weather source                                       |
| `HTTP_TIMEOUT_MS`            | `8000`                                   | Outbound HTTP timeout                                |
| `CACHE_TTL_CATALOG_SECONDS`  | `86400`                                  | Country catalogue cache TTL                          |
| `CACHE_TTL_INDICATORS_SECONDS` | `86400`                                | Indicator cache TTL                                  |
| `CACHE_TTL_WEATHER_SECONDS`  | `1800`                                   | Weather cache TTL                                    |
| `CACHE_ENABLED`              | `true`                                   | Set `false` to use only the in-memory fallback       |
| `RATE_LIMIT_TTL_SECONDS`     | `60`                                     | Rate-limit window                                    |
| `RATE_LIMIT_MAX_REQUESTS`    | `120`                                    | Requests per window per IP                           |
| `WEB_CONTAINER_PORT`         | `8080`                                   | Host port for the full-stack web container           |

The MVP needs **no API keys**. Never commit `.env` or real credentials.

## Running in development

```bash
pnpm dev        # builds @worldscope/shared, then runs API and web in parallel
pnpm dev:api    # API only (http://localhost:3000)
pnpm dev:web    # web only (http://localhost:5173)
```

The API requires PostgreSQL for favourites/comparisons and, by default, Redis for
caching. If Redis is unreachable the API logs a warning and falls back to an
in-memory cache, so development is still possible with only PostgreSQL running
(and `CACHE_ENABLED=false` removes the Redis connection attempt).

## Running everything in containers

```bash
# Docker
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose down

# Podman
podman compose up -d --build
podman compose logs -f api
podman compose down
```

The web container serves the built SPA through nginx on
`http://localhost:${WEB_CONTAINER_PORT:-8080}` and proxies `/api` to the API
container. The API container runs `prisma migrate deploy` before starting, so
migrations are applied automatically. All ports are bound to loopback except the
web container.

## Scripts

Root `package.json`:

| Command              | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `pnpm dev`           | Build shared, then run API and web in parallel                      |
| `pnpm dev:api`       | Build shared, then start the NestJS API in watch mode               |
| `pnpm dev:web`       | Build shared, then start Vite                                       |
| `pnpm build`         | Build shared, API and web for production                            |
| `pnpm start`         | Run the built API                                                   |
| `pnpm lint`          | ESLint over the repository                                          |
| `pnpm lint:fix`      | ESLint with autofix                                                 |
| `pnpm format`        | Prettier write                                                      |
| `pnpm format:check`  | Prettier check                                                      |
| `pnpm typecheck`     | Typecheck every workspace                                           |
| `pnpm test`          | Run each workspace's tests (suites are still being written)         |
| `pnpm test:e2e`      | Playwright E2E (specs/config pending)                               |
| `pnpm db:generate`   | Generate the Prisma client                                          |
| `pnpm db:migrate`    | `prisma migrate dev` using the root `.env`                          |
| `pnpm db:deploy`     | `prisma migrate deploy` (non-interactive, used by containers)       |
| `pnpm db:studio`     | Open Prisma Studio                                                  |
| `pnpm docker:up`     | `docker compose up -d`                                              |
| `pnpm docker:down`   | `docker compose down`                                               |
| `pnpm docker:logs`   | `docker compose logs -f`                                            |

Workspace scripts: `pnpm --filter @worldscope/api <script>` and
`pnpm --filter @worldscope/web <script>`. Note that `pnpm --filter @worldscope/web lint`
currently expects an `e2e/` directory that has not been created yet; use the root
`pnpm lint` until the E2E suite lands.

### Migrations and Prisma Studio

```bash
pnpm db:generate   # after changing prisma/schema.prisma
pnpm db:migrate    # create + apply a migration in development (prompts for a name)
pnpm db:deploy     # apply committed migrations (CI/production)
pnpm db:studio     # browse the two tables
```

Only anonymous favourites and saved comparisons are stored; country data is never
duplicated in PostgreSQL.

## API

Base URL: `http://localhost:3000/api/v1` · Swagger UI: `http://localhost:3000/api/docs`

All responses follow a small envelope with `data` (or `error`) plus `sources` and
`cached` where applicable. Errors include `statusCode`, `error`, `message`, `path`
and `timestamp`, and never expose stack traces in production.

| Method   | Endpoint                          | Description                                             |
| -------- | --------------------------------- | ------------------------------------------------------- |
| `GET`    | `/health`                         | Database/cache status; `200` with `degraded` if down     |
| `GET`    | `/health/live`                    | Liveness probe, no dependencies                         |
| `GET`    | `/overview`                       | Dashboard totals, region aggregates and highlights      |
| `GET`    | `/countries`                      | Paginated list: `page`, `limit`, `search`, `region`, `subregion`, `sortBy`, `order` |
| `GET`    | `/countries/:code`                | Country detail with sources                             |
| `GET`    | `/countries/:code/indicators`     | World Bank series, `years` 5–30 (default 12)            |
| `GET`    | `/countries/:code/weather`        | Current weather + 7-day forecast for the capital        |
| `GET`    | `/compare?codes=BRA,USA`          | 2–4 countries, unit-safe metrics                        |
| `GET`    | `/favorites`                      | List favourites (requires `x-client-id`)                |
| `POST`   | `/favorites`                      | `{ "countryCode": "BRA" }` (idempotent)                 |
| `DELETE` | `/favorites/:countryCode`         | Remove a favourite (`204`)                              |
| `GET`    | `/comparisons`                    | List saved comparisons (requires `x-client-id`)         |
| `POST`   | `/comparisons`                    | `{ "countryCodes": ["BRA","USA"], "name": "Optional" }` |
| `DELETE` | `/comparisons/:id`                | Delete a saved comparison (`204`)                       |

Favourites and comparisons are scoped by the `x-client-id` header: 8–64 characters
matching `^[A-Za-z0-9_-]{8,64}$`. The web client generates a UUID once and stores it
in `localStorage`. **This is not authentication** — anyone who copies the value can
read those records.

### Examples

```bash
curl -s http://localhost:3000/api/v1/health | jq
curl -s 'http://localhost:3000/api/v1/overview' | jq '.data.totals'

curl -s 'http://localhost:3000/api/v1/countries?region=Americas&sortBy=population&order=desc&limit=5' | jq
curl -s http://localhost:3000/api/v1/countries/BRA | jq '.data | {name, capital, population, populationYear}'
curl -s 'http://localhost:3000/api/v1/countries/BRA/indicators?years=10' | jq '.data.series[] | {id, unit, points: (.points | length)}'
curl -s http://localhost:3000/api/v1/countries/BRA/weather | jq '.data.current'
curl -s 'http://localhost:3000/api/v1/compare?codes=BRA,USA,DEU' | jq '.data.countries[] | {name, population}'

# Anonymous favourites and comparisons
CLIENT_ID="demo-client-0001"
curl -s -X POST http://localhost:3000/api/v1/favorites \
  -H "content-type: application/json" -H "x-client-id: $CLIENT_ID" \
  -d '{"countryCode":"BRA"}' | jq
curl -s http://localhost:3000/api/v1/favorites -H "x-client-id: $CLIENT_ID" | jq
curl -s -X DELETE http://localhost:3000/api/v1/favorites/BRA -H "x-client-id: $CLIENT_ID" -i

curl -s -X POST http://localhost:3000/api/v1/comparisons \
  -H "content-type: application/json" -H "x-client-id: $CLIENT_ID" \
  -d '{"countryCodes":["BRA","USA"],"name":"South vs North"}' | jq
```

## External data sources

| Source | Used for | Notes |
| ------ | -------- | ----- |
| [mledoze/countries](https://github.com/mledoze/countries) | Country catalogue (names, codes, capital, languages, currencies, borders, coordinates) | Pinned commit; ODbL 1.0 |
| [flagcdn.com](https://flagcdn.com/) | Flag PNG/SVG URLs | No key required |
| [World Bank Open Data API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589) | Population, GDP, GDP per capita, unemployment, inflation | World Bank terms of use |
| [Open-Meteo](https://open-meteo.com/en/docs) | Current weather and 7-day forecast for capitals | CC BY 4.0; no key for non-commercial use |

## Caching and resilience

- Redis caches successful catalogue (24h), indicator (24h) and weather (30min)
  responses; TTLs are configurable.
- If Redis is unavailable, the API falls back to an in-process cache and reports
  the cache as degraded in `/health` instead of failing requests.
- Every outbound request has an 8s timeout (configurable) and a shared HTTP client.
- Provider errors become HTTP 502 with a safe message; other providers still
  serve their data.
- Empty or missing data is explicit (`null` values and `unavailableReason`) rather
  than invented.
- Rate limiting defaults to 120 requests per 60 seconds per IP.

## Quality and verification

The following commands were run against the current tree and pass:

```bash
pnpm --filter @worldscope/shared build
pnpm typecheck
pnpm lint          # 0 errors; 4 fast-refresh warnings in provider/hook modules
pnpm --filter @worldscope/web build
```

Automated test suites are **not implemented yet**: the API uses Jest with
`--passWithNoTests`, the web app has a Vitest setup but no specs, and Playwright
has neither config nor specs. CI workflows are also pending. Do not treat the
commands above as evidence that runtime behavior is tested end to end.

## Architectural decisions

- **One API, no direct provider calls from the browser.** Keys, timeouts, caching,
  CORS and rate limits stay server-side, and the UI consumes typed shared contracts.
- **Shared contracts package.** `@worldscope/shared` holds response types,
  indicator definitions, units and limits, so API and web cannot drift silently.
- **PostgreSQL stores only user-created anonymous data.** Public country data is
  fetched and cached, not copied into the database.
- **Cache is an optimisation, not a dependency.** The in-memory fallback keeps the
  app usable when Redis is down.
- **Unit-safe comparison.** Metrics are grouped by a single unit and year, and the
  UI labels the reference year instead of mixing incompatible periods.
- **No global state library.** TanStack Query plus URL search params cover server
  state and shareable filters; Zustand would add complexity without a use case.
- **Pinned provider commit.** The country catalogue is fetched from a fixed commit
  so builds and demos are reproducible.

## Security and limitations

- `x-client-id` is an anonymous correlation ID, **not** authentication; favourites
  and comparisons are not private.
- `.env` is ignored by Git; the API never returns secrets and hides stack traces in
  production.
- PostgreSQL and Redis are published on `127.0.0.1` only; Compose uses an internal
  network.
- Inputs are validated with DTOs (whitelist, no unknown properties) and Prisma uses
  parameterised queries.
- The production bundle is currently a single ~1.57 MB chunk (~510 kB gzip) because
  ECharts is imported in full; modular imports or route-level code splitting are the
  next optimisation.
- No authentication, payments, maps, social features or user accounts, by design.
- Provider availability and terms can change; data is shown with its source and
  retrieval time so staleness is visible.
- Screenshots, `docs/` and CI are still pending.

## Roadmap

- **Phase 4 — persistence and quality:** Jest specs for providers/services with
  mocked HTTP, Vitest/Testing Library specs for key components, Playwright E2E for
  the main flows, accessibility pass, bundle splitting.
- **Phase 5 — portfolio:** `docs/architecture.md`, `docs/development.md`,
  `docs/api-examples.md`, real screenshots, GitHub Actions (install, lint,
  typecheck, test, build), final security review and README verification.
- **Later:** optional real accounts, saved-view sharing, more indicators, map view.

## Contributing

1. Fork and create a branch from `main`.
2. Run `pnpm install`, start PostgreSQL/Redis (Docker or Podman) and `pnpm dev`.
3. Keep TypeScript strict and reuse `packages/shared` contracts.
4. Before opening a PR run `pnpm typecheck`, `pnpm lint` and `pnpm build`; add tests
   for new behavior as the suites land.
5. Keep commits small and descriptive. Never commit `.env` files, secrets or
   generated artefacts.

Issues and suggestions are welcome; please include reproduction steps and the
versions reported by `node --version` and `pnpm --version`.

## License and credits

Released under the [MIT License](LICENSE).

Data credits: country catalogue from [mledoze/countries](https://github.com/mledoze/countries)
(ODbL 1.0), flags from [flagcdn.com](https://flagcdn.com/), indicators from the
[World Bank Open Data API](https://data.worldbank.org/) and weather from
[Open-Meteo](https://open-meteo.com/) (CC BY 4.0). This project is not affiliated
with those providers.
