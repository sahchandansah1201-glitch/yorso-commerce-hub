# YORSO DB Package

Status: self-hosted PostgreSQL baseline
Batch: #20

`packages/db` contains SQL owned by the future self-hosted YORSO backend.
Supabase migrations may still exist as prototype references, but this package is
the production-direction database source for YORSO-owned server deployment.

## Current Scope

Migration `0001_account_company_baseline.sql` defines:

- `yorso_users`;
- `yorso_companies`;
- `yorso_company_media`;
- account/company enum types;
- indexes needed by account workspace and supplier profile work.

## Validation

```bash
npm run check:self-hosted-db
npm run test:db-contract
```

These checks are static and do not require Docker. Runtime migration execution
will be added when the PostgreSQL migration runner is introduced.
