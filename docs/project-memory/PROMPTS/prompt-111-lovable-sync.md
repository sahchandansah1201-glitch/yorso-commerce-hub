# Lovable Sync Prompt: Batch #111 Public Route SEO

Project: YORSO Commerce Hub

Source repository state:

- GitHub main commit: `17fc484`
- Commit message: `[codex] Batch #111 public route SEO`
- Previous required sync baseline: `ff989407` or newer, including Batch #110 `2e8fb7b`

## Task

Sync Lovable with GitHub `main` at commit `17fc484`.

Do not redesign the UI. This batch is a route-level SEO and metadata hardening patch for the existing public buyer-first pages.

## Confirm These Changes Are Present

1. Shared SEO helpers:
   - `src/lib/seo.ts`
   - `src/lib/public-route-seo.ts`

2. Public routes with route-owned SEO markers and metadata:
   - `/`
   - `/offers`
   - `/suppliers`
   - `/how-it-works`
   - `/for-suppliers`

3. Metadata coverage:
   - route-owned marker: `meta[name="x-route-seo"]`
   - canonical link
   - Open Graph title, description, URL, site name and locale
   - Twitter title and description
   - JSON-LD for public route structure

4. Trust and access guard:
   - `/suppliers` SEO must not expose exact supplier company names before access.

5. Copy updates:
   - `src/i18n/translations.ts` has buyer-first global meta descriptions in EN/RU/ES.
   - Homepage H1 text boundary is fixed in `src/components/landing/Hero.tsx`.

6. Tests:
   - `src/pages/PublicRouteSeo.test.tsx`
   - updated `src/i18n/locale-document-meta-ru.test.tsx`

## Expected Validation

Confirm whether Lovable sync is clean or whether conflicts appear in these files:

- `src/lib/seo.ts`
- `src/lib/public-route-seo.ts`
- `src/pages/Index.tsx`
- `src/pages/Offers.tsx`
- `src/pages/Suppliers.tsx`
- `src/pages/HowItWorks.tsx`
- `src/pages/ForSuppliers.tsx`
- `src/i18n/translations.ts`
- `src/components/landing/Hero.tsx`
- `src/pages/PublicRouteSeo.test.tsx`
- `docs/project-memory/*`

## Do Not Change

- Do not replace route content with generic AI landing-page sections.
- Do not change the buyer-first public narrative.
- Do not reveal locked supplier identities in metadata or visible UI.
- Do not remove existing mobile overflow and touch-target fixes from Batch #110.
- Do not rewrite the visual system.

## Report Back

Return:

1. GitHub commit synced.
2. Whether the listed files/routes are present.
3. Whether conflicts appeared.
4. Whether `/`, `/offers`, `/suppliers`, `/how-it-works` and `/for-suppliers` still render.
5. Any remaining known warnings.
