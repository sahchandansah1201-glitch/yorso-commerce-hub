#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/backend/production-scale-baseline.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-validation.md",
  "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
  "packages/db/migrations/0009_supplier_directory_pagination_sort.sql",
  "packages/db/migrations/0006_offer_catalog.sql",
  "packages/db/migrations/0010_offer_catalog_pagination_sort.sql",
  "packages/db/migrations/0007_supplier_access_flow.sql",
  "packages/db/migrations/0008_access_notification_ack.sql",
  "packages/db/migration-manifest.json",
  "package.json",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-offer-detail.mjs",
  "src/lib/offer-catalog-api.ts",
  "src/lib/use-offer-catalog.ts",
  "src/lib/use-offer-detail.ts",
  "src/components/catalog/SelectedOfferPanel.tsx",
  "src/lib/supplier-directory-api.ts",
  "src/lib/use-supplier-directory.ts",
  "src/lib/supplier-access-api.ts",
  "src/lib/supplier-access-requests.ts",
  "src/lib/supplier-approval-notifications.ts",
  "src/components/suppliers/SupplierApprovalNotifier.tsx",
  "src/lib/use-supplier-access-notifications.ts",
  "src/components/suppliers/SupplierAccessNotificationCenter.tsx",
  "src/components/suppliers/SupplierAccessRefreshBanner.tsx",
  "src/components/landing/Header.tsx",
  "src/pages/Suppliers.tsx",
  "src/pages/Offers.tsx",
  "e2e/offers-catalog-paging.spec.ts",
  "e2e/suppliers-directory-paging.spec.ts",
  "e2e/supplier-profile-detail.spec.ts",
  "e2e/supplier-directory-profile-flow.spec.ts",
  "e2e/offer-detail-runtime.spec.ts",
  "e2e/offer-catalog-detail-flow.spec.ts",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const baseline = read("docs/backend/production-scale-baseline.md");
const architecture = read("docs/backend/self-hosted-backend-architecture.md");
const validation = read("docs/backend/self-hosted-validation.md");
const supplierScaling = read("packages/db/migrations/0005_supplier_directory_search_scaling.sql");
const supplierPaginationSort = read("packages/db/migrations/0009_supplier_directory_pagination_sort.sql");
const offerCatalog = read("packages/db/migrations/0006_offer_catalog.sql");
const offerPaginationSort = read("packages/db/migrations/0010_offer_catalog_pagination_sort.sql");
const supplierAccess = read("packages/db/migrations/0007_supplier_access_flow.sql");
const accessNotificationAck = read("packages/db/migrations/0008_access_notification_ack.sql");
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const pkg = JSON.parse(read("package.json"));
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const offerDetailSmoke = read("scripts/smoke-self-hosted-offer-detail.mjs");
const offerApi = read("src/lib/offer-catalog-api.ts");
const useOfferCatalog = read("src/lib/use-offer-catalog.ts");
const useOfferDetail = read("src/lib/use-offer-detail.ts");
const selectedOfferPanel = read("src/components/catalog/SelectedOfferPanel.tsx");
const supplierApi = read("src/lib/supplier-directory-api.ts");
const useSupplierDirectory = read("src/lib/use-supplier-directory.ts");
const supplierAccessApi = read("src/lib/supplier-access-api.ts");
const supplierAccessRequests = read("src/lib/supplier-access-requests.ts");
const supplierApprovalNotifications = read("src/lib/supplier-approval-notifications.ts");
const supplierApprovalNotifier = read("src/components/suppliers/SupplierApprovalNotifier.tsx");
const useSupplierAccessNotifications = read("src/lib/use-supplier-access-notifications.ts");
const supplierAccessNotificationCenter = read("src/components/suppliers/SupplierAccessNotificationCenter.tsx");
const supplierAccessRefreshBanner = read("src/components/suppliers/SupplierAccessRefreshBanner.tsx");
const header = read("src/components/landing/Header.tsx");
const suppliersPage = read("src/pages/Suppliers.tsx");
const offersPage = read("src/pages/Offers.tsx");
const offersCatalogPagingE2E = read("e2e/offers-catalog-paging.spec.ts");
const suppliersDirectoryPagingE2E = read("e2e/suppliers-directory-paging.spec.ts");
const supplierProfileDetailE2E = read("e2e/supplier-profile-detail.spec.ts");
const supplierDirectoryProfileFlowE2E = read("e2e/supplier-directory-profile-flow.spec.ts");
const offerDetailRuntimeE2E = read("e2e/offer-detail-runtime.spec.ts");
const offerCatalogDetailFlowE2E = read("e2e/offer-catalog-detail-flow.spec.ts");

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

for (const marker of [
  "10,000 concurrent web users",
  "Required Capacity Review",
  "Connection strategy",
  "Queue/backpressure",
  "Observability",
  "Load test",
  "Supabase may remain as prototype/reference tooling, not as production",
  "Batch #36 promotes the target",
  "self-hosted offer detail smoke",
  "Batch #50",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "Batch #51",
  "Batch #52",
  "Batch #53",
  "Batch #54",
  "Batch #55",
  "Batch #56",
  "Batch #57",
  "Batch #58",
  "Batch #59",
  "Batch #60",
  "notification center",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
  "offer detail runtime browser e2e",
  "offer catalog detail flow browser e2e",
  "supplier directory profile flow browser e2e",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}

for (const marker of [
  "10,000 concurrent web users",
  "10,000 direct PostgreSQL connections are not an acceptable architecture",
  "PgBouncer",
  "Redis",
  "queue workers",
  "0005_supplier_directory_search_scaling",
  "0009_supplier_directory_pagination_sort",
  "0006_offer_catalog",
  "0007_supplier_access_flow",
  "0008_access_notification_ack",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "SupplierAccessRefreshBanner",
  "SupplierAccessNotificationCenter",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
  "offer catalog detail flow browser e2e",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}

for (const marker of [
  "check:production-scale-baseline",
  "10,000 concurrent-user read path",
  "supplier-directory trigram search indexes",
  "offer-catalog trigram search indexes",
  "self-hosted offer detail smoke",
  "supplier-access request and grant indexes",
  "access notification acknowledgement",
  "supplier-access change event",
  "refresh banner",
  "notification center",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}

for (const marker of [
  "create extension if not exists pg_trgm",
  "gin_trgm_ops",
  "idx_yorso_suppliers_directory_public_search_text",
  "idx_yorso_suppliers_directory_private_search_text",
  "idx_yorso_suppliers_directory_product_focus_search",
  "idx_yorso_suppliers_directory_certifications_search",
  "idx_yorso_suppliers_directory_verification_level",
  "high-concurrency catalog traffic",
]) {
  requireText("packages/db/migrations/0005_supplier_directory_search_scaling.sql", supplierScaling, marker);
}

for (const marker of [
  "idx_yorso_suppliers_directory_published_updated",
  "idx_yorso_suppliers_directory_published_country",
  "idx_yorso_suppliers_directory_published_verification_updated",
  "idx_yorso_suppliers_directory_published_response_updated",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0009_supplier_directory_pagination_sort.sql", supplierPaginationSort, marker);
}

for (const marker of [
  "idx_yorso_offers_catalog_public_search_text",
  "idx_yorso_offers_catalog_private_search_text",
  "idx_yorso_offers_catalog_certifications_search",
  "idx_yorso_offers_catalog_category",
  "idx_yorso_offers_catalog_origin_code",
  "idx_yorso_offers_catalog_supplier_country_code",
  "gin_trgm_ops",
  "high-concurrency catalog traffic",
]) {
  requireText("packages/db/migrations/0006_offer_catalog.sql", offerCatalog, marker);
}

for (const marker of [
  "idx_yorso_offers_catalog_published_updated",
  "idx_yorso_offers_catalog_published_category",
  "idx_yorso_offers_catalog_published_origin",
  "idx_yorso_offers_catalog_published_moq",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0010_offer_catalog_pagination_sort.sql", offerPaginationSort, marker);
}

for (const marker of [
  "idx_yorso_supplier_access_requests_buyer",
  "idx_yorso_supplier_access_requests_supplier_status",
  "idx_yorso_access_grants_buyer_supplier_scope",
  "idx_yorso_access_notifications_buyer_status_created",
]) {
  requireText("packages/db/migrations/0007_supplier_access_flow.sql", supplierAccess, marker);
}

for (const marker of [
  "notification_read",
  "PATCH /v1/access/notifications",
  "idx_yorso_access_notifications_buyer_status_created",
]) {
  requireText("packages/db/migrations/0008_access_notification_ack.sql", accessNotificationAck, marker);
}

if (!manifest.migrations?.some((migration) => migration.id === "0005_supplier_directory_search_scaling")) {
  failures.push("packages/db/migration-manifest.json: missing 0005_supplier_directory_search_scaling");
}
if (!manifest.migrations?.some((migration) => migration.id === "0006_offer_catalog")) {
  failures.push("packages/db/migration-manifest.json: missing 0006_offer_catalog");
}
if (!manifest.migrations?.some((migration) => migration.id === "0007_supplier_access_flow")) {
  failures.push("packages/db/migration-manifest.json: missing 0007_supplier_access_flow");
}
if (!manifest.migrations?.some((migration) => migration.id === "0008_access_notification_ack")) {
  failures.push("packages/db/migration-manifest.json: missing 0008_access_notification_ack");
}
if (!manifest.migrations?.some((migration) => migration.id === "0009_supplier_directory_pagination_sort")) {
  failures.push("packages/db/migration-manifest.json: missing 0009_supplier_directory_pagination_sort");
}
if (!manifest.migrations?.some((migration) => migration.id === "0010_offer_catalog_pagination_sort")) {
  failures.push("packages/db/migration-manifest.json: missing 0010_offer_catalog_pagination_sort");
}

if (pkg.scripts["check:production-scale-baseline"] !== "node scripts/check-production-scale-baseline.mjs") {
  failures.push("package.json: check:production-scale-baseline script missing or incorrect");
}

if (!pkg.scripts["ci:core"]?.includes("npm run check:production-scale-baseline")) {
  failures.push("package.json: ci:core must run check:production-scale-baseline");
}

if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-offer-detail:run")) {
  failures.push("package.json: ci:core must run the self-hosted offer detail smoke");
}

for (const marker of [
  "supplier_directory_locked=ok",
  "supplier_directory_requires_grant=ok",
  "supplier_directory_private_search_requires_grant=ok",
  "supplier_directory_unlocked=ok",
  "supplier_directory_granted_private_search=ok",
  "supplier_directory_ungranted_private_search_guard=ok",
  "supplier_directory_sort_pagination=ok",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "offer_catalog_private_search_requires_grant=ok",
  "offer_catalog_list_requires_grant=ok",
  "offer_catalog_sort_pagination=ok",
  "offer_catalog_granted_private_search=ok",
  "offer_catalog_ungranted_private_search_guard=ok",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "supplier_access_notifications=ok",
  "supplier_access_notifications_ack=ok",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "offer_detail_locked=ok",
  "offer_detail_requires_grant=ok",
  "offer_detail_unlocked=ok",
  "offer_detail_not_found=ok",
  "offer_detail_method_guard=ok",
  "self_hosted_offer_detail_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, marker);
}

for (const marker of [
  "limit",
  "offset",
  "sortBy",
  "sortDirection",
  "supplierCountryCode",
  "getApprovedSupplierAccessIds",
  "fallbackOfferForSupplierAccess",
]) {
  requireText("src/lib/offer-catalog-api.ts", offerApi, marker);
}

for (const marker of [
  "useOfferCatalogList",
  "limit",
  "offset",
  "sortBy",
  "sortDirection",
  "serverFiltered",
  "offerCatalogApiQueryFromFilters",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "getApprovedSupplierAccessIds",
  "fallbackOffersForSupplierAccess",
  "client.enabled && level !== \"anonymous_locked\"",
]) {
  requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, marker);
}

for (const marker of [
  "pageSize",
  "offset: (page - 1) * pageSize",
  "offer-catalog-sort",
  "offer-catalog-page-size",
  "offer-catalog-pagination",
  "useSearchParams",
  "forceLevel={offerAccessLevel(offer)}",
]) {
  requireText("src/pages/Offers.tsx", offersPage, marker);
}
requireText("src/components/catalog/SelectedOfferPanel.tsx", selectedOfferPanel, "forceLevel?: AccessLevel");

for (const marker of [
  "Batch #55 browser-level guard",
  "offer-catalog-sort",
  "offer-catalog-direction",
  "offer-catalog-page-size",
  "offer-catalog-page-summary",
  "offer-catalog-pagination",
  "Nordic Seafood AS",
  "qualified_unlocked",
]) {
  requireText("e2e/offers-catalog-paging.spec.ts", offersCatalogPagingE2E, marker);
}

if (!pkg.scripts["smoke:e2e:offers-catalog:run"]?.includes("e2e/offers-catalog-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:offers-catalog:run must cover /offers catalog paging e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offers-catalog-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers catalog paging e2e");
}

for (const marker of [
  "useOfferDetail",
  "getOfferById",
  "createOfferCatalogApiClient",
  "findFallbackOfferByIdForSupplierAccess",
  "client.enabled && level !== \"anonymous_locked\"",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-offer-detail.ts", useOfferDetail, marker);
}

for (const marker of [
  "limit",
  "offset",
  "verificationLevel",
]) {
  requireText("src/lib/supplier-directory-api.ts", supplierApi, marker);
}

for (const marker of [
  "useSupplierDirectoryList",
  "useSupplierDirectoryDetail",
  "serverFiltered",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, marker);
}

for (const marker of [
  "export const SUPPLIER_ACCESS_CHANGE_EVENT",
  "window.dispatchEvent",
]) {
  requireText("src/lib/supplier-access-requests.ts", supplierAccessRequests, marker);
}

for (const marker of [
  "acknowledgeSupplierAccessNotifications",
  "/v1/access/notifications",
  "PATCH",
]) {
  requireText("src/lib/supplier-access-api.ts", supplierAccessApi, marker);
}

for (const marker of [
  "BACKEND_NOTIFICATION_POLL_MS = 60_000",
  "MOCK_ACCESS_TICK_MS = 2_000",
]) {
  requireText("src/lib/supplier-approval-notifications.ts", supplierApprovalNotifications, marker);
}

for (const marker of [
  "visibilitychange",
  "backendSyncInFlight",
  "acknowledgeSupplierAccessNotifications",
]) {
  requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, marker);
}

for (const marker of [
  "useSupplierAccessNotifications",
  "readSupplierAccessNotifications",
  "acknowledgeSupplierAccessNotifications",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, marker);
}

for (const marker of [
  "SupplierAccessNotificationBell",
  "supplier_notifications_title",
  "markAllRead",
  "autoLoad: false",
  "header-supplier-access-notifications-bell",
]) {
  requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, marker);
}
requireText("src/components/landing/Header.tsx", header, "SupplierAccessNotificationBell");

for (const marker of [
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "backend_notification",
  "mock_progression",
]) {
  requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, marker);
}

for (const marker of [
  "setTimeout",
  "pageSize",
  "offset: (page - 1) * pageSize",
  "supplier-directory-search",
  "supplier-directory-page-size",
  "supplier-directory-pagination",
  "supplierAccessLevel",
]) {
  requireText("src/pages/Suppliers.tsx", suppliersPage, marker);
}
for (const marker of [
  "getApprovedSupplierAccessIds",
  "client.enabled && accessLevel !== \"anonymous_locked\"",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, marker);
}

for (const marker of [
  "Batch #56 browser-level guard",
  "supplier-directory-search",
  "supplier-directory-sort",
  "supplier-directory-direction",
  "supplier-directory-page-size",
  "supplier-directory-page-summary",
  "supplier-directory-pagination",
  "Nordfjord Sjømat AS",
  "qualified_unlocked",
]) {
  requireText("e2e/suppliers-directory-paging.spec.ts", suppliersDirectoryPagingE2E, marker);
}

if (!pkg.scripts["smoke:e2e:suppliers-directory:run"]?.includes("e2e/suppliers-directory-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:suppliers-directory:run must cover /suppliers directory paging e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/suppliers-directory-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers directory paging e2e");
}
for (const marker of [
  "Batch #57 browser-level guard",
  "supplier-request-price-access",
  "supplier-access-refresh-banner",
  "supplier-access-refresh-now",
  "unknown supplier renders not found",
  "Nordfjord Sjømat AS",
]) {
  requireText("e2e/supplier-profile-detail.spec.ts", supplierProfileDetailE2E, marker);
}
if (!pkg.scripts["smoke:e2e:supplier-profile-detail:run"]?.includes("e2e/supplier-profile-detail.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-profile-detail:run must cover /suppliers/:id profile detail e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/supplier-profile-detail.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers/:id profile detail e2e");
}
for (const marker of [
  "Batch #60 browser-level guard",
  "directory/profile access bridge",
  "approval on profile unlocks the matching directory row after return",
  "unrelated approval does not unlock the directory/profile flow",
  "q=salmon",
  "filter=salmon",
  "Nordfjord Sjømat AS",
  "supplier-access-refresh-banner",
]) {
  requireText("e2e/supplier-directory-profile-flow.spec.ts", supplierDirectoryProfileFlowE2E, marker);
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-flow:run"]?.includes("e2e/supplier-directory-profile-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-flow:run must cover supplier directory/profile approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/supplier-directory-profile-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include supplier directory/profile approval bridge e2e");
}
for (const marker of [
  "Batch #58 browser-level guard",
  "supplier-request-price-access",
  "supplier-access-refresh-banner",
  "supplier-access-refresh-now",
  "unknown offer renders not found",
  "EXACT_PRICE_PATTERN",
]) {
  requireText("e2e/offer-detail-runtime.spec.ts", offerDetailRuntimeE2E, marker);
}
if (!pkg.scripts["smoke:e2e:offer-detail-runtime:run"]?.includes("e2e/offer-detail-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-detail-runtime:run must cover /offers/:id runtime approval e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offer-detail-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers/:id runtime approval e2e");
}
for (const marker of [
  "Batch #59 browser-level guard",
  "catalog/detail access bridge",
  "approval on detail unlocks the matching catalog row after return",
  "unrelated approval does not unlock the catalog/detail flow",
  "offer-detail-back-to-catalog",
  "qualified_unlocked",
]) {
  requireText("e2e/offer-catalog-detail-flow.spec.ts", offerCatalogDetailFlowE2E, marker);
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-flow:run"]?.includes("e2e/offer-catalog-detail-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-flow:run must cover catalog/detail approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offer-catalog-detail-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include catalog/detail approval bridge e2e");
}

if (failures.length > 0) {
  console.error("Production scale baseline check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production scale baseline check passed.");
console.log("- 10,000 concurrent-user target is documented.");
console.log("- supplier, offer and access-flow paths have scaling guardrails.");
console.log("- ci:core enforces the baseline check.");
