# Self-Hosted Workspace PostgreSQL Smoke

Status: optional live runtime smoke  
Batch: #32  
Date: 2026-05-14

This smoke verifies that the account workspace sections work through the self-hosted API with the real PostgreSQL repository.

It is intentionally not part of `ci:core`, because it needs a live PostgreSQL connection. Without `MIGRATION_DATABASE_URL`, the command exits successfully with a skipped status.

## Command

```bash
npm run smoke:self-hosted-workspace-postgres
```

Runtime-only command after `npm run api:build`:

```bash
npm run smoke:self-hosted-workspace-postgres:run
```

## Safe Skip

If no live database URL is configured:

```text
self_hosted_workspace_postgres_smoke=skipped
reason=MIGRATION_DATABASE_URL is not set
```

Exit code is `0`. This keeps GitHub CI and Lovable preview portable.

## Live Mode

Set a staging or local PostgreSQL URL:

```bash
MIGRATION_DATABASE_URL="postgres://user:password@127.0.0.1:5432/yorso" \
MIGRATION_APPLIED_BY="local-operator" \
npm run smoke:self-hosted-workspace-postgres
```

The script:

1. Applies live migrations with `db:migrations:apply:live`.
2. Upserts two deterministic smoke users and companies.
3. Clears prior workspace rows for those smoke accounts.
4. Starts the compiled API with `ACCOUNT_REPOSITORY=postgres`.
5. Uses HTTP requests with explicit `x-yorso-user-id` and `x-yorso-session-id`.
6. Replaces and reads branches, products, meta-regions, and notifications.
7. Confirms validation rejects enabled notification channels with zero events.
8. Confirms PostgreSQL row counts match API writes.
9. Confirms another user cannot read the primary user's workspace rows.
10. Confirms empty replacement deletes branch rows.

Expected success output:

```text
live_migrations_apply=ok
workspace_seed=ok
health_live=ok
branches_replace=ok
branches_read=ok
products_replace=ok
meta_regions_replace=ok
notifications_replace=ok
notifications_validation_guard=ok
workspace_db_counts=ok
workspace_owner_isolation=ok
branches_empty_replace=ok
self_hosted_workspace_postgres_smoke=ok
```

## Scope

Covered endpoints:

- `PATCH /v1/account/branches`
- `GET /v1/account/branches`
- `PATCH /v1/account/products`
- `GET /v1/account/products`
- `PATCH /v1/account/meta-regions`
- `GET /v1/account/meta-regions`
- `PATCH /v1/account/notifications`
- `GET /v1/account/notifications`

Covered tables:

- `yorso_company_branches`
- `yorso_company_products`
- `yorso_company_meta_regions`
- `yorso_notification_preferences`

## Production Rule

Run this against local or staging PostgreSQL by default. Do not run against production until a separate production smoke policy defines:

- allowed smoke users
- cleanup rules
- audit trail
- run approval
- operator responsibility

This test supports the self-hosted backend path. Supabase remains prototype-only and is not required by this smoke.
