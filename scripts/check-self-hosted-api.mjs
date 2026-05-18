#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  ".github/workflows/ci.yml",
  "apps/api/src/index.ts",
  "apps/api/src/server.ts",
  "apps/api/src/modules/account/factory.ts",
  "apps/api/src/modules/account/postgres-repository.ts",
  "apps/api/src/modules/account/repository.ts",
  "apps/api/src/modules/account/service.ts",
  "apps/api/src/modules/account/routes.ts",
  "apps/api/src/modules/access/factory.ts",
  "apps/api/src/modules/access/postgres-repository.ts",
  "apps/api/src/modules/access/repository.ts",
  "apps/api/src/modules/access/routes.ts",
  "apps/api/src/modules/access/service.ts",
  "apps/api/src/modules/auth/session.ts",
  "apps/api/src/modules/storage/factory.ts",
  "apps/api/src/modules/storage/object-storage.ts",
  "apps/api/src/modules/storage/postgres-repository.ts",
  "apps/api/src/modules/storage/repository.ts",
  "apps/api/src/modules/storage/routes.ts",
  "apps/api/src/modules/storage/service.ts",
  "apps/api/src/modules/offers/factory.ts",
  "apps/api/src/modules/offers/postgres-repository.ts",
  "apps/api/src/modules/offers/repository.ts",
  "apps/api/src/modules/offers/routes.ts",
  "apps/api/src/modules/offers/service.ts",
  "apps/api/src/modules/suppliers/factory.ts",
  "apps/api/src/modules/suppliers/postgres-repository.ts",
  "apps/api/src/modules/suppliers/repository.ts",
  "apps/api/src/modules/suppliers/routes.ts",
  "apps/api/src/modules/suppliers/service.ts",
  "apps/api/src/config.ts",
  "apps/api/src/http.ts",
  "apps/api/src/routes/health.ts",
  "apps/api/src/routes/account.ts",
  "apps/api/src/server.test.ts",
  "apps/api/tsconfig.json",
  "apps/api/vitest.config.ts",
  "apps/api/Dockerfile",
  "packages/contracts/src/account-session.ts",
  "packages/contracts/src/offer-catalog.ts",
  "packages/contracts/src/supplier-access.ts",
  "packages/contracts/src/supplier-directory.ts",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-offer-detail.mjs",
  "scripts/smoke-e2e-self-hosted-access-runtime.mjs",
  "scripts/smoke-frontend-no-supabase-env.mjs",
  "src/lib/auth-runtime.ts",
  "src/lib/auth-runtime.test.ts",
  "src/lib/auth-runtime.boundary.test.ts",
  "src/lib/legacy-auth-supabase-adapter.ts",
  "src/pages/SignIn.tsx",
  "src/pages/ResetPassword.tsx",
  "scripts/smoke-self-hosted-account-postgres.mjs",
  "scripts/smoke-self-hosted-workspace-postgres.mjs",
  "src/components/account/CompanyDocumentsCard.tsx",
  "src/components/account/CompanyMediaCard.tsx",
  "src/components/account/SupplierProfilePreview.tsx",
  "src/lib/account-api.ts",
  "src/lib/account-api.test.ts",
  "src/lib/account-documents-store.ts",
  "src/lib/catalog-api.ts",
  "src/lib/catalog-api.boundary.test.ts",
  "src/lib/legacy-catalog-supabase-adapter.ts",
  "src/lib/offer-catalog-api.ts",
  "src/lib/offer-catalog-api.test.ts",
  "src/lib/catalog-fallback.ts",
  "src/lib/use-offer-catalog.ts",
  "src/lib/use-offer-catalog.test.tsx",
  "src/lib/use-offer-detail.ts",
  "src/lib/use-offer-detail.test.tsx",
  "src/components/catalog/SelectedOfferPanel.tsx",
  "src/pages/Offers.tsx",
  "src/pages/Offers.catalogPaging.test.tsx",
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
  "src/integrations/supabase/client.ts",
  "src/pages/OfferDetail.tsx",
  "src/lib/supplier-access-api.ts",
  "src/lib/supplier-access-api.boundary.test.ts",
  "src/lib/supplier-access-api.test.ts",
  "src/lib/legacy-supplier-access-supabase-adapter.ts",
  "src/lib/supplier-approval-notifications.ts",
  "src/lib/use-supplier-access-notifications.ts",
  "src/lib/use-supplier-access-notifications.test.tsx",
  "src/lib/use-supplier-access-state.ts",
  "src/lib/use-supplier-access-state.test.tsx",
  "src/components/offer-detail/SupplierTrustPanel.access.test.tsx",
  "src/components/suppliers/SupplierApprovalNotifier.tsx",
  "src/components/suppliers/SupplierApprovalNotifier.test.tsx",
  "src/components/suppliers/SupplierAccessNotificationCenter.tsx",
  "src/components/suppliers/SupplierAccessNotificationCenter.test.tsx",
  "src/components/suppliers/SupplierAccessRefreshBanner.tsx",
  "src/components/suppliers/SupplierAccessRefreshBanner.test.tsx",
  "src/components/landing/Header.tsx",
  "src/lib/supplier-directory-api.ts",
  "src/lib/supplier-directory-api.test.ts",
  "src/lib/use-supplier-directory.ts",
  "src/lib/use-supplier-directory.test.tsx",
  "docs/backend/self-hosted-account-api-smoke.md",
  "docs/backend/self-hosted-offer-detail-smoke.md",
  "docs/backend/self-hosted-account-postgres-smoke.md",
  "docs/backend/self-hosted-workspace-postgres-smoke.md",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required API file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const ciWorkflow = read(".github/workflows/ci.yml");
const server = read("apps/api/src/server.ts");
const config = read("apps/api/src/config.ts");
const accountFactory = read("apps/api/src/modules/account/factory.ts");
const postgresRepository = read("apps/api/src/modules/account/postgres-repository.ts");
const accountService = read("apps/api/src/modules/account/service.ts");
const accountRepository = read("apps/api/src/modules/account/repository.ts");
const accountRoutes = read("apps/api/src/modules/account/routes.ts");
const accessFactory = read("apps/api/src/modules/access/factory.ts");
const accessPostgresRepository = read("apps/api/src/modules/access/postgres-repository.ts");
const accessRepository = read("apps/api/src/modules/access/repository.ts");
const accessRoutes = read("apps/api/src/modules/access/routes.ts");
const accessService = read("apps/api/src/modules/access/service.ts");
const authSession = read("apps/api/src/modules/auth/session.ts");
const storageFactory = read("apps/api/src/modules/storage/factory.ts");
const storageObjectStorage = read("apps/api/src/modules/storage/object-storage.ts");
const storagePostgresRepository = read("apps/api/src/modules/storage/postgres-repository.ts");
const storageRepository = read("apps/api/src/modules/storage/repository.ts");
const storageRoutes = read("apps/api/src/modules/storage/routes.ts");
const storageService = read("apps/api/src/modules/storage/service.ts");
const offerFactory = read("apps/api/src/modules/offers/factory.ts");
const offerPostgresRepository = read("apps/api/src/modules/offers/postgres-repository.ts");
const offerRepository = read("apps/api/src/modules/offers/repository.ts");
const offerRoutes = read("apps/api/src/modules/offers/routes.ts");
const offerService = read("apps/api/src/modules/offers/service.ts");
const supplierFactory = read("apps/api/src/modules/suppliers/factory.ts");
const supplierPostgresRepository = read("apps/api/src/modules/suppliers/postgres-repository.ts");
const supplierRepository = read("apps/api/src/modules/suppliers/repository.ts");
const supplierRoutes = read("apps/api/src/modules/suppliers/routes.ts");
const supplierService = read("apps/api/src/modules/suppliers/service.ts");
const accountRoute = read("apps/api/src/routes/account.ts");
const accountSessionContract = read("packages/contracts/src/account-session.ts");
const accountCompanyContract = read("packages/contracts/src/account-company.ts");
const offerCatalogContract = read("packages/contracts/src/offer-catalog.ts");
const supplierAccessContract = read("packages/contracts/src/supplier-access.ts");
const supplierDirectoryContract = read("packages/contracts/src/supplier-directory.ts");
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const offerDetailSmoke = read("scripts/smoke-self-hosted-offer-detail.mjs");
const selfHostedAccessRuntimeSmoke = read("scripts/smoke-e2e-self-hosted-access-runtime.mjs");
const frontendNoSupabaseSmoke = read("scripts/smoke-frontend-no-supabase-env.mjs");
const authRuntime = read("src/lib/auth-runtime.ts");
const authRuntimeTest = read("src/lib/auth-runtime.test.ts");
const authRuntimeBoundaryTest = read("src/lib/auth-runtime.boundary.test.ts");
const legacyAuthSupabaseAdapter = read("src/lib/legacy-auth-supabase-adapter.ts");
const signInPage = read("src/pages/SignIn.tsx");
const resetPasswordPage = read("src/pages/ResetPassword.tsx");
const accountPostgresSmoke = read("scripts/smoke-self-hosted-account-postgres.mjs");
const workspacePostgresSmoke = read("scripts/smoke-self-hosted-workspace-postgres.mjs");
const dockerfile = read("apps/api/Dockerfile");
const compose = read("infra/docker-compose.yml");
const docs = read("docs/backend/self-hosted-backend-architecture.md");
const contractsIndex = read("packages/contracts/src/index.ts");
const companyDocumentsCard = read("src/components/account/CompanyDocumentsCard.tsx");
const companyMediaCard = read("src/components/account/CompanyMediaCard.tsx");
const supplierProfilePreview = read("src/components/account/SupplierProfilePreview.tsx");
const accountApi = read("src/lib/account-api.ts");
const accountDocumentsStore = read("src/lib/account-documents-store.ts");
const catalogApi = read("src/lib/catalog-api.ts");
const catalogApiBoundaryTest = read("src/lib/catalog-api.boundary.test.ts");
const legacyCatalogSupabaseAdapter = read("src/lib/legacy-catalog-supabase-adapter.ts");
const offerCatalogApi = read("src/lib/offer-catalog-api.ts");
const catalogFallback = read("src/lib/catalog-fallback.ts");
const useOfferCatalog = read("src/lib/use-offer-catalog.ts");
const useOfferDetail = read("src/lib/use-offer-detail.ts");
const selectedOfferPanel = read("src/components/catalog/SelectedOfferPanel.tsx");
const offersPage = read("src/pages/Offers.tsx");
const offerDetailPage = read("src/pages/OfferDetail.tsx");
const supplierAccessApi = read("src/lib/supplier-access-api.ts");
const supplierAccessApiBoundaryTest = read("src/lib/supplier-access-api.boundary.test.ts");
const legacySupplierAccessSupabaseAdapter = read("src/lib/legacy-supplier-access-supabase-adapter.ts");
const supplierApprovalNotifications = read("src/lib/supplier-approval-notifications.ts");
const useSupplierAccessNotifications = read("src/lib/use-supplier-access-notifications.ts");
const useSupplierAccessNotificationsTest = read("src/lib/use-supplier-access-notifications.test.tsx");
const useSupplierAccessState = read("src/lib/use-supplier-access-state.ts");
const supplierTrustPanelAccessTest = read("src/components/offer-detail/SupplierTrustPanel.access.test.tsx");
const supplierApprovalNotifier = read("src/components/suppliers/SupplierApprovalNotifier.tsx");
const supplierApprovalNotifierTest = read("src/components/suppliers/SupplierApprovalNotifier.test.tsx");
const supplierAccessNotificationCenter = read("src/components/suppliers/SupplierAccessNotificationCenter.tsx");
const supplierAccessNotificationCenterTest = read("src/components/suppliers/SupplierAccessNotificationCenter.test.tsx");
const supplierAccessRefreshBanner = read("src/components/suppliers/SupplierAccessRefreshBanner.tsx");
const supplierAccessRefreshBannerTest = read("src/components/suppliers/SupplierAccessRefreshBanner.test.tsx");
const header = read("src/components/landing/Header.tsx");
const supplierDirectoryApi = read("src/lib/supplier-directory-api.ts");
const useSupplierDirectory = read("src/lib/use-supplier-directory.ts");
const supplierProfileDetailE2E = read("e2e/supplier-profile-detail.spec.ts");
const supplierDirectoryProfileFlowE2E = read("e2e/supplier-directory-profile-flow.spec.ts");
const supplierDirectoryProfileApiFlowE2E = read("e2e/supplier-directory-profile-api-flow.spec.ts");
const offerDetailRuntimeE2E = read("e2e/offer-detail-runtime.spec.ts");
const offerCatalogDetailFlowE2E = read("e2e/offer-catalog-detail-flow.spec.ts");
const offerCatalogDetailApiFlowE2E = read("e2e/offer-catalog-detail-api-flow.spec.ts");
const supplierAccessNotificationCenterApiFlowE2E = read("e2e/supplier-access-notification-center-api-flow.spec.ts");
const selfHostedAccessRuntimeE2E = read("e2e/self-hosted-access-runtime.spec.ts");
const frontendNoSupabaseE2E = read("e2e/frontend-no-supabase-env.spec.ts");
const supabaseClient = read("src/integrations/supabase/client.ts");
const accountApiSmokeDocs = read("docs/backend/self-hosted-account-api-smoke.md");
const offerDetailSmokeDocs = read("docs/backend/self-hosted-offer-detail-smoke.md");
const accountPostgresSmokeDocs = read("docs/backend/self-hosted-account-postgres-smoke.md");
const workspacePostgresSmokeDocs = read("docs/backend/self-hosted-workspace-postgres-smoke.md");

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

const forbidText = (name, text, marker) => {
  if (text.includes(marker)) failures.push(`${name}: forbidden ${JSON.stringify(marker)}`);
};

if (pkg.scripts["contracts:build"] !== "tsc -p packages/contracts/tsconfig.json") {
  failures.push("package.json: contracts:build must compile packages/contracts/tsconfig.json");
}
if (pkg.scripts["api:build"] !== "npm run contracts:build && tsc -p apps/api/tsconfig.json") {
  failures.push("package.json: api:build must compile contracts before apps/api/tsconfig.json");
}
if (pkg.scripts["api:start"] !== "node apps/api/dist/index.js") {
  failures.push("package.json: api:start must run apps/api/dist/index.js");
}
if (pkg.scripts["smoke:self-hosted-account-api"] !== "npm run api:build && npm run smoke:self-hosted-account-api:run") {
  failures.push("package.json: smoke:self-hosted-account-api must build and run the self-hosted account API smoke");
}
if (pkg.scripts["smoke:self-hosted-account-api:run"] !== "node scripts/smoke-self-hosted-account-api.mjs") {
  failures.push("package.json: smoke:self-hosted-account-api:run must execute scripts/smoke-self-hosted-account-api.mjs");
}
if (pkg.scripts["smoke:self-hosted-offer-detail"] !== "npm run api:build && npm run smoke:self-hosted-offer-detail:run") {
  failures.push("package.json: smoke:self-hosted-offer-detail must build and run the self-hosted offer detail smoke");
}
if (pkg.scripts["smoke:self-hosted-offer-detail:run"] !== "node scripts/smoke-self-hosted-offer-detail.mjs") {
  failures.push("package.json: smoke:self-hosted-offer-detail:run must execute scripts/smoke-self-hosted-offer-detail.mjs");
}
if (pkg.scripts["smoke:self-hosted-account-postgres"] !== "npm run api:build && npm run smoke:self-hosted-account-postgres:run") {
  failures.push("package.json: smoke:self-hosted-account-postgres must build and run the live PostgreSQL account smoke");
}
if (pkg.scripts["smoke:self-hosted-account-postgres:run"] !== "node scripts/smoke-self-hosted-account-postgres.mjs") {
  failures.push("package.json: smoke:self-hosted-account-postgres:run must execute scripts/smoke-self-hosted-account-postgres.mjs");
}
if (pkg.scripts["smoke:self-hosted-workspace-postgres"] !== "npm run api:build && npm run smoke:self-hosted-workspace-postgres:run") {
  failures.push("package.json: smoke:self-hosted-workspace-postgres must build and run the live PostgreSQL workspace smoke");
}
if (pkg.scripts["smoke:self-hosted-workspace-postgres:run"] !== "node scripts/smoke-self-hosted-workspace-postgres.mjs") {
  failures.push("package.json: smoke:self-hosted-workspace-postgres:run must execute scripts/smoke-self-hosted-workspace-postgres.mjs");
}
if (pkg.scripts["test:api"] !== "npm run contracts:build && vitest run --config apps/api/vitest.config.ts") {
  failures.push("package.json: test:api must build contracts before apps/api tests");
}
if (!pkg.scripts["ci:core"]?.includes("npm run check:self-hosted-api")) {
  failures.push("package.json: ci:core must run check:self-hosted-api");
}
if (!pkg.scripts["ci:core"]?.includes("npm run api:build")) {
  failures.push("package.json: ci:core must run api:build");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:api")) {
  failures.push("package.json: ci:core must run test:api");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-account-api:run")) {
  failures.push("package.json: ci:core must run the self-hosted account API smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-offer-detail:run")) {
  failures.push("package.json: ci:core must run the self-hosted offer detail smoke");
}
if (pkg.scripts["test:auth-runtime"] !== "vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts") {
  failures.push("package.json: test:auth-runtime must cover the auth runtime adapter boundary");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:auth-runtime")) {
  failures.push("package.json: ci:core must run test:auth-runtime");
}
if (pkg.scripts["test:account-workspace"] !== "vitest run src/lib/account-api.test.ts src/lib/supplier-directory-api.test.ts src/lib/supplier-directory-view.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx") {
  failures.push("package.json: test:account-workspace must cover account API adapter and account workspace tests");
}
if (!pkg.scripts["test:supplier-directory-frontend"]?.includes("src/pages/Suppliers.test.tsx")) {
  failures.push("package.json: test:supplier-directory-frontend must cover supplier directory frontend tests");
}
if (!pkg.scripts["test:supplier-directory-frontend"]?.includes("src/lib/use-supplier-directory.test.tsx")) {
  failures.push("package.json: test:supplier-directory-frontend must cover supplier directory runtime refresh tests");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:account-workspace")) {
  failures.push("package.json: ci:core must run test:account-workspace");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:supplier-directory-frontend")) {
  failures.push("package.json: ci:core must run test:supplier-directory-frontend");
}
const offerCatalogFrontendTest = pkg.scripts["test:offer-catalog-frontend"] ?? "";
for (const requiredOfferCatalogTest of [
  "src/lib/offer-catalog-api.test.ts",
  "src/lib/catalog-api.boundary.test.ts",
  "src/lib/use-offer-catalog.test.tsx",
  "src/lib/use-offer-detail.test.tsx",
  "src/pages/Offers.catalogPaging.test.tsx",
]) {
  if (!offerCatalogFrontendTest.includes(requiredOfferCatalogTest)) {
    failures.push(`package.json: test:offer-catalog-frontend must cover ${requiredOfferCatalogTest}`);
  }
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:offer-catalog-frontend")) {
  failures.push("package.json: ci:core must run test:offer-catalog-frontend");
}
if (!pkg.scripts["smoke:e2e:offers-catalog:run"]?.includes("e2e/offers-catalog-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:offers-catalog:run must cover /offers catalog paging e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offers-catalog-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers catalog paging e2e");
}
if (!pkg.scripts["smoke:e2e:suppliers-directory:run"]?.includes("e2e/suppliers-directory-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:suppliers-directory:run must cover /suppliers directory paging e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/suppliers-directory-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers directory paging e2e");
}
if (!pkg.scripts["smoke:e2e:supplier-profile-detail:run"]?.includes("e2e/supplier-profile-detail.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-profile-detail:run must cover /suppliers/:id profile detail e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/supplier-profile-detail.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers/:id profile detail e2e");
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-flow:run"]?.includes("e2e/supplier-directory-profile-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-flow:run must cover /suppliers to /suppliers/:id approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/supplier-directory-profile-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers to /suppliers/:id approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-api-flow must build with the self-hosted API adapter enabled");
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-api-flow:run"]?.includes("e2e/supplier-directory-profile-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-api-flow:run must cover API-backed /suppliers to /suppliers/:id approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:offer-detail-runtime:run"]?.includes("e2e/offer-detail-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-detail-runtime:run must cover /offers/:id runtime approval e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offer-detail-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers/:id runtime approval e2e");
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-flow:run"]?.includes("e2e/offer-catalog-detail-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-flow:run must cover /offers to /offers/:id approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offer-catalog-detail-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers to /offers/:id approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-api-flow must build with the self-hosted API adapter enabled");
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-api-flow:run"]?.includes("e2e/offer-catalog-detail-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-api-flow:run must cover API-backed /offers to /offers/:id approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:supplier-access-notification-center-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:supplier-access-notification-center-api-flow must build with the self-hosted API adapter enabled");
}
if (!pkg.scripts["smoke:e2e:supplier-access-notification-center-api-flow:run"]?.includes("e2e/supplier-access-notification-center-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-access-notification-center-api-flow:run must cover API-backed notification center e2e");
}
if (!pkg.scripts["smoke:e2e:api-backed-access-flows"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:api-backed-access-flows must build with the self-hosted API adapter enabled");
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
  "Supabase is not configured",
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
forbidText("src/lib/auth-runtime.ts", authRuntime, "@/integrations/supabase/client");
for (const marker of [
  "auth-runtime adapter boundary",
  "uses local contract auth when Supabase is not configured",
  "delegates email sign-in and reset to prototype Supabase only when configured",
  "observes prototype Supabase recovery events behind the adapter",
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
requireText(".github/workflows/ci.yml", ciWorkflow, "Run frontend without Supabase env smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:frontend-no-supabase-env");
if (pkg.scripts["smoke:e2e:self-hosted-access-runtime"] !== "npm run api:build && node scripts/smoke-e2e-self-hosted-access-runtime.mjs") {
  failures.push("package.json: smoke:e2e:self-hosted-access-runtime must build API and run the real self-hosted access runtime browser smoke");
}
if (!pkg.scripts["smoke:e2e:self-hosted-access-runtime:run"]?.includes("e2e/self-hosted-access-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:self-hosted-access-runtime:run must cover the real self-hosted access runtime spec");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:self-hosted-access-runtime")) {
  failures.push("package.json: ci:full must include the real self-hosted access runtime browser smoke");
}
for (const marker of [
  "VITE_YORSO_API_URL: apiBaseUrl",
  "E2E_YORSO_API_URL: apiBaseUrl",
  "E2E_WEB_SERVER_PORT",
  "self_hosted_access_runtime_e2e=ok",
]) {
  requireText("scripts/smoke-e2e-self-hosted-access-runtime.mjs", selfHostedAccessRuntimeSmoke, marker);
}
for (const marker of [
  "Batch #65 real self-hosted API browser guard",
  "real memory-mode apps/api process",
  "no Playwright route interception",
  "VITE_YORSO_API_URL",
  "supplier-request-price-access",
  "Nordfjord Sjømat AS",
  "supplier directory private search",
  "self_hosted_access_runtime_e2e=ok",
]) {
  requireText("e2e/self-hosted-access-runtime.spec.ts", selfHostedAccessRuntimeE2E, marker);
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run self-hosted access runtime browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:self-hosted-access-runtime");
if (pkg.scripts["test:supplier-access-frontend"] !== "vitest run src/lib/supplier-access-api.test.ts src/lib/supplier-access-api.boundary.test.ts src/lib/use-supplier-access-state.test.tsx src/lib/use-supplier-access-notifications.test.tsx src/components/offer-detail/SupplierTrustPanel.access.test.tsx src/components/suppliers/SupplierApprovalNotifier.test.tsx src/components/suppliers/SupplierAccessRefreshBanner.test.tsx src/components/suppliers/SupplierAccessNotificationCenter.test.tsx") {
  failures.push("package.json: test:supplier-access-frontend must cover the self-hosted supplier access adapter, state hook, notification feed hook, offer-detail access UI, approval notification bridge, refresh banner and notification center");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:supplier-access-frontend")) {
  failures.push("package.json: ci:core must run test:supplier-access-frontend");
}

requireText("apps/api/src/server.ts", server, "/health/live");
requireText("apps/api/src/server.ts", server, "/health/ready");
requireText("apps/api/src/server.ts", server, "/v1/account/company/schema");
requireText("apps/api/src/server.ts", server, "handleAccountRoute");
requireText("apps/api/src/server.ts", server, "handleStorageRoute");
requireText("apps/api/src/server.ts", server, "handleOfferCatalogRoute");
requireText("apps/api/src/server.ts", server, "createOfferCatalogRepository(config)");
requireText("apps/api/src/server.ts", server, "supplierAccessRepository");
requireText("apps/api/src/server.ts", server, "handleSupplierAccessRoute");
requireText("apps/api/src/server.ts", server, "createSupplierAccessRepository(config)");
requireText("apps/api/src/server.ts", server, "handleSupplierDirectoryRoute");
requireText("apps/api/src/server.ts", server, "createSupplierRepository(config)");
requireText("apps/api/src/server.ts", server, "x-yorso-backend");
requireText("apps/api/src/server.ts", server, "accountUserIdHeaderName");
requireText("apps/api/src/server.ts", server, "accountSessionIdHeaderName");
requireText("apps/api/src/server.ts", server, "createAccountRepository(config)");
requireText("apps/api/src/server.ts", server, "createFileService(config)");
requireText("apps/api/src/server.ts", server, "access-control-allow-origin");
requireText("apps/api/src/server.ts", server, "OPTIONS");
requireText("apps/api/src/config.ts", config, "assertSupabaseIsPrototypeOnly");
requireText("apps/api/src/config.ts", config, "accountRepository: z.enum([\"memory\", \"postgres\"])");
requireText("apps/api/src/config.ts", config, "storageDriver: z.enum([\"local\"])");
requireText("apps/api/src/config.ts", config, "storageLocalRoot");
requireText("apps/api/src/config.ts", config, "maxUploadBytes");
requireText("apps/api/src/config.ts", config, "Supabase env values must stay empty in production self-hosted API config.");
requireText("apps/api/src/modules/account/factory.ts", accountFactory, "createAccountRepository");
requireText("apps/api/src/modules/account/factory.ts", accountFactory, "PostgresAccountRepository");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "class PostgresAccountRepository");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "from yorso_users");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "from yorso_companies c");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "from yorso_company_branches");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "from yorso_company_products");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "from yorso_company_meta_regions");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "from yorso_notification_preferences");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "insert into yorso_company_media");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "on conflict (company_id) do update");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "createBranch");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "updateBranch");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "deleteBranch");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "createProduct");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "updateProduct");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "deleteProduct");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "createMetaRegion");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "updateMetaRegion");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "deleteMetaRegion");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "createNotification");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "updateNotification");
requireText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "deleteNotification");
forbidText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "not implemented");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyProfileUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "userProfileUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountBranchesSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountProductsSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountMetaRegionsSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountNotificationsSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyBranchCreateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyBranchUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyProductCreateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyProductUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "metaRegionCreateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "metaRegionUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "notificationPreferenceCreateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "notificationPreferenceUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyProfileSchema.parse");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "updateUserProfile");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceBranches");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceProducts");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceMetaRegions");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceNotifications");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "createBranch");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "updateBranch");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "deleteBranch");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "workspace_item_conflict");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "workspace_item_not_found");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "interface AccountRepository");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "class MemoryAccountRepository");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/me");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/company");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/branches");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/products");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/meta-regions");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/notifications");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/branches/");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/products/");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/meta-regions/");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/notifications/");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "GET, POST, PATCH, DELETE");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "workspace_item_conflict");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "workspace_item_not_found");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "readJsonBody");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "updateCurrentUserProfile");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "resolveAccountSession(request)");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "AccountSessionError");
requireText("apps/api/src/modules/access/factory.ts", accessFactory, "createSupplierAccessRepository");
requireText("apps/api/src/modules/access/factory.ts", accessFactory, "PostgresSupplierAccessRepository");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "class PostgresSupplierAccessRepository");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "from yorso_supplier_access_requests");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "from yorso_access_grants");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "select distinct supplier_id");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "from yorso_access_notifications");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "insert into yorso_access_events");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "markNotificationsRead");
requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "notification_read");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "class MemorySupplierAccessRepository");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "createOrReuseRequest");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "decideRequest");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "markNotificationsRead");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "listAccessibleSupplierIds");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "price_access_approved");
requireText("apps/api/src/modules/access/repository.ts", accessRepository, "notification_read");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "/v1/access/suppliers/");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "/v1/access/supplier-requests/");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "/v1/access/notifications");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "PATCH");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "acknowledgeNotifications");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "supplier_access_request_not_found");
requireText("apps/api/src/modules/access/service.ts", accessService, "supplierAccessRequestCreateSchema.parse");
requireText("apps/api/src/modules/access/service.ts", accessService, "supplierAccessDecisionSchema.parse");
requireText("apps/api/src/modules/access/service.ts", accessService, "supplierAccessNotificationsResponseSchema.parse");
requireText("apps/api/src/modules/access/service.ts", accessService, "supplierAccessNotificationsAckSchema.parse");
requireText("apps/api/src/modules/access/service.ts", accessService, "acknowledgeNotifications");
requireText("apps/api/src/modules/auth/session.ts", authSession, "accountUserIdHeaderName");
requireText("apps/api/src/modules/auth/session.ts", authSession, "accountSessionIdHeaderName");
requireText("apps/api/src/modules/auth/session.ts", authSession, "account_session_required");
requireText("apps/api/src/modules/auth/session.ts", authSession, "account_session_invalid");
requireText("apps/api/src/modules/auth/session.ts", authSession, "allowQueryUserId");
requireText("apps/api/src/modules/auth/session.ts", authSession, "accountSessionHeadersSchema.safeParse");
requireText("apps/api/src/modules/storage/factory.ts", storageFactory, "createFileService");
requireText("apps/api/src/modules/storage/factory.ts", storageFactory, "LocalObjectStorage");
requireText("apps/api/src/modules/storage/factory.ts", storageFactory, "PostgresFileRepository");
requireText("apps/api/src/modules/storage/object-storage.ts", storageObjectStorage, "class LocalObjectStorage");
requireText("apps/api/src/modules/storage/object-storage.ts", storageObjectStorage, "putObject");
requireText("apps/api/src/modules/storage/object-storage.ts", storageObjectStorage, "getObject");
requireText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "class PostgresFileRepository");
requireText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "insert into yorso_file_assets");
requireText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "insert into yorso_company_documents");
requireText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "getFileAssetByObjectKeyForUser");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "interface FileRepository");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "class MemoryFileRepository");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "getFileAssetByObjectKeyForUser");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/company/media/logo");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/company/media/cover");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/documents");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/files/");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/files/by-object-key");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "resolveAccountSession(request");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "allowQueryUserId: true");
requireText("apps/api/src/modules/storage/service.ts", storageService, "class FileService");
requireText("apps/api/src/modules/storage/service.ts", storageService, "checksumSha256");
requireText("apps/api/src/modules/storage/service.ts", storageService, "contentBase64");
requireText("apps/api/src/modules/storage/service.ts", storageService, "getFileByObjectKeyForUser");
requireText("apps/api/src/modules/offers/factory.ts", offerFactory, "createOfferCatalogRepository");
requireText("apps/api/src/modules/offers/factory.ts", offerFactory, "MemoryOfferCatalogRepository");
requireText("apps/api/src/modules/offers/factory.ts", offerFactory, "PostgresOfferCatalogRepository");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "class PostgresOfferCatalogRepository");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "from yorso_offers_catalog");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "publication_status = 'published'");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "certifications_search ilike");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "private_search_text");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "supplier_directory_id = any");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "normalizeOfferCatalogId");
requireText("apps/api/src/modules/offers/repository.ts", offerRepository, "interface OfferCatalogRepository");
requireText("apps/api/src/modules/offers/repository.ts", offerRepository, "class MemoryOfferCatalogRepository");
requireText("apps/api/src/modules/offers/repository.ts", offerRepository, "privateSearchSupplierIds");
requireText("apps/api/src/modules/offers/repository.ts", offerRepository, "normalizeOfferCatalogId");
requireText("apps/api/src/modules/offers/routes.ts", offerRoutes, "/v1/offers");
requireText("apps/api/src/modules/offers/routes.ts", offerRoutes, "/v1/offers/");
requireText("apps/api/src/modules/offers/routes.ts", offerRoutes, "offer_not_found");
requireText("apps/api/src/modules/offers/routes.ts", offerRoutes, "resolveOptionalAccountSession");
requireText("apps/api/src/modules/offers/service.ts", offerService, "offerCatalogQuerySchema.parse");
requireText("apps/api/src/modules/offers/service.ts", offerService, "hasSupplierAccess");
requireText("apps/api/src/modules/offers/service.ts", offerService, "listAccessibleSupplierIds");
requireText("apps/api/src/modules/offers/service.ts", offerService, "resolveListAccessLevel");
requireText("apps/api/src/modules/offers/service.ts", offerService, "resolveDetailAccessLevel");
requireText("apps/api/src/modules/offers/service.ts", offerService, "shapeOfferForAccess");
requireText("apps/api/src/modules/offers/service.ts", offerService, "qualified_unlocked");
requireText("apps/api/src/modules/offers/service.ts", offerService, "id: offer.supplier.id");
requireText("apps/api/src/modules/suppliers/factory.ts", supplierFactory, "createSupplierRepository");
requireText("apps/api/src/modules/suppliers/factory.ts", supplierFactory, "MemorySupplierRepository");
requireText("apps/api/src/modules/suppliers/factory.ts", supplierFactory, "PostgresSupplierRepository");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "class PostgresSupplierRepository");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "from yorso_suppliers_directory");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "publication_status = 'published'");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "certifications_search ilike");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "interface SupplierRepository");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "class MemorySupplierRepository");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "/v1/suppliers");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "/v1/suppliers/");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "resolveOptionalAccountSession");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "supplier_not_found");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDirectoryQuerySchema.parse");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "hasSupplierAccess");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "listAccessibleSupplierIds");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "resolveListAccessLevel");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "resolveDetailAccessLevel");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "shapeSupplierForAccess");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "qualified_unlocked");
requireText("apps/api/src/routes/account.ts", accountRoute, "packages/contracts/src/account-company.ts");
requireText("apps/api/src/routes/account.ts", accountRoute, "UserProfileUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyBranch");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyBranchCreate");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyBranchUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyProduct");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyProductCreate");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyProductUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "MetaRegion");
requireText("apps/api/src/routes/account.ts", accountRoute, "MetaRegionCreate");
requireText("apps/api/src/routes/account.ts", accountRoute, "MetaRegionUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "NotificationPreference");
requireText("apps/api/src/routes/account.ts", accountRoute, "NotificationPreferenceCreate");
requireText("apps/api/src/routes/account.ts", accountRoute, "NotificationPreferenceUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "AccountFileAsset");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyDocument");
requireText("apps/api/src/routes/account.ts", accountRoute, "AccountSessionHeaders");
requireText("apps/api/src/routes/account.ts", accountRoute, "accountUserIdHeaderName");
requireText("apps/api/src/routes/account.ts", accountRoute, "self-hosted-yorso-api");
requireText("apps/api/Dockerfile", dockerfile, "FROM node:22-alpine");
requireText("apps/api/Dockerfile", dockerfile, "RUN npm run api:build");
requireText("apps/api/Dockerfile", dockerfile, "CMD [\"node\", \"apps/api/dist/index.js\"]");
requireText("infra/docker-compose.yml", compose, "dockerfile: apps/api/Dockerfile");
requireText("infra/docker-compose.yml", compose, "VITE_SUPABASE_URL: \"\"");
requireText("infra/docker-compose.yml", compose, "STORAGE_DRIVER: local");
requireText("infra/docker-compose.yml", compose, "yorso-api-uploads");
requireText("docs/backend/self-hosted-backend-architecture.md", docs, "YORSO API");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./account-company.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./account-session.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./offer-catalog.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./supplier-access.js\";");
requireText("packages/contracts/src/account-session.ts", accountSessionContract, "accountUserIdHeaderName");
requireText("packages/contracts/src/account-session.ts", accountSessionContract, "accountSessionHeadersSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "companyBranchCreateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "companyBranchUpdateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "companyProductCreateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "companyProductUpdateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "metaRegionCreateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "metaRegionUpdateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "notificationPreferenceCreateSchema");
requireText("packages/contracts/src/account-company.ts", accountCompanyContract, "notificationPreferenceUpdateSchema");
requireText("packages/contracts/src/offer-catalog.ts", offerCatalogContract, "offerCatalogRecordSchema");
requireText("packages/contracts/src/offer-catalog.ts", offerCatalogContract, "offerCatalogItemSchema");
requireText("packages/contracts/src/offer-catalog.ts", offerCatalogContract, "offerCatalogQuerySchema");
requireText("packages/contracts/src/offer-catalog.ts", offerCatalogContract, "supplierCountryCode: z.string().length(2).optional()");
requireText("packages/contracts/src/offer-catalog.ts", offerCatalogContract, "qualified_unlocked");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "supplierAccessRequestSchema");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "supplierAccessDecisionSchema");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "supplierAccessNotificationsResponseSchema");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "supplierAccessNotificationsAckSchema");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "supplierAccessNotificationsAckResponseSchema");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "notification_read");
requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, "supplierAccessGrantScopeSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDirectoryRecordSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDirectoryItemSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDirectoryQuerySchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "verificationLevel: supplierVerificationLevelSchema.optional()");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDirectorySortBySchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDirectorySortDirectionSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "qualified_unlocked");
requireText("apps/api/src/modules/auth/session.ts", authSession, "resolveOptionalAccountSession");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "apps/api/dist/index.js");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "x-yorso-user-id");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "account_session_required");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "/v1/account/company/media/logo");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "/v1/account/documents");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "/v1/account/files/by-object-key");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "file_owner_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "branch_row_create=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "branch_row_conflict_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "product_row_patch=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "meta_region_row_create=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "notification_row_validation_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "branch_row_delete=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_locked=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_verified_filter=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_sort_pagination=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_requires_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_private_search_requires_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_unlocked=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_granted_private_search=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_ungranted_private_search_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_locked=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_private_search_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_private_search_requires_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_list_requires_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_filters=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_sort_pagination=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_unlocked=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_granted_private_search=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "offer_catalog_ungranted_private_search_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_access_request=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_access_approved=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_access_notifications=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_access_notifications_ack=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "self_hosted_account_api_smoke=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "apps/api/dist/index.js");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "/v1/offers/1?accessLevel=anonymous_locked");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_locked=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_registered_locked=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_requires_grant=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_unlocked=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_not_found=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_method_guard=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_validation_guard=ok");
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "self_hosted_offer_detail_smoke=ok");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "MIGRATION_DATABASE_URL");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "self_hosted_account_postgres_smoke=skipped");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "ACCOUNT_REPOSITORY: \"postgres\"");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "db:migrations:apply:live");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "insert into yorso_users");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "/v1/account/company/media/logo");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "/v1/account/documents");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "file_owner_guard=ok");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "self_hosted_account_postgres_smoke=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "MIGRATION_DATABASE_URL");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "self_hosted_workspace_postgres_smoke=skipped");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "ACCOUNT_REPOSITORY: \"postgres\"");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "db:migrations:apply:live");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "yorso_suppliers_directory");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "supplier_directory_locked=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "supplier_directory_requires_grant=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "supplier_directory_private_search_requires_grant=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "supplier_directory_unlocked=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "supplier_directory_granted_private_search=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "/v1/account/branches");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "/v1/account/products");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "/v1/account/meta-regions");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "/v1/account/notifications");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "notifications_validation_guard=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "workspace_db_counts=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "workspace_owner_isolation=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "branches_empty_replace=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "branch_row_create=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "branch_row_patch=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "product_row_patch=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "meta_region_row_delete=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "notification_row_create=ok");
requireText("scripts/smoke-self-hosted-workspace-postgres.mjs", workspacePostgresSmoke, "self_hosted_workspace_postgres_smoke=ok");
requireText("src/lib/account-api.ts", accountApi, "VITE_YORSO_API_URL");
requireText("src/lib/account-api.ts", accountApi, "VITE_YORSO_ACCOUNT_USER_ID");
requireText("src/lib/account-api.ts", accountApi, "ACCOUNT_USER_ID_HEADER");
requireText("src/lib/account-api.ts", accountApi, "ACCOUNT_SESSION_ID_HEADER");
requireText("src/lib/account-api.ts", accountApi, "buyerSession.getSession()");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/me");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/company");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/branches");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/products");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/meta-regions");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/notifications");
requireText("src/lib/account-api.ts", accountApi, "createBranch");
requireText("src/lib/account-api.ts", accountApi, "updateBranch");
requireText("src/lib/account-api.ts", accountApi, "deleteBranch");
requireText("src/lib/account-api.ts", accountApi, "createProduct");
requireText("src/lib/account-api.ts", accountApi, "updateProduct");
requireText("src/lib/account-api.ts", accountApi, "deleteProduct");
requireText("src/lib/account-api.ts", accountApi, "createMetaRegion");
requireText("src/lib/account-api.ts", accountApi, "updateMetaRegion");
requireText("src/lib/account-api.ts", accountApi, "deleteMetaRegion");
requireText("src/lib/account-api.ts", accountApi, "createNotification");
requireText("src/lib/account-api.ts", accountApi, "updateNotification");
requireText("src/lib/account-api.ts", accountApi, "deleteNotification");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/company/media/");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/documents");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/files/");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/files/by-object-key");
requireText("src/lib/account-api.ts", accountApi, "fileToAccountUploadPayload");
requireText("src/lib/account-api.ts", accountApi, "fileUrlForObjectKey");
requireText("src/lib/account-api.ts", accountApi, "resolveStoredFileUrl");
requireText("src/lib/account-api.ts", accountApi, "local prototype mode");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "createSupplierDirectoryApiClient");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "/v1/suppliers");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "mockSuppliers");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "verificationLevel");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "sortBy");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "sortDirection");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "qualified_unlocked");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "ACCOUNT_USER_ID_HEADER");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "ACCOUNT_SESSION_ID_HEADER");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "getApprovedSupplierAccessIds");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "useSupplierDirectoryList");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "useSupplierDirectoryDetail");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "localizeSupplierDirectoryItem");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "localizedMockSuppliers");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "getApprovedSupplierAccessIds");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "serverFiltered");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "sortBy");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "sortDirection");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "supplier_not_found");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "SUPPLIER_ACCESS_CHANGE_EVENT");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "client.enabled && accessLevel !== \"anonymous_locked\"");
for (const marker of [
  "Batch #57 browser-level guard",
  "supplier-request-price-access",
  "supplier-access-request-status",
  "supplier-access-refresh-banner",
  "supplier-access-refresh-now",
  "mock approval event shows refresh banner",
  "approval event for another supplier does not unlock",
  "unknown supplier renders not found",
]) {
  requireText("e2e/supplier-profile-detail.spec.ts", supplierProfileDetailE2E, marker);
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
for (const marker of [
  "Batch #61 API-backed browser-level guard",
  "self-hosted API adapter",
  "backend approval unlocks the matching supplier after profile refresh and directory return",
  "backend approval for another supplier does not unlock the current directory/profile flow",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
  "notification-${supplierId}",
  "q=salmon",
  "filter=salmon",
  "Nordfjord Sjømat AS",
  "supplier-access-refresh-banner",
]) {
  requireText("e2e/supplier-directory-profile-api-flow.spec.ts", supplierDirectoryProfileApiFlowE2E, marker);
}
for (const marker of [
  "Batch #58 browser-level guard",
  "supplier-request-price-access",
  "supplier-access-request-status",
  "supplier-access-refresh-banner",
  "supplier-access-refresh-now",
  "matching approval event shows refresh banner",
  "approval event for another supplier does not unlock",
  "unknown offer renders not found",
  "EXACT_PRICE_PATTERN",
]) {
  requireText("e2e/offer-detail-runtime.spec.ts", offerDetailRuntimeE2E, marker);
}
for (const marker of [
  "Batch #59 browser-level guard",
  "catalog/detail access bridge",
  "approval on detail unlocks the matching catalog row after return",
  "unrelated approval does not unlock the catalog/detail flow",
  "offer-detail-back-to-catalog",
  "data-access-level",
  "qualified_unlocked",
]) {
  requireText("e2e/offer-catalog-detail-flow.spec.ts", offerCatalogDetailFlowE2E, marker);
}
for (const marker of [
  "Batch #62 API-backed browser-level guard",
  "self-hosted API adapter",
  "backend approval unlocks the matching offer after detail refresh and catalog return",
  "backend approval for another supplier does not unlock the current catalog/detail flow",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
  "notification-${supplierId}",
  "q=salmon",
  "category=Salmon",
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
for (const marker of [
  "LOCKED_PRICE_RANGE_LABEL",
  "Price on request",
  "deliveryBasisOptions",
  "volumeBreaks: unlocked ? offer.volumeBreaks : []",
]) {
  requireText("apps/api/src/modules/offers/service.ts", offerService, marker);
}
for (const marker of [
  "redactDeliveryBasisOptions",
  "Цена по запросу",
  "deliveryBasisOptions: redactDeliveryBasisOptions",
  "volumeBreaks: []",
]) {
  requireText("src/lib/catalog-fallback.ts", catalogFallback, marker);
}
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "privateSearchSupplierIds");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "private_search_text");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "orderByClause");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "listAccessibleSupplierIds");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "orderByClause");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "createOfferCatalogApiClient");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "/v1/offers");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "ACCOUNT_USER_ID_HEADER");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "mockOffers");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "supplierCountryCode");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "sortBy");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "sortDirection");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "qualified_unlocked");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "getApprovedSupplierAccessIds");
requireText("src/lib/offer-catalog-api.ts", offerCatalogApi, "fallbackOfferForSupplierAccess");
requireText("src/lib/catalog-api.ts", catalogApi, "self-hosted-first catalog facade");
requireText("src/lib/catalog-api.ts", catalogApi, "createOfferCatalogApiClient");
requireText("src/lib/catalog-api.ts", catalogApi, "fetchLegacyCatalogOffers");
requireText("src/lib/catalog-api.ts", catalogApi, "fetchLegacyCatalogOfferById");
requireText("src/lib/legacy-catalog-supabase-adapter.ts", legacyCatalogSupabaseAdapter, "@/integrations/supabase/client");
requireText("src/lib/legacy-catalog-supabase-adapter.ts", legacyCatalogSupabaseAdapter, "SUPABASE_NOT_CONFIGURED_ERROR");
requireText("src/lib/legacy-catalog-supabase-adapter.ts", legacyCatalogSupabaseAdapter, "fetchLegacyCatalogOffers");
requireText("src/lib/legacy-catalog-supabase-adapter.ts", legacyCatalogSupabaseAdapter, "fetchLegacyCatalogOfferById");
requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, "uses self-hosted offer catalog before legacy Supabase fallback");
requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, "keeps direct Supabase imports out of catalog-api.ts");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "useOfferCatalogList");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "offerCatalogApiQueryFromFilters");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "offerMatchesClientFilters");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "serverFiltered");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "fallbackOffersForSupplierAccess");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "getApprovedSupplierAccessIds");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "client.enabled && level !== \"anonymous_locked\"");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "sortBy");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "sortDirection");
requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, "SUPPLIER_ACCESS_CHANGE_EVENT");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "useOfferDetail");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "createOfferCatalogApiClient");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "getOfferById");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "findFallbackOfferByIdForSupplierAccess");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "client.enabled && level !== \"anonymous_locked\"");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "offer_not_found");
requireText("src/lib/use-offer-detail.ts", useOfferDetail, "SUPPLIER_ACCESS_CHANGE_EVENT");
requireText("src/pages/Offers.tsx", offersPage, "forceLevel={offerAccessLevel(offer)}");
requireText("src/components/catalog/SelectedOfferPanel.tsx", selectedOfferPanel, "forceLevel?: AccessLevel");
requireText("src/pages/OfferDetail.tsx", offerDetailPage, "useOfferDetail");
requireText("src/pages/OfferDetail.tsx", offerDetailPage, "renderAccessLevel");
forbidText("src/pages/OfferDetail.tsx", offerDetailPage, "useResilientOffer");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "createSupplierAccessApiClient");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "/v1/access/suppliers/");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "/v1/access/notifications");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "response.accessGranted");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "getConfiguredAccountApiBaseUrl");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "clearSupplierAccessRequest");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "isSupplierAccessApiConfigured");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "acknowledgeSupplierAccessNotifications");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "acknowledgeNotifications");
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "legacy-supplier-access-supabase-adapter");
requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, "@/integrations/supabase/client");
requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, "readLegacySupplierAccessRequest");
requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, "requestLegacySupplierAccess");
requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, "log_supplier_access_event");
requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, "supplier_access_requests");
requireText("src/lib/supplier-access-api.boundary.test.ts", supplierAccessApiBoundaryTest, "keeps direct Supabase imports out of supplier-access-api.ts");
requireText("src/lib/supplier-access-api.boundary.test.ts", supplierAccessApiBoundaryTest, "isolated legacy Supabase adapter");
requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, "useSupplierAccessNotifications");
requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, "readSupplierAccessNotifications");
requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, "acknowledgeSupplierAccessNotifications");
requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, "SUPPLIER_ACCESS_CHANGE_EVENT");
requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, "getAllApprovalNotifications");
requireText("src/lib/use-supplier-access-notifications.test.tsx", useSupplierAccessNotificationsTest, "markAllRead");
requireText("src/lib/use-supplier-access-notifications.test.tsx", useSupplierAccessNotificationsTest, "self-hosted access notifications");
requireText("src/lib/use-supplier-access-state.ts", useSupplierAccessState, "isSupplierAccessApiConfigured");
requireText("src/lib/use-supplier-access-state.ts", useSupplierAccessState, "readSupplierAccessRequest");
requireText("src/lib/use-supplier-access-state.ts", useSupplierAccessState, "requestSupplierAccess");
requireText("src/lib/use-supplier-access-state.ts", useSupplierAccessState, "SUPPLIER_ACCESS_CHANGE_EVENT");
requireText("src/components/offer-detail/SupplierTrustPanel.access.test.tsx", supplierTrustPanelAccessTest, "supplier-request-price-access");
requireText("src/components/offer-detail/SupplierTrustPanel.access.test.tsx", supplierTrustPanelAccessTest, "supplier-access-request-status");
requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, "readSupplierAccessNotifications");
requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, "acknowledgeSupplierAccessNotifications");
requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, "BACKEND_NOTIFICATION_POLL_MS");
requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, "visibilitychange");
requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, "backendSyncInFlight");
requireText("src/lib/supplier-approval-notifications.ts", supplierApprovalNotifications, "persistSupplierAccessRequest");
requireText("src/lib/supplier-approval-notifications.ts", supplierApprovalNotifications, "setQualified(true");
requireText("src/lib/supplier-approval-notifications.ts", supplierApprovalNotifications, "BACKEND_NOTIFICATION_POLL_MS = 60_000");
requireText("src/lib/supplier-approval-notifications.ts", supplierApprovalNotifications, "applyBackendSupplierAccessNotifications");
requireText("src/components/suppliers/SupplierApprovalNotifier.test.tsx", supplierApprovalNotifierTest, "BACKEND_NOTIFICATION_POLL_MS");
requireText("src/components/suppliers/SupplierApprovalNotifier.test.tsx", supplierApprovalNotifierTest, "acknowledgeSupplierAccessNotifications");
requireText("src/components/suppliers/SupplierApprovalNotifier.test.tsx", supplierApprovalNotifierTest, "does not re-apply already seen backend notifications");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, "SupplierAccessNotificationBell");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, "supplier_notifications_title");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, "markAllRead");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, "autoLoad: false");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, "header-supplier-access-notifications-bell");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.test.tsx", supplierAccessNotificationCenterTest, "self-hosted supplier access notifications");
requireText("src/components/suppliers/SupplierAccessNotificationCenter.test.tsx", supplierAccessNotificationCenterTest, "Prototype mode");
requireText("src/components/landing/Header.tsx", header, "SupplierAccessNotificationBell");
requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, "SUPPLIER_ACCESS_CHANGE_EVENT");
requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, "supplier_accessRefresh_title");
requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, "backend_notification");
requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, "mock_progression");
requireText("src/components/suppliers/SupplierAccessRefreshBanner.test.tsx", supplierAccessRefreshBannerTest, "backend_read");
requireText("src/components/suppliers/SupplierAccessRefreshBanner.test.tsx", supplierAccessRefreshBannerTest, "supplier-access-refresh-now");
requireText("src/components/account/CompanyDocumentsCard.tsx", companyDocumentsCard, "account-company-documents");
requireText("src/components/account/CompanyDocumentsCard.tsx", companyDocumentsCard, "createAccountApiClient");
requireText("src/components/account/CompanyDocumentsCard.tsx", companyDocumentsCard, "fileToAccountUploadPayload");
requireText("src/components/account/CompanyDocumentsCard.tsx", companyDocumentsCard, "createLocalCompanyDocument");
requireText("src/components/account/CompanyMediaCard.tsx", companyMediaCard, "onUploadFile");
requireText("src/components/account/CompanyMediaCard.tsx", companyMediaCard, "resolveMediaSrc");
requireText("src/components/account/SupplierProfilePreview.tsx", supplierProfilePreview, "resolveMediaSrc");
requireText("src/lib/account-documents-store.ts", accountDocumentsStore, "ACCOUNT_DOCUMENTS_STORAGE_KEY");
requireText("src/lib/account-documents-store.ts", accountDocumentsStore, "createLocalCompanyDocument");
requireText("src/lib/account-documents-store.ts", accountDocumentsStore, "listLocalCompanyDocuments");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "Self-Hosted Account API Smoke");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "npm run smoke:self-hosted-account-api");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "self_hosted_account_api_smoke=ok");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "Self-Hosted Offer Detail Smoke");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "npm run smoke:self-hosted-offer-detail");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "offer_detail_locked=ok");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "offer_detail_unlocked=ok");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "self_hosted_offer_detail_smoke=ok");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "Self-Hosted Account PostgreSQL Smoke");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "npm run smoke:self-hosted-account-postgres");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "self_hosted_account_postgres_smoke=skipped");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "self_hosted_account_postgres_smoke=ok");
requireText("docs/backend/self-hosted-workspace-postgres-smoke.md", workspacePostgresSmokeDocs, "Self-Hosted Workspace PostgreSQL Smoke");
requireText("docs/backend/self-hosted-workspace-postgres-smoke.md", workspacePostgresSmokeDocs, "npm run smoke:self-hosted-workspace-postgres");
requireText("docs/backend/self-hosted-workspace-postgres-smoke.md", workspacePostgresSmokeDocs, "self_hosted_workspace_postgres_smoke=skipped");
requireText("docs/backend/self-hosted-workspace-postgres-smoke.md", workspacePostgresSmokeDocs, "self_hosted_workspace_postgres_smoke=ok");

forbidText("apps/api/src/server.ts", server, "@/integrations/supabase/client");
forbidText("apps/api/src/config.ts", config, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/factory.ts", accountFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/service.ts", accountService, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/repository.ts", accountRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/routes.ts", accountRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/access/factory.ts", accessFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/access/repository.ts", accessRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/access/routes.ts", accessRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/access/service.ts", accessService, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/auth/session.ts", authSession, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/factory.ts", storageFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/object-storage.ts", storageObjectStorage, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/repository.ts", storageRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/routes.ts", storageRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/service.ts", storageService, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/offers/factory.ts", offerFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/offers/repository.ts", offerRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/offers/routes.ts", offerRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/offers/service.ts", offerService, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/suppliers/factory.ts", supplierFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/suppliers/service.ts", supplierService, "@/integrations/supabase/client");
forbidText("apps/api/src/routes/account.ts", accountRoute, "@/integrations/supabase/client");
forbidText("src/components/account/CompanyDocumentsCard.tsx", companyDocumentsCard, "@/integrations/supabase/client");
forbidText("src/components/account/CompanyMediaCard.tsx", companyMediaCard, "@/integrations/supabase/client");
forbidText("src/components/account/SupplierProfilePreview.tsx", supplierProfilePreview, "@/integrations/supabase/client");
forbidText("src/pages/SignIn.tsx", signInPage, "@/integrations/supabase/client");
forbidText("src/pages/ResetPassword.tsx", resetPasswordPage, "@/integrations/supabase/client");
forbidText("src/lib/account-api.ts", accountApi, "@/integrations/supabase/client");
forbidText("src/lib/account-documents-store.ts", accountDocumentsStore, "@/integrations/supabase/client");
forbidText("src/lib/catalog-api.ts", catalogApi, "@/integrations/supabase/client");
forbidText("src/lib/offer-catalog-api.ts", offerCatalogApi, "@/integrations/supabase/client");
forbidText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "@/integrations/supabase/client");
forbidText("src/lib/supplier-access-api.ts", supplierAccessApi, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/routes.ts", accountRoutes, "x-demo-user-id");
forbidText("apps/api/src/modules/storage/routes.ts", storageRoutes, "x-demo-user-id");
forbidText("apps/api/src/server.ts", server, "x-demo-user-id");

if (failures.length > 0) {
  console.error("Self-hosted API skeleton check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Self-hosted API skeleton check passed.");
console.log("- apps/api exposes health and account-contract endpoints.");
console.log("- apps/api builds as a standalone Node service.");
console.log("- Account and file repositories implement self-hosted profile, workspace and document storage.");
console.log("- Supplier directory API exposes access-shaped supplier discovery without Supabase production coupling.");
console.log("- Offer catalog API exposes access-shaped offer discovery without Supabase production coupling.");
console.log("- Supplier access API exposes request, decision, grant and notification flow without Supabase production coupling.");
console.log("- Supplier access UX consumes self-hosted request status and approval notifications with local fallback.");
console.log("- Account routes require explicit self-hosted session headers instead of hidden demo-user fallback.");
console.log("- Auth pages cross Supabase only through the prototype adapter boundary.");
console.log("- Runtime account API smoke is wired into ci:core.");
console.log("- Account UI can bridge company media and documents to the self-hosted file API with local fallback.");
console.log("- infra/docker-compose.yml includes the API service without Supabase production env.");
