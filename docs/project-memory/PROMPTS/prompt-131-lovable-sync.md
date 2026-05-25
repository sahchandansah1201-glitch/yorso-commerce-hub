# Prompt #131: Lovable Sync For Public Pulse Estimate Disclosure

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `8590361`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #131, then verify that
public Pulse activity signals keep visible estimate disclosure, reduced-motion
guards and the new dynamic count drift. This is buyer-trust hardening, not a
redesign. Do not change product behavior, offer routing, supplier access,
redaction, price locks, SEO route ownership, analytics, backend APIs, Supabase
settings or data models.

Source of truth:
- GitHub `main`, commit `8590361` or newer.
- PR #183: [codex] Batch #131 public pulse estimate disclosure.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier content remains a trust/supply
  mechanism. Pulse signals must feel helpful without pretending to be live
  backend market data.

Important base context:
- `origin/main` advanced to `da880e4` before Batch #131 merge with dynamic
  PulseBadge behavior (`Сделал пульсацию динамичной`).
- Batch #131 was rebased over that change and must preserve the dynamic
  client-side count drift while adding visible/programmatic estimate disclosure.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, offer detail, supplier directory, supplier
  profile, how-it-works, blog, auth pages, registration pages, admin pages or
  shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections
  or marketing filler.
- Do not remove PulseBadge dynamic drift, disappearance/reappearance behavior,
  initial deterministic values or transition styling.
- Do not make the Pulse labels look like live backend data.
- Do not add polling, subscriptions, timers beyond the existing client-side
  PulseBadge drift, backend calls, database schema, Supabase changes, routes,
  dependencies or new product behavior.
- Do not change offer data, supplier mock data, access gating, supplier identity
  redaction, exact-price locks, CTA labels, CTA destinations, SEO, analytics
  hooks or account/admin behavior.
- Do not change the Batch #112 route code-splitting strategy or add manual
  third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batches #110-#130 public UX/a11y safeguards.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/PulseBadge.tsx`:
   - keeps the dynamic Pulse behavior from `origin/main`:
     deterministic initial count from `pulseInt`, client-side drift, occasional
     temporary disappearance and return, plus transition opacity styling;
   - computes the visible label from the current `count`;
   - appends visible localized estimate text inside the badge;
   - exposes the same estimate disclosure in `aria-label`;
   - keeps `title={t.pulse_estimate}`;
   - adds `motion-reduce:animate-none` to the ping animation span;
   - keeps `data-testid="pulse-badge"`.
2. `src/components/offer-detail/MarketPulse.tsx`:
   - renders the pulse panel as a `<section>`;
   - uses `aria-labelledby="offer-market-pulse-heading"`;
   - gives the visible heading that id;
   - adds `motion-reduce:animate-none` to the ping animation span;
   - keeps the existing visible estimate copy.
3. `src/components/PulseBadge.test.tsx` exists and checks:
   - English visible and programmatic estimate disclosure;
   - Russian localized disclosure without English `estimate` leakage;
   - reduced-motion class on the ping animation.
4. `e2e/public-pulse-disclosure.spec.ts` exists and checks at 390px:
   - homepage Pulse badges are visible and include estimate disclosure in text,
     `aria-label` and `title`;
   - offer-detail MarketPulse keeps visible estimate copy;
   - the MarketPulse ping has `motion-reduce:animate-none`;
   - zero nested interactive controls;
   - zero horizontal overflow.
5. `package.json` includes:
   - `smoke:e2e:public-pulse-disclosure`;
   - `smoke:e2e:public-pulse-disclosure:run`;
   - `e2e/public-pulse-disclosure.spec.ts` in `smoke:e2e:run`.
6. `docs/backend/production-scale-baseline.md` includes the Batch #131
   10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/` renders at mobile 390px and homepage Pulse badges include visible
  `estimate` copy in English.
- Confirm PulseBadge still drifts dynamically over time, but never presents the
  signal as live market data.
- Confirm PulseBadge has an `aria-label` containing the visible activity label
  and estimate disclosure.
- Confirm PulseBadge `title` is still the localized estimate label.
- Confirm the PulseBadge ping includes `motion-reduce:animate-none`.
- Confirm `/offers/00000000-0000-0000-0000-000000000001` renders
  `offer-market-pulse` as a labelled section with visible estimate copy.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`,
  `a a`, `button button`.
- Confirm offer routing, access gating, supplier identity redaction, exact-price
  locks, SEO and analytics are unchanged.
- Confirm Batch #130 supplier profile mobile accessibility, Batch #129 offer
  detail mobile accessibility, Batch #128 registration accessibility, Batch #127
  blog tap targets, Batch #126 skip-to-main behavior and Batch #125 landmark
  labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-pulse-disclosure.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk
  warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #131: `126.77 kB` minified and `21.01 kB` gzip.
- Entry chunk after Batch #131: `355.47 kB` minified and `114.18 kB` gzip.
- i18n-translations after Batch #131: `317.70 kB` minified and `100.04 kB` gzip.
- Index route chunk after Batch #131: `38.17 kB` minified and `10.77 kB` gzip.
- OfferDetail route chunk after Batch #131: `50.96 kB` minified and `13.01 kB` gzip.
- Local full browser smoke passed after rebase:
  `npm run smoke:e2e:run`, 237 tests.
- GitHub `Core Type And Build Gate` passed on PR #183 in 10m13s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public Pulse estimate disclosure status
5. Dynamic Pulse behavior status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
