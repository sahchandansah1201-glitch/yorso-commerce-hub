import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = () => readFileSync("packages/db/migrations/0001_account_company_baseline.sql", "utf8");
const workspaceSql = () => readFileSync("packages/db/migrations/0002_account_workspace_sections.sql", "utf8");
const filesSql = () => readFileSync("packages/db/migrations/0003_account_files_and_documents.sql", "utf8");
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


  it("matches account/company DTO enum boundaries", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}`;

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
  });

  it("contains constraints and indexes for account workspace reads", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}`;

    expect(text).toContain("char_length(legal_name) between 2 and 180");
    expect(text).toContain("array_length(product_focus, 1) <= 20");
    expect(text).toContain("cover_focal_x >= 0 and cover_focal_x <= 1");
    expect(text).toContain("idx_yorso_companies_owner_user_id");
    expect(text).toContain("idx_yorso_companies_country_code");
    expect(text).toContain("idx_yorso_company_products_role");
    expect(text).toContain("yorso_notification_enabled_has_events");
    expect(text).toContain("idx_yorso_file_assets_owner_user_id");
    expect(text).toContain("idx_yorso_company_documents_status");
  });

  it("does not depend on Supabase auth tables or RLS ownership", () => {
    const text = `${registrySql()}\n${sql()}\n${workspaceSql()}\n${filesSql()}`.toLowerCase();

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
      ]),
    );
  });
});
