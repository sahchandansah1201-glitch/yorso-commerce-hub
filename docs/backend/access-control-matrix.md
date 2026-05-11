# YORSO Backend Access Control Matrix

Status: Phase 0 backend contract
Primary audience: Lovable, Codex, backend implementers
Related documents:

- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/frontend-backend-contract.md`

## Purpose

YORSO's backend must protect the commercial value of the marketplace: exact
prices, private price tiers, supplier identity, supplier contacts, legal
details, restricted documents and full product catalogs.

Published trade terms and production capability facts are public marketplace
data unless a supplier or admin explicitly marks a field as confidential.

This matrix defines what each access level can receive from the backend. The
frontend may visually blur or mask values, but backend responses must already be
safe. Locked users must never receive real hidden values in network payloads,
DOM text, JSON-LD, metadata, logs, search indexes or downloadable exports.

## Access Levels

| Access level | Meaning | Backend identity |
|---|---|---|
| `anonymous_locked` | Visitor without buyer session | no authenticated user |
| `registered_locked` | Signed-in buyer without supplier/price approval | authenticated user, no active grant |
| `qualified_unlocked` | Buyer with active grant for supplier or offer | authenticated user, active access grant |
| `supplier_owner` | Supplier company member managing own data | authenticated user, supplier company membership |
| `admin` | YORSO operator with verification/support role | authenticated user, admin role |

Important:

- `qualified_unlocked` is not a global permanent unlock by default.
- Access should be supplier-scoped, offer-scoped or document-scoped.
- A buyer may be qualified for one supplier and still locked for another.
- Dev overrides must never exist in production builds.

## Data Classes

| Data class | Examples | Sensitivity |
|---|---|---|
| Public product facts | product name, Latin name, format, origin, image, safe MOQ label | low |
| Public supplier teaser | masked name, country, city when allowed, type, safe trust summary | medium |
| Exact price and private price tiers | exact price, buyer-specific price tiers, unpublished rebates | high |
| Public trade and logistics terms | payment terms, incoterms, delivery basis, public MOQ, loading port | low/medium |
| Supplier identity | company name, legal name, supplier id, profile owner | high |
| Contact channels | email, phone, WhatsApp, website, direct messenger | high |
| Legal details | registration number, tax id, legal address, bank-related fields | high |
| Published production capability facts | plant capacity, staff count, cold storage, blast freezing, transit specifics | low/medium |
| Documents | certificates, health docs, catch/IUU docs, packing lists, traceability files | high |
| Activity metrics | exact offer count, exact product count, response history, buyer demand | medium/high |
| Internal operations | verification notes, risk flags, moderation notes, admin audit | restricted |

## Global Rules

1. Do not send high-sensitivity values to locked users.
2. If a locked UI needs structure, send placeholders, not real values.
3. Exact counts should be gated when they reveal supplier catalog breadth.
4. JSON-LD and metadata must follow the same access rules as visible UI.
5. Search must not reveal hidden company names or contacts.
6. Logs and analytics payloads must not contain hidden values for locked users.
7. Export/download endpoints must enforce the same RLS rules as page APIs.
8. Public views should be safe even if a user copies the entire response.
9. Owner and admin views must be separate from buyer-qualified views.
10. RLS is the source of truth. React conditional rendering is not enough.
11. Public trade/logistics terms and published production capability facts may
    be returned to locked users when the field is explicitly classified as
    public.

## Surface Access Matrix

### Homepage

| Data | anonymous_locked | registered_locked | qualified_unlocked |
|---|---|---|---|
| Public offer teaser | allowed | allowed | allowed |
| Real product photos | allowed | allowed | allowed |
| Exact price | masked or safe range only | masked or safe range only | allowed only when grant applies |
| Supplier name | safe teaser only unless intentionally public | safe teaser only | allowed only when grant applies |
| Supplier contacts | denied | denied | denied on homepage by default |

Backend target:

- `homepage_marketplace_preview`
- safe offer preview view

### Offers Listing `/offers`

| Data | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| Product identity | allowed | allowed | allowed | allowed for own offers | allowed |
| Latin name, format, origin | allowed | allowed | allowed | allowed | allowed |
| Product images | allowed | allowed | allowed | allowed | allowed |
| Safe MOQ label | allowed | allowed | allowed | allowed | allowed |
| Exact MOQ value | allowed if not sensitive | allowed if not sensitive | allowed | allowed | allowed |
| Payment terms | allowed | allowed | allowed | allowed | allowed |
| Incoterms / delivery basis | allowed | allowed | allowed | allowed | allowed |
| Price range label | allowed | allowed | allowed | allowed | allowed |
| Exact price min/max | denied | denied unless offer grant exists | allowed by offer/supplier grant | own offers only | allowed |
| Supplier id | denied | denied unless grant exists | allowed by grant | own company only | allowed |
| Supplier name | masked | masked/partial | allowed by grant | own company only | allowed |
| Supplier contacts | denied | denied | allowed only in detail/contact flow by grant | own company only | allowed |
| Compare metadata | allowed with safe fields | allowed with safe fields | allowed with granted fields | allowed | allowed |

Backend target:

- `offers_public`
- `offers_registered`
- `offers_qualified`
- `offers_owner`
- `offers_admin`

### Offer Detail `/offers/:id`

| Data | anonymous_locked | registered_locked | qualified_unlocked |
|---|---|---|---|
| Product detail | allowed | allowed | allowed |
| Photo gallery | allowed | allowed | allowed |
| Price summary | safe range only | safe range only | exact values by grant |
| Payment terms / incoterms / delivery basis | allowed | allowed | allowed |
| Supplier trust summary | safe summary | safe summary | full trust pack by grant |
| Supplier profile link | link to masked profile | link to masked profile | full profile by grant |
| Documents | teaser/status only | teaser/status only | downloadable by document grant |
| Traceability | safe summary | safe summary | full details by grant |
| Related offers | safe fields | safe fields | granted fields where applicable |

Backend target:

- `offer_detail_public`
- `offer_detail_registered`
- `offer_detail_qualified`

### Supplier Directory `/suppliers`

| Data | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| Masked supplier name | allowed | allowed | allowed if no grant | not needed | allowed |
| Real company name | denied | denied | allowed by supplier grant | own company only | allowed |
| Country/city | allowed if safe | allowed | allowed | allowed | allowed |
| Supplier type | allowed | allowed | allowed | allowed | allowed |
| Short safe description | allowed | allowed | allowed | allowed | allowed |
| Full about text | denied | denied | allowed by grant | own company only | allowed |
| Product preview images | allowed | allowed | allowed | allowed | allowed |
| Exact product count | denied | denied | allowed by grant | own company only | allowed |
| Exact active offer count | denied | denied | allowed by grant | own company only | allowed |
| Delivery geography | limited teaser | limited teaser | full by grant | own company only | allowed |
| Website/WhatsApp/email | denied | denied | allowed by grant | own company only | allowed |

Backend target:

- `suppliers_public`
- `suppliers_registered`
- `suppliers_qualified`
- `suppliers_owner`
- `suppliers_admin`

### Supplier Profile `/suppliers/:supplierId`

| Data | anonymous_locked | registered_locked | qualified_unlocked |
|---|---|---|---|
| Dossier layout | allowed | allowed | allowed |
| Hero image | allowed if public-safe | allowed if public-safe | allowed |
| Logo | placeholder or public-safe | placeholder or public-safe | allowed by grant |
| Real company name | denied | denied | allowed by grant |
| Legal details | denied | denied | allowed by grant/admin policy |
| Website/WhatsApp/contact | denied | denied | allowed by grant |
| Published production passport facts | allowed | allowed | allowed |
| Non-public production notes | denied | denied | allowed by grant/admin policy |
| Catalog preview | safe teaser only | safe teaser only | full by grant |
| Supplier offers | safe offer preview | safe offer preview | supplier-specific granted offers |
| Documents | status only | status only | full/downloadable by grant |
| Similar suppliers | safe teaser | safe teaser | safe or qualified based on each supplier grant |

Backend target:

- `supplier_profile_public`
- `supplier_profile_registered`
- `supplier_profile_qualified`
- `supplier_profile_owner`

### Account Workspace `/account/*`

| Data | account owner | company member | company admin | public/other user |
|---|---|---|---|---|
| Personal profile | own only | denied | denied unless admin support | denied |
| Company identity | company scope | company scope | edit | denied |
| Company media | company scope | company scope | edit | public only after publication |
| Branches | company scope | company scope | edit | denied |
| Products | company scope | company scope | edit | public preview only after publication |
| Meta-regions | company scope | company scope | edit | denied |
| Notification preferences | own/company scope | role-based | edit | denied |

Backend target:

- `profiles`
- `companies`
- `company_members`
- `company_branches`
- `company_products`
- `company_meta_regions`
- `notification_preferences`

### Supplier Access Request Flow

| Action/data | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| See access CTA | allowed | allowed | hidden or shows granted state | not applicable | allowed |
| Create request | redirect/sign-up first | allowed | no duplicate active request | not applicable | allowed for support |
| See own request status | denied | allowed | allowed | supplier sees incoming requests | allowed |
| Approve/reject request | denied | denied | denied | allowed for own supplier | allowed |
| Receive approval notification | denied | allowed | allowed | not applicable | allowed |
| Audit access event | denied | own request only | own grant only | own supplier requests | allowed |

Backend target:

- `supplier_access_requests`
- `price_access_requests`
- `access_grants`
- `access_events`
- `notifications`

### RFQ / Product Request

| Action/data | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| View empty-state request form | allowed teaser | allowed | allowed | not primary | allowed |
| Submit RFQ | sign-up required or draft only | allowed | allowed | not primary | allowed |
| See own RFQs | denied | own company only | own company only | supplier responses only | allowed |
| See supplier responses | denied | own requests only | own requests only | own submitted responses | allowed |
| Attach files | denied | allowed with validation | allowed with validation | allowed for response | allowed |

Backend target:

- `buyer_requests`
- `buyer_request_items`
- `supplier_responses`
- `request_attachments`
- `request_events`

## Search Rules

Search must respect the same access level as rendered results.

Locked users may search by:

- masked supplier name;
- country;
- city if public-safe;
- supplier type;
- product species;
- certifications;
- safe delivery teaser;
- public trade and logistics terms;
- published production capability facts;
- public product fields.

Locked users must not search by:

- real company name;
- website;
- WhatsApp;
- email;
- legal registration number;
- hidden product names;
- hidden document names;
- confidential production notes.

Qualified users may search by granted supplier identity and non-public
commercial fields, but only within the scope of their active grants.

## Metadata And SEO Rules

Public SEO metadata must never leak locked values.

Rules:

- supplier profile JSON-LD must use masked/public-safe identity unless the page
  is intentionally public and approved;
- canonical URLs can exist for supplier profiles, but metadata must be safe;
- no hidden company name in `title`, `description`, `og:title`,
  `og:description`, `alt`, JSON-LD, breadcrumb schema or sitemap labels;
- offer pages must not expose supplier identity or exact prices in metadata for
  locked/public views;
- blog content can mention suppliers only when that information is intentionally
  public and approved.

## Required Backend Views

Minimum views/RPCs needed for Phase 1:

```sql
suppliers_public
suppliers_registered
suppliers_qualified
suppliers_owner
offers_public
offers_registered
offers_qualified
offers_owner
get_supplier_profile_public(p_supplier_id)
get_supplier_profile_qualified(p_supplier_id)
get_offer_public(p_offer_id)
get_offer_qualified(p_offer_id)
```

Recommended helper functions:

```sql
is_admin(p_user_id)
is_company_member(p_user_id, p_company_id)
has_company_role(p_user_id, p_company_id, p_role)
is_supplier_owner(p_user_id, p_supplier_id)
has_supplier_access(p_user_id, p_supplier_id)
has_offer_price_access(p_user_id, p_offer_id)
has_document_access(p_user_id, p_document_id)
```

## Test Matrix

Every backend access implementation must include tests for these cases:

| Test case | Expected result |
|---|---|
| anonymous reads offers_public | no exact price, no supplier id, no contacts; public payment terms, incoterms and delivery basis may be returned |
| registered reads offers_public/registered | no exact price unless grant exists |
| qualified reads granted offer | exact price and supplier identity returned |
| qualified reads non-granted offer | fallback to public-safe payload |
| anonymous reads suppliers_public | no companyName, website, WhatsApp, legal details |
| anonymous reads published production facts | public plant, staff, storage, freezing and transit facts may be returned when classified public |
| registered searches supplier real name | no hidden identity result leak |
| qualified reads granted supplier | full allowed profile returned |
| supplier owner reads own supplier | full owner profile returned |
| supplier owner reads another supplier | public or denied, not owner data |
| admin reads supplier | full admin view returned |
| locked supplier profile metadata | no hidden value in title/meta/JSON-LD |
| locked DOM snapshot | no hidden real values in textContent |
| locked network payload | no hidden real values in response JSON |

## Implementation Notes

- Keep frontend placeholders and blur effects for UX.
- Replace real hidden values with backend-generated placeholders before the
  payload reaches the client.
- Do not use `select *` in public views.
- Do not pass raw supplier rows to shared frontend components in locked states.
- Do not reuse owner/admin payloads for buyer views.
- Classify fields as `public`, `restricted` or `confidential`; do not assume all
  commercial or production fields are sensitive.
- Store access decisions as auditable events.
- Make grants explicit: supplier, offer, document, scope, actor, timestamp and
  expiration if applicable.

## Phase 0 Exit Criteria

Access-control planning is complete when:

- this matrix is committed in `docs/backend/`;
- `frontend-backend-contract.md` references the same access levels;
- Supabase migration plan includes public/qualified/owner/admin views;
- tests are planned for DOM, network and RLS leaks;
- no future backend task can ignore access level requirements.
