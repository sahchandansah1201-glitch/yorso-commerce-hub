# Supabase access write smoke

This smoke verifies the first real backend path for the Supplier Access Flow:

1. anon can read the safe public supplier baseline;
2. anon cannot insert `supplier_access_requests`;
3. an authenticated buyer can create or reuse one supplier access request;
4. `log_supplier_access_event(...)` writes an `access_events` row as `SECURITY INVOKER`;
5. the buyer can read the created audit event through RLS.

The smoke is intentionally local-only. It never prints Supabase keys or passwords.

## Required target

The local frontend config must point to the YORSO Supabase project:

```bash
VITE_SUPABASE_URL=https://eaasthucczsduwrznrng.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Use `.env.local` for this. Do not commit `.env.local`.

## Step 1: Apply migrations

```bash
npm run supabase:access-preflight
npx supabase db push --dry-run
npx supabase db push
```

## Step 2: Seed the smoke supplier

This creates one deterministic public supplier and one published offer. It does
not create users and does not use secrets.

```bash
npm run supabase:access-seed
```

If Supabase CLI returns a temporary `ECIRCUITBREAKER` authentication error, wait
10-15 minutes before retrying or connect with an explicit database password.

## Step 3: Create a confirmed buyer

Create or confirm one test buyer in Supabase Auth. The buyer must have a
`buyer` role in `public.user_roles`.

Preferred options:

- create the user through the app registration flow and confirm email;
- create the user in Supabase Dashboard and add the buyer role if needed.

Do not deploy the old `seed-demo-user` function as a public function. It uses
service-role access and is not suitable as an exposed API surface.

## Step 4: Run the smoke

Pass credentials through shell environment variables, not tracked files:

```bash
SUPABASE_SMOKE_EMAIL="buyer@example.com" \
SUPABASE_SMOKE_PASSWORD="password" \
npm run supabase:access-smoke
```

Expected successful output:

```text
project=eaasthucczsduwrznrng
public_read=ok
anon_insert=blocked code=...
auth=ok
buyer_role=ok
request_insert=ok status=sent
event_rpc=ok
event_read=ok
access_smoke=ok
```

`request_insert=existing` is also acceptable on repeated runs. Each smoke run
may append one audit event for the existing request.

## Common precondition failures

- `access_smoke=missing_seed`: run `npm run supabase:access-seed`.
- `access_smoke=missing_auth`: pass `SUPABASE_SMOKE_EMAIL` and `SUPABASE_SMOKE_PASSWORD`.
- `access_smoke=auth_failed`: the buyer does not exist, is not confirmed, or the password is wrong.
- `access_smoke=missing_buyer_role`: add the `buyer` role for the smoke user.
