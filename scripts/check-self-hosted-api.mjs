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
  "apps/api/src/config.ts",
  "apps/api/src/http.ts",
  "apps/api/src/routes/health.ts",
  "apps/api/src/routes/account.ts",
  "apps/api/src/server.test.ts",
  "apps/api/tsconfig.json",
  "apps/api/vitest.config.ts",
  "apps/api/Dockerfile",
  "src/lib/account-api.ts",
  "src/lib/account-api.test.ts",
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
const accountRoute = read("apps/api/src/routes/account.ts");
const dockerfile = read("apps/api/Dockerfile");
const compose = read("infra/docker-compose.yml");
const docs = read("docs/backend/self-hosted-backend-architecture.md");
const contractsIndex = read("packages/contracts/src/index.ts");
const accountApi = read("src/lib/account-api.ts");

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
requireText("apps/api/src/server.ts", server, "x-yorso-backend");
requireText("apps/api/src/server.ts", server, "createAccountRepository(config)");
requireText("apps/api/src/server.ts", server, "access-control-allow-origin");
requireText("apps/api/src/server.ts", server, "OPTIONS");
requireText("apps/api/src/config.ts", config, "assertSupabaseIsPrototypeOnly");
requireText("apps/api/src/config.ts", config, "accountRepository: z.enum([\"memory\", \"postgres\"])");
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
requireText("apps/api/src/routes/account.ts", accountRoute, "packages/contracts/src/account-company.ts");
requireText("apps/api/src/routes/account.ts", accountRoute, "UserProfileUpdate");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyBranch");
requireText("apps/api/src/routes/account.ts", accountRoute, "CompanyProduct");
requireText("apps/api/src/routes/account.ts", accountRoute, "MetaRegion");
requireText("apps/api/src/routes/account.ts", accountRoute, "NotificationPreference");
requireText("apps/api/src/routes/account.ts", accountRoute, "self-hosted-yorso-api");
requireText("apps/api/Dockerfile", dockerfile, "FROM node:22-alpine");
requireText("apps/api/Dockerfile", dockerfile, "RUN npm run api:build");
requireText("apps/api/Dockerfile", dockerfile, "CMD [\"node\", \"apps/api/dist/index.js\"]");
requireText("infra/docker-compose.yml", compose, "dockerfile: apps/api/Dockerfile");
requireText("infra/docker-compose.yml", compose, "VITE_SUPABASE_URL: \"\"");
requireText("docs/backend/self-hosted-backend-architecture.md", docs, "YORSO API");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./account-company.js\";");
requireText("src/lib/account-api.ts", accountApi, "VITE_YORSO_API_URL");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/me");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/company");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/branches");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/products");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/meta-regions");
requireText("src/lib/account-api.ts", accountApi, "/v1/account/notifications");
requireText("src/lib/account-api.ts", accountApi, "local prototype mode");

forbidText("apps/api/src/server.ts", server, "@/integrations/supabase/client");
forbidText("apps/api/src/config.ts", config, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/factory.ts", accountFactory, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/postgres-repository.ts", postgresRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/service.ts", accountService, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/repository.ts", accountRepository, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/account/routes.ts", accountRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/routes/account.ts", accountRoute, "@/integrations/supabase/client");
forbidText("src/lib/account-api.ts", accountApi, "@/integrations/supabase/client");

if (failures.length > 0) {
  console.error("Self-hosted API skeleton check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Self-hosted API skeleton check passed.");
console.log("- apps/api exposes health and account-contract endpoints.");
console.log("- apps/api builds as a standalone Node service.");
console.log("- PostgresAccountRepository implements account profile reads and writes.");
console.log("- infra/docker-compose.yml includes the API service without Supabase production env.");
