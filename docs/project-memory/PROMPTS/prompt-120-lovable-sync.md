# Prompt #120: Lovable Sync For Auth CTA Semantics

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `276f790`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #120, then verify that
public auth route back CTAs render as single semantic links, not nested
link/button controls. Do not change auth behavior, buyer session behavior,
password recovery behavior, redirects, route shell, backend APIs, Supabase
settings or data models.

Source of truth:
- GitHub `main`, commit `276f790` or newer.
- PR #171: [codex] Batch #120 auth CTA semantics.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Auth routes should reduce friction into the buyer procurement workspace without changing trust/access rules.

Do not:
- Do not recreate the app from scratch.
- Do not redesign public pages, auth pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change sign-in form fields, validation, redirects, password reset behavior, self-hosted auth API behavior or Supabase prototype recovery behavior.
- Do not change buyer access gating, supplier identity redaction or price-lock rules.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics or Batch #119 offers CTA semantics.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/pages/SignIn.tsx` renders the login-view `Back` control with `Button asChild` and a direct React Router `Link` to `/`.
2. `src/pages/ResetPassword.tsx` renders the `Back to sign in` control with `Button asChild` and a direct React Router `Link` to `/signin`.
3. `src/pages/AuthCtaSemantics.test.tsx` exists and asserts both auth routes have no nested `a button` / `button a` markup.
4. `e2e/auth-cta-semantics.spec.ts` exists and checks mobile `/signin` and `/reset-password`:
   - visible sign-in heading and back link to `/`;
   - visible register link to `/register`;
   - forgot-password view still uses a real button for returning to sign-in;
   - visible reset-password heading and back link to `/signin`;
   - invalid reset-link fallback still renders;
   - zero nested `a button` / `button a` controls;
   - no horizontal overflow at 390px.
5. `package.json` includes `e2e/auth-cta-semantics.spec.ts` in:
   - `smoke:e2e:auth-cta-semantics:run`;
   - `smoke:e2e:run`.
6. `docs/backend/production-scale-baseline.md` includes the Batch #120 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/signin` renders in English on desktop and mobile.
- On `/signin` mobile around 390px, confirm:
  - `Back` is visible as a link to `/`;
  - `Register` is visible as a link to `/register`;
  - `Forgot password?` still opens the reset-request view without navigation;
  - the reset-request `Back to sign in` control is a button, not a link.
- Confirm `/reset-password` renders in English on desktop and mobile.
- On `/reset-password` mobile around 390px, confirm:
  - `Back to sign in` is visible as a link to `/signin`;
  - invalid reset-link fallback still renders when no recovery token is present.
- Confirm both auth routes have no nested interactive CTA controls:
  `document.querySelectorAll("a button, button a").length === 0`
- Confirm both auth routes have no horizontal overflow at mobile width.
- Confirm self-hosted auth behavior is unchanged: email sign-in still posts to the owned API when `VITE_YORSO_API_URL` is configured.
- Confirm public pages keep the buyer-first story and access gating remains unchanged.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run tests, run or confirm:
  `npx vitest run src/pages/AuthCtaSemantics.test.tsx`
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/auth-cta-semantics.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local and GitHub validation:
- CSS bundle after Batch #120: `125.44 kB` minified and `20.79 kB` gzip.
- Entry chunk after Batch #120: `355.46 kB` minified and `114.16 kB` gzip.
- i18n-translations after Batch #120: `313.45 kB` minified and `98.69 kB` gzip.
- SignIn route chunk after Batch #120: `8.96 kB` minified and `2.76 kB` gzip.
- ResetPassword route chunk after Batch #120: `4.39 kB` minified and `1.99 kB` gzip.
- GitHub PR #171 `Core Type And Build Gate` passed before merge in 10m50s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public auth runtime status
5. Auth CTA semantics status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
