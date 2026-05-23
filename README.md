# YORSO Commerce Hub

Frontend/backend prototype for the YORSO B2B seafood marketplace.

This repository contains the buyer-facing marketplace UI, supplier discovery,
offer catalog, account workspace, self-hosted API prototype, database
migrations, admin/operator tools, smoke tests, and project-memory handoff files.

## Current Product Surfaces

- Public marketplace: `/`, `/offers`, `/offers/:id`, `/suppliers`, `/suppliers/:supplierId`.
- Education and acquisition: `/how-it-works`, `/for-suppliers`, `/blog`, legal/support pages.
- Account workspace: `/account/personal`, `/account/company`, `/account/branches`, `/account/products`, `/account/meta-regions`, `/account/notifications`.
- Admin/operator workspace: `/admin`, access review/grants, runtime, audit, incidents, execution, workload, trends, trend actions.
- Backend prototype: `apps/api`, `packages/contracts`, `packages/db`, `infra`, `supabase` boundary/reference files.

## Source Of Truth

Use repository files and `docs/project-memory/` as the recovery source. Do not
treat old chat history as authoritative unless it is confirmed by files or an
explicit handoff.

Read first:

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/HANDOFF.md`
5. `docs/project-memory/NEXT_ACTIONS.md`

## Development

```bash
npm install
npm run dev
```

Local Vite URL:

```text
http://127.0.0.1:8080/
```

## Core Checks

```bash
npm run lint
npx tsc -b --noEmit
npm run build
npm run check:production-scale-baseline
```

`npm run ci:core` runs the broader local gate for self-hosted backend,
database, contracts, frontend, and smoke coverage.

## Production-Scale Rule

Production-facing frontend, backend, persistence, queues, integrations, and
runtime decisions must be designed for at least 10,000 concurrent users. The
release gate and review fields are documented in
`docs/backend/production-scale-baseline.md`.
