#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/backend/production-scale-baseline.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-validation.md",
  "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
  "packages/db/migrations/0006_offer_catalog.sql",
  "packages/db/migrations/0007_supplier_access_flow.sql",
  "packages/db/migrations/0008_access_notification_ack.sql",
  "packages/db/migration-manifest.json",
  "package.json",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-offer-detail.mjs",
  "src/lib/offer-catalog-api.ts",
  "src/lib/use-offer-catalog.ts",
  "src/lib/use-offer-detail.ts",
  "src/lib/supplier-directory-api.ts",
  "src/lib/use-supplier-directory.ts",
  "src/lib/supplier-access-api.ts",
  "src/lib/supplier-access-requests.ts",
  "src/lib/supplier-approval-notifications.ts",
  "src/components/suppliers/SupplierApprovalNotifier.tsx",
  "src/components/suppliers/SupplierAccessRefreshBanner.tsx",
  "src/pages/Suppliers.tsx",
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
const offerCatalog = read("packages/db/migrations/0006_offer_catalog.sql");
const supplierAccess = read("packages/db/migrations/0007_supplier_access_flow.sql");
const accessNotificationAck = read("packages/db/migrations/0008_access_notification_ack.sql");
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const pkg = JSON.parse(read("package.json"));
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const offerDetailSmoke = read("scripts/smoke-self-hosted-offer-detail.mjs");
const offerApi = read("src/lib/offer-catalog-api.ts");
const useOfferCatalog = read("src/lib/use-offer-catalog.ts");
const useOfferDetail = read("src/lib/use-offer-detail.ts");
const supplierApi = read("src/lib/supplier-directory-api.ts");
const useSupplierDirectory = read("src/lib/use-supplier-directory.ts");
const supplierAccessApi = read("src/lib/supplier-access-api.ts");
const supplierAccessRequests = read("src/lib/supplier-access-requests.ts");
const supplierApprovalNotifications = read("src/lib/supplier-approval-notifications.ts");
const supplierApprovalNotifier = read("src/components/suppliers/SupplierApprovalNotifier.tsx");
const supplierAccessRefreshBanner = read("src/components/suppliers/SupplierAccessRefreshBanner.tsx");
const suppliersPage = read("src/pages/Suppliers.tsx");

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
  "0006_offer_catalog",
  "0007_supplier_access_flow",
  "0008_access_notification_ack",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "SupplierAccessRefreshBanner",
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
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "offer_catalog_private_search_requires_grant=ok",
  "offer_catalog_list_requires_grant=ok",
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
  "supplierCountryCode",
]) {
  requireText("src/lib/offer-catalog-api.ts", offerApi, marker);
}

for (const marker of [
  "useOfferCatalogList",
  "limit",
  "offset",
  "serverFiltered",
  "offerCatalogApiQueryFromFilters",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, marker);
}

for (const marker of [
  "useOfferDetail",
  "getOfferById",
  "createOfferCatalogApiClient",
  "findFallbackOfferById",
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
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "backend_notification",
  "mock_progression",
]) {
  requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, marker);
}

for (const marker of [
  "setTimeout",
  "limit: 50",
  "offset: 0",
]) {
  requireText("src/pages/Suppliers.tsx", suppliersPage, marker);
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
