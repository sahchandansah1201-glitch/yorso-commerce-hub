import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = () => readFileSync("packages/db/migrations/0001_account_company_baseline.sql", "utf8");
const workspaceSql = () => readFileSync("packages/db/migrations/0002_account_workspace_sections.sql", "utf8");
const filesSql = () => readFileSync("packages/db/migrations/0003_account_files_and_documents.sql", "utf8");
const supplierSql = () => readFileSync("packages/db/migrations/0004_supplier_directory.sql", "utf8");
const supplierScalingSql = () => readFileSync("packages/db/migrations/0005_supplier_directory_search_scaling.sql", "utf8");
const offerCatalogSql = () => readFileSync("packages/db/migrations/0006_offer_catalog.sql", "utf8");
const supplierAccessSql = () => readFileSync("packages/db/migrations/0007_supplier_access_flow.sql", "utf8");
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

  it("matches account/company DTO enum boundaries", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}`;

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
  });

  it("contains constraints and indexes for account workspace reads", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}`;

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
    expect(text).toContain("idx_yorso_supplier_access_requests_buyer");
    expect(text).toContain("idx_yorso_supplier_access_requests_supplier_status");
    expect(text).toContain("idx_yorso_access_grants_buyer_supplier_scope");
    expect(text).toContain("idx_yorso_access_notifications_buyer_status_created");
    expect(text).toContain("public_search_text text generated always");
    expect(text).toContain("private_search_text text generated always");
    expect(text).toContain("gin_trgm_ops");
  });

  it("does not depend on Supabase auth tables or RLS ownership", () => {
    const text = `${registrySql()}\n${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}`.toLowerCase();

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
      ]),
    );
  });
});
