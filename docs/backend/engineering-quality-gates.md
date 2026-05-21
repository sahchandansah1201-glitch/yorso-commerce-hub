# Engineering Quality Gates

YORSO is moving toward a self-hosted production product. The release process
must therefore catch process regressions, not only runtime regressions.

## Batch #98 Guardrails

Batch #98 adds a repository-level engineering lessons gate.

The gate protects three concrete issues found while developing Batch #96 and
Batch #97:

1. API-backed e2e specs that require `VITE_YORSO_API_URL` must not be included
   in generic `smoke:e2e:run`.
2. Build-based e2e commands must not run in parallel when they write to the
   shared Vite `dist/` directory.
3. Memory repository smoke tests must assert stable contract fields, not
   production display names that the memory repository does not own.

## Commands

```bash
npm run check:engineering-lessons
npm run test:engineering-lessons
```

Both commands are part of `ci:core`.

## Production Relevance

These checks do not add runtime traffic, but they protect the release pipeline
for production-facing admin and access-control flows. A false green can ship a
broken self-hosted API bridge. A false red can block development and hide the
actual failure source.
