import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = () => readFileSync("packages/db/migrations/0001_account_company_baseline.sql", "utf8");
const workspaceSql = () => readFileSync("packages/db/migrations/0002_account_workspace_sections.sql", "utf8");
const filesSql = () => readFileSync("packages/db/migrations/0003_account_files_and_documents.sql", "utf8");
const supplierSql = () => readFileSync("packages/db/migrations/0004_supplier_directory.sql", "utf8");
const supplierScalingSql = () => readFileSync("packages/db/migrations/0005_supplier_directory_search_scaling.sql", "utf8");
const offerCatalogSql = () => readFileSync("packages/db/migrations/0006_offer_catalog.sql", "utf8");
const supplierAccessSql = () => readFileSync("packages/db/migrations/0007_supplier_access_flow.sql", "utf8");
const accessNotificationAckSql = () => readFileSync("packages/db/migrations/0008_access_notification_ack.sql", "utf8");
const supplierPaginationSortSql = () => readFileSync("packages/db/migrations/0009_supplier_directory_pagination_sort.sql", "utf8");
const offerPaginationSortSql = () => readFileSync("packages/db/migrations/0010_offer_catalog_pagination_sort.sql", "utf8");
const authSessionsSql = () => readFileSync("packages/db/migrations/0011_auth_sessions.sql", "utf8");
const authSecurityEventsSql = () => readFileSync("packages/db/migrations/0012_auth_security_events.sql", "utf8");
const apiAuditEventsSql = () => readFileSync("packages/db/migrations/0013_api_audit_events.sql", "utf8");
const adminAuditAccessSql = () => readFileSync("packages/db/migrations/0014_admin_audit_access.sql", "utf8");
const registrySql = () => readFileSync("packages/db/migrations/0000_migration_registry.sql", "utf8");
const manifest = () => JSON.parse(readFileSync("packages/db/migration-manifest.json", "utf8"));

describe("self-hosted PostgreSQL account/company baseline", () => {
  it("declares a self-hosted migration registry before feature tables", () => {
    const text = registrySql();

    expect(text).toContain("create table if not exists _yorso_migrations");
    expect(text).toContain("checksum text not null");
    expect(text).toContain("idx_yorso_migrations_applied_at");
    expect(text).toContain("Self-hosted YORSO schema migration registry");
  });

  it("declares account, company and media tables owned by YORSO", () => {
    const text = sql();

    expect(text).toContain("create table if not exists yorso_users");
    expect(text).toContain("create table if not exists yorso_companies");
    expect(text).toContain("create table if not exists yorso_company_media");
    expect(text).toContain("create extension if not exists citext");
    expect(text).toContain("comment on table yorso_users is 'Self-hosted YORSO user profiles");
  });

  it("declares account workspace section tables owned by YORSO", () => {
    const text = workspaceSql();

    expect(text).toContain("create table if not exists yorso_company_branches");
    expect(text).toContain("create table if not exists yorso_company_products");
    expect(text).toContain("create table if not exists yorso_company_meta_regions");
    expect(text).toContain("create table if not exists yorso_notification_preferences");
    expect(text).toContain("primary key (company_id, id)");
    expect(text).toContain("primary key (user_id, id)");
    expect(text).toContain("comment on table yorso_company_products is 'Self-hosted company product matching matrix");
  });

  it("declares file asset and company document tables owned by YORSO", () => {
    const text = filesSql();

    expect(text).toContain("create table if not exists yorso_file_assets");
    expect(text).toContain("create table if not exists yorso_company_documents");
    expect(text).toContain("create type yorso_account_file_purpose");
    expect(text).toContain("create type yorso_company_document_type");
    expect(text).toContain("checksum_sha256 char(64)");
    expect(text).toContain("references yorso_file_assets(id)");
    expect(text).toContain("comment on table yorso_company_documents is 'Self-hosted company document records");
  });

  it("declares supplier directory tables owned by YORSO", () => {
    const text = supplierSql();

    expect(text).toContain("create table if not exists yorso_suppliers_directory");
    expect(text).toContain("create type yorso_supplier_type");
    expect(text).toContain("company_id uuid references yorso_companies(id)");
    expect(text).toContain("product_focus jsonb");
    expect(text).toContain("delivery_countries jsonb");
    expect(text).toContain("product_catalog_preview jsonb");
    expect(text).toContain("idx_yorso_suppliers_directory_country_code");
    expect(text).toContain("Private supplier identity");
  });

  it("adds scalable supplier directory search indexes separately from the baseline table migration", () => {
    const text = supplierScalingSql();

    expect(text).toContain("create extension if not exists pg_trgm");
    expect(text).toContain("drop index if exists idx_yorso_suppliers_directory_public_search_text");
    expect(text).toContain("idx_yorso_suppliers_directory_public_search_text");
    expect(text).toContain("idx_yorso_suppliers_directory_private_search_text");
    expect(text).toContain("idx_yorso_suppliers_directory_product_focus_search");
    expect(text).toContain("idx_yorso_suppliers_directory_certifications_search");
    expect(text).toContain("idx_yorso_suppliers_directory_verification_level");
    expect(text).toContain("gin_trgm_ops");
    expect(supplierSql()).not.toContain("create extension if not exists pg_trgm");
  });

  it("declares offer catalog tables and search indexes owned by YORSO", () => {
    const text = offerCatalogSql();

    expect(text).toContain("create table if not exists yorso_offers_catalog");
    expect(text).toContain("create type yorso_offer_format");
    expect(text).toContain("supplier_directory_id text references yorso_suppliers_directory(id)");
    expect(text).toContain("price_min numeric");
    expect(text).toContain("supplier jsonb not null");
    expect(text).toContain("public_search_text text generated always");
    expect(text).toContain("private_search_text text generated always");
    expect(text).toContain("idx_yorso_offers_catalog_public_search_text");
    expect(text).toContain("idx_yorso_offers_catalog_private_search_text");
    expect(text).toContain("idx_yorso_offers_catalog_supplier_country_code");
    expect(text).toContain("gin_trgm_ops");
    expect(text).toContain("Self-hosted offer catalog");
  });

  it("declares supplier and price access flow tables owned by YORSO", () => {
    const text = supplierAccessSql();

    expect(text).toContain("create table if not exists yorso_supplier_access_requests");
    expect(text).toContain("create table if not exists yorso_access_grants");
    expect(text).toContain("create table if not exists yorso_access_events");
    expect(text).toContain("create table if not exists yorso_access_notifications");
    expect(text).toContain("create type yorso_supplier_access_status");
    expect(text).toContain("create type yorso_access_grant_scope");
    expect(text).toContain("references yorso_users(id)");
    expect(text).toContain("references yorso_suppliers_directory(id)");
    expect(text).toContain("references yorso_offers_catalog(id)");
    expect(text).toContain("idx_yorso_access_grants_buyer_supplier_scope");
    expect(text).toContain("idx_yorso_access_notifications_buyer_status_created");
  });

  it("adds supplier access notification acknowledgement audit support separately", () => {
    const text = accessNotificationAckSql();

    expect(text).toContain("alter type yorso_access_event_type add value if not exists 'notification_read'");
    expect(text).toContain("PATCH /v1/access/notifications");
    expect(text).toContain("idx_yorso_access_notifications_buyer_status_created");
    expect(supplierAccessSql()).not.toContain("notification_read");
  });

  it("adds supplier directory pagination and sort indexes separately", () => {
    const text = supplierPaginationSortSql();

    expect(text).toContain("idx_yorso_suppliers_directory_published_updated");
    expect(text).toContain("idx_yorso_suppliers_directory_published_country");
    expect(text).toContain("idx_yorso_suppliers_directory_published_verification_updated");
    expect(text).toContain("idx_yorso_suppliers_directory_published_response_updated");
    expect(text).toContain("10,000 concurrent users");
    expect(supplierSql()).not.toContain("idx_yorso_suppliers_directory_published_updated");
  });

  it("adds offer catalog pagination and sort indexes separately", () => {
    const text = offerPaginationSortSql();

    expect(text).toContain("idx_yorso_offers_catalog_published_updated");
    expect(text).toContain("idx_yorso_offers_catalog_published_category");
    expect(text).toContain("idx_yorso_offers_catalog_published_origin");
    expect(text).toContain("idx_yorso_offers_catalog_published_moq");
    expect(text).toContain("10,000 concurrent users");
    expect(offerCatalogSql()).not.toContain("idx_yorso_offers_catalog_published_updated");
  });

  it("declares self-hosted auth credential and session tables owned by YORSO", () => {
    const text = authSessionsSql();

    expect(text).toContain("create table if not exists yorso_auth_credentials");
    expect(text).toContain("create table if not exists yorso_auth_sessions");
    expect(text).toContain("references yorso_users(id)");
    expect(text).toContain("idx_yorso_auth_credentials_enabled_user");
    expect(text).toContain("idx_yorso_auth_sessions_user_active");
    expect(text).toContain("idx_yorso_auth_sessions_active_expiry");
    expect(text).toContain("Self-hosted auth credential records");
  });

  it("declares self-hosted auth security event audit tables and indexes", () => {
    const text = authSecurityEventsSql();

    expect(text).toContain("create type yorso_auth_security_event_type as enum");
    expect(text).toContain("create table if not exists yorso_auth_security_events");
    expect(text).toContain("sign_in_failed");
    expect(text).toContain("sign_in_rate_limited");
    expect(text).toContain("session_invalid");
    expect(text).toContain("idx_yorso_auth_security_events_email_type_recent");
    expect(text).toContain("idx_yorso_auth_security_events_session_recent");
    expect(text).toContain("idx_yorso_auth_security_events_type_recent");
    expect(text).toContain("10,000 concurrent users");
  });

  it("declares durable API audit event tables and indexes", () => {
    const text = apiAuditEventsSql();

    expect(text).toContain("create table if not exists yorso_api_audit_events");
    expect(text).toContain("audit_id text primary key");
    expect(text).toContain("check ((event->>'type') = 'api_audit_event')");
    expect(text).toContain("idx_yorso_api_audit_events_occurred_at");
    expect(text).toContain("idx_yorso_api_audit_events_action_outcome_time");
    expect(text).toContain("idx_yorso_api_audit_events_actor_time");
    expect(text).toContain("idx_yorso_api_audit_events_resource_time");
    expect(text).toContain("idx_yorso_api_audit_events_correlation");
    expect(text).toContain("10,000 concurrent users");
  });

  it("declares self-hosted admin roles and audit read indexes", () => {
    const text = adminAuditAccessSql();

    expect(text).toContain("create table if not exists yorso_user_roles");
    expect(text).toContain("role text not null check");
    expect(text).toContain("idx_yorso_user_roles_role_user");
    expect(text).toContain("idx_yorso_api_audit_events_status_time");
    expect(text).toContain("idx_yorso_api_audit_events_route_time");
    expect(text).toContain("Admin audit endpoints require the admin role");
  });

  it("matches account/company DTO enum boundaries", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}\n${accessNotificationAckSql()}\n${supplierPaginationSortSql()}\n${offerPaginationSortSql()}\n${authSessionsSql()}\n${authSecurityEventsSql()}\n${apiAuditEventsSql()}\n${adminAuditAccessSql()}`;

    expect(text).toContain("create type yorso_account_role as enum ('buyer', 'supplier', 'both')");
    expect(text).toContain("create type yorso_company_publication_status as enum ('draft', 'review', 'published', 'blocked')");
    expect(text).toContain("create type yorso_buyer_qualification_status as enum ('not_started', 'pending', 'qualified', 'rejected')");
    expect(text).toContain("create type yorso_logo_fit as enum ('contain', 'cover')");
    expect(text).toContain("create type yorso_branch_type as enum");
    expect(text).toContain("create type yorso_product_state as enum ('frozen', 'fresh', 'chilled', 'alive', 'cooked')");
    expect(text).toContain("create type yorso_product_role as enum ('buying', 'selling', 'both')");
    expect(text).toContain("create type yorso_notification_frequency as enum ('instant', 'daily', 'weekly')");
    expect(text).toContain("create type yorso_account_file_purpose as enum");
    expect(text).toContain("create type yorso_company_document_visibility as enum");
    expect(text).toContain("create type yorso_company_document_status as enum");
    expect(text).toContain("create type yorso_supplier_type as enum");
    expect(text).toContain("create type yorso_supplier_publication_status as enum");
    expect(text).toContain("create type yorso_offer_format as enum ('Frozen', 'Fresh', 'Chilled')");
    expect(text).toContain("create type yorso_offer_publication_status as enum");
    expect(text).toContain("create type yorso_supplier_access_status as enum");
    expect(text).toContain("create type yorso_access_grant_scope as enum");
    expect(text).toContain("create type yorso_access_event_type as enum");
    expect(text).toContain("create type yorso_auth_security_event_type as enum");
  });

  it("contains constraints and indexes for account workspace reads", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}\n${accessNotificationAckSql()}\n${supplierPaginationSortSql()}\n${offerPaginationSortSql()}\n${authSessionsSql()}\n${authSecurityEventsSql()}\n${apiAuditEventsSql()}\n${adminAuditAccessSql()}`;

    expect(text).toContain("char_length(legal_name) between 2 and 180");
    expect(text).toContain("array_length(product_focus, 1) <= 20");
    expect(text).toContain("cover_focal_x >= 0 and cover_focal_x <= 1");
    expect(text).toContain("idx_yorso_companies_owner_user_id");
    expect(text).toContain("idx_yorso_companies_country_code");
    expect(text).toContain("idx_yorso_company_products_role");
    expect(text).toContain("yorso_notification_enabled_has_events");
    expect(text).toContain("idx_yorso_file_assets_owner_user_id");
    expect(text).toContain("idx_yorso_company_documents_status");
    expect(text).toContain("idx_yorso_suppliers_directory_supplier_type");
    expect(text).toContain("idx_yorso_suppliers_directory_public_search_text");
    expect(text).toContain("idx_yorso_suppliers_directory_private_search_text");
    expect(text).toContain("idx_yorso_suppliers_directory_certifications_search");
    expect(text).toContain("idx_yorso_offers_catalog_category");
    expect(text).toContain("idx_yorso_offers_catalog_origin_code");
    expect(text).toContain("idx_yorso_offers_catalog_supplier_country_code");
    expect(text).toContain("idx_yorso_offers_catalog_certifications_search");
    expect(text).toContain("idx_yorso_offers_catalog_published_updated");
    expect(text).toContain("idx_yorso_offers_catalog_published_category");
    expect(text).toContain("idx_yorso_supplier_access_requests_buyer");
    expect(text).toContain("idx_yorso_supplier_access_requests_supplier_status");
    expect(text).toContain("idx_yorso_access_grants_buyer_supplier_scope");
    expect(text).toContain("idx_yorso_access_notifications_buyer_status_created");
    expect(text).toContain("idx_yorso_auth_sessions_user_active");
    expect(text).toContain("idx_yorso_auth_sessions_active_expiry");
    expect(text).toContain("idx_yorso_auth_security_events_email_type_recent");
    expect(text).toContain("idx_yorso_auth_security_events_session_recent");
    expect(text).toContain("idx_yorso_api_audit_events_action_outcome_time");
    expect(text).toContain("idx_yorso_api_audit_events_actor_time");
    expect(text).toContain("idx_yorso_api_audit_events_status_time");
    expect(text).toContain("idx_yorso_api_audit_events_route_time");
    expect(text).toContain("idx_yorso_user_roles_role_user");
    expect(text).toContain("public_search_text text generated always");
    expect(text).toContain("private_search_text text generated always");
    expect(text).toContain("gin_trgm_ops");
  });

  it("does not depend on Supabase auth tables or RLS ownership", () => {
    const text = `${registrySql()}\n${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}\n${accessNotificationAckSql()}\n${supplierPaginationSortSql()}\n${offerPaginationSortSql()}\n${authSessionsSql()}\n${authSecurityEventsSql()}\n${apiAuditEventsSql()}\n${adminAuditAccessSql()}`.toLowerCase();

    expect(text).not.toContain("auth.users");
    expect(text).not.toContain("supabase");
    expect(text).not.toContain("row level security");
  });

  it("is listed in the migration manifest", () => {
    const data = manifest();

    expect(data).toMatchObject({
      productionTarget: "self-hosted-postgresql",
      supabaseRole: "prototype-reference-only",
    });
    expect(data.migrations.map((migration: { id: string }) => migration.id)).toEqual([
      "0000_migration_registry",
      "0001_account_company_baseline",
      "0002_account_workspace_sections",
      "0003_account_files_and_documents",
      "0004_supplier_directory",
      "0005_supplier_directory_search_scaling",
      "0006_offer_catalog",
      "0007_supplier_access_flow",
      "0008_access_notification_ack",
      "0009_supplier_directory_pagination_sort",
      "0010_offer_catalog_pagination_sort",
      "0011_auth_sessions",
      "0012_auth_security_events",
      "0013_api_audit_events",
      "0014_admin_audit_access",
    ]);
    expect(data.migrations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "0000_migration_registry",
          ownedTables: ["_yorso_migrations"],
        }),
        expect.objectContaining({
          id: "0001_account_company_baseline",
          ownedTables: ["yorso_users", "yorso_companies", "yorso_company_media"],
          dependsOn: ["0000_migration_registry"],
        }),
        expect.objectContaining({
          id: "0002_account_workspace_sections",
          ownedTables: [
            "yorso_company_branches",
            "yorso_company_products",
            "yorso_company_meta_regions",
            "yorso_notification_preferences",
          ],
          dependsOn: ["0001_account_company_baseline"],
        }),
        expect.objectContaining({
          id: "0003_account_files_and_documents",
          ownedTables: ["yorso_file_assets", "yorso_company_documents"],
          dependsOn: ["0002_account_workspace_sections"],
        }),
        expect.objectContaining({
          id: "0004_supplier_directory",
          ownedTables: ["yorso_suppliers_directory"],
          dependsOn: ["0003_account_files_and_documents"],
        }),
        expect.objectContaining({
          id: "0005_supplier_directory_search_scaling",
          ownedTables: ["yorso_suppliers_directory"],
          dependsOn: ["0004_supplier_directory"],
        }),
        expect.objectContaining({
          id: "0006_offer_catalog",
          ownedTables: ["yorso_offers_catalog"],
          dependsOn: ["0005_supplier_directory_search_scaling"],
        }),
        expect.objectContaining({
          id: "0007_supplier_access_flow",
          ownedTables: [
            "yorso_supplier_access_requests",
            "yorso_access_grants",
            "yorso_access_events",
            "yorso_access_notifications",
          ],
          dependsOn: ["0006_offer_catalog"],
        }),
        expect.objectContaining({
          id: "0008_access_notification_ack",
          ownedTables: [
            "yorso_access_events",
            "yorso_access_notifications",
          ],
          dependsOn: ["0007_supplier_access_flow"],
        }),
        expect.objectContaining({
          id: "0009_supplier_directory_pagination_sort",
          ownedTables: ["yorso_suppliers_directory"],
          dependsOn: ["0008_access_notification_ack"],
        }),
        expect.objectContaining({
          id: "0010_offer_catalog_pagination_sort",
          ownedTables: ["yorso_offers_catalog"],
          dependsOn: ["0009_supplier_directory_pagination_sort"],
        }),
        expect.objectContaining({
          id: "0011_auth_sessions",
          ownedTables: ["yorso_auth_credentials", "yorso_auth_sessions"],
          dependsOn: ["0010_offer_catalog_pagination_sort"],
        }),
        expect.objectContaining({
          id: "0012_auth_security_events",
          ownedTables: ["yorso_auth_security_events"],
          dependsOn: ["0011_auth_sessions"],
        }),
        expect.objectContaining({
          id: "0013_api_audit_events",
          ownedTables: ["yorso_api_audit_events"],
          dependsOn: ["0012_auth_security_events"],
        }),
        expect.objectContaining({
          id: "0014_admin_audit_access",
          ownedTables: ["yorso_user_roles"],
          dependsOn: ["0013_api_audit_events"],
        }),
      ]),
    );
  });
});
