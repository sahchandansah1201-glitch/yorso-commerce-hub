import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sha256 } from "./checksum.js";
import { buildMigrationPlan } from "./migrator.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

describe("self-hosted DB migration planner", () => {
  it("builds a deterministic migration plan from the manifest", () => {
    const plan = buildMigrationPlan(packageRoot);

    expect(plan.migrations.map((migration) => migration.id)).toEqual([
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
      "0034_supplier_profile_restricted_documents",
      "0035_supplier_document_download_grants",
      "0036_supplier_document_download_events",
    ]);
    expect(plan.migrations.map((migration) => migration.file)).toEqual([
      "migrations/0000_migration_registry.sql",
      "migrations/0001_account_company_baseline.sql",
      "migrations/0002_account_workspace_sections.sql",
      "migrations/0003_account_files_and_documents.sql",
      "migrations/0004_supplier_directory.sql",
      "migrations/0005_supplier_directory_search_scaling.sql",
      "migrations/0006_offer_catalog.sql",
      "migrations/0007_supplier_access_flow.sql",
      "migrations/0008_access_notification_ack.sql",
      "migrations/0009_supplier_directory_pagination_sort.sql",
      "migrations/0010_offer_catalog_pagination_sort.sql",
      "migrations/0011_auth_sessions.sql",
      "migrations/0012_auth_security_events.sql",
      "migrations/0013_api_audit_events.sql",
      "migrations/0014_admin_audit_access.sql",
      "migrations/0015_admin_audit_retention_query_hardening.sql",
      "migrations/0016_admin_audit_retention_runtime.sql",
      "migrations/0017_supplier_access_review_queue.sql",
      "migrations/0018_admin_access_grants_console.sql",
      "migrations/0019_admin_incident_acknowledgements.sql",
      "migrations/0020_admin_incident_workflow.sql",
      "migrations/0021_admin_incident_execution.sql",
      "migrations/0022_admin_incident_workload_correlation.sql",
      "migrations/0023_admin_incident_trend_analytics.sql",
      "migrations/0024_admin_incident_trend_actions.sql",
      "migrations/0025_admin_incident_trend_action_queue.sql",
      "migrations/0026_registration_account_source.sql",
      "migrations/0027_registration_verification_delivery_outbox.sql",
      "migrations/0028_registration_verification_code_policy.sql",
      "migrations/0029_auth_password_recovery.sql",
      "migrations/0030_auth_password_recovery_abuse_cleanup.sql",
      "migrations/0031_supplier_profile_dossier_facts.sql",
      "migrations/0032_supplier_profile_evidence_blocks.sql",
      "migrations/0033_supplier_profile_legal_details.sql",
      "migrations/0034_supplier_profile_restricted_documents.sql",
      "migrations/0035_supplier_document_download_grants.sql",
      "migrations/0036_supplier_document_download_events.sql",
    ]);
  });

  it("calculates stable SHA-256 checksums for every SQL file", () => {
    const plan = buildMigrationPlan(packageRoot);

    for (const migration of plan.migrations) {
      expect(migration.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(migration.checksum).toBe(sha256(migration.sql));
    }
  });

  it("keeps the registry before feature migrations", () => {
    const plan = buildMigrationPlan(packageRoot);
    const registry = plan.migrations[0];
    const account = plan.migrations[1];
    const workspaceSections = plan.migrations[2];
    const filesAndDocuments = plan.migrations[3];
    const supplierDirectory = plan.migrations[4];
    const supplierDirectorySearchScaling = plan.migrations[5];
    const offerCatalog = plan.migrations[6];
    const supplierAccessFlow = plan.migrations[7];
    const accessNotificationAck = plan.migrations[8];
    const supplierDirectoryPaginationSort = plan.migrations[9];
    const offerCatalogPaginationSort = plan.migrations[10];
    const authSessions = plan.migrations[11];
    const authSecurityEvents = plan.migrations[12];
    const apiAuditEvents = plan.migrations[13];
    const adminAuditAccess = plan.migrations[14];
    const adminAuditRetentionQueryHardening = plan.migrations[15];
    const adminAuditRetentionRuntime = plan.migrations[16];
    const supplierAccessReviewQueue = plan.migrations[17];
    const adminAccessGrantsConsole = plan.migrations[18];
    const adminIncidentAcknowledgements = plan.migrations[19];
    const adminIncidentWorkflow = plan.migrations[20];
    const adminIncidentExecution = plan.migrations[21];
    const adminIncidentWorkloadCorrelation = plan.migrations[22];
    const adminIncidentTrendAnalytics = plan.migrations[23];
    const adminIncidentTrendActions = plan.migrations[24];
    const adminIncidentTrendActionQueue = plan.migrations[25];
    const registrationAccountSource = plan.migrations[26];
    const registrationVerificationDeliveryOutbox = plan.migrations[27];
    const registrationVerificationCodePolicy = plan.migrations[28];
    const authPasswordRecovery = plan.migrations[29];
    const authPasswordRecoveryAbuseCleanup = plan.migrations[30];
    const supplierProfileDossierFacts = plan.migrations[31];
    const supplierProfileEvidenceBlocks = plan.migrations[32];
    const supplierProfileLegalDetails = plan.migrations[33];
    const supplierProfileRestrictedDocuments = plan.migrations[34];
    const supplierDocumentDownloadGrants = plan.migrations[35];
    const supplierDocumentDownloadEvents = plan.migrations[36];

    expect(registry.ownedTables).toEqual(["_yorso_migrations"]);
    expect(account.dependsOn).toEqual(["0000_migration_registry"]);
    expect(account.sql).toContain("create table if not exists yorso_companies");
    expect(workspaceSections.dependsOn).toEqual(["0001_account_company_baseline"]);
    expect(workspaceSections.sql).toContain("create table if not exists yorso_company_products");
    expect(filesAndDocuments.dependsOn).toEqual(["0002_account_workspace_sections"]);
    expect(filesAndDocuments.sql).toContain("create table if not exists yorso_file_assets");
    expect(supplierDirectory.dependsOn).toEqual(["0003_account_files_and_documents"]);
    expect(supplierDirectory.sql).toContain("create table if not exists yorso_suppliers_directory");
    expect(supplierDirectorySearchScaling.dependsOn).toEqual(["0004_supplier_directory"]);
    expect(supplierDirectorySearchScaling.sql).toContain("idx_yorso_suppliers_directory_certifications_search");
    expect(offerCatalog.dependsOn).toEqual(["0005_supplier_directory_search_scaling"]);
    expect(offerCatalog.sql).toContain("create table if not exists yorso_offers_catalog");
    expect(supplierAccessFlow.dependsOn).toEqual(["0006_offer_catalog"]);
    expect(supplierAccessFlow.sql).toContain("create table if not exists yorso_supplier_access_requests");
    expect(accessNotificationAck.dependsOn).toEqual(["0007_supplier_access_flow"]);
    expect(accessNotificationAck.sql).toContain("notification_read");
    expect(supplierDirectoryPaginationSort.dependsOn).toEqual(["0008_access_notification_ack"]);
    expect(supplierDirectoryPaginationSort.sql).toContain("idx_yorso_suppliers_directory_published_updated");
    expect(offerCatalogPaginationSort.dependsOn).toEqual(["0009_supplier_directory_pagination_sort"]);
    expect(offerCatalogPaginationSort.sql).toContain("idx_yorso_offers_catalog_published_updated");
    expect(authSessions.dependsOn).toEqual(["0010_offer_catalog_pagination_sort"]);
    expect(authSessions.sql).toContain("create table if not exists yorso_auth_sessions");
    expect(authSecurityEvents.dependsOn).toEqual(["0011_auth_sessions"]);
    expect(authSecurityEvents.sql).toContain("create table if not exists yorso_auth_security_events");
    expect(apiAuditEvents.dependsOn).toEqual(["0012_auth_security_events"]);
    expect(apiAuditEvents.sql).toContain("create table if not exists yorso_api_audit_events");
    expect(adminAuditAccess.dependsOn).toEqual(["0013_api_audit_events"]);
    expect(adminAuditAccess.sql).toContain("create table if not exists yorso_user_roles");
    expect(adminAuditAccess.sql).toContain("idx_yorso_api_audit_events_status_time");
    expect(adminAuditRetentionQueryHardening.dependsOn).toEqual(["0014_admin_audit_access"]);
    expect(adminAuditRetentionQueryHardening.sql).toContain("yorso_purge_api_audit_events");
    expect(adminAuditRetentionQueryHardening.sql).toContain("idx_yorso_api_audit_events_route_status_time");
    expect(adminAuditRetentionRuntime.dependsOn).toEqual(["0015_admin_audit_retention_query_hardening"]);
    expect(adminAuditRetentionRuntime.sql).toContain("yorso_purge_api_audit_events_batch");
    expect(adminAuditRetentionRuntime.sql).toContain("idx_yorso_api_audit_events_retention_scan");
    expect(supplierAccessReviewQueue.dependsOn).toEqual(["0016_admin_audit_retention_runtime"]);
    expect(supplierAccessReviewQueue.sql).toContain("idx_yorso_supplier_access_requests_review_open");
    expect(adminAccessGrantsConsole.dependsOn).toEqual(["0017_supplier_access_review_queue"]);
    expect(adminAccessGrantsConsole.sql).toContain("idx_yorso_access_grants_admin_active");
    expect(adminIncidentAcknowledgements.dependsOn).toEqual(["0018_admin_access_grants_console"]);
    expect(adminIncidentAcknowledgements.sql).toContain("create table if not exists yorso_admin_incident_acknowledgements");
    expect(adminIncidentWorkflow.dependsOn).toEqual(["0019_admin_incident_acknowledgements"]);
    expect(adminIncidentWorkflow.sql).toContain("create table if not exists yorso_admin_incident_events");
    expect(adminIncidentExecution.dependsOn).toEqual(["0020_admin_incident_workflow"]);
    expect(adminIncidentExecution.sql).toContain("create table if not exists yorso_admin_incident_execution_items");
    expect(adminIncidentWorkloadCorrelation.dependsOn).toEqual(["0021_admin_incident_execution"]);
    expect(adminIncidentWorkloadCorrelation.sql).toContain("idx_yorso_admin_incident_execution_status_updated");
    expect(adminIncidentWorkloadCorrelation.sql).toContain("idx_yorso_admin_incident_events_incident_recent");
    expect(adminIncidentTrendAnalytics.dependsOn).toEqual(["0022_admin_incident_workload_correlation"]);
    expect(adminIncidentTrendAnalytics.sql).toContain("idx_yorso_admin_incident_events_occurred_type");
    expect(adminIncidentTrendAnalytics.sql).toContain("idx_yorso_admin_incident_execution_priority_updated");
    expect(adminIncidentTrendActions.dependsOn).toEqual(["0023_admin_incident_trend_analytics"]);
    expect(adminIncidentTrendActions.sql).toContain("create table if not exists yorso_admin_incident_trend_actions");
    expect(adminIncidentTrendActions.sql).toContain("idx_yorso_admin_trend_actions_related_gin");
    expect(adminIncidentTrendActionQueue.dependsOn).toEqual(["0024_admin_incident_trend_actions"]);
    expect(adminIncidentTrendActionQueue.sql).toContain("idx_yorso_admin_trend_actions_owner_priority");
    expect(adminIncidentTrendActionQueue.sql).toContain("idx_yorso_admin_trend_actions_status_kind_priority");
    expect(registrationAccountSource.dependsOn).toEqual(["0025_admin_incident_trend_action_queue"]);
    expect(registrationAccountSource.sql).toContain("create table if not exists yorso_registration_drafts");
    expect(registrationVerificationDeliveryOutbox.dependsOn).toEqual(["0026_registration_account_source"]);
    expect(registrationVerificationDeliveryOutbox.sql).toContain("create table if not exists yorso_registration_delivery_outbox");
    expect(registrationVerificationDeliveryOutbox.sql).toContain("idx_yorso_registration_delivery_outbox_ready");
    expect(registrationVerificationCodePolicy.dependsOn).toEqual(["0027_registration_verification_delivery_outbox"]);
    expect(registrationVerificationCodePolicy.sql).toContain("email_code_expires_at");
    expect(registrationVerificationCodePolicy.sql).toContain("verification_code_sealed");
    expect(authPasswordRecovery.dependsOn).toEqual(["0028_registration_verification_code_policy"]);
    expect(authPasswordRecovery.sql).toContain("create table if not exists yorso_auth_password_recovery_tokens");
    expect(authPasswordRecovery.sql).toContain("create table if not exists yorso_auth_password_recovery_outbox");
    expect(authPasswordRecovery.sql).toContain("idx_yorso_auth_password_recovery_outbox_ready");
    expect(authPasswordRecoveryAbuseCleanup.dependsOn).toEqual(["0029_auth_password_recovery"]);
    expect(authPasswordRecoveryAbuseCleanup.sql).toContain("password_reset_rate_limited");
    expect(authPasswordRecoveryAbuseCleanup.sql).toContain("idx_yorso_auth_password_recovery_outbox_terminal_cleanup");
    expect(supplierProfileDossierFacts.dependsOn).toEqual(["0030_auth_password_recovery_abuse_cleanup"]);
    expect(supplierProfileDossierFacts.sql).toContain("production_facts jsonb not null");
    expect(supplierProfileDossierFacts.sql).toContain("logistics_facts jsonb not null");
    expect(supplierProfileEvidenceBlocks.dependsOn).toEqual(["0031_supplier_profile_dossier_facts"]);
    expect(supplierProfileEvidenceBlocks.sql).toContain("shipment_cases jsonb not null");
    expect(supplierProfileEvidenceBlocks.sql).toContain("profile_faq_items jsonb not null");
    expect(supplierProfileLegalDetails.dependsOn).toEqual(["0032_supplier_profile_evidence_blocks"]);
    expect(supplierProfileLegalDetails.sql).toContain("legal_details jsonb");
    expect(supplierProfileLegalDetails.sql).toContain("yorso_suppliers_legal_details_object_or_null");
    expect(supplierProfileRestrictedDocuments.dependsOn).toEqual(["0033_supplier_profile_legal_details"]);
    expect(supplierProfileRestrictedDocuments.sql).toContain("supplier_documents jsonb not null");
    expect(supplierProfileRestrictedDocuments.sql).toContain("yorso_suppliers_supplier_documents_array");
    expect(supplierDocumentDownloadGrants.dependsOn).toEqual(["0034_supplier_profile_restricted_documents"]);
    expect(supplierDocumentDownloadGrants.sql).toContain("create table if not exists yorso_supplier_document_download_grants");
    expect(supplierDocumentDownloadGrants.sql).toContain("idx_yorso_supplier_document_grants_buyer_recent");
    expect(supplierDocumentDownloadEvents.dependsOn).toEqual(["0035_supplier_document_download_grants"]);
    expect(supplierDocumentDownloadEvents.sql).toContain("create table if not exists yorso_supplier_document_download_events");
    expect(supplierDocumentDownloadEvents.sql).toContain("idx_yorso_supplier_document_download_events_buyer_recent");
  });

  it("keeps self-hosted SQL free of managed-backend coupling", () => {
    const plan = buildMigrationPlan(packageRoot);
    const combinedSql = plan.migrations.map((migration) => migration.sql.toLowerCase()).join("\n");

    expect(combinedSql).not.toContain("auth.users");
    expect(combinedSql).not.toContain("supabase");
    expect(combinedSql).not.toContain("enable row level security");
  });
});
