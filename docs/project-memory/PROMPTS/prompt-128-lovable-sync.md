# Prompt #128: Lovable Sync For Public Auth And Registration Accessibility

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `912230c`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #128, then verify that
public auth and registration routes keep accessible form names, useful browser
completion hints, one stable `main#main`, a working skip-to-main link,
mobile-safe 44px target zones and single semantic CTAs. Do not change
registration copy, funnel logic, route behavior, auth runtime, buyer narrative,
access gating, supplier identity redaction, backend APIs, Supabase settings or
data models.

Source of truth:
- GitHub `main`, commit `912230c` or newer.
- PR #179: [codex] Batch #128 public auth registration accessibility.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Suppliers remain trust/supply mechanism;
  this batch is public auth/registration accessibility hardening, not a redesign.

Do not:
- Do not recreate the app from scratch.
- Do not redesign homepage, catalog, supplier pages, how-it-works, blog, auth pages, registration pages, admin pages or shared components.
- Do not add generic AI-looking sections, decorative cards, new hero sections or marketing filler.
- Do not add authentication features, database schema, Supabase changes, routes, dependencies or new product behavior.
- Do not change registration copy, CTA labels, route flow, analytics hooks, local registration storage behavior, auth API behavior or visual styling beyond the synced semantic/target-size attributes.
- Do not change buyer access gating, supplier identity redaction or exact-price locking.
- Do not change the Batch #112 route code-splitting strategy or add manual third-party vendor chunks.
- Do not remove the Batch #113 route chunk error boundary.
- Do not remove Batch #110 mobile fixes, Batch #111 public route SEO, Batch #114 font loading, Batch #115 catalog locale hardening, Batch #116 offers proof anchor fallback, Batch #117 offers request anchor, Batch #118 for-suppliers CTA semantics, Batch #119 offers CTA semantics, Batch #120 auth CTA semantics, Batch #121 offer detail CTA semantics, Batch #122 public CTA semantics, Batch #123 public input accessibility, Batch #124 public heading structure, Batch #125 public landmark labels, Batch #126 skip-to-main target or Batch #127 blog mobile tap targets.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `src/components/registration/RegistrationLayout.tsx`:
   - exposes a hidden-until-focus `Skip to main content` link through `t.aria_skipToMain`;
   - focuses and scrolls `main#main`, then normalizes the URL to `#main`;
   - renders exactly one `<main id="main">`;
   - marks registration shell/footer controls with `data-registration-mobile-target`;
   - keeps the same registration header/footer destinations and visual style.
2. `src/components/registration/CountryPhoneInput.tsx`:
   - accepts `inputAutoComplete`;
   - passes it to the phone input;
   - keeps country search autocomplete disabled.
3. Public auth screens:
   - `src/pages/SignIn.tsx` keeps named email/phone/password/forgot-password fields and adds expected autocomplete hints: email, tel, current-password;
   - `src/pages/ResetPassword.tsx` connects labels to reset password fields and uses `new-password` completion hints.
4. Registration screens:
   - `RegisterEmail` has a stable `register-email` label/id and email autocomplete;
   - `RegisterVerify` names each OTP input as `SMS code 1` through `SMS code 6` and uses `one-time-code`;
   - `RegisterDetails` connects labels and completion hints for full name, company, country, VAT/TIN, phone and password;
   - `RegisterOnboarding` and `RegisterCountries` keep existing choices but harden chip/skip target sizes;
   - `RegisterReady` uses `Button asChild` with a direct React Router `Link` to `/offers`, not nested `Link > Button`.
5. `e2e/public-auth-registration-a11y.spec.ts` exists and checks:
   - sign-in completion hints;
   - `/register`, `/register/email`, `/register/verify`, `/register/details`, `/register/onboarding`, `/register/countries` and `/register/ready` at 390px;
   - exactly one `main#main`, no extra `main:not(#main)`, one skip link, no nested controls and no horizontal overflow;
   - every `[data-registration-mobile-target]` is visible and at least 44px by 44px;
   - registration skip-link activation moves focus to `main#main`;
   - registration form labels and autocomplete hints stay intact.
6. `package.json` includes:
   - `smoke:e2e:public-auth-registration-a11y`;
   - `smoke:e2e:public-auth-registration-a11y:run`;
   - `e2e/public-auth-registration-a11y.spec.ts` in `smoke:e2e:run`.
7. `docs/backend/production-scale-baseline.md` includes the Batch #128 10,000 concurrent-user capacity review.

Verification to run in Lovable:
- Confirm `/signin`, `/reset-password`, `/register`, `/register/email`, `/register/verify`, `/register/details`, `/register/onboarding`, `/register/countries` and `/register/ready` render in English at mobile 390px.
- Confirm each registration route has one hidden-until-focus skip link and exactly one `main#main`.
- Confirm activation of the registration skip link focuses `main#main` and keeps the route otherwise unchanged.
- Confirm every `[data-registration-mobile-target]` on registration routes has a box of at least 44px by 44px at 390px.
- Confirm there is no horizontal overflow at 390px.
- Confirm there are zero nested interactive controls: `a button`, `button a`, `a a`, `button button`.
- Confirm `/register/ready` final CTA is one semantic link to `/offers`.
- Confirm auth/registration labels and autocomplete hints are present without changing form submissions.
- Confirm registration copy, step flow, analytics events, local registration storage behavior and auth runtime behavior are unchanged.
- Confirm Batch #127 blog mobile tap targets, Batch #126 skip-to-main behavior and Batch #125 landmark labels are still present.
- Confirm the Batch #113 route chunk error boundary is still present.
- If Lovable can run e2e, run or confirm:
  `npx playwright test e2e/public-auth-registration-a11y.spec.ts --project=chromium`
- If Lovable can run a production build, confirm the previous Vite large-chunk warning remains resolved.

Expected build measurement from local validation:
- CSS bundle after Batch #128: `126.67 kB` minified and `20.99 kB` gzip.
- Entry chunk after Batch #128: `355.46 kB` minified and `114.15 kB` gzip.
- i18n-translations after Batch #128: `314.40 kB` minified and `99.06 kB` gzip.
- RegisterChoose route chunk after Batch #128: `3.16 kB` minified and `1.47 kB` gzip.
- RegisterEmail route chunk after Batch #128: `3.50 kB` minified and `1.59 kB` gzip.
- RegisterVerify route chunk after Batch #128: `7.50 kB` minified and `2.92 kB` gzip.
- RegisterDetails route chunk after Batch #128: `11.92 kB` minified and `3.55 kB` gzip.
- RegisterOnboarding route chunk after Batch #128: `8.03 kB` minified and `3.07 kB` gzip.
- RegisterReady route chunk after Batch #128: `8.30 kB` minified and `2.94 kB` gzip.
- SignIn route chunk after Batch #128: `9.29 kB` minified and `2.86 kB` gzip.
- ResetPassword route chunk after Batch #128: `4.59 kB` minified and `2.05 kB` gzip.
- Local full browser smoke passed: `npm run smoke:e2e:run`, 231 tests.
- GitHub `Core Type And Build Gate` passed on PR #179 in 11m57s.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public auth and registration accessibility status
5. Registration mobile scanability status
6. Bundle/code-splitting status
7. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
