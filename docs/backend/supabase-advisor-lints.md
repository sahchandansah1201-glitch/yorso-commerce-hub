# Supabase Advisor Lints

Source exports:

- `Supabase Performance Security Lints (eaasthucczsduwrznrng)-1.csv`
- `Supabase Performance Security Lints (eaasthucczsduwrznrng).csv`

## Current Findings

### Fixed By Migration

Migration:

`supabase/migrations/20260512183000_security_invoker_views_and_access_event_rpc.sql`

Fixes these Advisor findings:

- `security_definer_view`: `public.offers_public`
- `security_definer_view`: `public.suppliers_public`
- `security_definer_view`: `public.access_events_admin`
- `authenticated_security_definer_function_executable`: `public.log_supplier_access_event(...)`

Important implementation notes:

- `offers_public` and `suppliers_public` are changed to `security_invoker = on`.
- Public view privileges are reset to `SELECT` only.
- Base tables receive only column-level `SELECT` grants for the columns used by public views.
- Exact price columns, supplier identity columns, owner fields and contact fields are not granted to public roles.
- `access_events_admin` is changed to `security_invoker = on` and removed from authenticated PostgREST exposure until the admin backend is designed.
- `log_supplier_access_event(...)` is changed to `SECURITY INVOKER` and restricted to buyer-created `supplier_access_requested` events.

## Accepted Temporarily

These two warnings remain intentionally unresolved for now:

- `authenticated_security_definer_function_executable`: `public.get_qualified_offer(p_offer_id uuid)`
- `authenticated_security_definer_function_executable`: `public.get_qualified_offers()`

Reason:

These RPC functions are the current backend boundary for exact price and supplier identity access. They are `SECURITY DEFINER` because they must read protected offer and supplier fields only after internal checks:

- admin role
- supplier owner
- buyer with approved price access

Do not remove `EXECUTE` from `authenticated` without replacing the frontend qualified-price flow. Doing so would make qualified users fall back to the public masked catalog.

Recommended next step:

Replace the qualified price RPCs with one of these backend patterns:

- Edge Function using service-role access plus explicit application-level policy checks.
- Dedicated `api` schema with narrowly exposed RPC wrappers and a separate PostgREST exposure policy.
- RLS-native exact-price tables/views with safer column separation between public offer fields and protected commercial fields.

## Environment Note

The local Supabase CLI is linked to:

`eaasthucczsduwrznrng`

The tracked `.env` currently points frontend requests to:

`rxjufyldskfkjrpzhloo.supabase.co`

Before validating frontend writes, align `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the linked YORSO project, otherwise the app will query a different Supabase schema than the one receiving migrations.
