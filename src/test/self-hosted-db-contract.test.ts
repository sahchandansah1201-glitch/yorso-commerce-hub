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
const adminAuditRetentionQueryHardeningSql = () =>
  readFileSync("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql", "utf8");
const adminAuditRetentionRuntimeSql = () =>
  readFileSync("packages/db/migrations/0016_admin_audit_retention_runtime.sql", "utf8");
const supplierAccessReviewQueueSql = () =>
  readFileSync("packages/db/migrations/0017_supplier_access_review_queue.sql", "utf8");
const adminAccessGrantsConsoleSql = () =>
  readFileSync("packages/db/migrations/0018_admin_access_grants_console.sql", "utf8");
const adminIncidentAcknowledgementsSql = () =>
  readFileSync("packages/db/migrations/0019_admin_incident_acknowledgements.sql", "utf8");
const adminIncidentWorkflowSql = () =>
  readFileSync("packages/db/migrations/0020_admin_incident_workflow.sql", "utf8");
const adminIncidentExecutionSql = () =>
  readFileSync("packages/db/migrations/0021_admin_incident_execution.sql", "utf8");
const adminIncidentWorkloadCorrelationSql = () =>
  readFileSync("packages/db/migrations/0022_admin_incident_workload_correlation.sql", "utf8");
const adminIncidentTrendAnalyticsSql = () =>
  readFileSync("packages/db/migrations/0023_admin_incident_trend_analytics.sql", "utf8");
const adminIncidentTrendActionsSql = () =>
  readFileSync("packages/db/migrations/0024_admin_incident_trend_actions.sql", "utf8");
const adminIncidentTrendActionQueueSql = () =>
  readFileSync("packages/db/migrations/0025_admin_incident_trend_action_queue.sql", "utf8");
const authPasswordRecoverySql = () =>
  readFileSync("packages/db/migrations/0029_auth_password_recovery.sql", "utf8");
const authPasswordRecoveryAbuseCleanupSql = () =>
  readFileSync("packages/db/migrations/0030_auth_password_recovery_abuse_cleanup.sql", "utf8");
const supplierProfileDossierFactsSql = () =>
  readFileSync("packages/db/migrations/0031_supplier_profile_dossier_facts.sql", "utf8");
const supplierProfileEvidenceBlocksSql = () =>
  readFileSync("packages/db/migrations/0032_supplier_profile_evidence_blocks.sql", "utf8");
const supplierProfileLegalDetailsSql = () =>
  readFileSync("packages/db/migrations/0033_supplier_profile_legal_details.sql", "utf8");
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

  it("adds backend-owned supplier profile dossier facts to the supplier directory record", () => {
    const text = supplierProfileDossierFactsSql();

    expect(text).toContain("alter table yorso_suppliers_directory");
    expect(text).toContain("production_facts jsonb not null");
    expect(text).toContain("logistics_facts jsonb not null");
    expect(text).toContain("yorso_suppliers_production_facts_object");
    expect(text).toContain("yorso_suppliers_logistics_facts_object");
    expect(text).toContain("API-owned and safe for locked buyer views");
  });

  it("adds backend-owned supplier profile evidence blocks to the supplier directory record", () => {
    const text = supplierProfileEvidenceBlocksSql();

    expect(text).toContain("alter table yorso_suppliers_directory");
    expect(text).toContain("shipment_cases jsonb not null default '[]'::jsonb");
    expect(text).toContain("profile_faq_items jsonb not null default '[]'::jsonb");
    expect(text).toContain("yorso_suppliers_shipment_cases_array");
    expect(text).toContain("yorso_suppliers_profile_faq_items_array");
    expect(text).toContain("API-owned and safe for locked buyer views");
  });

  it("adds restricted backend-owned supplier legal details to the supplier directory record", () => {
    const text = supplierProfileLegalDetailsSql();

    expect(text).toContain("alter table yorso_suppliers_directory");
    expect(text).toContain("legal_details jsonb");
    expect(text).toContain("yorso_suppliers_legal_details_object_or_null");
    expect(text).toContain("qualified_unlocked");
    expect(text).toContain("not safe for locked buyer views");
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

  it("declares self-hosted password recovery token and delivery outbox tables", () => {
    const text = authPasswordRecoverySql();

    expect(text).toContain("alter type yorso_auth_security_event_type add value if not exists 'password_reset_requested'");
    expect(text).toContain("create table if not exists yorso_auth_password_recovery_tokens");
    expect(text).toContain("create table if not exists yorso_auth_password_recovery_outbox");
    expect(text).toContain("token_lookup_hash text not null unique");
    expect(text).toContain("recovery_token_sealed text not null");
    expect(text).toContain("idx_yorso_auth_password_recovery_active_expiry");
    expect(text).toContain("idx_yorso_auth_password_recovery_outbox_ready");
    expect(text).toContain("10,000 concurrent-user baseline");
  });

  it("declares password recovery abuse-control and cleanup indexes", () => {
    const text = authPasswordRecoveryAbuseCleanupSql();

    expect(text).toContain("password_reset_rate_limited");
    expect(text).toContain("idx_yorso_auth_password_recovery_cleanup_expired");
    expect(text).toContain("idx_yorso_auth_password_recovery_cleanup_used");
    expect(text).toContain("idx_yorso_auth_password_recovery_outbox_terminal_cleanup");
    expect(text).toContain("10,000 concurrent-user baseline");
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

  it("declares admin audit retention helper and route/status query indexes", () => {
    const text = adminAuditRetentionQueryHardeningSql();

    expect(text).toContain("idx_yorso_api_audit_events_route_status_time");
    expect(text).toContain("idx_yorso_api_audit_events_outcome_status_time");
    expect(text).toContain("create or replace function yorso_purge_api_audit_events");
    expect(text).toContain("delete from yorso_api_audit_events");
    expect(text).toContain("10,000 concurrent users");
  });

  it("declares bounded admin audit retention runtime helper", () => {
    const text = adminAuditRetentionRuntimeSql();

    expect(text).toContain("idx_yorso_api_audit_events_retention_scan");
    expect(text).toContain("create or replace function yorso_purge_api_audit_events_batch");
    expect(text).toContain("p_limit must be between 1 and 5000");
    expect(text).toContain("order by occurred_at asc, audit_id asc");
    expect(text).toContain("10,000 concurrent users");
  });

  it("declares supplier access review queue indexes", () => {
    const text = supplierAccessReviewQueueSql();

    expect(text).toContain("idx_yorso_supplier_access_requests_review_open");
    expect(text).toContain("where status in ('sent', 'pending')");
    expect(text).toContain("idx_yorso_supplier_access_requests_review_all");
    expect(text).toContain("idx_yorso_supplier_access_requests_review_buyer");
    expect(text).toContain("10,000 concurrent-user production baseline");
  });

  it("declares admin access-grants console indexes", () => {
    const text = adminAccessGrantsConsoleSql();

    expect(text).toContain("idx_yorso_access_grants_admin_active");
    expect(text).toContain("idx_yorso_access_grants_admin_expired");
    expect(text).toContain("idx_yorso_access_grants_admin_buyer_active");
    expect(text).toContain("idx_yorso_access_grants_admin_supplier_active");
    expect(text).toContain("idx_yorso_access_events_supplier_revoked");
    expect(text).toContain("10,000 concurrent-user production baseline");
  });

  it("declares admin incident acknowledgement state indexes", () => {
    const text = adminIncidentAcknowledgementsSql();

    expect(text).toContain("create table if not exists yorso_admin_incident_acknowledgements");
    expect(text).toContain("incident_id text primary key");
    expect(text).toContain("acknowledged_by_user_id uuid not null references yorso_users(id)");
    expect(text).toContain("idx_yorso_admin_incident_ack_status_updated");
    expect(text).toContain("idx_yorso_admin_incident_ack_actor_updated");
    expect(text).toContain("10,000 concurrent-user production baseline");
  });

  it("declares admin incident workflow assignment, escalation and timeline state", () => {
    const text = adminIncidentWorkflowSql();

    expect(text).toContain("alter table yorso_admin_incident_acknowledgements");
    expect(text).toContain("assigned_to_user_id uuid references yorso_users(id)");
    expect(text).toContain("escalation_level text not null default 'none'");
    expect(text).toContain("create table if not exists yorso_admin_incident_events");
    expect(text).toContain("event_type text not null check");
    expect(text).toContain("idx_yorso_admin_incident_events_incident_time");
    expect(text).toContain("idx_yorso_admin_incident_events_actor_time");
    expect(text).toContain("idx_yorso_admin_incident_ack_assignee_updated");
    expect(text).toContain("10,000 concurrent-user");
  });

  it("declares admin incident execution item state", () => {
    const text = adminIncidentExecutionSql();

    expect(text).toContain("create table if not exists yorso_admin_incident_execution_items");
    expect(text).toContain("primary key (incident_id, item_id)");
    expect(text).toContain("source text not null check");
    expect(text).toContain("status text not null default 'open' check");
    expect(text).toContain("updated_by_user_id uuid not null references yorso_users(id)");
    expect(text).toContain("idx_yorso_admin_incident_execution_incident_status");
    expect(text).toContain("idx_yorso_admin_incident_execution_assignee_status");
    expect(text).toContain("idx_yorso_admin_incident_execution_source_status");
    expect(text).toContain("10,000 concurrent-user");
  });

  it("declares admin incident workload and correlation indexes separately", () => {
    const text = adminIncidentWorkloadCorrelationSql();

    expect(text).toContain("idx_yorso_admin_incident_execution_status_updated");
    expect(text).toContain("idx_yorso_admin_incident_execution_owner_status_due");
    expect(text).toContain("idx_yorso_admin_incident_execution_source_status_due");
    expect(text).toContain("idx_yorso_admin_incident_execution_incident_source_status");
    expect(text).toContain("idx_yorso_admin_incident_events_incident_recent");
    expect(text).toContain("idx_yorso_admin_incident_events_type_recent");
    expect(text).toContain("10,000 concurrent-user");
    expect(text).toContain("Batch #106");
  });

  it("declares admin incident trend action decision state", () => {
    const text = adminIncidentTrendActionsSql();

    expect(text).toContain("create table if not exists yorso_admin_incident_trend_actions");
    expect(text).toContain("action_id text primary key");
    expect(text).toContain("decided_by_user_id uuid not null references yorso_users(id)");
    expect(text).toContain("related_incident_ids text[] not null");
    expect(text).toContain("idx_yorso_admin_trend_actions_status_updated");
    expect(text).toContain("idx_yorso_admin_trend_actions_kind_priority");
    expect(text).toContain("idx_yorso_admin_trend_actions_related_gin");
    expect(text).toContain("Batch #108");
  });

  it("matches account/company DTO enum boundaries", () => {
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}\n${accessNotificationAckSql()}\n${supplierPaginationSortSql()}\n${offerPaginationSortSql()}\n${authSessionsSql()}\n${authSecurityEventsSql()}\n${apiAuditEventsSql()}\n${adminAuditAccessSql()}\n${adminAuditRetentionQueryHardeningSql()}\n${adminAuditRetentionRuntimeSql()}\n${adminAccessGrantsConsoleSql()}\n${adminIncidentAcknowledgementsSql()}\n${adminIncidentWorkflowSql()}\n${adminIncidentExecutionSql()}\n${adminIncidentWorkloadCorrelationSql()}\n${adminIncidentTrendAnalyticsSql()}\n${adminIncidentTrendActionsSql()}`;

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
    const text = `${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}\n${accessNotificationAckSql()}\n${supplierPaginationSortSql()}\n${offerPaginationSortSql()}\n${authSessionsSql()}\n${authSecurityEventsSql()}\n${apiAuditEventsSql()}\n${adminAuditAccessSql()}\n${adminAuditRetentionQueryHardeningSql()}\n${adminAuditRetentionRuntimeSql()}\n${adminAccessGrantsConsoleSql()}\n${adminIncidentAcknowledgementsSql()}\n${adminIncidentWorkflowSql()}\n${adminIncidentExecutionSql()}\n${adminIncidentWorkloadCorrelationSql()}\n${adminIncidentTrendAnalyticsSql()}\n${adminIncidentTrendActionQueueSql()}`;

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
    expect(text).toContain("idx_yorso_access_grants_admin_active");
    expect(text).toContain("idx_yorso_access_grants_admin_supplier_active");
    expect(text).toContain("idx_yorso_access_notifications_buyer_status_created");
    expect(text).toContain("idx_yorso_auth_sessions_user_active");
    expect(text).toContain("idx_yorso_auth_sessions_active_expiry");
    expect(text).toContain("idx_yorso_auth_security_events_email_type_recent");
    expect(text).toContain("idx_yorso_auth_security_events_session_recent");
    expect(text).toContain("idx_yorso_api_audit_events_action_outcome_time");
    expect(text).toContain("idx_yorso_api_audit_events_actor_time");
    expect(text).toContain("idx_yorso_api_audit_events_status_time");
    expect(text).toContain("idx_yorso_api_audit_events_route_time");
    expect(text).toContain("idx_yorso_api_audit_events_route_status_time");
    expect(text).toContain("idx_yorso_api_audit_events_outcome_status_time");
    expect(text).toContain("idx_yorso_api_audit_events_retention_scan");
    expect(text).toContain("idx_yorso_user_roles_role_user");
    expect(text).toContain("idx_yorso_admin_incident_events_incident_time");
    expect(text).toContain("idx_yorso_admin_incident_ack_assignee_updated");
    expect(text).toContain("idx_yorso_admin_incident_execution_incident_status");
    expect(text).toContain("idx_yorso_admin_incident_execution_assignee_status");
    expect(text).toContain("idx_yorso_admin_incident_execution_status_updated");
    expect(text).toContain("idx_yorso_admin_incident_events_incident_recent");
    expect(text).toContain("idx_yorso_admin_incident_events_occurred_type");
    expect(text).toContain("idx_yorso_admin_incident_events_incident_type_occurred");
    expect(text).toContain("idx_yorso_admin_incident_ack_status_updated");
    expect(text).toContain("idx_yorso_admin_incident_execution_status_updated_source");
    expect(text).toContain("idx_yorso_admin_incident_execution_priority_updated");
    expect(text).toContain("idx_yorso_admin_trend_actions_owner_priority");
    expect(text).toContain("idx_yorso_admin_trend_actions_status_kind_priority");
    expect(text).toContain("idx_yorso_admin_trend_actions_decider_updated");
    expect(text).toContain("public_search_text text generated always");
    expect(text).toContain("private_search_text text generated always");
    expect(text).toContain("gin_trgm_ops");
  });

  it("does not depend on hosted auth tables or RLS ownership", () => {
    const text = `${registrySql()}\n${sql()}\n${workspaceSql()}\n${filesSql()}\n${supplierSql()}\n${supplierScalingSql()}\n${offerCatalogSql()}\n${supplierAccessSql()}\n${accessNotificationAckSql()}\n${supplierPaginationSortSql()}\n${offerPaginationSortSql()}\n${authSessionsSql()}\n${authSecurityEventsSql()}\n${apiAuditEventsSql()}\n${adminAuditAccessSql()}\n${adminAuditRetentionQueryHardeningSql()}\n${adminAuditRetentionRuntimeSql()}\n${supplierAccessReviewQueueSql()}\n${adminAccessGrantsConsoleSql()}\n${adminIncidentAcknowledgementsSql()}\n${adminIncidentWorkflowSql()}\n${adminIncidentExecutionSql()}\n${adminIncidentWorkloadCorrelationSql()}\n${adminIncidentTrendAnalyticsSql()}\n${adminIncidentTrendActionsSql()}\n${adminIncidentTrendActionQueueSql()}\n${authPasswordRecoverySql()}\n${authPasswordRecoveryAbuseCleanupSql()}\n${supplierProfileDossierFactsSql()}\n${supplierProfileEvidenceBlocksSql()}`.toLowerCase();

    expect(text).not.toContain("auth.users");
    expect(text).not.toContain("supabase");
    expect(text).not.toContain("row level security");
  });

  it("is listed in the migration manifest", () => {
    const data = manifest();

    expect(data).toMatchObject({
      productionTarget: "self-hosted-postgresql",
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
      "0015_admin_audit_retention_query_hardening",
      "0016_admin_audit_retention_runtime",
      "0017_supplier_access_review_queue",
      "0018_admin_access_grants_console",
      "0019_admin_incident_acknowledgements",
      "0020_admin_incident_workflow",
      "0021_admin_incident_execution",
      "0022_admin_incident_workload_correlation",
      "0023_admin_incident_trend_analytics",
      "0024_admin_incident_trend_actions",
      "0025_admin_incident_trend_action_queue",
      "0026_registration_account_source",
      "0027_registration_verification_delivery_outbox",
      "0028_registration_verification_code_policy",
      "0029_auth_password_recovery",
      "0030_auth_password_recovery_abuse_cleanup",
      "0031_supplier_profile_dossier_facts",
      "0032_supplier_profile_evidence_blocks",
      "0033_supplier_profile_legal_details",
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
        expect.objectContaining({
          id: "0015_admin_audit_retention_query_hardening",
          ownedTables: ["yorso_api_audit_events"],
          dependsOn: ["0014_admin_audit_access"],
        }),
        expect.objectContaining({
          id: "0016_admin_audit_retention_runtime",
          ownedTables: ["yorso_api_audit_events"],
          dependsOn: ["0015_admin_audit_retention_query_hardening"],
        }),
        expect.objectContaining({
          id: "0017_supplier_access_review_queue",
          ownedTables: ["yorso_supplier_access_requests"],
          dependsOn: ["0016_admin_audit_retention_runtime"],
        }),
        expect.objectContaining({
          id: "0018_admin_access_grants_console",
          ownedTables: ["yorso_access_grants", "yorso_access_events"],
          dependsOn: ["0017_supplier_access_review_queue"],
        }),
        expect.objectContaining({
          id: "0019_admin_incident_acknowledgements",
          ownedTables: ["yorso_admin_incident_acknowledgements"],
          dependsOn: ["0018_admin_access_grants_console"],
        }),
        expect.objectContaining({
          id: "0020_admin_incident_workflow",
          ownedTables: ["yorso_admin_incident_acknowledgements", "yorso_admin_incident_events"],
          dependsOn: ["0019_admin_incident_acknowledgements"],
        }),
        expect.objectContaining({
          id: "0021_admin_incident_execution",
          ownedTables: ["yorso_admin_incident_execution_items"],
          dependsOn: ["0020_admin_incident_workflow"],
        }),
        expect.objectContaining({
          id: "0022_admin_incident_workload_correlation",
          ownedTables: ["yorso_admin_incident_execution_items", "yorso_admin_incident_events"],
          dependsOn: ["0021_admin_incident_execution"],
        }),
        expect.objectContaining({
          id: "0023_admin_incident_trend_analytics",
          ownedTables: [
            "yorso_admin_incident_acknowledgements",
            "yorso_admin_incident_execution_items",
            "yorso_admin_incident_events",
          ],
          dependsOn: ["0022_admin_incident_workload_correlation"],
        }),
        expect.objectContaining({
          id: "0024_admin_incident_trend_actions",
          ownedTables: ["yorso_admin_incident_trend_actions"],
          dependsOn: ["0023_admin_incident_trend_analytics"],
        }),
        expect.objectContaining({
          id: "0029_auth_password_recovery",
          ownedTables: ["yorso_auth_password_recovery_tokens", "yorso_auth_password_recovery_outbox"],
          dependsOn: ["0028_registration_verification_code_policy"],
        }),
        expect.objectContaining({
          id: "0030_auth_password_recovery_abuse_cleanup",
          ownedTables: [
            "yorso_auth_security_events",
            "yorso_auth_password_recovery_tokens",
            "yorso_auth_password_recovery_outbox",
          ],
          dependsOn: ["0029_auth_password_recovery"],
        }),
        expect.objectContaining({
          id: "0031_supplier_profile_dossier_facts",
          ownedTables: ["yorso_suppliers_directory"],
          dependsOn: ["0030_auth_password_recovery_abuse_cleanup"],
        }),
        expect.objectContaining({
          id: "0032_supplier_profile_evidence_blocks",
          ownedTables: ["yorso_suppliers_directory"],
          dependsOn: ["0031_supplier_profile_dossier_facts"],
        }),
        expect.objectContaining({
          id: "0033_supplier_profile_legal_details",
          ownedTables: ["yorso_suppliers_directory"],
          dependsOn: ["0032_supplier_profile_evidence_blocks"],
        }),
      ]),
    );
  });
});
