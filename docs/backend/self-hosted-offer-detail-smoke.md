# Self-Hosted Offer Detail Smoke

Status: runtime guard
Batch: #43
Date: 2026-05-14

`smoke:self-hosted-offer-detail` is a focused runtime check for the
self-hosted offer detail path:

```bash
npm run smoke:self-hosted-offer-detail
```

The command builds `apps/api`, starts the compiled Node API on a free local
port with the in-memory repository, and exercises `GET /v1/offers/:id` over
real HTTP.

## What It Verifies

The smoke covers the list-to-detail contract that `/offers/:id` now depends on:

- `anonymous_locked` detail returns public product, origin, MOQ and public price
  range label, but exact `priceMin`, `priceMax`, `currency`, `volumeBreaks` and
  supplier identity are hidden.
- `registered_locked` follows the same data-shaping rule. Registration alone
  does not unlock supplier identity or exact price.
- `qualified_unlocked` without a supplier-access grant is downgraded to
  `registered_locked`; the query parameter alone cannot unlock exact price or
  supplier identity.
- `qualified_unlocked` after an approved supplier-access request returns exact
  price, currency, volume breaks and supplier identity through the same DTO.
- Missing offers return `404 offer_not_found`.
- Unsupported methods return `405 method_not_allowed` with `Allow: GET`.
- Invalid detail query values return `400 validation_error`.

Expected success markers:

```text
offer_detail_locked=ok
offer_detail_registered_locked=ok
offer_detail_requires_grant=ok
offer_detail_unlocked=ok
offer_detail_not_found=ok
offer_detail_method_guard=ok
offer_detail_validation_guard=ok
self_hosted_offer_detail_smoke=ok
```

## Why This Exists

Batch #42 moved `/offers/:id` from frontend-only fallback data to the
self-hosted offer detail bridge. Batch #43 adds a runtime gate so the frontend
cannot silently depend on a broken detail endpoint.

This is part of the production scale baseline:

- the frontend calls a typed API adapter, not PostgreSQL or Supabase directly;
- the API owns access shaping before data reaches the browser;
- the detail endpoint checks the self-hosted supplier-access grant before
  returning qualified fields;
- detail reads are bounded one-row reads, not unbounded catalog scans;
- CI catches method, validation, not-found and access-shaping regressions.

The smoke is intentionally independent from live PostgreSQL. It protects the
HTTP contract in every environment. PostgreSQL-specific behavior remains covered
by migration checks and optional live smoke commands.
