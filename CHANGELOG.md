# Changelog

All notable changes to WorldScope are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `CHANGELOG.md` to track every implementation phase from now on.
- Web client bootstrap: React 19 entry point, router, TanStack Query provider,
  theme provider, i18n provider and Sonner toasts.
- Typed API client for every `/api/v1` endpoint, including the anonymous
  `x-client-id` header used by favourites and saved comparisons.
- Theme support (light/dark, persisted, applied before first paint) and
  responsive app shell with skip link, desktop and mobile navigation.
- Shared UI primitives (button, card, input, select, badge, skeleton) styled with
  Tailwind 4 tokens.
- Common components: page header, loading/error/empty states, pagination,
  country card, stat card and data-source list with retrieval timestamps.
- ECharts wrappers (bar and line) that follow the active theme and expose a
  text summary for screen readers.
- Dashboard page backed by the new `/overview` endpoint: global totals, regional
  distribution charts and most populous countries.
- Explore page with debounced search, region/subregion filters, sorting,
  pagination and filter facets, all reflected in the URL.
- Country detail page with profile facts, favourites, border navigation,
  World Bank indicator chart and Open-Meteo current weather/forecast.
- Compare page for two to four countries with code-based selection, unit-safe
  metric table, chart and save-to-library action.
- Library page listing anonymous favourites and saved comparisons with delete
  and re-open actions.
- 404 page, favicon, Vitest setup file and chart accessibility summaries.
- `README.md` in English covering features, stack, architecture, setup, scripts,
  endpoints, caching, security, limitations and roadmap — including Docker and
  Podman workflows (`podman compose` / `podman-compose`).

### Changed

- Web build and typecheck verified (`tsc --noEmit` and `vite build`). Lint passes
  with only fast-refresh warnings on provider/hook modules.

### Known limitations

- The production bundle is a single ~1.57 MB chunk (~510 kB gzip) because
  ECharts is imported in full; modular imports or route-level code splitting is
  the next optimisation.
- No frontend unit/E2E tests yet, and Docker was unavailable in the session
  environment, so the API/web integration was not smoke-tested at runtime.
- `docs/` and the portfolio README sections for Phase 5 are still pending.

## [1.0.0] - 2026-11-23

Initial repository history, built in phases.

### Phase 1 — Foundation (commit 1bb51b4)

- pnpm workspace monorepo with strict TypeScript, ESLint, Prettier and shared
  tsconfig.
- `@worldscope/shared` package with API contracts, indicator definitions and
  shared limits.
- Docker Compose stack with PostgreSQL and Redis, pinned images, health checks
  and host ports bound to `127.0.0.1`.
- Environment template (`.env.example`), `.gitignore`, MIT license and README.
- NestJS API and React web workspaces with base scripts.

### Phase 2 — Backend and infrastructure (commit ea0fb9e)

- Prisma schema and initial migration for `FavoriteCountry` and
  `SavedComparison`.
- Container stack, database schema and Docker documentation.

### Phase 2 — Aggregated API (commit 8204122)

- REST Countries (pinned `mledoze/countries` dataset), World Bank and Open-Meteo
  providers behind a shared HTTP client with timeouts and `ProviderError`.
- Redis-backed cache with 24 h TTLs for the catalogue and indicators and 30 min
  for weather; cache failures degrade to live fetches.
- Endpoints under `/api/v1`: health (plus liveness), countries list/detail,
  indicators, weather, comparison, favourites and saved comparisons.
- Search, filtering, sorting, pagination, DTO validation, rate limiting, CORS
  allowlist, Helmet and a global exception filter with a stable error body.
- Anonymous client-scoped favourites and comparisons via the `x-client-id`
  header (explicitly not authentication).
- Swagger UI at `/api/docs`.

### Phase 3 — Web client (uncommitted)

- Vite + React 19 + Tailwind CSS 4 scaffold with light/dark design tokens.
- Shared formatting helpers (numbers, areas, dates, indicator units) and an
  English translation dictionary prepared for future locales.
- API module `overview` (aggregate totals, region distribution and highlights)
  to back the dashboard.
- Full dashboard, explore, country detail, compare, library and 404 pages.

