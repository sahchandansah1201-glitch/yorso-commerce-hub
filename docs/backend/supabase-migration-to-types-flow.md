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

Strict generated type check:

```bash
npm run check:supabase-types
```

This command is now strict because the live Supabase access migrations have been
applied. It is used by `prebuild`, so Lovable and local builds fail if
`src/integrations/supabase/types.ts` is regenerated from a stale pre-access
schema.

Diagnostic non-strict check:

```bash
npm run check:supabase-types:preview
```

This command exits `0` and prints a drift warning. Use it only to inspect drift
without blocking a diagnostic shell session.

Strict backend-readiness check:

```bash
npm run check:supabase-types:strict
```

This command exits `1` until migrations are applied and types are regenerated.
It is the gate to use before backend access work is considered complete.

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

Do not replace `check:supabase-types` with the preview check. Backend access
migrations are live now, so generated type drift must block builds.

Do not treat missing access types as a Lovable UI problem. It is a backend schema
deployment state.

## Current Meaning Of Drift

If the preview check prints a drift warning, the repository contains backend
access migrations but the generated types are stale or were regenerated from a
pre-access schema. Run `npm run supabase:types:regen` and commit the result.

If strict check passes, the live backend schema and generated frontend contract
are aligned for the current access foundation.
