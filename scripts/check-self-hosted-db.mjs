#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const files = [
  "packages/db/README.md",
  "packages/db/migration-manifest.json",
  "packages/db/tsconfig.json",
  "packages/db/vitest.config.ts",
  "packages/db/src/checksum.ts",
  "packages/db/src/cli.ts",
  "packages/db/src/migrator.ts",
  "packages/db/src/postgres-client.ts",
  "packages/db/src/runtime.ts",
  "packages/db/migrations/0000_migration_registry.sql",
  "packages/db/migrations/0001_account_company_baseline.sql",
  "packages/db/migrations/0002_account_workspace_sections.sql",
  "packages/db/migrations/0003_account_files_and_documents.sql",
  "packages/db/migrations/0004_supplier_directory.sql",
  "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
];

const failures = [];

for (const file of files) {
  if (!existsSync(file)) failures.push(`missing ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const registrySql = read("packages/db/migrations/0000_migration_registry.sql");
const baselineSql = read("packages/db/migrations/0001_account_company_baseline.sql");
const workspaceSql = read("packages/db/migrations/0002_account_workspace_sections.sql");
const filesSql = read("packages/db/migrations/0003_account_files_and_documents.sql");
const supplierSql = read("packages/db/migrations/0004_supplier_directory.sql");
const supplierScalingSql = read("packages/db/migrations/0005_supplier_directory_search_scaling.sql");
const allSql = `${registrySql}\n${baselineSql}\n${workspaceSql}\n${filesSql}\n${supplierSql}\n${supplierScalingSql}`;
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const readme = read("packages/db/README.md");
const pkg = JSON.parse(read("package.json"));

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

const forbidText = (name, text, marker) => {
  if (text.includes(marker)) failures.push(`${name}: forbidden ${JSON.stringify(marker)}`);
};

for (const marker of [
  "create table if not exists _yorso_migrations",
  "idx_yorso_migrations_applied_at",
]) {
  requireText("packages/db/migrations/0000_migration_registry.sql", registrySql, marker);
}

for (const marker of [
  "create table if not exists yorso_users",
  "create table if not exists yorso_companies",
  "create table if not exists yorso_company_media",
  "create type yorso_account_role",
  "create type yorso_company_publication_status",
  "create type yorso_buyer_qualification_status",
  "references yorso_users(id)",
  "references yorso_companies(id)",
  "idx_yorso_companies_owner_user_id",
  "idx_yorso_companies_country_code",
  "Self-hosted YORSO",
]) {
  requireText("packages/db/migrations/0001_account_company_baseline.sql", baselineSql, marker);
}

for (const marker of [
  "create table if not exists yorso_company_branches",
  "create table if not exists yorso_company_products",
  "create table if not exists yorso_company_meta_regions",
  "create table if not exists yorso_notification_preferences",
  "create type yorso_branch_type",
  "create type yorso_product_state",
  "create type yorso_notification_event",
  "references yorso_companies(id)",
  "references yorso_users(id)",
  "idx_yorso_company_products_role",
  "primary key (company_id, id)",
  "primary key (user_id, id)",
  "Self-hosted account",
]) {
  requireText("packages/db/migrations/0002_account_workspace_sections.sql", workspaceSql, marker);
}

for (const marker of [
  "create table if not exists yorso_file_assets",
  "create table if not exists yorso_company_documents",
  "create type yorso_account_file_purpose",
  "create type yorso_company_document_type",
  "create type yorso_company_document_visibility",
  "create type yorso_company_document_status",
  "references yorso_users(id)",
  "references yorso_companies(id)",
  "references yorso_file_assets(id)",
  "checksum_sha256 char(64)",
  "idx_yorso_file_assets_owner_user_id",
  "idx_yorso_company_documents_status",
  "Self-hosted file metadata",
]) {
  requireText("packages/db/migrations/0003_account_files_and_documents.sql", filesSql, marker);
}

for (const marker of [
  "create table if not exists yorso_suppliers_directory",
  "create type yorso_supplier_type",
  "create type yorso_supplier_response_signal",
  "create type yorso_supplier_document_readiness",
  "create type yorso_supplier_verification_level",
  "create type yorso_supplier_publication_status",
  "company_id uuid references yorso_companies(id)",
  "product_focus jsonb",
  "delivery_countries jsonb",
  "product_catalog_preview jsonb",
  "publication_status yorso_supplier_publication_status",
  "public_search_text text generated always",
  "private_search_text text generated always",
  "idx_yorso_suppliers_directory_country_code",
  "idx_yorso_suppliers_directory_supplier_type",
  "idx_yorso_suppliers_directory_public_search_text",
  "idx_yorso_suppliers_directory_private_search_text",
  "Private supplier identity",
]) {
  requireText("packages/db/migrations/0004_supplier_directory.sql", supplierSql, marker);
}

for (const marker of [
  "create extension if not exists pg_trgm",
  "drop index if exists idx_yorso_suppliers_directory_public_search_text",
  "idx_yorso_suppliers_directory_public_search_text",
  "idx_yorso_suppliers_directory_private_search_text",
  "idx_yorso_suppliers_directory_product_focus_search",
  "idx_yorso_suppliers_directory_certifications_search",
  "idx_yorso_suppliers_directory_verification_level",
  "gin_trgm_ops",
  "high-concurrency catalog traffic",
]) {
  requireText("packages/db/migrations/0005_supplier_directory_search_scaling.sql", supplierScalingSql, marker);
}

forbidText("packages/db/migrations", allSql, "auth.users");
forbidText("packages/db/migrations", allSql, "supabase");

if (manifest.productionTarget !== "self-hosted-postgresql") {
  failures.push("packages/db/migration-manifest.json: productionTarget must be self-hosted-postgresql");
}
if (!manifest.migrations?.some((migration) => migration.id === "0000_migration_registry")) {
  failures.push("packages/db/migration-manifest.json: missing 0000_migration_registry");
}
if (!manifest.migrations?.some((migration) => migration.id === "0001_account_company_baseline")) {
  failures.push("packages/db/migration-manifest.json: missing 0001_account_company_baseline");
}
if (!manifest.migrations?.some((migration) => migration.id === "0002_account_workspace_sections")) {
  failures.push("packages/db/migration-manifest.json: missing 0002_account_workspace_sections");
}
if (!manifest.migrations?.some((migration) => migration.id === "0003_account_files_and_documents")) {
  failures.push("packages/db/migration-manifest.json: missing 0003_account_files_and_documents");
}
if (!manifest.migrations?.some((migration) => migration.id === "0004_supplier_directory")) {
  failures.push("packages/db/migration-manifest.json: missing 0004_supplier_directory");
}
if (!manifest.migrations?.some((migration) => migration.id === "0005_supplier_directory_search_scaling")) {
  failures.push("packages/db/migration-manifest.json: missing 0005_supplier_directory_search_scaling");
}
if (manifest.migrations?.[0]?.id !== "0000_migration_registry") {
  failures.push("packages/db/migration-manifest.json: registry migration must be first");
}
if (!manifest.migrations?.[1]?.dependsOn?.includes("0000_migration_registry")) {
  failures.push("packages/db/migration-manifest.json: account baseline must depend on registry migration");
}
if (!manifest.migrations?.[2]?.dependsOn?.includes("0001_account_company_baseline")) {
  failures.push("packages/db/migration-manifest.json: account workspace sections must depend on account baseline");
}
if (!manifest.migrations?.[3]?.dependsOn?.includes("0002_account_workspace_sections")) {
  failures.push("packages/db/migration-manifest.json: account files and documents must depend on workspace sections");
}
if (!manifest.migrations?.[4]?.dependsOn?.includes("0003_account_files_and_documents")) {
  failures.push("packages/db/migration-manifest.json: supplier directory must depend on account files and documents");
}
if (!manifest.migrations?.[5]?.dependsOn?.includes("0004_supplier_directory")) {
  failures.push("packages/db/migration-manifest.json: supplier directory search scaling must depend on supplier directory");
}

requireText("packages/db/README.md", readme, "self-hosted PostgreSQL baseline");
requireText("packages/db/README.md", readme, "Supabase migrations may still exist as prototype references");
requireText("packages/db/README.md", readme, "db:migrations:plan");
requireText("packages/db/README.md", readme, "MIGRATION_DATABASE_URL");

if (pkg.scripts["check:self-hosted-db"] !== "node scripts/check-self-hosted-db.mjs") {
  failures.push("package.json: check:self-hosted-db script missing or incorrect");
}
if (pkg.dependencies?.pg === undefined) {
  failures.push("package.json: pg dependency is required for the live PostgreSQL migration adapter");
}
if (pkg.scripts["db:build"] !== "tsc -p packages/db/tsconfig.json") {
  failures.push("package.json: db:build script missing or incorrect");
}
if (!pkg.scripts["db:migrations:plan"]?.includes("packages/db/dist/cli.js plan")) {
  failures.push("package.json: db:migrations:plan script missing or incorrect");
}
if (!pkg.scripts["db:migrations:check"]?.includes("packages/db/dist/cli.js check")) {
  failures.push("package.json: db:migrations:check script missing or incorrect");
}
if (!pkg.scripts["db:migrations:status"]?.includes("packages/db/dist/cli.js status")) {
  failures.push("package.json: db:migrations:status script missing or incorrect");
}
if (!pkg.scripts["db:migrations:status:live"]?.includes("packages/db/dist/cli.js status --live")) {
  failures.push("package.json: db:migrations:status:live script missing or incorrect");
}
if (!pkg.scripts["db:migrations:apply:dry-run"]?.includes("packages/db/dist/cli.js apply --dry-run")) {
  failures.push("package.json: db:migrations:apply:dry-run script missing or incorrect");
}
if (!pkg.scripts["db:migrations:apply:live:dry-run"]?.includes("packages/db/dist/cli.js apply --live --dry-run")) {
  failures.push("package.json: db:migrations:apply:live:dry-run script missing or incorrect");
}
if (!pkg.scripts["db:migrations:apply:live"]?.includes("packages/db/dist/cli.js apply --live --confirm")) {
  failures.push("package.json: db:migrations:apply:live script missing or incorrect");
}
if (!pkg.scripts["db:migrations:smoke:live"]?.includes("db:migrations:status:live")) {
  failures.push("package.json: db:migrations:smoke:live script missing or incorrect");
}
if (!pkg.scripts["test:db-migrations"]?.includes("packages/db/vitest.config.ts")) {
  failures.push("package.json: test:db-migrations script missing or incorrect");
}
if (!pkg.scripts["ci:core"]?.includes("npm run check:self-hosted-db")) {
  failures.push("package.json: ci:core must run check:self-hosted-db");
}
if (!pkg.scripts["ci:core"]?.includes("npm run db:migrations:check")) {
  failures.push("package.json: ci:core must run db:migrations:check");
}
if (!pkg.scripts["ci:core"]?.includes("npm run db:migrations:status")) {
  failures.push("package.json: ci:core must run db:migrations:status");
}
if (!pkg.scripts["ci:core"]?.includes("npm run db:migrations:apply:dry-run")) {
  failures.push("package.json: ci:core must run db:migrations:apply:dry-run");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:db-migrations")) {
  failures.push("package.json: ci:core must run test:db-migrations");
}

if (failures.length > 0) {
  console.error("Self-hosted DB check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Self-hosted DB check passed.");
console.log("- packages/db owns the account/company/files/supplier-directory PostgreSQL baseline and search scaling indexes.");
console.log("- Supabase auth/RLS dependencies are not used by the self-hosted DB baseline.");
