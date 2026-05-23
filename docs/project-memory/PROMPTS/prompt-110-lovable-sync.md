# Prompt #110: Lovable Sync For Batch #110

Target: Lovable.dev

Use this prompt after syncing Lovable with GitHub `main` at commit `2e8fb7b`
or newer.

```text
You are working on the YORSO Commerce Hub project.

Goal:
Sync the Lovable project with GitHub `main` after Batch #110, then verify that the public UX/mobile remediation is present without introducing new UI, copy, routes, auth, data models or backend features.

Source of truth:
- GitHub `main`, commit `2e8fb7b` or newer.
- Project name: YORSO Commerce Hub.
- Audience: B2B seafood buyers, procurement teams, decision makers and suppliers.
- Narrative priority: buyer-first. Supplier UI should support trust and supply evidence, not replace the buyer story.

Do not:
- Do not recreate the app from scratch.
- Do not redesign the visual system.
- Do not add generic AI-looking hero sections, decorative cards or marketing filler.
- Do not add authentication, database schema, Supabase changes, routes or features.
- Do not remove existing shadcn/Tailwind patterns.
- Do not overwrite newer user edits without reporting the conflict first.

Expected synced changes:
1. `index.html` no longer contains Lovable default metadata. It should use YORSO-specific title, description, Open Graph and Twitter metadata.
2. `README.md` describes YORSO Commerce Hub instead of the default Lovable TODO.
3. Public pages keep the buyer-first procurement narrative and have mobile overflow containment:
   - `/`
   - `/how-it-works`
   - `/suppliers`
   - `/offers`
   - `/for-suppliers`
4. Mobile public controls are hardened for practical tap targets, including header actions, footer links, breadcrumbs, supplier filter chips, supplier rows, offer filters, certification chips, mobile offer card controls and public CTA buttons.
5. Public CTA blocks no longer use invalid nested `Link > Button`; they use the existing `Button asChild` pattern.
6. DB migration tests include Batch #109 migration `0025_admin_incident_trend_action_queue` and expect 26 local migrations.
7. Project-memory files reflect that PR #161 / Batch #110 was merged.

Verification to run in Lovable:
- Inspect the five public routes listed above at a mobile width around 390px.
- Confirm there is no horizontal overflow on those routes.
- Confirm interactive mobile controls are not visually cramped and remain scannable.
- Confirm the buyer-first story remains clear: buyers compare offers, evaluate supplier trust, request access and understand procurement workflow.
- Confirm supplier-facing content acts as a trust/supply mechanism, not the primary narrative.

Output a short sync report with exactly these sections:
1. GitHub commit synced
2. Files/routes checked
3. Conflicts found, if any
4. Public mobile UX status
5. Remaining known warnings

Known warnings to preserve, not fix in this sync:
- Supabase generated types are still out of sync in non-strict mode.
- Browserslist data is stale.
- Main production JS chunk is still large and needs a later code-splitting batch.
```

Done condition: Lovable reports a clean sync or gives a concrete conflict list.
