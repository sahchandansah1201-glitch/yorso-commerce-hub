# YORSO Self-Hosted Infra Skeleton

This directory is the starting point for running YORSO without Supabase as a production dependency.

Current scope:

- PostgreSQL for transactional data.
- PgBouncer for connection pooling.
- Redis for cache, sessions, rate limits and short-lived workflow state.
- MinIO as local S3-compatible object storage.

Start locally after copying `.env.example` to `.env.local` and choosing local-only secrets:

```bash
docker compose --env-file ../.env.local -f infra/docker-compose.yml up -d
```

This is not a full production deployment yet. It is the baseline for future API, migration and storage work.
