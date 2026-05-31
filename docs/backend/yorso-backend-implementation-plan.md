# YORSO Backend Implementation Plan

Status: planning document
Frontend source: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`
Architecture workspace: `/Users/istokdmgmail.com/yorso_new`

## Purpose

This plan defines how to turn the current YORSO frontend prototype into a real
working trade system without breaking the product surfaces already built in
Lovable and Codex.

The backend must not invent a separate product. It must become the source of
truth for the current frontend:

- public landing and SEO pages;
- registration and sign-in;
- procurement catalog `/offers`;
- offer details `/offers/:id`;
- supplier directory `/suppliers`;
- supplier profile `/suppliers/:supplierId`;
- account workspace `/account/*`;
- supplier access request flow;
- catalog request and RFQ recovery flow;
- blog and product update content.

## Current Frontend State

The frontend already contains the main public and workspace surfaces:

- Homepage with live offers, trust sections, supplier verification and product
  categories.
- Registration flow with route guards, session persistence and analytics.
- Sign-in and reset password screens.
- Catalog workspace with filters, horizontal offer rows, selected offer panel,
  market intelligence, compare tray and gated price access.
- Supplier directory with access-aware supplier rows.
- Dedicated supplier profile page with locked and unlocked states.
- Blog index and article pages with SEO metadata and structured data.
- Account workspace with sections for personal profile, company profile,
  branches, products, meta-regions and notifications.

The frontend still uses a mixed prototype data model:

- `mockOffers`, `mockSuppliers`, `mockIntelligence`, `mockAccount` for most
  product state;
- `localStorage` and `sessionStorage` for account, buyer session, access
  requests and UI state;
- legacy Supabase prototype adapters for auth, password reset, catalog reads
  and supplier-access compatibility;
- Supabase migrations and smoke tooling already exist locally, but they are
  historical prototype assets only. They are not production architecture and
  must not be required for self-hosted server deployment.

## Backend Strategy

Build a self-hosted YORSO backend as the production target. Supabase is no
longer the future production backend. Supabase, Firebase, Appwrite, Clerk,
Auth0, hosted BaaS platforms and similar third-party application backends must
not be used as production dependencies for YORSO auth, database, storage,
access control or deployment.

Legacy Supabase code may remain only as historical prototype reference and
temporary compatibility while the self-hosted replacement is being completed.
It must be removable without changing product surfaces.

Production target:

- PostgreSQL as the main transactional database.
- PgBouncer for connection pooling.
- Backend API service as the only data gateway for the frontend.
- Redis for cache, sessions, rate limits and short-lived workflow state.
- MinIO or owned S3-compatible object storage for logos, cover images, product
  photos, certificates and documents.
- Queue workers for email, notifications, approvals, imports, report generation
  and future agent jobs.
- Self-hosted search service for catalog, supplier and product discovery when
  Postgres indexes are no longer enough.
- Docker Compose first, then self-hosted Kubernetes or owned container
  orchestration only when load requires it.

Reasoning:

- YORSO must be deployable as one coherent software system on owned
  infrastructure.
- The frontend must not depend on Supabase or similar hosted clients as
  production data gateways.
- Postgres fits the YORSO domain: companies, offers, branches, documents,
  access grants, RFQ records and audit logs are relational data.
- Access control must be enforced in the backend API and database queries, not
  only by frontend blur or Supabase RLS.
- Files, migrations, API contracts, seeds and deployment instructions must stay
  reproducible from this local repository.
- Supabase has already been useful for validating schema and access ideas, but
  it must not become a hidden hosting dependency for production.

The backend must follow this rule:

> If a user does not have access to data, the backend must not return the real
> value. Frontend blur is a UX hint, not a security boundary.

## Local File Ownership

All project files must exist locally on this PC. Production runtime should be
deployable on owned server infrastructure from local repository files and owned
configuration. Hosted BaaS/SaaS dashboards must not be the source of truth.

Local files that must be stored in Git or local project folders:

- frontend source;
- backend docs and contracts;
- self-hosted backend source and API contracts;
- PostgreSQL migrations;
- Supabase prototype migrations only while they are useful for schema
  comparison;
- seed data for demo and QA;
- generated API/client types;
- test fixtures;
- API contracts;
- prompt and audit history;
- local runbooks.

Files that must exist locally but should not be committed:

- `.env.local`;
- database credentials;
- API keys;
- production uploads;
- private user documents;
- exported production data;
- temporary browser/session artifacts.

Recommended local structure in the frontend repo:

```text
docs/
  backend/
    frontend-backend-contract.md
    yorso-backend-implementation-plan.md
    self-hosted-backend-architecture.md
    access-control-matrix.md
    migration-roadmap.md
apps/
  api/
  web/
packages/
  contracts/
  db/
  core/
infra/
  docker-compose.yml
  postgres/
  pgbouncer/
  object-storage/
supabase/
  migrations/
  seed/
src/integrations/supabase/
  client.ts
  types.ts
src/lib/
  catalog-api.ts
  account-api.ts
  supplier-api.ts
  access-api.ts
  rfq-api.ts
```

This current document is stored in `yorso_new` because that workspace is the
local architecture and steering layer. A copy or synchronized version should be
added to the frontend repo under `docs/backend/` when backend implementation
starts.

## Backend Modules Matched To Frontend

| Frontend surface | Current source | Backend module needed | Priority |
|---|---|---|---|
| `/register` | self-hosted registration/account creation when configured; transient sessionStorage for form continuity and API-disabled preview | auth onboarding, user profile, company draft | Phase 2A-2I implemented |
| `/signin`, `/reset-password` | self-hosted auth/password recovery when configured; local contract preview when API is disabled | self-hosted auth/session API, buyer session bridge | Phase 2J closed |
| `/account/personal` | localStorage `mockAccount` | user profiles API | P0 |
| `/account/company` | localStorage `mockAccount` | company profiles, logo, cover, public profile draft | P0 |
| `/account/branches` | read-only mock | company branches CRUD | P1 |
| `/account/products` | read-only mock | company product matrix CRUD | P1 |
| `/account/meta-regions` | read-only mock | meta-region CRUD | P1 |
| `/account/notifications` | read-only mock | notification preferences API | P1 |
| `/offers` | self-hosted catalog API when configured; API-disabled local fixture preview; no Supabase fallback | offer catalog API, public and qualified views | Phase 3A closed |
| `/offers/:id` | self-hosted catalog API when configured; API-disabled local fixture preview; no Supabase fallback | offer detail API, documents, related offers | Phase 3A closed |
| `/suppliers` | self-hosted supplier directory API when configured; API-disabled mock preview only | supplier directory public/qualified views | Phase 4A source-of-truth audit |
| `/suppliers/:supplierId` | self-hosted supplier detail API when configured; API-disabled mock preview only; backend-owned dossier/evidence/legal/document fields: `productionFacts`, `logisticsFacts`, `shipmentCases`, `faqItems`, qualified-only `legalDetails` and `supplierDocuments`; qualified-only supplier document grant + grant-bound file-serving endpoints | supplier profile public/qualified/owner views, owner/admin editing and future UI download action | Phase 4G document serving |
| Supplier access panel | self-hosted access API when configured; API-disabled local preview; no Supabase fallback | access request workflow, grants, notifications and audit | Phase 3B closed |
| Catalog request form | sessionStorage mock | RFQ request API | P1 |
| Blog | static data files | content source, SEO metadata, sitemap/RSS | P2 |
| Analytics dashboards | mock data | event ingestion, funnel queries | P2 |

## Core Data Model

### Identity

Tables:

- `profiles`
- `companies`
- `company_members`
- `company_roles`
- `buyer_qualifications`
- `supplier_verifications`

Purpose:

- connect every user to a company;
- support buyer, supplier and mixed roles;
- avoid treating registration as a single personal account;
- prepare team accounts and permissions.

Required behavior:

- one user can belong to multiple companies later;
- one company can have multiple users;
- protected company actions require membership and role checks;
- buyer qualification and supplier verification are independent states.

### Company Profile

Tables:

- `company_profiles`
- `company_media`
- `company_branches`
- `company_products`
- `company_meta_regions`
- `company_notification_preferences`

Purpose:

- make `/account/*` real;
- allow supplier profile pages to use data filled by the company;
- allow buyer/supplier matching by product and geography;
- store logo and cover image metadata.

Storage buckets:

- `company-logos`
- `company-covers`
- `company-documents`

Important:

- logo and cover must store object path, alt text, fit/focal settings and owner;
- uploaded files must not be referenced only by temporary local URLs;
- account edits must write to database, not only localStorage.

### Supplier Directory

Tables and views:

- `supplier_profiles`
- `supplier_certifications`
- `supplier_delivery_markets`
- `supplier_documents`
- `supplier_product_previews`
- `suppliers_public`
- `suppliers_registered`
- `suppliers_qualified`
- `suppliers_owner`

Purpose:

- replace `mockSuppliers`;
- enforce access gating at database level;
- keep supplier identity hidden until access is granted;
- allow public discovery without leaking restricted identity, contact, exact price
  or document detail.

Access rules:

- anonymous users see only public supplier preview;
- registered users see more non-sensitive evidence, but not real identity or
  contacts unless approved;
- qualified users see approved supplier identity, contacts, documents and full
  catalog preview;
- supplier owners see their own complete profile.

### Offer Catalog

Tables and views:

- `products`
- `offers`
- `offer_prices`
- `offer_media`
- `offer_delivery_terms`
- `offer_documents`
- `offer_volume_breaks`
- `offers_public`
- `offers_registered`
- `offers_qualified`
- `offers_owner`

Purpose:

- replace `mockOffers`;
- power `/offers` and `/offers/:id`;
- keep exact prices and supplier identity locked until access exists;
- support filters by species, origin, supplier country, state, certifications,
  incoterms, MOQ and delivery basis.

Access rules:

- public views must not include `supplier_id`, exact `price_min`,
  `price_max`, supplier name, website, WhatsApp or contacts;
- public views may include payment terms, incoterms, delivery basis and
  published production capability facts when those fields are explicitly marked
  public;
- qualified views can include exact prices and supplier identity only when RLS
  confirms buyer access;
- owner views expose full offer management to supplier users.

### Access Requests

Tables:

- `supplier_access_requests`
- `price_access_requests`
- `access_grants`
- `access_events`
- `access_notifications`

Statuses:

- `sent`
- `pending`
- `approved`
- `rejected`
- `expired`

Purpose:

- replace localStorage mock approval;
- connect buyer request, supplier decision and buyer notification;
- create an audit trail for sensitive data access.

Required behavior:

- buyer can request access in one click from supplier profile or offer;
- no extra "reason" step by default;
- default business intent is price and supplier identity access;
- supplier/admin can approve or reject;
- approval creates a grant and queues a notification;
- next buyer visit shows access approved notification;
- all views immediately reflect the new grant.

### RFQ And Product Requests

Tables:

- `buyer_requests`
- `buyer_request_items`
- `buyer_request_destinations`
- `supplier_responses`
- `request_events`
- `request_attachments`

Purpose:

- replace sessionStorage catalog request form;
- support the "not found" path;
- allow suppliers to respond with structured comparable offers.

Fields:

- species;
- Latin name;
- format and cut;
- state;
- packaging;
- volume;
- destination;
- incoterms;
- target delivery window;
- certifications;
- notes;
- photos or reference files.

### Procurement Workspace

Tables:

- `saved_offers`
- `shortlisted_suppliers`
- `watched_products`
- `watched_countries`
- `price_alerts`
- `buyer_activity`
- `compare_sessions`

Purpose:

- make return visits valuable;
- support retention;
- replace `mockWorkspace`;
- connect catalog actions to user history.

### Notifications

Tables:

- `notifications`
- `notification_preferences`
- `notification_deliveries`

Channels:

- in-app;
- email;
- messenger-ready placeholder;
- agent-ready placeholder.

Events:

- supplier access approved;
- price access approved;
- new matching product;
- RFQ response;
- price movement;
- country news;
- document readiness;
- supplier profile review.

## RLS And Access Design

RLS must be treated as product logic, not as a later security patch.

Minimum RLS policies:

- user can read and update own profile;
- company member can read company data according to role;
- company admin can edit company profile;
- supplier owner can edit supplier profile and offers;
- buyer can read public suppliers and offers;
- buyer can read qualified data only with active grant;
- public users can read only public-safe views;
- no policy should expose contact, legal, exact price or full catalog data to
  locked access states.

Recommended access helper functions:

```sql
has_company_role(user_id, company_id, role)
has_supplier_access(user_id, supplier_id)
has_offer_price_access(user_id, offer_id)
is_company_member(user_id, company_id)
is_supplier_owner(user_id, supplier_id)
is_admin(user_id)
```

## API And Frontend Adapter Migration

Do not rewrite frontend pages first. Replace data sources behind existing
interfaces.

Recommended adapter files:

- `src/lib/account-api.ts`
- `src/lib/supplier-api.ts`
- `src/lib/offer-api.ts`
- `src/lib/access-api.ts`
- `src/lib/rfq-api.ts`
- `src/lib/notification-api.ts`

Migration pattern:

1. Keep mock fallback for preview stability.
2. Add API adapters with typed return shapes matching existing components.
3. Add loading, empty and error states.
4. Add tests for public, registered and qualified access.
5. Remove direct mock imports from page components.
6. Keep mock data only as seed fixtures or fallback.

## Implementation Phases

### Backend Phase 0: Contract And Gate Fixes

Goal:

Create a stable backend contract before expanding features.

Tasks:

- create `docs/backend/frontend-backend-contract.md`;
- document current frontend data dependencies;
- fix current `npm test` and `npm run lint` failures before backend expansion;
- inventory existing Supabase migrations as prototype/schema references only;
- define self-hosted API contracts and generated client type strategy;
- define local seed strategy;
- define `.env.example`.

Exit criteria:

- production build passes;
- lint passes;
- test suite passes or known failures are explicitly documented;
- backend contract maps every active frontend page to a data source.

### Backend Phase 1: Account Source Of Truth

Goal:

Make `/account/*` real.

Tasks:

- implement profiles and companies tables;
- implement company media storage;
- implement branch CRUD;
- implement product matrix CRUD;
- implement meta-region CRUD;
- implement notification preferences CRUD;
- connect frontend account pages to backend API adapters.

Exit criteria:

- account data survives browser/device changes;
- logo and cover are stored in self-hosted object storage;
- supplier profile preview uses saved company data;
- localStorage is only fallback, not source of truth.

### Backend Phase 2: Supplier Directory And Profile

Goal:

Make supplier discovery real and access-safe.

Tasks:

- migrate supplier data to database;
- build public and qualified supplier views;
- connect `/suppliers`;
- connect `/suppliers/:supplierId`;
- keep configured API failures fail-closed without substituting mock supplier
  rows or fallback profiles;
- keep production/logistics dossier facts in the supplier directory contract/API,
  not in frontend hash-based profile synthesis;
- keep locked DOM free of hidden real values;
- add supplier owner view for own company.

Exit criteria:

- locked users cannot receive hidden supplier fields from backend;
- qualified users see approved data;
- supplier owner sees own full profile;
- browser and DOM leak tests pass.

### Backend Phase 3: Offer Catalog

Goal:

Make procurement catalog real.

Tasks:

- migrate offers, prices, media and terms to database;
- implement public and qualified offer views;
- connect filters to backend query;
- connect offer detail page;
- connect document readiness and offer media;
- preserve mock fallback for preview only.

Exit criteria:

- locked users do not receive exact prices or supplier identity;
- qualified users receive exact price and supplier details;
- filters work from backend;
- offer pages no longer depend on `mockOffers` as primary source.

### Backend Phase 4: Access Request Workflow

Goal:

Replace localStorage access request simulation.

Tasks:

- implement request tables;
- implement one-click request from supplier profile and offer page;
- implement status transitions;
- implement approval grant;
- implement next-visit notification;
- create admin or supplier-side approval placeholder.

Exit criteria:

- buyer request persists in database;
- approval changes frontend access level;
- buyer receives notification after approval;
- audit log records all sensitive access changes.

### Backend Phase 5: RFQ And Recovery Flow

Goal:

Turn "not found" into a real procurement request.

Tasks:

- implement structured RFQ tables;
- connect catalog empty state form;
- add supplier response model;
- add buyer request list in workspace;
- add basic notifications.

Exit criteria:

- buyer can submit request;
- request is visible in buyer workspace;
- supplier/admin can respond in a structured format;
- responses can be compared.

### Backend Phase 6: Buyer And Supplier Workspaces

Goal:

Create operating workspaces beyond public catalog.

Buyer workspace:

- saved offers;
- price requests;
- supplier access requests;
- RFQs;
- messages;
- watched products;
- price alerts;
- activity feed.

Supplier workspace:

- company profile;
- product catalog;
- offers and prices;
- buyer access requests;
- RFQ responses;
- documents;
- visibility analytics.

Exit criteria:

- users can return to ongoing work;
- suppliers can manage data without developer intervention;
- procurement activity is not lost between sessions.

### Backend Phase 7: Messaging, Documents And Notifications

Goal:

Support real deal communication.

Tasks:

- implement buyer-supplier threads;
- implement document requests;
- implement file storage and access control;
- implement in-app notifications;
- add email delivery;
- prepare messenger integrations.

Exit criteria:

- buyer and supplier can exchange structured messages;
- documents are gated and auditable;
- notifications are tied to real events.

### Backend Phase 8: Admin And Verification

Goal:

Make trust operational.

Tasks:

- supplier verification console;
- document review queue;
- company qualification;
- fraud and abuse moderation;
- access audit;
- support tools.

Exit criteria:

- supplier trust labels are backed by real review states;
- admin can approve, reject and audit;
- public trust claims are defensible.

## Testing Strategy

Backend work must not rely only on visual checks.

Required tests:

- RLS tests for anonymous, registered, qualified, supplier owner and admin;
- adapter tests for each frontend API wrapper;
- DOM leak tests for locked supplier and offer data;
- access request lifecycle tests;
- account persistence tests;
- upload validation tests;
- browser-level tests for critical flows;
- migration tests for seed data.

Current known quality risks from audit:

- supplier legal/compliance details, shipment evidence and FAQ source are now
  backend-owned through Phase 4C/4D supplier directory fields;
- supplier owner/admin editing is not implemented yet;
- API-disabled `mockSuppliers` preview still exists for local/Lovable preview
  and should be retired only by a separate demo-mode decision.

## Data Migration Rules

Mock data should become seed data, not disappear immediately.

Rules:

- keep `mockOffers` and `mockSuppliers` until self-hosted seed parity exists;
- migrate one frontend surface at a time;
- avoid big-bang replacement;
- keep deterministic demo data for Lovable preview;
- keep locked/qualified cases in seed data;
- all generated SQL and seed files must be local.

## Risk Register

| Risk | Why it matters | Mitigation |
|---|---|---|
| Frontend blur used as security | Hidden supplier data can leak through DOM/network | Enforce access in API queries and database views |
| Backend model diverges from frontend | UI breaks or becomes decorative | Frontend-backend contract first |
| Too much scope at once | Backend stalls and frontend quality regresses | Work by page and adapter |
| Mock data removed too early | Lovable preview loses stability | Keep fallback until seeded backend is stable |
| Supplier trust without operations | Verification badges become fake claims | Build admin verification states |
| Files only in cloud | Project becomes non-reproducible | Store migrations, functions, seed and docs locally |

## Immediate Next Actions

1. Copy this plan into the frontend repo under `docs/backend/`.
2. Create `frontend-backend-contract.md` from the active routes and components.
3. Fix current lint and test failures.
4. Inventory current Supabase migrations as prototype references only.
5. Create Phase 1 schema for account/company data.
6. Implement account adapters behind existing `/account/*` UI.
7. Add API access tests before moving supplier and offer data.

## Decision Summary

YORSO should not start backend from orders, payments, CRM or AI agents.

The correct first backend is:

1. identity;
2. company profile;
3. supplier profile;
4. offer catalog;
5. access control;
6. RFQ;
7. workspaces;
8. notifications and documents.

This sequence matches the frontend already built and protects the central
business rule of YORSO: exact price, supplier identity, contacts and commercial
detail are valuable data and must be disclosed only through controlled access.
