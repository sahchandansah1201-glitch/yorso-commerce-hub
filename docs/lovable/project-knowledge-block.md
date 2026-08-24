# Yorso Lovable Project Knowledge

Use this block as the source text for Lovable Project Knowledge. Repository
files remain the source of truth when this copy becomes stale.

## Project Boundary

- Product: `yorso_new`.
- GitHub repository: `sahchandansah1201-glitch/yorso-commerce-hub`.
- `main` is the production source of truth and is not a development branch.
- Experimental work is done only on the explicitly selected
  `local-lab/<scope>` branch. Before any work, report repository, branch, HEAD
  and working-tree status. Stop on a mismatch.
- Preserve the self-hosted, provider-free direction. Do not install or add
  Supabase, Lovable Cloud backend, hosted BaaS, auth, database, payment or
  external runtime integrations unless the user explicitly approves that
  exact scope.

## Capability Preflight

Before planning, state which capabilities are actually available in the
current Lovable session: Plan mode, Build mode, browser testing, Preview,
screenshots, console/network inspection, visual edits, Design Guidance,
GitHub sync and project skills. Do not invent a capability. Do not ban browser
tools without checking availability. If a capability is unavailable, name the
reproducible fallback and the evidence it can produce.

## Required Lifecycle

1. **Discover in Plan mode.** Inspect the real route, files, state, testids,
   existing components and translations. Reproduce the reported issue before
   proposing a fix. State user role, job, primary action, non-goals, affected
   contracts and stop condition. Do not edit code.
2. **Build the approved scope.** Change only agreed files. Reuse existing
   tokens and components. Preserve API, state, storage, access, locale and
   testid contracts unless the approved scope says otherwise. Do not add
   unrelated refactors, fake data, unsupported claims, metrics or logos.
3. **Run browser acceptance as a separate pass.** Use the real user flow, not
   only isolated selectors. Test desktop, tablet when layout changes, and
   mobile 390px. Capture screenshots and console/page errors.
4. **Run visual critique.** Review screenshots for hierarchy, scanability,
   density, action priority, contrast, labels versus values, truncation,
   overlap and responsive stability. Findings come before praise or summary.
5. **Verify sync.** Report branch, HEAD, changed files, exact commands and
   results, screenshots, runtime errors, conflicts and every unverified item.

Do not combine a large implementation and final acceptance into one
unreviewed prompt. Plan, Build and acceptance are separate evidence gates.

## Human-Like Interaction Matrix

For pickers, multi-selects, CRUD forms and other stateful controls, acceptance
must include the relevant sequences:

- choose at least three items consecutively without reopening the form;
- remove one item, add another, then remove and re-add the original;
- attempt a duplicate and verify the feedback;
- cover empty query, no results, invalid input and cancel;
- use keyboard navigation: ArrowDown, ArrowUp, Enter, Escape and Home/End when
  supported;
- Save, reload the route, reopen Edit and verify prefill;
- repeat the critical flow at 390px;
- verify no horizontal overflow and no nested interactive controls;
- collect console errors and page errors;
- report defects before fixing them, then rerun the same failing flow.

Passing unit tests or a single happy path is not enough evidence for an
interactive control.

## Yorso UI Rules

- Operational B2B screens must be quiet, compact and easy to scan. Avoid
  marketing composition, decorative cards and excessive helper copy.
- Preserve visible user-entered values. Read mode shows strong values under
  stable, quieter labels. Edit mode pre-fills current values.
- Keep one clear primary action per context. Secondary and destructive actions
  must remain findable without competing visually.
- Mobile touch targets are at least 44px. Text must wrap without overlap.
- Do not nest `a button`, `button a`, `a a` or `button button`.
- Use EN/RU/ES native interface wording. Do not expose raw enum values.
- Use official images or logos only from a confirmed project source. Never
  fabricate or silently download brand assets.

## Acceptance Evidence

For every completed UI batch provide in Russian:

| План | Сделано | Осталось | Проверка |
|---|---|---|---|

Also include:

- commit/HEAD and whether GitHub sync is confirmed;
- files changed and approximate batch size;
- exact checks and pass/fail counts;
- desktop/tablet/390px screenshots relevant to the change;
- `document.body.scrollWidth <= document.documentElement.clientWidth`;
- nested-interactive count equals zero;
- console/page error count;
- provider-free status;
- conflicts and residual risks.

Never report “verified”, “synced” or “fixed” without current evidence. Stop
after the approved scope and wait for review.

## Yorso Lovable Quality Pack

The following workspace skills are the canonical quality pack for Yorso:

1. `yorso-ui-surface-build` - implement a scoped Yorso UI surface without
   changing unrelated behavior.
2. `yorso-real-user-acceptance` - verify the actual user flow in a browser,
   including desktop and 390px mobile behavior, console errors, overflow and
   interactive-control semantics.
3. `yorso-multilingual-interface-copy` - review visible interface copy and
   labels in EN, RU and ES using native, concise wording.
4. `yorso-provider-free-github-sync` - verify the intended GitHub branch and
   commit, preserve the provider-free boundary and report synchronization
   evidence without regenerating product code.

Name every applicable skill explicitly in the task prompt. Do not assume a
project-level enable toggle has been applied. A normal UI lifecycle is:

1. Preflight and branch synchronization with
   `yorso-provider-free-github-sync`.
2. Scoped implementation with `yorso-ui-surface-build`.
3. Copy review with `yorso-multilingual-interface-copy` when visible text is
   added or changed.
4. Real user-flow verification with `yorso-real-user-acceptance`.
5. Final branch, commit and provider-free verification with
   `yorso-provider-free-github-sync`.
