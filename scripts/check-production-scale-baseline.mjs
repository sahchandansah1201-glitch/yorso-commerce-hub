#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  ".github/workflows/ci.yml",
  "docs/backend/production-scale-baseline.md",
  "docs/backend/self-hosted-production-policy.md",
  "docs/backend/self-hosted-production-deploy.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-validation.md",
  ".env.production.example",
  "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
  "packages/db/migrations/0009_supplier_directory_pagination_sort.sql",
  "packages/db/migrations/0006_offer_catalog.sql",
  "packages/db/migrations/0010_offer_catalog_pagination_sort.sql",
  "packages/db/migrations/0007_supplier_access_flow.sql",
  "packages/db/migrations/0008_access_notification_ack.sql",
  "packages/db/migrations/0011_auth_sessions.sql",
  "packages/db/migration-manifest.json",
  "package.json",
  "packages/contracts/src/auth.ts",
  "apps/api/src/modules/auth/factory.ts",
  "apps/api/src/modules/auth/postgres-repository.ts",
  "apps/api/src/modules/auth/repository.ts",
  "apps/api/src/modules/auth/routes.ts",
  "apps/api/src/modules/auth/service.ts",
  "scripts/smoke-self-hosted-auth-api.mjs",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-offer-detail.mjs",
  "scripts/smoke-e2e-self-hosted-access-runtime.mjs",
  "scripts/smoke-frontend-no-supabase-env.mjs",
  "scripts/check-self-hosted-production-runtime.mjs",
  "src/lib/auth-runtime.ts",
  "src/lib/auth-runtime.test.ts",
  "src/lib/auth-runtime.boundary.test.ts",
  "src/lib/legacy-auth-supabase-adapter.ts",
  "src/pages/SignIn.tsx",
  "src/pages/ResetPassword.tsx",
  "apps/api/src/modules/offers/repository.ts",
  "apps/api/src/modules/offers/postgres-repository.ts",
  "src/integrations/supabase/client.ts",
  "src/lib/catalog-api.ts",
  "src/lib/catalog-api.boundary.test.ts",
  "src/lib/legacy-catalog-supabase-adapter.ts",
  "src/lib/offer-catalog-api.ts",
  "src/lib/use-offer-catalog.ts",
  "src/lib/use-offer-detail.ts",
  "src/components/catalog/SelectedOfferPanel.tsx",
  "src/lib/supplier-directory-api.ts",
  "src/lib/use-supplier-directory.ts",
  "src/lib/supplier-access-api.ts",
  "src/lib/supplier-access-api.boundary.test.ts",
  "src/lib/supplier-access-requests.ts",
  "src/lib/legacy-supplier-access-supabase-adapter.ts",
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
  "e2e/supplier-directory-profile-api-flow.spec.ts",
  "e2e/offer-detail-runtime.spec.ts",
  "e2e/offer-catalog-detail-flow.spec.ts",
  "e2e/offer-catalog-detail-api-flow.spec.ts",
  "e2e/supplier-access-notification-center-api-flow.spec.ts",
  "e2e/self-hosted-access-runtime.spec.ts",
  "e2e/frontend-no-supabase-env.spec.ts",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const ciWorkflow = read(".github/workflows/ci.yml");
const baseline = read("docs/backend/production-scale-baseline.md");
const productionPolicy = read("docs/backend/self-hosted-production-policy.md");
const productionDeploy = read("docs/backend/self-hosted-production-deploy.md");
const productionEnv = read(".env.production.example");
const architecture = read("docs/backend/self-hosted-backend-architecture.md");
const validation = read("docs/backend/self-hosted-validation.md");
const supplierScaling = read("packages/db/migrations/0005_supplier_directory_search_scaling.sql");
const supplierPaginationSort = read("packages/db/migrations/0009_supplier_directory_pagination_sort.sql");
const offerCatalog = read("packages/db/migrations/0006_offer_catalog.sql");
const offerPaginationSort = read("packages/db/migrations/0010_offer_catalog_pagination_sort.sql");
const supplierAccess = read("packages/db/migrations/0007_supplier_access_flow.sql");
const accessNotificationAck = read("packages/db/migrations/0008_access_notification_ack.sql");
const authSessions = read("packages/db/migrations/0011_auth_sessions.sql");
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const pkg = JSON.parse(read("package.json"));
const authContract = read("packages/contracts/src/auth.ts");
const authFactory = read("apps/api/src/modules/auth/factory.ts");
const authPostgresRepository = read("apps/api/src/modules/auth/postgres-repository.ts");
const authRepository = read("apps/api/src/modules/auth/repository.ts");
const authRoutes = read("apps/api/src/modules/auth/routes.ts");
const authService = read("apps/api/src/modules/auth/service.ts");
const authApiSmoke = read("scripts/smoke-self-hosted-auth-api.mjs");
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const offerDetailSmoke = read("scripts/smoke-self-hosted-offer-detail.mjs");
const selfHostedAccessRuntimeSmoke = read("scripts/smoke-e2e-self-hosted-access-runtime.mjs");
const frontendNoSupabaseSmoke = read("scripts/smoke-frontend-no-supabase-env.mjs");
const productionRuntimeCheck = read("scripts/check-self-hosted-production-runtime.mjs");
const authRuntime = read("src/lib/auth-runtime.ts");
const authRuntimeTest = read("src/lib/auth-runtime.test.ts");
const authRuntimeBoundaryTest = read("src/lib/auth-runtime.boundary.test.ts");
const legacyAuthSupabaseAdapter = read("src/lib/legacy-auth-supabase-adapter.ts");
const signInPage = read("src/pages/SignIn.tsx");
const resetPasswordPage = read("src/pages/ResetPassword.tsx");
const offerRepository = read("apps/api/src/modules/offers/repository.ts");
const offerPostgresRepository = read("apps/api/src/modules/offers/postgres-repository.ts");
const supabaseClient = read("src/integrations/supabase/client.ts");
const catalogApi = read("src/lib/catalog-api.ts");
const catalogApiBoundaryTest = read("src/lib/catalog-api.boundary.test.ts");
const legacyCatalogSupabaseAdapter = read("src/lib/legacy-catalog-supabase-adapter.ts");
const offerApi = read("src/lib/offer-catalog-api.ts");
const useOfferCatalog = read("src/lib/use-offer-catalog.ts");
const useOfferDetail = read("src/lib/use-offer-detail.ts");
const selectedOfferPanel = read("src/components/catalog/SelectedOfferPanel.tsx");
const supplierApi = read("src/lib/supplier-directory-api.ts");
const useSupplierDirectory = read("src/lib/use-supplier-directory.ts");
const supplierAccessApi = read("src/lib/supplier-access-api.ts");
const supplierAccessApiBoundaryTest = read("src/lib/supplier-access-api.boundary.test.ts");
const supplierAccessRequests = read("src/lib/supplier-access-requests.ts");
const legacySupplierAccessSupabaseAdapter = read("src/lib/legacy-supplier-access-supabase-adapter.ts");
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
const supplierDirectoryProfileApiFlowE2E = read("e2e/supplier-directory-profile-api-flow.spec.ts");
const offerDetailRuntimeE2E = read("e2e/offer-detail-runtime.spec.ts");
const offerCatalogDetailFlowE2E = read("e2e/offer-catalog-detail-flow.spec.ts");
const offerCatalogDetailApiFlowE2E = read("e2e/offer-catalog-detail-api-flow.spec.ts");
const supplierAccessNotificationCenterApiFlowE2E = read("e2e/supplier-access-notification-center-api-flow.spec.ts");
const selfHostedAccessRuntimeE2E = read("e2e/self-hosted-access-runtime.spec.ts");
const frontendNoSupabaseE2E = read("e2e/frontend-no-supabase-env.spec.ts");

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
  "third-party application backends must not be production dependencies",
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
  "Batch #61",
  "Batch #62",
  "Batch #63",
  "Batch #64",
  "Batch #65",
  "Batch #66",
  "Batch #67",
  "Batch #68",
  "Batch #69",
  "Batch #70",
  "Batch #71",
  "Batch #72",
  "Batch #73",
  "notification center",
  "self-hosted auth/session foundation",
  "real self-hosted API browser smoke",
  "optional Supabase frontend smoke",
  "auth runtime adapter boundary",
  "legacy auth Supabase adapter boundary",
  "self-hosted production policy",
  "self-hosted production runtime guard",
  ".env.production.example",
  "legacy catalog Supabase adapter boundary",
  "legacy supplier access Supabase adapter boundary",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
  "offer detail runtime browser e2e",
  "offer catalog detail flow browser e2e",
  "supplier directory profile flow browser e2e",
  "API-backed supplier directory profile flow browser e2e",
  "API-backed offer catalog detail flow browser e2e",
  "API-backed supplier access notification center browser e2e",
  "API-backed access browser suite",
  "Supabase, Firebase, Appwrite, Clerk",
  "third-party application backends must not be production dependencies",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}

for (const marker of [
  "YORSO production must run as one self-hosted product on owned server",
  "Production runtime must not depend on Supabase, Firebase, Appwrite, Clerk",
  "Supabase files in this repository are not production architecture.",
  "Backend Boundary",
  "Deployment Boundary",
  "Batch #71",
  "Batch #72",
  "check:self-hosted-production-runtime",
  ".env.production.example",
]) {
  requireText("docs/backend/self-hosted-production-policy.md", productionPolicy, marker);
}

for (const marker of [
  "Batch: #72",
  "Self-Hosted Production Deploy",
  "Minimum production topology",
  "Production env must not contain",
  "check:self-hosted-production-runtime",
]) {
  requireText("docs/backend/self-hosted-production-deploy.md", productionDeploy, marker);
}

for (const marker of [
  "NODE_ENV=production",
  "VITE_YORSO_API_URL=https://api.yorso.example",
  "ACCOUNT_REPOSITORY=postgres",
  "DATABASE_URL=postgres://",
  "REDIS_URL=redis://redis:6379",
  "STORAGE_DRIVER=local",
]) {
  requireText(".env.production.example", productionEnv, marker);
}

if (/SUPABASE|FIREBASE|APPWRITE|CLERK|AUTH0/i.test(productionEnv)) {
  failures.push(".env.production.example: production runtime must not contain hosted BaaS/SaaS provider settings");
}

if (pkg.scripts["check:self-hosted-production-runtime"] !== "node scripts/check-self-hosted-production-runtime.mjs") {
  failures.push("package.json: check:self-hosted-production-runtime must run the production runtime guard");
}

if (!pkg.scripts["ci:core"]?.includes("npm run check:self-hosted-production-runtime")) {
  failures.push("package.json: ci:core must run check:self-hosted-production-runtime");
}

for (const marker of [
  ".env.production.example",
  "docs/backend/self-hosted-production-deploy.md",
  "ci:core enforces check:self-hosted-production-runtime",
]) {
  requireText("scripts/check-self-hosted-production-runtime.mjs", productionRuntimeCheck, marker);
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
  "API-backed offer catalog detail flow browser e2e",
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
  "API-backed offer catalog detail flow",
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
if (!manifest.migrations?.some((migration) => migration.id === "0011_auth_sessions")) {
  failures.push("packages/db/migration-manifest.json: missing 0011_auth_sessions");
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

if (pkg.scripts["smoke:self-hosted-auth-api"] !== "npm run api:build && npm run smoke:self-hosted-auth-api:run") {
  failures.push("package.json: smoke:self-hosted-auth-api must build and run the self-hosted auth API smoke");
}
if (pkg.scripts["smoke:self-hosted-auth-api:run"] !== "node scripts/smoke-self-hosted-auth-api.mjs") {
  failures.push("package.json: smoke:self-hosted-auth-api:run must execute scripts/smoke-self-hosted-auth-api.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-auth-api:run")) {
  failures.push("package.json: ci:core must run the self-hosted auth API smoke");
}

for (const marker of [
  "authSignInSchema",
  "authSessionSchema",
  "authSessionResponseSchema",
  "authSignOutResponseSchema",
]) {
  requireText("packages/contracts/src/auth.ts", authContract, marker);
}

for (const marker of [
  "create table if not exists yorso_auth_credentials",
  "create table if not exists yorso_auth_sessions",
  "idx_yorso_auth_sessions_user_active",
]) {
  requireText("packages/db/migrations/0011_auth_sessions.sql", authSessions, marker);
}

for (const marker of [
  "createAuthRepository",
  "PostgresAuthRepository",
  "MemoryAuthRepository",
]) {
  requireText("apps/api/src/modules/auth/factory.ts", authFactory, marker);
}

for (const marker of [
  "class PostgresAuthRepository",
  "from yorso_users u",
  "join yorso_auth_credentials",
  "insert into yorso_auth_sessions",
  "revoked_at",
]) {
  requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, marker);
}

for (const marker of [
  "interface AuthRepository",
  "class MemoryAuthRepository",
  "buyer@example.com",
]) {
  requireText("apps/api/src/modules/auth/repository.ts", authRepository, marker);
}

for (const marker of [
  "/v1/auth/sign-in",
  "/v1/auth/session",
  "/v1/auth/sign-out",
  "accountSessionIdHeaderName",
]) {
  requireText("apps/api/src/modules/auth/routes.ts", authRoutes, marker);
}

for (const marker of [
  "AuthService",
  "authSignInSchema.parse",
  "auth_invalid_credentials",
  "sha256:",
]) {
  requireText("apps/api/src/modules/auth/service.ts", authService, marker);
}

for (const marker of [
  "auth_sign_in=ok",
  "auth_session=ok",
  "auth_sign_out=ok",
  "auth_invalid_credentials_guard=ok",
  "auth_validation_guard=ok",
  "self_hosted_auth_api_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-auth-api.mjs", authApiSmoke, marker);
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
  "self-hosted-first catalog facade",
  "createOfferCatalogApiClient",
  "fetchLegacyCatalogOffers",
  "fetchLegacyCatalogOfferById",
]) {
  requireText("src/lib/catalog-api.ts", catalogApi, marker);
}
for (const marker of [
  "@/integrations/supabase/client",
  "SUPABASE_NOT_CONFIGURED_ERROR",
  "fetchLegacyCatalogOffers",
  "fetchLegacyCatalogOfferById",
]) {
  requireText("src/lib/legacy-catalog-supabase-adapter.ts", legacyCatalogSupabaseAdapter, marker);
}
for (const marker of [
  "uses self-hosted offer catalog before legacy Supabase fallback",
  "keeps direct Supabase imports out of catalog-api.ts",
]) {
  requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, marker);
}
if (catalogApi.includes("@/integrations/supabase/client")) {
  failures.push("src/lib/catalog-api.ts: must not import Supabase client directly");
}
if (!pkg.scripts["test:offer-catalog-frontend"]?.includes("src/lib/catalog-api.boundary.test.ts")) {
  failures.push("package.json: test:offer-catalog-frontend must cover src/lib/catalog-api.boundary.test.ts");
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
  "legacy-supplier-access-supabase-adapter",
]) {
  requireText("src/lib/supplier-access-api.ts", supplierAccessApi, marker);
}
for (const marker of [
  "@/integrations/supabase/client",
  "readLegacySupplierAccessRequest",
  "requestLegacySupplierAccess",
  "log_supplier_access_event",
  "supplier_access_requests",
]) {
  requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, marker);
}
for (const marker of [
  "keeps direct Supabase imports out of supplier-access-api.ts",
  "isolated legacy Supabase adapter",
]) {
  requireText("src/lib/supplier-access-api.boundary.test.ts", supplierAccessApiBoundaryTest, marker);
}
if (supplierAccessApi.includes("@/integrations/supabase/client")) {
  failures.push("src/lib/supplier-access-api.ts: must not import Supabase client directly");
}
if (!pkg.scripts["test:supplier-access-frontend"]?.includes("src/lib/supplier-access-api.boundary.test.ts")) {
  failures.push("package.json: test:supplier-access-frontend must cover src/lib/supplier-access-api.boundary.test.ts");
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
  "Batch #61 API-backed browser-level guard",
  "self-hosted API adapter",
  "backend approval unlocks the matching supplier after profile refresh and directory return",
  "backend approval for another supplier does not unlock the current directory/profile flow",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
  "Nordfjord Sjømat AS",
  "supplier-access-refresh-banner",
]) {
  requireText("e2e/supplier-directory-profile-api-flow.spec.ts", supplierDirectoryProfileApiFlowE2E, marker);
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-api-flow must build with the API-backed supplier directory/profile flow enabled");
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-api-flow:run"]?.includes("e2e/supplier-directory-profile-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-api-flow:run must cover API-backed supplier directory/profile approval bridge e2e");
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
for (const marker of [
  "Batch #62 API-backed browser-level guard",
  "self-hosted API adapter",
  "backend approval unlocks the matching offer after detail refresh and catalog return",
  "backend approval for another supplier does not unlock the current catalog/detail flow",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
  "Nordic Seafood AS",
  "supplier-access-refresh-banner",
]) {
  requireText("e2e/offer-catalog-detail-api-flow.spec.ts", offerCatalogDetailApiFlowE2E, marker);
}
for (const marker of [
  "Batch #63 API-backed browser-level guard",
  "self-hosted API adapter",
  "Header notification center uses the self-hosted API adapter when configured",
  "the bell itself does not auto-load feed data on render",
  "opening the bell refreshes `/v1/access/notifications`",
  "Mark all read and row open acknowledge notifications through PATCH",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
  "header-supplier-access-notifications-bell",
  "supplier-access-notifications-mark-all",
  "x-yorso-user-id",
  "x-yorso-session-id",
]) {
  requireText(
    "e2e/supplier-access-notification-center-api-flow.spec.ts",
    supplierAccessNotificationCenterApiFlowE2E,
    marker,
  );
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-api-flow must build with the API-backed offer catalog/detail flow enabled");
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-api-flow:run"]?.includes("e2e/offer-catalog-detail-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-api-flow:run must cover API-backed offer catalog/detail approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:supplier-access-notification-center-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:supplier-access-notification-center-api-flow must build with the API-backed notification center enabled");
}
if (!pkg.scripts["smoke:e2e:supplier-access-notification-center-api-flow:run"]?.includes("e2e/supplier-access-notification-center-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-access-notification-center-api-flow:run must cover API-backed notification center e2e");
}
if (!pkg.scripts["smoke:e2e:api-backed-access-flows"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:api-backed-access-flows must build with the API-backed access suite enabled");
}
for (const spec of [
  "e2e/supplier-directory-profile-api-flow.spec.ts",
  "e2e/offer-catalog-detail-api-flow.spec.ts",
  "e2e/supplier-access-notification-center-api-flow.spec.ts",
]) {
  if (!pkg.scripts["smoke:e2e:api-backed-access-flows:run"]?.includes(spec)) {
    failures.push(`package.json: smoke:e2e:api-backed-access-flows:run must include ${spec}`);
  }
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run API-backed access browser suite");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:api-backed-access-flows");
if (pkg.scripts["smoke:e2e:frontend-no-supabase-env"] !== "node scripts/smoke-frontend-no-supabase-env.mjs") {
  failures.push("package.json: smoke:e2e:frontend-no-supabase-env must run the no-Supabase frontend smoke wrapper");
}
if (pkg.scripts["test:auth-runtime"] !== "vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts") {
  failures.push("package.json: test:auth-runtime must cover the auth runtime adapter boundary");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:auth-runtime")) {
  failures.push("package.json: ci:core must run test:auth-runtime");
}
if (!pkg.scripts["smoke:e2e:frontend-no-supabase-env:run"]?.includes("e2e/frontend-no-supabase-env.spec.ts")) {
  failures.push("package.json: smoke:e2e:frontend-no-supabase-env:run must cover the no-Supabase frontend e2e spec");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:frontend-no-supabase-env")) {
  failures.push("package.json: ci:full must include the no-Supabase frontend smoke");
}
for (const marker of [
  "VITE_SUPABASE_URL: \"\"",
  "VITE_SUPABASE_PUBLISHABLE_KEY: \"\"",
  "VITE_YORSO_API_URL: \"\"",
  "frontend_no_supabase_env_smoke=ok",
]) {
  requireText("scripts/smoke-frontend-no-supabase-env.mjs", frontendNoSupabaseSmoke, marker);
}
for (const marker of [
  "Batch #66 optional Supabase frontend smoke",
  "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are intentionally empty",
  "frontend-no-supabase-env",
]) {
  requireText("e2e/frontend-no-supabase-env.spec.ts", frontendNoSupabaseE2E, marker);
}
for (const marker of [
  "isSupabaseConfigured",
  "SUPABASE_NOT_CONFIGURED_ERROR",
  "createDisabledSupabaseClient",
]) {
  requireText("src/integrations/supabase/client.ts", supabaseClient, marker);
}
for (const marker of [
  "signInWithEmail",
  "requestPasswordReset",
  "observePasswordRecovery",
  "updateRecoveredPassword",
  "supabase_prototype",
  "local_contract",
  "legacy-auth-supabase-adapter",
]) {
  requireText("src/lib/auth-runtime.ts", authRuntime, marker);
}
if (authRuntime.includes("@/integrations/supabase/client")) {
  failures.push("src/lib/auth-runtime.ts: must not import Supabase client directly");
}
for (const marker of [
  "auth-runtime adapter boundary",
  "uses local contract auth when Supabase is not configured",
  "delegates email sign-in and reset to prototype Supabase only when configured",
]) {
  requireText("src/lib/auth-runtime.test.ts", authRuntimeTest, marker);
}
for (const marker of [
  "keeps direct Supabase imports out of auth-runtime.ts",
  "legacy-auth-supabase-adapter",
  "isLegacyAuthSupabaseConfigured",
]) {
  requireText("src/lib/auth-runtime.boundary.test.ts", authRuntimeBoundaryTest, marker);
}
for (const marker of [
  "@/integrations/supabase/client",
  "isLegacyAuthSupabaseConfigured",
  "signInWithPrototypeSupabase",
  "requestPrototypePasswordReset",
  "observePrototypePasswordRecovery",
  "updatePrototypeRecoveredPassword",
]) {
  requireText("src/lib/legacy-auth-supabase-adapter.ts", legacyAuthSupabaseAdapter, marker);
}
requireText("src/pages/SignIn.tsx", signInPage, "@/lib/auth-runtime");
requireText("src/pages/ResetPassword.tsx", resetPasswordPage, "@/lib/auth-runtime");
if (signInPage.includes("@/integrations/supabase/client")) {
  failures.push("src/pages/SignIn.tsx: must not import Supabase client directly");
}
if (resetPasswordPage.includes("@/integrations/supabase/client")) {
  failures.push("src/pages/ResetPassword.tsx: must not import Supabase client directly");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run frontend without Supabase env smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:frontend-no-supabase-env");
if (pkg.scripts["smoke:e2e:self-hosted-access-runtime"] !== "npm run api:build && node scripts/smoke-e2e-self-hosted-access-runtime.mjs") {
  failures.push("package.json: smoke:e2e:self-hosted-access-runtime must run the real self-hosted access runtime browser smoke");
}
if (!pkg.scripts["smoke:e2e:self-hosted-access-runtime:run"]?.includes("e2e/self-hosted-access-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:self-hosted-access-runtime:run must cover real self-hosted access runtime e2e");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:self-hosted-access-runtime")) {
  failures.push("package.json: ci:full must include the real self-hosted API browser smoke");
}
for (const marker of [
  "Batch #65 real self-hosted API browser guard",
  "real memory-mode apps/api process",
  "no Playwright route interception",
  "VITE_YORSO_API_URL",
  "supplier-request-price-access",
  "Nordfjord Sjømat AS",
  "self_hosted_access_runtime_e2e=ok",
]) {
  requireText("e2e/self-hosted-access-runtime.spec.ts", selfHostedAccessRuntimeE2E, marker);
}
for (const marker of [
  "VITE_YORSO_API_URL: apiBaseUrl",
  "E2E_YORSO_API_URL: apiBaseUrl",
  "self_hosted_access_runtime_e2e=ok",
]) {
  requireText("scripts/smoke-e2e-self-hosted-access-runtime.mjs", selfHostedAccessRuntimeSmoke, marker);
}
requireText("apps/api/src/modules/offers/repository.ts", offerRepository, "normalizeOfferCatalogId");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "normalizeOfferCatalogId");
requireText(".github/workflows/ci.yml", ciWorkflow, "Run self-hosted access runtime browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:self-hosted-access-runtime");

if (failures.length > 0) {
  console.error("Production scale baseline check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production scale baseline check passed.");
console.log("- 10,000 concurrent-user target is documented.");
console.log("- supplier, offer and access-flow paths have scaling guardrails.");
console.log("- ci:core enforces the baseline check.");
