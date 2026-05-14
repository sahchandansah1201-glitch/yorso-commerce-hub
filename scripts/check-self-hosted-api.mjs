#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "apps/api/src/index.ts",
  "apps/api/src/server.ts",
  "apps/api/src/modules/account/factory.ts",
  "apps/api/src/modules/account/postgres-repository.ts",
  "apps/api/src/modules/account/repository.ts",
  "apps/api/src/modules/account/service.ts",
  "apps/api/src/modules/account/routes.ts",
  "apps/api/src/modules/auth/session.ts",
  "apps/api/src/modules/storage/factory.ts",
  "apps/api/src/modules/storage/object-storage.ts",
  "apps/api/src/modules/storage/postgres-repository.ts",
  "apps/api/src/modules/storage/repository.ts",
  "apps/api/src/modules/storage/routes.ts",
  "apps/api/src/modules/storage/service.ts",
  "apps/api/src/config.ts",
  "apps/api/src/http.ts",
  "apps/api/src/routes/health.ts",
  "apps/api/src/routes/account.ts",
  "apps/api/src/server.test.ts",
  "apps/api/tsconfig.json",
  "apps/api/vitest.config.ts",
  "apps/api/Dockerfile",
  "packages/contracts/src/account-session.ts",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-account-postgres.mjs",
  "src/components/account/CompanyDocumentsCard.tsx",
  "src/components/account/CompanyMediaCard.tsx",
  "src/components/account/SupplierProfilePreview.tsx",
  "src/lib/account-api.ts",
  "src/lib/account-api.test.ts",
  "src/lib/account-documents-store.ts",
  "docs/backend/self-hosted-account-api-smoke.md",
  "docs/backend/self-hosted-account-postgres-smoke.md",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required API file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const server = read("apps/api/src/server.ts");
const config = read("apps/api/src/config.ts");
const accountFactory = read("apps/api/src/modules/account/factory.ts");
const postgresRepository = read("apps/api/src/modules/account/postgres-repository.ts");
const accountService = read("apps/api/src/modules/account/service.ts");
const accountRepository = read("apps/api/src/modules/account/repository.ts");
const accountRoutes = read("apps/api/src/modules/account/routes.ts");
const authSession = read("apps/api/src/modules/auth/session.ts");
const storageFactory = read("apps/api/src/modules/storage/factory.ts");
const storageObjectStorage = read("apps/api/src/modules/storage/object-storage.ts");
const storagePostgresRepository = read("apps/api/src/modules/storage/postgres-repository.ts");
const storageRepository = read("apps/api/src/modules/storage/repository.ts");
const storageRoutes = read("apps/api/src/modules/storage/routes.ts");
const storageService = read("apps/api/src/modules/storage/service.ts");
const accountRoute = read("apps/api/src/routes/account.ts");
const accountSessionContract = read("packages/contracts/src/account-session.ts");
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const accountPostgresSmoke = read("scripts/smoke-self-hosted-account-postgres.mjs");
const dockerfile = read("apps/api/Dockerfile");
const compose = read("infra/docker-compose.yml");
const docs = read("docs/backend/self-hosted-backend-architecture.md");
const contractsIndex = read("packages/contracts/src/index.ts");
const companyDocumentsCard = read("src/components/account/CompanyDocumentsCard.tsx");
const companyMediaCard = read("src/components/account/CompanyMediaCard.tsx");
const supplierProfilePreview = read("src/components/account/SupplierProfilePreview.tsx");
const accountApi = read("src/lib/account-api.ts");
const accountDocumentsStore = read("src/lib/account-documents-store.ts");
const accountApiSmokeDocs = read("docs/backend/self-hosted-account-api-smoke.md");
const accountPostgresSmokeDocs = read("docs/backend/self-hosted-account-postgres-smoke.md");

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
if (pkg.scripts["smoke:self-hosted-account-postgres"] !== "npm run api:build && npm run smoke:self-hosted-account-postgres:run") {
  failures.push("package.json: smoke:self-hosted-account-postgres must build and run the live PostgreSQL account smoke");
}
if (pkg.scripts["smoke:self-hosted-account-postgres:run"] !== "node scripts/smoke-self-hosted-account-postgres.mjs") {
  failures.push("package.json: smoke:self-hosted-account-postgres:run must execute scripts/smoke-self-hosted-account-postgres.mjs");
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
if (pkg.scripts["test:account-workspace"] !== "vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx") {
  failures.push("package.json: test:account-workspace must cover account API adapter and account workspace tests");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:account-workspace")) {
  failures.push("package.json: ci:core must run test:account-workspace");
}

requireText("apps/api/src/server.ts", server, "/health/live");
requireText("apps/api/src/server.ts", server, "/health/ready");
requireText("apps/api/src/server.ts", server, "/v1/account/company/schema");
requireText("apps/api/src/server.ts", server, "handleAccountRoute");
requireText("apps/api/src/server.ts", server, "handleStorageRoute");
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
forbidText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "not implemented");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyProfileUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "userProfileUpdateSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountBranchesSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountProductsSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountMetaRegionsSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "accountNotificationsSchema.parse");
requireText("apps/api/src/modules/account/service.ts", accountService, "companyProfileSchema.parse");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "updateUserProfile");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceBranches");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceProducts");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceMetaRegions");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "replaceNotifications");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "interface AccountRepository");
requireText("apps/api/src/modules/account/repository.ts", accountRepository, "class MemoryAccountRepository");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/me");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/company");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/branches");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/products");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/meta-regions");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "/v1/account/notifications");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "readJsonBody");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "updateCurrentUserProfile");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "resolveAccountSession(request)");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "AccountSessionError");
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
requireText("apps/api/src/routes/account.ts", accountRoute, "packages/contracts/src/account-company.ts");
requireText("apps/api/src/routes/account.ts", accountRoute, "UserProfileUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyBranch");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyProduct");
requireText("apps/api/src/routes/account.ts", accountRoute, "MetaRegion");
requireText("apps/api/src/routes/account.ts", accountRoute, "NotificationPreference");
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
requireText("packages/contracts/src/account-session.ts", accountSessionContract, "accountUserIdHeaderName");
requireText("packages/contracts/src/account-session.ts", accountSessionContract, "accountSessionHeadersSchema");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "apps/api/dist/index.js");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "x-yorso-user-id");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "account_session_required");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "/v1/account/company/media/logo");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "/v1/account/documents");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "/v1/account/files/by-object-key");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "file_owner_guard=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "self_hosted_account_api_smoke=ok");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "MIGRATION_DATABASE_URL");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "self_hosted_account_postgres_smoke=skipped");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "ACCOUNT_REPOSITORY: \"postgres\"");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "db:migrations:apply:live");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "insert into yorso_users");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "/v1/account/company/media/logo");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "/v1/account/documents");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "file_owner_guard=ok");
requireText("scripts/smoke-self-hosted-account-postgres.mjs", accountPostgresSmoke, "self_hosted_account_postgres_smoke=ok");
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
requireText("src/lib/account-api.ts", accountApi, "/v1/account/company/media/");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/documents");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/files/");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/files/by-object-key");
requireText("src/lib/account-api.ts", accountApi, "fileToAccountUploadPayload");
requireText("src/lib/account-api.ts", accountApi, "fileUrlForObjectKey");
requireText("src/lib/account-api.ts", accountApi, "resolveStoredFileUrl");
requireText("src/lib/account-api.ts", accountApi, "local prototype mode");
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
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "Self-Hosted Account PostgreSQL Smoke");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "npm run smoke:self-hosted-account-postgres");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "self_hosted_account_postgres_smoke=skipped");
requireText("docs/backend/self-hosted-account-postgres-smoke.md", accountPostgresSmokeDocs, "self_hosted_account_postgres_smoke=ok");

forbidText("apps/api/src/server.ts", server, "@/integrations/supabase/client");
forbidText("apps/api/src/config.ts", config, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/factory.ts", accountFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/service.ts", accountService, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/repository.ts", accountRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/routes.ts", accountRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/auth/session.ts", authSession, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/factory.ts", storageFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/object-storage.ts", storageObjectStorage, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/repository.ts", storageRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/routes.ts", storageRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/storage/service.ts", storageService, "@/integrations/supabase/client");
forbidText("apps/api/src/routes/account.ts", accountRoute, "@/integrations/supabase/client");
forbidText("src/components/account/CompanyDocumentsCard.tsx", companyDocumentsCard, "@/integrations/supabase/client");
forbidText("src/components/account/CompanyMediaCard.tsx", companyMediaCard, "@/integrations/supabase/client");
forbidText("src/components/account/SupplierProfilePreview.tsx", supplierProfilePreview, "@/integrations/supabase/client");
forbidText("src/lib/account-api.ts", accountApi, "@/integrations/supabase/client");
forbidText("src/lib/account-documents-store.ts", accountDocumentsStore, "@/integrations/supabase/client");
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
console.log("- Account routes require explicit self-hosted session headers instead of hidden demo-user fallback.");
console.log("- Runtime account API smoke is wired into ci:core.");
console.log("- Account UI can bridge company media and documents to the self-hosted file API with local fallback.");
console.log("- infra/docker-compose.yml includes the API service without Supabase production env.");
