# YORSO Self-Hosted Infra Skeleton

This directory is the starting point for running YORSO without Supabase as a production dependency.

Current scope:

- YORSO API as the first self-hosted backend process.
- PostgreSQL for transactional data.
- PgBouncer for connection pooling.
- Redis for cache, sessions, rate limits and short-lived workflow state.
- MinIO as local S3-compatible object storage.
- `yorso-api-uploads` as the current local file-storage volume for API-managed
  uploads until the S3 driver is added.

Start locally after copying `.env.example` to `.env.local` and choosing local-only secrets:

```bash
docker compose --env-file ../.env.local -f infra/docker-compose.yml up -d
```

For owned-server production setup, use `.env.production.example` as the server
template and follow `docs/backend/self-hosted-production-deploy.md`.

This is not a hosted BaaS deployment. `infra/docker-compose.yml` must not
require Supabase, Firebase, Appwrite, Clerk, Auth0 or similar hosted
application-backend environment variables.

Validate the static self-hosted baseline without starting Docker:

```bash
npm run check:self-hosted-infra
npm run check:self-hosted-production-runtime
npm run check:self-hosted-api
npm run check:self-hosted-db
```

The full validation flow is documented in
`docs/backend/self-hosted-validation.md`.
