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
  "packages/db/migrations/0006_offer_catalog.sql",
  "packages/db/migrations/0007_supplier_access_flow.sql",
  "packages/db/migrations/0008_access_notification_ack.sql",
  "packages/db/migrations/0009_supplier_directory_pagination_sort.sql",
  "packages/db/migrations/0010_offer_catalog_pagination_sort.sql",
  "packages/db/migrations/0011_auth_sessions.sql",
  "packages/db/migrations/0012_auth_security_events.sql",
  "packages/db/migrations/0013_api_audit_events.sql",
  "packages/db/migrations/0014_admin_audit_access.sql",
  "packages/db/migrations/0015_admin_audit_retention_query_hardening.sql",
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
const offerCatalogSql = read("packages/db/migrations/0006_offer_catalog.sql");
const supplierAccessSql = read("packages/db/migrations/0007_supplier_access_flow.sql");
const accessNotificationAckSql = read("packages/db/migrations/0008_access_notification_ack.sql");
const supplierPaginationSortSql = read("packages/db/migrations/0009_supplier_directory_pagination_sort.sql");
const offerPaginationSortSql = read("packages/db/migrations/0010_offer_catalog_pagination_sort.sql");
const authSessionsSql = read("packages/db/migrations/0011_auth_sessions.sql");
const authSecurityEventsSql = read("packages/db/migrations/0012_auth_security_events.sql");
const apiAuditEventsSql = read("packages/db/migrations/0013_api_audit_events.sql");
const adminAuditAccessSql = read("packages/db/migrations/0014_admin_audit_access.sql");
const adminAuditRetentionQueryHardeningSql = read("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql");
const allSql = `${registrySql}\n${baselineSql}\n${workspaceSql}\n${filesSql}\n${supplierSql}\n${supplierScalingSql}\n${offerCatalogSql}\n${supplierAccessSql}\n${accessNotificationAckSql}\n${supplierPaginationSortSql}\n${offerPaginationSortSql}\n${authSessionsSql}\n${authSecurityEventsSql}\n${apiAuditEventsSql}\n${adminAuditAccessSql}\n${adminAuditRetentionQueryHardeningSql}`;
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

for (const marker of [
  "create table if not exists yorso_offers_catalog",
  "create type yorso_offer_format",
  "create type yorso_offer_stock_status",
  "create type yorso_offer_publication_status",
  "supplier_directory_id text references yorso_suppliers_directory(id)",
  "price_min numeric",
  "price_max numeric",
  "supplier jsonb not null",
  "public_search_text text generated always",
  "private_search_text text generated always",
  "idx_yorso_offers_catalog_public_search_text",
  "idx_yorso_offers_catalog_private_search_text",
  "idx_yorso_offers_catalog_certifications_search",
  "idx_yorso_offers_catalog_supplier_directory_id",
  "gin_trgm_ops",
  "Self-hosted offer catalog",
]) {
  requireText("packages/db/migrations/0006_offer_catalog.sql", offerCatalogSql, marker);
}

for (const marker of [
  "create table if not exists yorso_supplier_access_requests",
  "create table if not exists yorso_access_grants",
  "create table if not exists yorso_access_events",
  "create table if not exists yorso_access_notifications",
  "create type yorso_supplier_access_status",
  "create type yorso_access_grant_scope",
  "create type yorso_access_event_type",
  "references yorso_users(id)",
  "references yorso_suppliers_directory(id)",
  "references yorso_offers_catalog(id)",
  "unique (buyer_user_id, supplier_id)",
  "unique (buyer_user_id, supplier_id, scope, offer_id_key)",
  "idx_yorso_supplier_access_requests_buyer",
  "idx_yorso_supplier_access_requests_supplier_status",
  "idx_yorso_access_grants_buyer_supplier_scope",
  "idx_yorso_access_notifications_buyer_status_created",
]) {
  requireText("packages/db/migrations/0007_supplier_access_flow.sql", supplierAccessSql, marker);
}

for (const marker of [
  "alter type yorso_access_event_type add value if not exists 'notification_read'",
  "PATCH /v1/access/notifications",
  "idx_yorso_access_notifications_buyer_status_created",
]) {
  requireText("packages/db/migrations/0008_access_notification_ack.sql", accessNotificationAckSql, marker);
}

for (const marker of [
  "idx_yorso_suppliers_directory_published_updated",
  "idx_yorso_suppliers_directory_published_country",
  "idx_yorso_suppliers_directory_published_verification_updated",
  "idx_yorso_suppliers_directory_published_response_updated",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0009_supplier_directory_pagination_sort.sql", supplierPaginationSortSql, marker);
}

for (const marker of [
  "idx_yorso_offers_catalog_published_updated",
  "idx_yorso_offers_catalog_published_category",
  "idx_yorso_offers_catalog_published_origin",
  "idx_yorso_offers_catalog_published_moq",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0010_offer_catalog_pagination_sort.sql", offerPaginationSortSql, marker);
}

for (const marker of [
  "create table if not exists yorso_auth_credentials",
  "create table if not exists yorso_auth_sessions",
  "references yorso_users(id)",
  "idx_yorso_auth_credentials_enabled_user",
  "idx_yorso_auth_sessions_user_active",
  "idx_yorso_auth_sessions_active_expiry",
  "Self-hosted auth credential records",
]) {
  requireText("packages/db/migrations/0011_auth_sessions.sql", authSessionsSql, marker);
}

for (const marker of [
  "create type yorso_auth_security_event_type as enum",
  "create table if not exists yorso_auth_security_events",
  "sign_in_failed",
  "sign_in_rate_limited",
  "session_invalid",
  "idx_yorso_auth_security_events_email_type_recent",
  "idx_yorso_auth_security_events_session_recent",
  "idx_yorso_auth_security_events_type_recent",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0012_auth_security_events.sql", authSecurityEventsSql, marker);
}

for (const marker of [
  "create table if not exists yorso_api_audit_events",
  "idx_yorso_api_audit_events_occurred_at",
  "idx_yorso_api_audit_events_action_outcome_time",
  "idx_yorso_api_audit_events_actor_time",
  "idx_yorso_api_audit_events_resource_time",
  "idx_yorso_api_audit_events_correlation",
  "api_audit_event",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0013_api_audit_events.sql", apiAuditEventsSql, marker);
}

for (const marker of [
  "create table if not exists yorso_user_roles",
  "idx_yorso_user_roles_role_user",
  "idx_yorso_api_audit_events_status_time",
  "idx_yorso_api_audit_events_route_time",
  "Admin audit endpoints require the admin role",
]) {
  requireText("packages/db/migrations/0014_admin_audit_access.sql", adminAuditAccessSql, marker);
}

for (const marker of [
  "idx_yorso_api_audit_events_route_status_time",
  "idx_yorso_api_audit_events_outcome_status_time",
  "create or replace function yorso_purge_api_audit_events",
  "delete from yorso_api_audit_events",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql", adminAuditRetentionQueryHardeningSql, marker);
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
if (!manifest.migrations?.some((migration) => migration.id === "0012_auth_security_events")) {
  failures.push("packages/db/migration-manifest.json: missing 0012_auth_security_events");
}
if (!manifest.migrations?.some((migration) => migration.id === "0013_api_audit_events")) {
  failures.push("packages/db/migration-manifest.json: missing 0013_api_audit_events");
}
if (!manifest.migrations?.some((migration) => migration.id === "0014_admin_audit_access")) {
  failures.push("packages/db/migration-manifest.json: missing 0014_admin_audit_access");
}
if (!manifest.migrations?.some((migration) => migration.id === "0015_admin_audit_retention_query_hardening")) {
  failures.push("packages/db/migration-manifest.json: missing 0015_admin_audit_retention_query_hardening");
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
if (!manifest.migrations?.[6]?.dependsOn?.includes("0005_supplier_directory_search_scaling")) {
  failures.push("packages/db/migration-manifest.json: offer catalog must depend on supplier directory search scaling");
}
if (!manifest.migrations?.[7]?.dependsOn?.includes("0006_offer_catalog")) {
  failures.push("packages/db/migration-manifest.json: supplier access flow must depend on offer catalog");
}
if (!manifest.migrations?.[8]?.dependsOn?.includes("0007_supplier_access_flow")) {
  failures.push("packages/db/migration-manifest.json: access notification ack must depend on supplier access flow");
}
if (!manifest.migrations?.[9]?.dependsOn?.includes("0008_access_notification_ack")) {
  failures.push("packages/db/migration-manifest.json: supplier directory pagination sort must depend on access notification ack");
}
if (!manifest.migrations?.[10]?.dependsOn?.includes("0009_supplier_directory_pagination_sort")) {
  failures.push("packages/db/migration-manifest.json: offer catalog pagination sort must depend on supplier directory pagination sort");
}
if (!manifest.migrations?.[11]?.dependsOn?.includes("0010_offer_catalog_pagination_sort")) {
  failures.push("packages/db/migration-manifest.json: auth sessions must depend on offer catalog pagination sort");
}
if (!manifest.migrations?.[12]?.dependsOn?.includes("0011_auth_sessions")) {
  failures.push("packages/db/migration-manifest.json: auth security events must depend on auth sessions");
}
if (!manifest.migrations?.[13]?.dependsOn?.includes("0012_auth_security_events")) {
  failures.push("packages/db/migration-manifest.json: API audit events must depend on auth security events");
}
if (!manifest.migrations?.[14]?.dependsOn?.includes("0013_api_audit_events")) {
  failures.push("packages/db/migration-manifest.json: admin audit access must depend on API audit events");
}
if (!manifest.migrations?.[15]?.dependsOn?.includes("0014_admin_audit_access")) {
  failures.push("packages/db/migration-manifest.json: admin audit retention/query hardening must depend on admin audit access");
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
console.log("- packages/db owns the account/company/files/supplier-directory/offer-catalog/supplier-access PostgreSQL baseline and scaling indexes.");
console.log("- Supabase auth/RLS dependencies are not used by the self-hosted DB baseline.");
