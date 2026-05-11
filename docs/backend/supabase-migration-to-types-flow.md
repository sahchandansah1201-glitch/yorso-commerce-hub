# Supabase Migration To Types Flow

Status: backend-readiness procedure
Project id: `eaasthucczsduwrznrng`

## Why This Exists

YORSO now has backend access migrations in the repository, but Lovable Cloud can
still regenerate `src/integrations/supabase/types.ts` from the live Supabase
schema.

If the live Supabase schema has not received the access migrations yet, generated
types will not contain:

- `access_events`
- `access_grants`
- `supplier_access_requests`
- `access_events_admin`
- `log_supplier_access_event`
- `access_event_type`
- `access_grant_scope`
- `access_request_status`

This is expected until the live backend is migrated. It is not a frontend bug.

## Commands

Live migration preflight:

```bash
npm run supabase:access-preflight
```

This command does not change the database. It checks:

- Supabase CLI availability;
- local access migration files;
- whether the repo is linked to project `eaasthucczsduwrznrng`;
- whether the current Supabase login can see that project;
- whether strict generated type check already passes.

Preview/build check:

```bash
npm run check:supabase-types
```

This command is intentionally non-strict. It exits `0` and prints a drift
warning when `src/integrations/supabase/types.ts` is missing access markers.
Lovable may regenerate this file from its own linked Supabase schema, so the
runtime adapter must not depend on generated access table typings.

Strict backend-readiness check:

```bash
npm run check:supabase-types:strict
```

This command exits `1` until migrations are applied and types are regenerated
from a schema containing the access tables/RPCs. It is the backend-readiness
gate, not the Lovable preview/build gate.

Regenerate generated types:

```bash
npm run supabase:types:regen
```

This runs:

```bash
npx supabase gen types typescript --project-id eaasthucczsduwrznrng --schema public
```

and writes the output to:

```text
src/integrations/supabase/types.ts
```

The command then runs `npm run check:supabase-types:strict`.

Safety behavior:

- if generated output is still missing access markers, the command fails before
  writing `types.ts`;
- this prevents accidentally replacing a correct local file with pre-access
  generated types.

## Required Sequence

1. Run preflight:

```bash
npm run supabase:access-preflight
```

2. If preflight passes, inspect pending remote migrations:

```bash
npx supabase db push --dry-run
```

3. Apply pending migrations to the live Supabase project only after explicit
   approval.
4. Regenerate Supabase types from the migrated project:

```bash
npm run supabase:types:regen
```

5. Verify strict check:

```bash
npm run check:supabase-types:strict
```

6. Verify frontend build:

```bash
npm run build
```

7. Commit regenerated `src/integrations/supabase/types.ts`.

## Do Not Do This

Do not manually restore access sections in `types.ts` after Lovable regenerates
the file from a pre-access backend. That creates a temporary local illusion but
does not fix the live schema.

Do not make `prebuild` depend on the strict check while Lovable can regenerate
`types.ts` from a different Supabase schema. That recreates the sync loop where
Lovable removes access markers and the app cannot build.

Do not treat missing access types as a Lovable UI problem. It is a backend schema
deployment state.

## Current Meaning Of Drift

If the default check prints a drift warning, the repository contains backend
access migrations but the generated types are stale or were regenerated from a
schema without the access contract. The frontend still builds because the
Supplier Access adapter owns a local access contract for these backend tables.

If strict check passes, the live backend schema and generated frontend contract
are aligned for the current access foundation.
