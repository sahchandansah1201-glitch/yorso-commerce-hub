# Twenty CRM local runtime

Twenty is the self-hosted CRM used by YORSO. The stack binds the web UI to
`127.0.0.1:3020` and reuses Docker named volumes owned by the Compose project
`yorso-twenty`.

## Start or reconcile

```bash
docker network inspect yorso-local >/dev/null 2>&1 || docker network create yorso-local
docker compose \
  --env-file infra/twenty/.env \
  -f infra/twenty/docker-compose.yml \
  -f infra/twenty/docker-compose.local.yml \
  up -d
```

Do not run `docker compose down --volumes`: the named volumes contain the CRM
database, Redis state, and local file storage.

## Verify

```bash
docker compose \
  --env-file infra/twenty/.env \
  -f infra/twenty/docker-compose.yml \
  -f infra/twenty/docker-compose.local.yml \
  ps
curl --fail http://127.0.0.1:3020/healthz
```

Copy `.env.example` to the ignored `.env` file for a new workstation. Never
commit the real password or encryption key.
