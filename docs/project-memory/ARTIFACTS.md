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

## Batch #98 Engineering Lessons Guards

- `docs/project-memory/ENGINEERING_LESSONS.md`: durable record of Batch #96/#97 mistakes, root causes, fixes and guards.
- `docs/backend/engineering-quality-gates.md`: engineering quality gate documentation.
- `scripts/lib/e2e-script-policy.mjs`: reusable package-script policy for API-backed e2e isolation and build-race prevention.
- `scripts/check-engineering-lessons.mjs`: release guard for engineering lessons, project-memory markers, package scripts and stable smoke assertions.
- `src/test/engineering-lessons-guard.test.ts`: Vitest coverage for the e2e policy and memory-repository smoke assertion rule.
- `AGENTS.md`: Failure Learning Contract added to the Engineer Agent Action Contract.
- `docs/backend/production-scale-baseline.md`: Batch #98 production-scale release gate note.

## Batch #99 Admin Operator Hub

- `packages/contracts/src/admin-operations.ts`: admin operations overview DTOs and production-capacity shape.
- `apps/api/src/modules/admin-operations/service.ts`: self-hosted admin overview aggregation across runtime, access-review queue and active grants.
- `apps/api/src/modules/admin-operations/routes.ts`: admin-protected `GET /v1/admin/operations/overview`.
- `src/lib/admin-operations-api.ts`: frontend self-hosted admin operations API client.
- `src/lib/use-admin-operations-overview.ts`: frontend hook for disabled/session/forbidden/ready states.
- `src/pages/admin/AdminOperations.tsx`: admin operations hub page at `/admin`.
- `src/components/admin/AdminOperatorNav.tsx`: shared admin navigation for operations, runtime, requests and grants.
- `e2e/admin-operations.spec.ts`: browser smoke for the admin operations hub and admin role guard.
- `scripts/smoke-self-hosted-admin-operations.mjs`: self-hosted runtime smoke for auth, role, overview, access summaries and secret guards.
- `docs/backend/self-hosted-admin-operations-smoke.md`: runtime smoke documentation.

## Batch #100 Admin Command Center

- `packages/contracts/src/admin-operations.ts`: expanded admin operations DTOs for audit summary, readiness and operator actions.
- `apps/api/src/modules/admin-operations/service.ts`: command-center aggregation across runtime, access queue, grants and bounded audit sample.
- `src/pages/admin/AdminOperations.tsx`: admin command-center UI with audit card, readiness checklist, operator actions and recent audit feed.
- `src/pages/admin/AdminAuditEvents.tsx`: read-only admin audit events page at `/admin/audit`.
- `src/lib/admin-audit-api.ts`: self-hosted admin audit frontend API client.
- `src/lib/use-admin-audit-events.ts`: admin audit page hook with disabled/session/forbidden/loading/error/ready states.
- `e2e/admin-audit-events.spec.ts`: API-backed browser smoke for `/admin/audit`.
- `docs/backend/self-hosted-admin-audit-events-page.md`: admin audit page runbook and scale notes.
- `docs/backend/production-scale-baseline.md`: Batch #100 10,000 concurrent users capacity review.

## Batch #101 Admin Incident Response

- `packages/contracts/src/admin-incidents.ts`: incident DTOs, query schema and acknowledge response schema.
- `apps/api/src/modules/admin-incidents/`: backend incident repository, PostgreSQL adapter, service and admin-only routes.
- `packages/db/migrations/0019_admin_incident_acknowledgements.sql`: durable acknowledgement/resolution state for derived incidents.
- `src/lib/admin-incidents-api.ts`: frontend self-hosted admin incidents API client.
- `src/lib/use-admin-incidents.ts`: frontend hook for disabled/session/forbidden/loading/error/ready states and acknowledge actions.
- `src/pages/admin/AdminIncidents.tsx`: admin incident response console at `/admin/incidents`.
- `e2e/admin-incidents.spec.ts`: API-backed browser smoke for incident list and acknowledge flow.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: self-hosted runtime smoke for auth guard, role guard, incident list/detail/acknowledge/resolve and secret guards.
- `docs/backend/self-hosted-admin-incidents-smoke.md`: incident response smoke documentation and 10,000 concurrent users notes.

## Batch #102 Admin Incident Workflow

- `packages/contracts/src/admin-incidents.ts`: workflow action, timeline, SLA and escalation DTOs.
- `packages/contracts/src/admin-incidents.ts`: runbook and workload-summary DTOs for assignment coverage, SLA risk, escalation load and source mix.
- `apps/api/src/modules/admin-incidents/`: workflow service/repository/routes for assign, comment, escalate, resolve, bulk workflow and sanitized export actions.
- `packages/db/migrations/0020_admin_incident_workflow.sql`: durable assignment/escalation fields and indexed `yorso_admin_incident_events` timeline table.
- `src/lib/admin-incidents-api.ts`: frontend self-hosted workflow API client.
- `src/lib/use-admin-incidents.ts`: frontend hook workflow action bridge.
- `src/pages/admin/AdminIncidents.tsx`: incident workflow controls, bulk workflow panel, export buttons, workflow filters, runbook steps, SLA/due state, workload summary and timeline preview.
- `e2e/admin-incidents.spec.ts`: API-backed browser smoke for assignment/escalation workflow, bulk workflow, export and workload summary rendering.
- `scripts/smoke-self-hosted-admin-incidents.mjs`: runtime smoke markers for assign, escalate, comment, bulk workflow, export, workload summary, workflow filters and workflow validation.
- `docs/backend/production-scale-baseline.md`: Batch #102 10,000 concurrent users capacity review.
