# Artifacts

## Project Memory

- `AGENTS.md`: project-level agent rules.
- `docs/project-memory/README.md`: protocol for preventing chat context loss.
- `docs/project-memory/CONTEXT_HEALTH.md`: context-risk checkpoint.
- `docs/project-memory/PROJECT_STATE.yaml`: structured current state.
- `docs/project-memory/HANDOFF.md`: handoff for a new chat.
- `docs/project-memory/NEXT_ACTIONS.md`: next safe actions.
- `docs/project-memory/WORKLOG.md`: factual work log.
- `docs/project-memory/RISKS.md`: active risks and mitigations.
- `docs/project-memory/PROMPTS/new-chat-recovery-prompt.md`: prompt for recovery in a new chat.
- `docs/project-memory/templates/`: reusable templates.

## Core Project Files

- `README.md`: project readme.
- `package.json`: scripts and dependencies.
- `src/`: frontend source.
- `apps/`: application/runtime area if present.
- `packages/`: shared packages.
- `infra/`: infrastructure area.
- `supabase/`: Supabase boundary/migration area.
- `e2e/`: end-to-end tests.

## Batch #96 Supplier Access Review Console

- `packages/contracts/src/supplier-access.ts`: review queue DTOs and query/status schemas.
- `apps/api/src/modules/access/routes.ts`: admin review list and decision endpoints.
- `apps/api/src/modules/access/service.ts`: admin review orchestration.
- `apps/api/src/modules/access/repository.ts`: memory repository review queue implementation.
- `apps/api/src/modules/access/postgres-repository.ts`: PostgreSQL review queue implementation.
- `packages/db/migrations/0017_supplier_access_review_queue.sql`: queue indexes for review reads.
- `src/lib/admin-access-review-api.ts`: frontend self-hosted admin review API client.
- `src/lib/use-admin-access-review.ts`: frontend admin review hook.
- `src/pages/admin/AdminAccessRequests.tsx`: admin/operator review console page.
- `e2e/admin-access-review.spec.ts`: browser smoke for admin review queue and forbidden role state.
- `scripts/smoke-self-hosted-admin-access-review.mjs`: self-hosted runtime smoke.
- `docs/backend/self-hosted-admin-access-review-smoke.md`: smoke documentation.

## Batch #97 Admin Access Grants Console

- `packages/contracts/src/supplier-access.ts`: admin grant list/revoke DTOs and query/status schemas.
- `apps/api/src/modules/access/routes.ts`: admin access grant list and revoke endpoints.
- `apps/api/src/modules/access/service.ts`: admin grant list/revoke orchestration.
- `apps/api/src/modules/access/repository.ts`: memory repository admin grant implementation.
- `apps/api/src/modules/access/postgres-repository.ts`: PostgreSQL admin grant implementation.
- `packages/db/migrations/0018_admin_access_grants_console.sql`: grant-console indexes for active/expired admin reads.
- `src/lib/admin-access-grants-api.ts`: frontend self-hosted admin grants API client.
- `src/lib/use-admin-access-grants.ts`: frontend admin grants hook.
- `src/pages/admin/AdminAccessGrants.tsx`: admin/operator grants console page.
- `e2e/admin-access-grants.spec.ts`: browser smoke for grant list/revoke and forbidden role state.
- `scripts/smoke-self-hosted-admin-access-grants.mjs`: self-hosted runtime smoke.
- `docs/backend/self-hosted-admin-access-grants-smoke.md`: smoke documentation.
