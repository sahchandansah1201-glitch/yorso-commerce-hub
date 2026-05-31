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
  "apps/api/src/modules/admin-audit/factory.ts",
  "apps/api/src/modules/admin-audit/postgres-repository.ts",
  "apps/api/src/modules/admin-audit/repository.ts",
  "apps/api/src/modules/admin-audit/repository.test.ts",
  "apps/api/src/modules/admin-audit/routes.ts",
  "apps/api/src/modules/admin-audit/service.ts",
  "apps/api/src/modules/admin-runtime/routes.ts",
  "apps/api/src/modules/admin-runtime/service.ts",
  "apps/api/src/modules/admin-incidents/factory.ts",
  "apps/api/src/modules/admin-incidents/postgres-repository.ts",
  "apps/api/src/modules/admin-incidents/repository.ts",
  "apps/api/src/modules/admin-incidents/repository.test.ts",
  "apps/api/src/modules/admin-incidents/routes.ts",
  "apps/api/src/modules/admin-incidents/service.ts",
  "apps/api/src/modules/admin-incidents/service.test.ts",
  "src/lib/admin-runtime-api.ts",
  "src/lib/admin-runtime-api.test.ts",
  "src/lib/use-admin-runtime-status.ts",
  "src/lib/use-admin-runtime-status.test.tsx",
  "src/pages/admin/AdminRuntimeStatus.tsx",
  "src/pages/admin/AdminRuntimeStatus.test.tsx",
  "e2e/admin-runtime-status.spec.ts",
  "src/lib/admin-access-review-api.ts",
  "src/lib/admin-access-review-api.test.ts",
  "src/lib/use-admin-access-review.ts",
  "src/lib/use-admin-access-review.test.tsx",
  "src/pages/admin/AdminAccessRequests.tsx",
  "src/pages/admin/AdminAccessRequests.test.tsx",
  "e2e/admin-access-review.spec.ts",
  "src/lib/admin-access-grants-api.ts",
  "src/lib/admin-access-grants-api.test.ts",
  "src/lib/use-admin-access-grants.ts",
  "src/lib/use-admin-access-grants.test.tsx",
  "src/pages/admin/AdminAccessGrants.tsx",
  "src/pages/admin/AdminAccessGrants.test.tsx",
  "e2e/admin-access-grants.spec.ts",
  "apps/api/src/modules/admin-operations/routes.ts",
  "apps/api/src/modules/admin-operations/service.ts",
  "packages/contracts/src/admin-operations.ts",
  "src/components/admin/AdminOperatorNav.tsx",
  "src/lib/admin-operations-api.ts",
  "src/lib/admin-operations-api.test.ts",
  "src/lib/use-admin-operations-overview.ts",
  "src/lib/use-admin-operations-overview.test.tsx",
  "src/pages/admin/AdminOperations.tsx",
  "src/pages/admin/AdminOperations.test.tsx",
  "e2e/admin-operations.spec.ts",
  "packages/contracts/src/admin-incidents.ts",
  "src/lib/admin-incidents-api.ts",
  "src/lib/admin-incidents-api.test.ts",
  "src/lib/admin-incidents-trends-api.test.ts",
  "src/lib/use-admin-incidents.ts",
  "src/lib/use-admin-incidents.test.tsx",
  "src/lib/use-admin-incident-detail.ts",
  "src/lib/use-admin-incident-detail.test.tsx",
  "src/lib/use-admin-incident-execution-queue.ts",
  "src/lib/use-admin-incident-execution-queue.test.tsx",
  "src/lib/use-admin-incident-workload.ts",
  "src/lib/use-admin-incident-workload.test.tsx",
  "src/lib/use-admin-incident-trends.ts",
  "src/lib/use-admin-incident-trends.test.tsx",
  "src/lib/use-admin-incident-trend-action-queue.ts",
  "src/lib/use-admin-incident-trend-action-queue.test.tsx",
  "src/pages/admin/AdminIncidents.tsx",
  "src/pages/admin/AdminIncidents.test.tsx",
  "src/pages/admin/AdminIncidentDetail.tsx",
  "src/pages/admin/AdminIncidentDetail.test.tsx",
  "src/pages/admin/AdminIncidentExecutionQueue.tsx",
  "src/pages/admin/AdminIncidentExecutionQueue.test.tsx",
  "src/pages/admin/AdminIncidentWorkload.tsx",
  "src/pages/admin/AdminIncidentWorkload.test.tsx",
  "src/pages/admin/AdminIncidentTrends.tsx",
  "src/pages/admin/AdminIncidentTrends.test.tsx",
  "src/pages/admin/AdminIncidentTrendActions.tsx",
  "src/pages/admin/AdminIncidentTrendActions.test.tsx",
  "e2e/admin-incidents.spec.ts",
  "e2e/admin-incident-detail.spec.ts",
  "e2e/admin-incident-execution-queue.spec.ts",
  "e2e/admin-incident-workload.spec.ts",
  "e2e/admin-incident-trends.spec.ts",
  "e2e/admin-incident-trend-actions.spec.ts",
  "src/lib/admin-audit-api.ts",
  "src/lib/admin-audit-api.test.ts",
  "src/lib/use-admin-audit-events.ts",
  "src/lib/use-admin-audit-events.test.tsx",
  "src/pages/admin/AdminAuditEvents.tsx",
  "src/pages/admin/AdminAuditEvents.test.tsx",
  "e2e/admin-audit-events.spec.ts",
  "src/lib/admin-supplier-document-audit-api.ts",
  "src/lib/admin-supplier-document-audit-api.test.ts",
  "src/lib/use-admin-supplier-document-audit.ts",
  "src/lib/use-admin-supplier-document-audit.test.tsx",
  "src/pages/admin/AdminSupplierDocumentAudit.tsx",
  "src/pages/admin/AdminSupplierDocumentAudit.test.tsx",
  "e2e/admin-supplier-document-audit.spec.ts",
  "apps/api/src/modules/access/factory.ts",
  "apps/api/src/modules/access/postgres-repository.ts",
  "apps/api/src/modules/access/repository.ts",
  "apps/api/src/modules/access/routes.ts",
  "apps/api/src/modules/access/service.ts",
  "apps/api/src/modules/auth/factory.ts",
  "apps/api/src/modules/auth/rate-limit.ts",
  "apps/api/src/modules/auth/session-cache.ts",
  "apps/api/src/modules/auth/session-cache.test.ts",
  "apps/api/src/modules/auth/observability.ts",
  "apps/api/src/modules/auth/observability.test.ts",
  "apps/api/src/modules/auth/postgres-repository.ts",
  "apps/api/src/modules/auth/repository.ts",
  "apps/api/src/modules/auth/routes.ts",
  "apps/api/src/modules/auth/service.ts",
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
  "apps/api/src/modules/suppliers/admin-routes.ts",
  "apps/api/src/modules/suppliers/document-management-policy.ts",
  "apps/api/src/modules/suppliers/document-management-policy.test.ts",
  "apps/api/src/modules/suppliers/routes.ts",
  "apps/api/src/modules/suppliers/service.ts",
  "apps/api/src/config.ts",
  "apps/api/src/http.ts",
  "apps/api/src/audit.ts",
  "apps/api/src/audit.test.ts",
  "apps/api/src/error-observability.ts",
  "apps/api/src/error-observability.test.ts",
  "apps/api/src/metrics.ts",
  "apps/api/src/metrics.test.ts",
  "apps/api/src/request-observability.ts",
  "apps/api/src/request-observability.test.ts",
  "apps/api/src/lifecycle.ts",
  "apps/api/src/lifecycle.test.ts",
  "apps/api/src/routes/health.ts",
  "apps/api/src/routes/account.ts",
  "apps/api/src/server.test.ts",
  "apps/api/tsconfig.json",
  "apps/api/vitest.config.ts",
  "apps/api/Dockerfile",
  "packages/contracts/src/account-session.ts",
  "packages/contracts/src/admin-audit.ts",
  "packages/contracts/src/admin-runtime.ts",
  "packages/contracts/src/auth.ts",
  "packages/contracts/src/offer-catalog.ts",
  "packages/contracts/src/supplier-access.ts",
  "packages/contracts/src/supplier-directory.ts",
  "scripts/smoke-self-hosted-health-readiness.mjs",
  "scripts/smoke-self-hosted-graceful-shutdown.mjs",
  "scripts/smoke-self-hosted-request-guardrails.mjs",
  "scripts/smoke-self-hosted-request-observability.mjs",
  "scripts/smoke-self-hosted-error-observability.mjs",
  "scripts/smoke-self-hosted-metrics.mjs",
  "scripts/smoke-self-hosted-audit-trail.mjs",
  "scripts/smoke-self-hosted-audit-persistence.mjs",
  "scripts/smoke-self-hosted-admin-audit.mjs",
  "scripts/smoke-self-hosted-admin-runtime-status.mjs",
  "scripts/smoke-self-hosted-admin-access-review.mjs",
  "scripts/smoke-self-hosted-admin-access-grants.mjs",
  "scripts/smoke-self-hosted-admin-operations.mjs",
  "scripts/smoke-self-hosted-admin-incidents.mjs",
  "scripts/smoke-self-hosted-auth-api.mjs",
  "scripts/smoke-self-hosted-auth-observability.mjs",
  "scripts/smoke-self-hosted-session-cache-fail-closed.mjs",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-offer-detail.mjs",
  "scripts/smoke-e2e-self-hosted-access-runtime.mjs",
  "scripts/smoke-frontend-provider-free-env.mjs",
  "src/lib/auth-runtime.ts",
  "src/lib/auth-runtime.test.ts",
  "src/lib/auth-runtime.boundary.test.ts",
  "src/lib/buyer-session.test.ts",
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
  "e2e/frontend-provider-free-env.spec.ts",
  "e2e/signin-self-hosted-auth-flow.spec.ts",
    "src/pages/OfferDetail.tsx",
  "src/lib/supplier-access-api.ts",
  "src/lib/supplier-access-api.boundary.test.ts",
  "src/lib/supplier-access-api.test.ts",
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
  "src/lib/supplier-dossier-facts.ts",
  "src/lib/supplier-directory-api.ts",
  "src/lib/supplier-directory-view.ts",
  "src/lib/supplier-directory-api.test.ts",
  "src/lib/use-supplier-directory.ts",
  "src/lib/use-supplier-directory.test.tsx",
  "src/pages/SupplierProfile.tsx",
  "docs/backend/self-hosted-auth-api-smoke.md",
  "docs/backend/self-hosted-account-api-smoke.md",
  "docs/backend/self-hosted-offer-detail-smoke.md",
  "docs/backend/self-hosted-admin-access-review-smoke.md",
  "docs/backend/self-hosted-admin-access-grants-smoke.md",
  "docs/backend/self-hosted-admin-operations-smoke.md",
  "docs/backend/self-hosted-admin-incidents-smoke.md",
  "docs/backend/self-hosted-admin-audit-events-page.md",
  "docs/backend/self-hosted-account-postgres-smoke.md",
  "docs/backend/self-hosted-workspace-postgres-smoke.md",
  "docs/backend/phase-2e-registration-verification-code-policy.md",
  "docs/backend/phase-2f-password-recovery-source-of-truth.md",
  "docs/backend/phase-2g-password-recovery-delivery-runtime.md",
  "docs/backend/phase-2h-password-recovery-abuse-cleanup.md",
  "docs/backend/phase-2i-password-recovery-cleanup-runtime.md",
  "docs/backend/phase-2j-auth-surface-closure-audit.md",
  "docs/backend/phase-3a-catalog-supabase-fallback-removal.md",
  "docs/backend/phase-3b-supplier-access-supabase-fallback-removal.md",
  "docs/backend/phase-4a-supplier-directory-source-of-truth-audit.md",
  "docs/backend/phase-4b-supplier-profile-dossier-completeness.md",
  "docs/backend/phase-4c-supplier-profile-evidence-blocks.md",
  "docs/backend/phase-4d-supplier-profile-legal-details.md",
  "docs/backend/phase-4e-supplier-profile-restricted-documents.md",
  "docs/backend/phase-4f-supplier-document-download-grants.md",
  "docs/backend/phase-4g-supplier-document-download-serving.md",
  "docs/backend/phase-4h-supplier-document-download-ui.md",
  "docs/backend/phase-4i-supplier-document-download-audit-listing.md",
  "docs/backend/phase-4j-supplier-document-grant-audit-listing.md",
  "docs/backend/phase-4k-supplier-document-audit-admin-ui.md",
  "docs/backend/phase-4l-supplier-document-management-rules.md",
  "docs/backend/phase-4m-supplier-document-owner-create.md",
  "docs/backend/phase-4n-supplier-document-admin-decision.md",
  "docs/backend/phase-4o-supplier-document-owner-correction.md",
  "src/test/supplier-document-management-contract.test.ts",
  "packages/db/migrations/0013_api_audit_events.sql",
  "packages/db/migrations/0014_admin_audit_access.sql",
  "packages/db/migrations/0015_admin_audit_retention_query_hardening.sql",
  "packages/db/migrations/0016_admin_audit_retention_runtime.sql",
  "packages/db/migrations/0018_admin_access_grants_console.sql",
  "packages/db/migrations/0019_admin_incident_acknowledgements.sql",
  "packages/db/migrations/0020_admin_incident_workflow.sql",
  "packages/db/migrations/0021_admin_incident_execution.sql",
  "packages/db/migrations/0024_admin_incident_trend_actions.sql",
  "packages/db/migrations/0025_admin_incident_trend_action_queue.sql",
  "packages/db/migrations/0028_registration_verification_code_policy.sql",
  "packages/db/migrations/0029_auth_password_recovery.sql",
  "packages/db/migrations/0030_auth_password_recovery_abuse_cleanup.sql",
  "packages/db/migrations/0031_supplier_profile_dossier_facts.sql",
  "packages/db/migrations/0032_supplier_profile_evidence_blocks.sql",
  "packages/db/migrations/0033_supplier_profile_legal_details.sql",
  "packages/db/migrations/0034_supplier_profile_restricted_documents.sql",
  "packages/db/migrations/0035_supplier_document_download_grants.sql",
  "packages/db/migrations/0036_supplier_document_download_events.sql",
  "packages/db/migrations/0037_supplier_document_management_events.sql",
  "apps/api/src/modules/auth/password-recovery.ts",
  "apps/api/src/modules/auth/password-recovery-cleanup.ts",
  "apps/api/src/modules/auth/password-recovery-cleanup-scheduler.ts",
  "apps/api/src/modules/auth/password-recovery-cleanup-runtime.ts",
  "apps/api/src/modules/auth/password-recovery-delivery-worker.ts",
  "apps/api/src/modules/auth/password-recovery-delivery-sender.ts",
  "apps/api/src/modules/auth/password-recovery-delivery-runtime.ts",
  "apps/api/src/modules/auth/verification-code.ts",
  "docs/backend/admin-incident-trend-actions.md",
  "docs/backend/admin-incident-trend-actions-api-contract.md",
  "docs/backend/admin-incident-trend-actions-indexing.md",
  "docs/backend/admin-incident-trend-action-queue.md",
  "docs/backend/admin-incident-trend-action-queue-api-contract.md",
  "docs/backend/admin-incident-trend-action-queue-indexing.md",
  "scripts/admin-audit-retention.mjs",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required API file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const ciWorkflow = read(".github/workflows/ci.yml");
const server = read("apps/api/src/server.ts");
const serverTest = read("apps/api/src/server.test.ts");
const config = read("apps/api/src/config.ts");
const audit = read("apps/api/src/audit.ts");
const errorObservability = read("apps/api/src/error-observability.ts");
const metrics = read("apps/api/src/metrics.ts");
const requestObservability = read("apps/api/src/request-observability.ts");
const index = read("apps/api/src/index.ts");
const lifecycle = read("apps/api/src/lifecycle.ts");
const lifecycleTest = read("apps/api/src/lifecycle.test.ts");
const accountFactory = read("apps/api/src/modules/account/factory.ts");
const postgresRepository = read("apps/api/src/modules/account/postgres-repository.ts");
const accountService = read("apps/api/src/modules/account/service.ts");
const accountRepository = read("apps/api/src/modules/account/repository.ts");
const accountRoutes = read("apps/api/src/modules/account/routes.ts");
const adminAuditFactory = read("apps/api/src/modules/admin-audit/factory.ts");
const adminAuditPostgresRepository = read("apps/api/src/modules/admin-audit/postgres-repository.ts");
const adminAuditRepository = read("apps/api/src/modules/admin-audit/repository.ts");
const adminAuditRoutes = read("apps/api/src/modules/admin-audit/routes.ts");
const adminAuditService = read("apps/api/src/modules/admin-audit/service.ts");
const adminRuntimeRoutes = read("apps/api/src/modules/admin-runtime/routes.ts");
const adminRuntimeService = read("apps/api/src/modules/admin-runtime/service.ts");
const adminIncidentsRepository = read("apps/api/src/modules/admin-incidents/repository.ts");
const adminIncidentsPostgresRepository = read("apps/api/src/modules/admin-incidents/postgres-repository.ts");
const adminIncidentsRoutes = read("apps/api/src/modules/admin-incidents/routes.ts");
const adminIncidentsService = read("apps/api/src/modules/admin-incidents/service.ts");
const adminIncidentsContract = read("packages/contracts/src/admin-incidents.ts");
const adminRuntimeApi = read("src/lib/admin-runtime-api.ts");
const adminRuntimeApiTest = read("src/lib/admin-runtime-api.test.ts");
const useAdminRuntimeStatus = read("src/lib/use-admin-runtime-status.ts");
const useAdminRuntimeStatusTest = read("src/lib/use-admin-runtime-status.test.tsx");
const adminRuntimePage = read("src/pages/admin/AdminRuntimeStatus.tsx");
const adminRuntimePageTest = read("src/pages/admin/AdminRuntimeStatus.test.tsx");
const adminRuntimeE2E = read("e2e/admin-runtime-status.spec.ts");
const adminAccessReviewApi = read("src/lib/admin-access-review-api.ts");
const adminAccessReviewApiTest = read("src/lib/admin-access-review-api.test.ts");
const useAdminAccessReview = read("src/lib/use-admin-access-review.ts");
const useAdminAccessReviewTest = read("src/lib/use-admin-access-review.test.tsx");
const adminAccessReviewPage = read("src/pages/admin/AdminAccessRequests.tsx");
const adminAccessReviewPageTest = read("src/pages/admin/AdminAccessRequests.test.tsx");
const adminAccessReviewE2E = read("e2e/admin-access-review.spec.ts");
const adminAccessGrantsApi = read("src/lib/admin-access-grants-api.ts");
const adminAccessGrantsApiTest = read("src/lib/admin-access-grants-api.test.ts");
const useAdminAccessGrants = read("src/lib/use-admin-access-grants.ts");
const useAdminAccessGrantsTest = read("src/lib/use-admin-access-grants.test.tsx");
const adminAccessGrantsPage = read("src/pages/admin/AdminAccessGrants.tsx");
const adminAccessGrantsPageTest = read("src/pages/admin/AdminAccessGrants.test.tsx");
const adminAccessGrantsE2E = read("e2e/admin-access-grants.spec.ts");
const adminOperationsRoutes = read("apps/api/src/modules/admin-operations/routes.ts");
const adminOperationsService = read("apps/api/src/modules/admin-operations/service.ts");
const adminOperationsContract = read("packages/contracts/src/admin-operations.ts");
const adminOperatorNav = read("src/components/admin/AdminOperatorNav.tsx");
const adminOperationsApi = read("src/lib/admin-operations-api.ts");
const adminOperationsApiTest = read("src/lib/admin-operations-api.test.ts");
const useAdminOperationsOverview = read("src/lib/use-admin-operations-overview.ts");
const useAdminOperationsOverviewTest = read("src/lib/use-admin-operations-overview.test.tsx");
const adminOperationsPage = read("src/pages/admin/AdminOperations.tsx");
const adminOperationsPageTest = read("src/pages/admin/AdminOperations.test.tsx");
const adminOperationsE2E = read("e2e/admin-operations.spec.ts");
const adminIncidentsApi = read("src/lib/admin-incidents-api.ts");
const adminIncidentsApiTest = read("src/lib/admin-incidents-api.test.ts");
const adminIncidentsTrendsApiTest = read("src/lib/admin-incidents-trends-api.test.ts");
const useAdminIncidents = read("src/lib/use-admin-incidents.ts");
const useAdminIncidentsTest = read("src/lib/use-admin-incidents.test.tsx");
const useAdminIncidentDetail = read("src/lib/use-admin-incident-detail.ts");
const useAdminIncidentDetailTest = read("src/lib/use-admin-incident-detail.test.tsx");
const useAdminIncidentExecutionQueue = read("src/lib/use-admin-incident-execution-queue.ts");
const useAdminIncidentExecutionQueueTest = read("src/lib/use-admin-incident-execution-queue.test.tsx");
const useAdminIncidentWorkload = read("src/lib/use-admin-incident-workload.ts");
const useAdminIncidentWorkloadTest = read("src/lib/use-admin-incident-workload.test.tsx");
const useAdminIncidentTrends = read("src/lib/use-admin-incident-trends.ts");
const useAdminIncidentTrendsTest = read("src/lib/use-admin-incident-trends.test.tsx");
const useAdminIncidentTrendActionQueue = read("src/lib/use-admin-incident-trend-action-queue.ts");
const useAdminIncidentTrendActionQueueTest = read("src/lib/use-admin-incident-trend-action-queue.test.tsx");
const adminIncidentsPage = read("src/pages/admin/AdminIncidents.tsx");
const adminIncidentsPageTest = read("src/pages/admin/AdminIncidents.test.tsx");
const adminIncidentDetailPage = read("src/pages/admin/AdminIncidentDetail.tsx");
const adminIncidentDetailPageTest = read("src/pages/admin/AdminIncidentDetail.test.tsx");
const adminIncidentExecutionQueuePage = read("src/pages/admin/AdminIncidentExecutionQueue.tsx");
const adminIncidentExecutionQueuePageTest = read("src/pages/admin/AdminIncidentExecutionQueue.test.tsx");
const adminIncidentWorkloadPage = read("src/pages/admin/AdminIncidentWorkload.tsx");
const adminIncidentWorkloadPageTest = read("src/pages/admin/AdminIncidentWorkload.test.tsx");
const adminIncidentTrendsPage = read("src/pages/admin/AdminIncidentTrends.tsx");
const adminIncidentTrendsPageTest = read("src/pages/admin/AdminIncidentTrends.test.tsx");
const adminIncidentTrendActionsPage = read("src/pages/admin/AdminIncidentTrendActions.tsx");
const adminIncidentTrendActionsPageTest = read("src/pages/admin/AdminIncidentTrendActions.test.tsx");
const adminIncidentsE2E = read("e2e/admin-incidents.spec.ts");
const adminIncidentDetailE2E = read("e2e/admin-incident-detail.spec.ts");
const adminIncidentExecutionQueueE2E = read("e2e/admin-incident-execution-queue.spec.ts");
const adminIncidentWorkloadE2E = read("e2e/admin-incident-workload.spec.ts");
const adminIncidentTrendsE2E = read("e2e/admin-incident-trends.spec.ts");
const adminIncidentTrendActionsE2E = read("e2e/admin-incident-trend-actions.spec.ts");
const adminAuditFrontendApi = read("src/lib/admin-audit-api.ts");
const adminAuditFrontendApiTest = read("src/lib/admin-audit-api.test.ts");
const useAdminAuditEvents = read("src/lib/use-admin-audit-events.ts");
const useAdminAuditEventsTest = read("src/lib/use-admin-audit-events.test.tsx");
const adminAuditEventsPage = read("src/pages/admin/AdminAuditEvents.tsx");
const adminAuditEventsPageTest = read("src/pages/admin/AdminAuditEvents.test.tsx");
const adminAuditEventsE2E = read("e2e/admin-audit-events.spec.ts");
const adminSupplierDocumentAuditApi = read("src/lib/admin-supplier-document-audit-api.ts");
const adminSupplierDocumentAuditApiTest = read("src/lib/admin-supplier-document-audit-api.test.ts");
const useAdminSupplierDocumentAudit = read("src/lib/use-admin-supplier-document-audit.ts");
const useAdminSupplierDocumentAuditTest = read("src/lib/use-admin-supplier-document-audit.test.tsx");
const adminSupplierDocumentAuditPage = read("src/pages/admin/AdminSupplierDocumentAudit.tsx");
const adminSupplierDocumentAuditPageTest = read("src/pages/admin/AdminSupplierDocumentAudit.test.tsx");
const adminSupplierDocumentAuditE2E = read("e2e/admin-supplier-document-audit.spec.ts");
const accessFactory = read("apps/api/src/modules/access/factory.ts");
const accessPostgresRepository = read("apps/api/src/modules/access/postgres-repository.ts");
const accessRepository = read("apps/api/src/modules/access/repository.ts");
const accessRoutes = read("apps/api/src/modules/access/routes.ts");
const accessService = read("apps/api/src/modules/access/service.ts");
const authFactory = read("apps/api/src/modules/auth/factory.ts");
const authRateLimit = read("apps/api/src/modules/auth/rate-limit.ts");
const authSessionCache = read("apps/api/src/modules/auth/session-cache.ts");
const authObservability = read("apps/api/src/modules/auth/observability.ts");
const authObservabilityTest = read("apps/api/src/modules/auth/observability.test.ts");
const authPostgresRepository = read("apps/api/src/modules/auth/postgres-repository.ts");
const authRepository = read("apps/api/src/modules/auth/repository.ts");
const authRoutes = read("apps/api/src/modules/auth/routes.ts");
const authService = read("apps/api/src/modules/auth/service.ts");
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
const supplierAdminRoutes = read("apps/api/src/modules/suppliers/admin-routes.ts");
const supplierDocumentManagementPolicy = read("apps/api/src/modules/suppliers/document-management-policy.ts");
const supplierDocumentManagementPolicyTest = read("apps/api/src/modules/suppliers/document-management-policy.test.ts");
const supplierRoutes = read("apps/api/src/modules/suppliers/routes.ts");
const supplierService = read("apps/api/src/modules/suppliers/service.ts");
const accountRoute = read("apps/api/src/routes/account.ts");
const accountSessionContract = read("packages/contracts/src/account-session.ts");
const adminAuditContract = read("packages/contracts/src/admin-audit.ts");
const adminRuntimeContract = read("packages/contracts/src/admin-runtime.ts");
const authContract = read("packages/contracts/src/auth.ts");
const accountCompanyContract = read("packages/contracts/src/account-company.ts");
const offerCatalogContract = read("packages/contracts/src/offer-catalog.ts");
const supplierAccessContract = read("packages/contracts/src/supplier-access.ts");
const supplierDirectoryContract = read("packages/contracts/src/supplier-directory.ts");
const healthReadinessSmoke = read("scripts/smoke-self-hosted-health-readiness.mjs");
const gracefulShutdownSmoke = read("scripts/smoke-self-hosted-graceful-shutdown.mjs");
const requestGuardrailsSmoke = read("scripts/smoke-self-hosted-request-guardrails.mjs");
const requestObservabilitySmoke = read("scripts/smoke-self-hosted-request-observability.mjs");
const errorObservabilitySmoke = read("scripts/smoke-self-hosted-error-observability.mjs");
const metricsSmoke = read("scripts/smoke-self-hosted-metrics.mjs");
const auditTrailSmoke = read("scripts/smoke-self-hosted-audit-trail.mjs");
const auditPersistenceSmoke = read("scripts/smoke-self-hosted-audit-persistence.mjs");
const adminAuditSmoke = read("scripts/smoke-self-hosted-admin-audit.mjs");
const adminRuntimeSmoke = read("scripts/smoke-self-hosted-admin-runtime-status.mjs");
const adminAccessReviewSmoke = read("scripts/smoke-self-hosted-admin-access-review.mjs");
const adminAccessGrantsSmoke = read("scripts/smoke-self-hosted-admin-access-grants.mjs");
const adminOperationsSmoke = read("scripts/smoke-self-hosted-admin-operations.mjs");
const adminIncidentsSmoke = read("scripts/smoke-self-hosted-admin-incidents.mjs");
const apiAuditEventsMigration = read("packages/db/migrations/0013_api_audit_events.sql");
const adminAuditAccessMigration = read("packages/db/migrations/0014_admin_audit_access.sql");
const adminAuditRetentionQueryHardeningMigration = read("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql");
const adminAuditRetentionRuntimeMigration = read("packages/db/migrations/0016_admin_audit_retention_runtime.sql");
const adminIncidentAcknowledgementsMigration = read("packages/db/migrations/0019_admin_incident_acknowledgements.sql");
const adminIncidentWorkflowMigration = read("packages/db/migrations/0020_admin_incident_workflow.sql");
const adminIncidentExecutionMigration = read("packages/db/migrations/0021_admin_incident_execution.sql");
const adminIncidentTrendActionsMigration = read("packages/db/migrations/0024_admin_incident_trend_actions.sql");
const adminIncidentTrendActionQueueMigration = read("packages/db/migrations/0025_admin_incident_trend_action_queue.sql");
const registrationVerificationCodePolicyMigration = read("packages/db/migrations/0028_registration_verification_code_policy.sql");
const authPasswordRecoveryMigration = read("packages/db/migrations/0029_auth_password_recovery.sql");
const authPasswordRecoveryAbuseCleanupMigration = read("packages/db/migrations/0030_auth_password_recovery_abuse_cleanup.sql");
const supplierProfileDossierFactsMigration = read("packages/db/migrations/0031_supplier_profile_dossier_facts.sql");
const supplierProfileEvidenceBlocksMigration = read("packages/db/migrations/0032_supplier_profile_evidence_blocks.sql");
const supplierProfileLegalDetailsMigration = read("packages/db/migrations/0033_supplier_profile_legal_details.sql");
const supplierProfileRestrictedDocumentsMigration = read("packages/db/migrations/0034_supplier_profile_restricted_documents.sql");
const supplierDocumentDownloadGrantsMigration = read("packages/db/migrations/0035_supplier_document_download_grants.sql");
const supplierDocumentDownloadEventsMigration = read("packages/db/migrations/0036_supplier_document_download_events.sql");
const supplierDocumentManagementEventsMigration = read("packages/db/migrations/0037_supplier_document_management_events.sql");
const authVerificationCode = read("apps/api/src/modules/auth/verification-code.ts");
const authPasswordRecovery = read("apps/api/src/modules/auth/password-recovery.ts");
const authPasswordRecoveryCleanup = read("apps/api/src/modules/auth/password-recovery-cleanup.ts");
const authPasswordRecoveryCleanupScheduler = read("apps/api/src/modules/auth/password-recovery-cleanup-scheduler.ts");
const authPasswordRecoveryCleanupRuntime = read("apps/api/src/modules/auth/password-recovery-cleanup-runtime.ts");
const authPasswordRecoveryDeliveryWorker = read("apps/api/src/modules/auth/password-recovery-delivery-worker.ts");
const authPasswordRecoveryDeliverySender = read("apps/api/src/modules/auth/password-recovery-delivery-sender.ts");
const authPasswordRecoveryDeliveryRuntime = read("apps/api/src/modules/auth/password-recovery-delivery-runtime.ts");
const adminIncidentTrendActionsDocs = read("docs/backend/admin-incident-trend-actions.md");
const adminIncidentTrendActionsApiDocs = read("docs/backend/admin-incident-trend-actions-api-contract.md");
const adminIncidentTrendActionsIndexingDocs = read("docs/backend/admin-incident-trend-actions-indexing.md");
const adminIncidentTrendActionQueueDocs = read("docs/backend/admin-incident-trend-action-queue.md");
const adminIncidentTrendActionQueueApiDocs = read("docs/backend/admin-incident-trend-action-queue-api-contract.md");
const adminIncidentTrendActionQueueIndexingDocs = read("docs/backend/admin-incident-trend-action-queue-indexing.md");
const phase2eRegistrationVerificationCodePolicy = read("docs/backend/phase-2e-registration-verification-code-policy.md");
const phase2fPasswordRecoverySourceOfTruth = read("docs/backend/phase-2f-password-recovery-source-of-truth.md");
const phase2gPasswordRecoveryDeliveryRuntime = read("docs/backend/phase-2g-password-recovery-delivery-runtime.md");
const phase2hPasswordRecoveryAbuseCleanup = read("docs/backend/phase-2h-password-recovery-abuse-cleanup.md");
const phase2iPasswordRecoveryCleanupRuntime = read("docs/backend/phase-2i-password-recovery-cleanup-runtime.md");
const phase2jAuthSurfaceClosureAudit = read("docs/backend/phase-2j-auth-surface-closure-audit.md");
const phase3aCatalogSupabaseFallbackRemoval = read("docs/backend/phase-3a-catalog-supabase-fallback-removal.md");
const phase3bSupplierAccessSupabaseFallbackRemoval = read("docs/backend/phase-3b-supplier-access-supabase-fallback-removal.md");
const phase4aSupplierDirectorySourceOfTruthAudit = read("docs/backend/phase-4a-supplier-directory-source-of-truth-audit.md");
const phase4bSupplierProfileDossierCompleteness = read("docs/backend/phase-4b-supplier-profile-dossier-completeness.md");
const phase4cSupplierProfileEvidenceBlocks = read("docs/backend/phase-4c-supplier-profile-evidence-blocks.md");
const phase4dSupplierProfileLegalDetails = read("docs/backend/phase-4d-supplier-profile-legal-details.md");
const phase4eSupplierProfileRestrictedDocuments = read("docs/backend/phase-4e-supplier-profile-restricted-documents.md");
const phase4fSupplierDocumentDownloadGrants = read("docs/backend/phase-4f-supplier-document-download-grants.md");
const phase4gSupplierDocumentDownloadServing = read("docs/backend/phase-4g-supplier-document-download-serving.md");
const phase4hSupplierDocumentDownloadUi = read("docs/backend/phase-4h-supplier-document-download-ui.md");
const phase4iSupplierDocumentDownloadAuditListing = read("docs/backend/phase-4i-supplier-document-download-audit-listing.md");
const phase4jSupplierDocumentGrantAuditListing = read("docs/backend/phase-4j-supplier-document-grant-audit-listing.md");
const phase4kSupplierDocumentAuditAdminUi = read("docs/backend/phase-4k-supplier-document-audit-admin-ui.md");
const phase4lSupplierDocumentManagementRules = read("docs/backend/phase-4l-supplier-document-management-rules.md");
const phase4mSupplierDocumentOwnerCreate = read("docs/backend/phase-4m-supplier-document-owner-create.md");
const phase4nSupplierDocumentAdminDecision = read("docs/backend/phase-4n-supplier-document-admin-decision.md");
const phase4oSupplierDocumentOwnerCorrection = read("docs/backend/phase-4o-supplier-document-owner-correction.md");
const supplierDocumentManagementContractTest = read("src/test/supplier-document-management-contract.test.ts");
const adminAuditRetentionCli = read("scripts/admin-audit-retention.mjs");
const authApiSmoke = read("scripts/smoke-self-hosted-auth-api.mjs");
const authObservabilitySmoke = read("scripts/smoke-self-hosted-auth-observability.mjs");
const sessionCacheFailClosedSmoke = read("scripts/smoke-self-hosted-session-cache-fail-closed.mjs");
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const offerDetailSmoke = read("scripts/smoke-self-hosted-offer-detail.mjs");
const selfHostedAccessRuntimeSmoke = read("scripts/smoke-e2e-self-hosted-access-runtime.mjs");
const frontendProviderFreeSmoke = read("scripts/smoke-frontend-provider-free-env.mjs");
const authRuntime = read("src/lib/auth-runtime.ts");
const authRuntimeTest = read("src/lib/auth-runtime.test.ts");
const authRuntimeBoundaryTest = read("src/lib/auth-runtime.boundary.test.ts");
const buyerSessionTest = read("src/lib/buyer-session.test.ts");
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
const offerCatalogApi = read("src/lib/offer-catalog-api.ts");
const catalogFallback = read("src/lib/catalog-fallback.ts");
const useOfferCatalog = read("src/lib/use-offer-catalog.ts");
const useOfferDetail = read("src/lib/use-offer-detail.ts");
const selectedOfferPanel = read("src/components/catalog/SelectedOfferPanel.tsx");
const offersPage = read("src/pages/Offers.tsx");
const offerDetailPage = read("src/pages/OfferDetail.tsx");
const supplierAccessApi = read("src/lib/supplier-access-api.ts");
const supplierAccessApiBoundaryTest = read("src/lib/supplier-access-api.boundary.test.ts");
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
const supplierDossierFacts = read("src/lib/supplier-dossier-facts.ts");
const supplierDirectoryApi = read("src/lib/supplier-directory-api.ts");
const supplierDirectoryView = read("src/lib/supplier-directory-view.ts");
const useSupplierDirectory = read("src/lib/use-supplier-directory.ts");
const supplierProfilePage = read("src/pages/SupplierProfile.tsx");
const authApiSmokeDocs = read("docs/backend/self-hosted-auth-api-smoke.md");
const supplierProfileDetailE2E = read("e2e/supplier-profile-detail.spec.ts");
const supplierDirectoryProfileFlowE2E = read("e2e/supplier-directory-profile-flow.spec.ts");
const supplierDirectoryProfileApiFlowE2E = read("e2e/supplier-directory-profile-api-flow.spec.ts");
const offerDetailRuntimeE2E = read("e2e/offer-detail-runtime.spec.ts");
const offerCatalogDetailFlowE2E = read("e2e/offer-catalog-detail-flow.spec.ts");
const offerCatalogDetailApiFlowE2E = read("e2e/offer-catalog-detail-api-flow.spec.ts");
const supplierAccessNotificationCenterApiFlowE2E = read("e2e/supplier-access-notification-center-api-flow.spec.ts");
const selfHostedAccessRuntimeE2E = read("e2e/self-hosted-access-runtime.spec.ts");
const frontendProviderFreeE2E = read("e2e/frontend-provider-free-env.spec.ts");
const selfHostedAuthFrontendE2E = read("e2e/signin-self-hosted-auth-flow.spec.ts");
const accountApiSmokeDocs = read("docs/backend/self-hosted-account-api-smoke.md");
const offerDetailSmokeDocs = read("docs/backend/self-hosted-offer-detail-smoke.md");
const adminAccessReviewSmokeDocs = read("docs/backend/self-hosted-admin-access-review-smoke.md");
const adminAccessGrantsSmokeDocs = read("docs/backend/self-hosted-admin-access-grants-smoke.md");
const adminOperationsSmokeDocs = read("docs/backend/self-hosted-admin-operations-smoke.md");
const adminIncidentsSmokeDocs = read("docs/backend/self-hosted-admin-incidents-smoke.md");
const adminAuditEventsPageDocs = read("docs/backend/self-hosted-admin-audit-events-page.md");
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
if (pkg.scripts["smoke:self-hosted-health-readiness"] !== "npm run api:build && npm run smoke:self-hosted-health-readiness:run") {
  failures.push("package.json: smoke:self-hosted-health-readiness must build and run the health readiness smoke");
}
if (pkg.scripts["smoke:self-hosted-health-readiness:run"] !== "node scripts/smoke-self-hosted-health-readiness.mjs") {
  failures.push("package.json: smoke:self-hosted-health-readiness:run must execute scripts/smoke-self-hosted-health-readiness.mjs");
}
if (pkg.scripts["smoke:self-hosted-graceful-shutdown"] !== "npm run api:build && npm run smoke:self-hosted-graceful-shutdown:run") {
  failures.push("package.json: smoke:self-hosted-graceful-shutdown must build and run the graceful shutdown smoke");
}
if (pkg.scripts["smoke:self-hosted-graceful-shutdown:run"] !== "node scripts/smoke-self-hosted-graceful-shutdown.mjs") {
  failures.push("package.json: smoke:self-hosted-graceful-shutdown:run must execute scripts/smoke-self-hosted-graceful-shutdown.mjs");
}
if (pkg.scripts["smoke:self-hosted-request-guardrails"] !== "npm run api:build && npm run smoke:self-hosted-request-guardrails:run") {
  failures.push("package.json: smoke:self-hosted-request-guardrails must build and run the request guardrails smoke");
}
if (pkg.scripts["smoke:self-hosted-request-guardrails:run"] !== "node scripts/smoke-self-hosted-request-guardrails.mjs") {
  failures.push("package.json: smoke:self-hosted-request-guardrails:run must execute scripts/smoke-self-hosted-request-guardrails.mjs");
}
if (pkg.scripts["smoke:self-hosted-request-observability"] !== "npm run api:build && npm run smoke:self-hosted-request-observability:run") {
  failures.push("package.json: smoke:self-hosted-request-observability must build and run the request observability smoke");
}
if (pkg.scripts["smoke:self-hosted-request-observability:run"] !== "node scripts/smoke-self-hosted-request-observability.mjs") {
  failures.push("package.json: smoke:self-hosted-request-observability:run must execute scripts/smoke-self-hosted-request-observability.mjs");
}
if (pkg.scripts["smoke:self-hosted-error-observability"] !== "npm run api:build && npm run smoke:self-hosted-error-observability:run") {
  failures.push("package.json: smoke:self-hosted-error-observability must build and run the error observability smoke");
}
if (pkg.scripts["smoke:self-hosted-error-observability:run"] !== "node scripts/smoke-self-hosted-error-observability.mjs") {
  failures.push("package.json: smoke:self-hosted-error-observability:run must execute scripts/smoke-self-hosted-error-observability.mjs");
}
if (pkg.scripts["smoke:self-hosted-metrics"] !== "npm run api:build && npm run smoke:self-hosted-metrics:run") {
  failures.push("package.json: smoke:self-hosted-metrics must build and run the metrics smoke");
}
if (pkg.scripts["smoke:self-hosted-metrics:run"] !== "node scripts/smoke-self-hosted-metrics.mjs") {
  failures.push("package.json: smoke:self-hosted-metrics:run must execute scripts/smoke-self-hosted-metrics.mjs");
}
if (pkg.scripts["smoke:self-hosted-audit-trail"] !== "npm run api:build && npm run smoke:self-hosted-audit-trail:run") {
  failures.push("package.json: smoke:self-hosted-audit-trail must build and run the audit trail smoke");
}
if (pkg.scripts["smoke:self-hosted-audit-trail:run"] !== "node scripts/smoke-self-hosted-audit-trail.mjs") {
  failures.push("package.json: smoke:self-hosted-audit-trail:run must execute scripts/smoke-self-hosted-audit-trail.mjs");
}
if (pkg.scripts["smoke:self-hosted-audit-persistence"] !== "npm run api:build && npm run smoke:self-hosted-audit-persistence:run") {
  failures.push("package.json: smoke:self-hosted-audit-persistence must build and run the audit persistence smoke");
}
if (pkg.scripts["smoke:self-hosted-audit-persistence:run"] !== "node scripts/smoke-self-hosted-audit-persistence.mjs") {
  failures.push("package.json: smoke:self-hosted-audit-persistence:run must execute scripts/smoke-self-hosted-audit-persistence.mjs");
}
if (pkg.scripts["smoke:self-hosted-admin-audit"] !== "npm run api:build && npm run smoke:self-hosted-admin-audit:run") {
  failures.push("package.json: smoke:self-hosted-admin-audit must build and run the admin audit smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-audit:run"] !== "node scripts/smoke-self-hosted-admin-audit.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-audit:run must execute scripts/smoke-self-hosted-admin-audit.mjs");
}
if (pkg.scripts["smoke:self-hosted-admin-runtime-status"] !== "npm run api:build && npm run smoke:self-hosted-admin-runtime-status:run") {
  failures.push("package.json: smoke:self-hosted-admin-runtime-status must build and run the admin runtime status smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-runtime-status:run"] !== "node scripts/smoke-self-hosted-admin-runtime-status.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-runtime-status:run must execute scripts/smoke-self-hosted-admin-runtime-status.mjs");
}
if (pkg.scripts["smoke:self-hosted-admin-access-review"] !== "npm run api:build && npm run smoke:self-hosted-admin-access-review:run") {
  failures.push("package.json: smoke:self-hosted-admin-access-review must build and run the admin access review smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-access-review:run"] !== "node scripts/smoke-self-hosted-admin-access-review.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-access-review:run must execute scripts/smoke-self-hosted-admin-access-review.mjs");
}
if (pkg.scripts["smoke:self-hosted-auth-api"] !== "npm run api:build && npm run smoke:self-hosted-auth-api:run") {
  failures.push("package.json: smoke:self-hosted-auth-api must build and run the self-hosted auth API smoke");
}
if (pkg.scripts["smoke:self-hosted-auth-api:run"] !== "node scripts/smoke-self-hosted-auth-api.mjs") {
  failures.push("package.json: smoke:self-hosted-auth-api:run must execute scripts/smoke-self-hosted-auth-api.mjs");
}
if (pkg.scripts["smoke:self-hosted-auth-observability"] !== "npm run api:build && npm run smoke:self-hosted-auth-observability:run") {
  failures.push("package.json: smoke:self-hosted-auth-observability must build and run the self-hosted auth observability smoke");
}
if (pkg.scripts["smoke:self-hosted-auth-observability:run"] !== "node scripts/smoke-self-hosted-auth-observability.mjs") {
  failures.push("package.json: smoke:self-hosted-auth-observability:run must execute scripts/smoke-self-hosted-auth-observability.mjs");
}
if (pkg.scripts["smoke:self-hosted-session-cache-fail-closed"] !== "npm run api:build && npm run smoke:self-hosted-session-cache-fail-closed:run") {
  failures.push("package.json: smoke:self-hosted-session-cache-fail-closed must build and run the session cache fail-closed smoke");
}
if (pkg.scripts["smoke:self-hosted-session-cache-fail-closed:run"] !== "node scripts/smoke-self-hosted-session-cache-fail-closed.mjs") {
  failures.push("package.json: smoke:self-hosted-session-cache-fail-closed:run must execute scripts/smoke-self-hosted-session-cache-fail-closed.mjs");
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
if (pkg.scripts["test:supplier-document-management-policy"] !== "npm run contracts:build && vitest run src/test/supplier-document-management-contract.test.ts && vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/document-management-policy.test.ts") {
  failures.push("package.json: test:supplier-document-management-policy must cover contracts and API policy tests");
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
if (!pkg.scripts["ci:core"]?.includes("npm run test:supplier-document-management-policy")) {
  failures.push("package.json: ci:core must run supplier document management policy tests");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-health-readiness:run")) {
  failures.push("package.json: ci:core must run the self-hosted health readiness smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-graceful-shutdown:run")) {
  failures.push("package.json: ci:core must run the graceful shutdown smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-request-guardrails:run")) {
  failures.push("package.json: ci:core must run the request guardrails smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-request-observability:run")) {
  failures.push("package.json: ci:core must run the request observability smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-error-observability:run")) {
  failures.push("package.json: ci:core must run the error observability smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-metrics:run")) {
  failures.push("package.json: ci:core must run the self-hosted metrics smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-audit-trail:run")) {
  failures.push("package.json: ci:core must run the self-hosted audit trail smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-audit-persistence:run")) {
  failures.push("package.json: ci:core must run the self-hosted audit persistence smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-audit:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin audit smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-runtime-status:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin runtime status smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-access-review:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin access review smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-access-grants:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin access grants smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-operations"] !== "npm run api:build && npm run smoke:self-hosted-admin-operations:run") {
  failures.push("package.json: smoke:self-hosted-admin-operations must build and run the admin operations smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-operations:run"] !== "node scripts/smoke-self-hosted-admin-operations.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-operations:run must execute scripts/smoke-self-hosted-admin-operations.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-operations:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin operations smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-incidents"] !== "npm run api:build && npm run smoke:self-hosted-admin-incidents:run") {
  failures.push("package.json: smoke:self-hosted-admin-incidents must build and run the admin incidents smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-incidents:run"] !== "node scripts/smoke-self-hosted-admin-incidents.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-incidents:run must execute scripts/smoke-self-hosted-admin-incidents.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-incidents:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin incidents smoke");
}
if (pkg.scripts["test:admin-runtime-frontend"] !== "vitest run src/lib/admin-runtime-api.test.ts src/lib/use-admin-runtime-status.test.tsx src/pages/admin/AdminRuntimeStatus.test.tsx") {
  failures.push("package.json: test:admin-runtime-frontend must cover the admin runtime adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-runtime-frontend")) {
  failures.push("package.json: ci:core must run the admin runtime frontend tests");
}
if (pkg.scripts["test:admin-access-review-frontend"] !== "vitest run src/lib/admin-access-review-api.test.ts src/lib/use-admin-access-review.test.tsx src/pages/admin/AdminAccessRequests.test.tsx") {
  failures.push("package.json: test:admin-access-review-frontend must cover the admin access review adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-access-review-frontend")) {
  failures.push("package.json: ci:core must run the admin access review frontend tests");
}
if (pkg.scripts["test:admin-access-grants-frontend"] !== "vitest run src/lib/admin-access-grants-api.test.ts src/lib/use-admin-access-grants.test.tsx src/pages/admin/AdminAccessGrants.test.tsx") {
  failures.push("package.json: test:admin-access-grants-frontend must cover the admin access grants adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-access-grants-frontend")) {
  failures.push("package.json: ci:core must run the admin access grants frontend tests");
}
if (pkg.scripts["test:admin-operations-frontend"] !== "vitest run src/lib/admin-operations-api.test.ts src/lib/use-admin-operations-overview.test.tsx src/pages/admin/AdminOperations.test.tsx") {
  failures.push("package.json: test:admin-operations-frontend must cover the admin operations adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-operations-frontend")) {
  failures.push("package.json: ci:core must run the admin operations frontend tests");
}
if (pkg.scripts["test:admin-incidents-frontend"] !== "NODE_OPTIONS=--max-old-space-size=8192 vitest run src/lib/admin-incidents-api.test.ts src/lib/admin-incidents-trends-api.test.ts src/lib/use-admin-incidents.test.tsx src/lib/use-admin-incident-detail.test.tsx src/lib/use-admin-incident-execution-queue.test.tsx src/lib/use-admin-incident-workload.test.tsx src/lib/use-admin-incident-trends.test.tsx src/lib/use-admin-incident-trend-action-queue.test.tsx src/pages/admin/AdminIncidents.test.tsx src/pages/admin/AdminIncidentDetail.test.tsx src/pages/admin/AdminIncidentExecutionQueue.test.tsx src/pages/admin/AdminIncidentWorkload.test.tsx src/pages/admin/AdminIncidentTrends.test.tsx src/pages/admin/AdminIncidentTrendActions.test.tsx") {
  failures.push("package.json: test:admin-incidents-frontend must cover the admin incidents adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-incidents-frontend")) {
  failures.push("package.json: ci:core must run the admin incidents frontend tests");
}
if (pkg.scripts["test:admin-audit-frontend"] !== "vitest run src/lib/admin-audit-api.test.ts src/lib/use-admin-audit-events.test.tsx src/pages/admin/AdminAuditEvents.test.tsx") {
  failures.push("package.json: test:admin-audit-frontend must cover admin audit adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-audit-frontend")) {
  failures.push("package.json: ci:core must run the admin audit frontend tests");
}
if (pkg.scripts["test:admin-supplier-document-audit-frontend"] !== "vitest run src/lib/admin-supplier-document-audit-api.test.ts src/lib/use-admin-supplier-document-audit.test.tsx src/pages/admin/AdminSupplierDocumentAudit.test.tsx") {
  failures.push("package.json: test:admin-supplier-document-audit-frontend must cover supplier document audit adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-supplier-document-audit-frontend")) {
  failures.push("package.json: ci:core must run the supplier document audit frontend tests");
}
if (pkg.scripts["smoke:e2e:admin-runtime-status"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-runtime-status:run") {
  failures.push("package.json: smoke:e2e:admin-runtime-status must build with the self-hosted admin runtime adapter enabled");
}
if (!pkg.scripts["smoke:e2e:admin-runtime-status:run"]?.includes("e2e/admin-runtime-status.spec.ts")) {
  failures.push("package.json: smoke:e2e:admin-runtime-status:run must cover /admin/runtime browser behavior");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin runtime status browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-runtime-status");
if (pkg.scripts["smoke:e2e:admin-access-review"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-access-review:run") {
  failures.push("package.json: smoke:e2e:admin-access-review must build with the self-hosted admin access review adapter enabled");
}
if (!pkg.scripts["smoke:e2e:admin-access-review:run"]?.includes("e2e/admin-access-review.spec.ts")) {
  failures.push("package.json: smoke:e2e:admin-access-review:run must cover /admin/access-requests browser behavior");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-access-review")) {
  failures.push("package.json: ci:full must include the admin access review browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin access review browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-access-review");
if (pkg.scripts["smoke:e2e:admin-access-grants"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-access-grants:run") {
  failures.push("package.json: smoke:e2e:admin-access-grants must build with the self-hosted admin access grants adapter enabled");
}
if (!pkg.scripts["smoke:e2e:admin-access-grants:run"]?.includes("e2e/admin-access-grants.spec.ts")) {
  failures.push("package.json: smoke:e2e:admin-access-grants:run must cover /admin/access-grants browser behavior");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-access-grants")) {
  failures.push("package.json: ci:full must include the admin access grants browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin access grants browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-access-grants");
if (pkg.scripts["smoke:e2e:admin-operations"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-operations:run") {
  failures.push("package.json: smoke:e2e:admin-operations must build with the self-hosted admin operations adapter enabled");
}
if (!pkg.scripts["smoke:e2e:admin-operations:run"]?.includes("e2e/admin-operations.spec.ts")) {
  failures.push("package.json: smoke:e2e:admin-operations:run must cover /admin browser behavior");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-operations")) {
  failures.push("package.json: ci:full must include the admin operations browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin operations browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-operations");
if (pkg.scripts["smoke:e2e:admin-incidents"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incidents:run") {
  failures.push("package.json: smoke:e2e:admin-incidents must build with the self-hosted admin incidents adapter enabled");
}
if (!pkg.scripts["smoke:e2e:admin-incidents:run"]?.includes("e2e/admin-incidents.spec.ts")) {
  failures.push("package.json: smoke:e2e:admin-incidents:run must cover /admin/incidents browser behavior");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incidents")) {
  failures.push("package.json: ci:full must include the admin incidents browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incidents browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incidents");
if (pkg.scripts["smoke:e2e:admin-incident-detail"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-detail:run") {
  failures.push("package.json: smoke:e2e:admin-incident-detail must build with the self-hosted admin incident detail adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-incident-detail:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-incident-detail.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-incident-detail:run must execute e2e/admin-incident-detail.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-detail")) {
  failures.push("package.json: ci:full must include the admin incident detail browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incident detail browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incident-detail");
if (pkg.scripts["smoke:e2e:admin-incident-execution-queue"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-execution-queue:run") {
  failures.push("package.json: smoke:e2e:admin-incident-execution-queue must build with the self-hosted admin incident execution queue adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-incident-execution-queue:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-incident-execution-queue.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-incident-execution-queue:run must execute e2e/admin-incident-execution-queue.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-execution-queue")) {
  failures.push("package.json: ci:full must include the admin incident execution queue browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incident execution queue browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incident-execution-queue");
if (pkg.scripts["smoke:e2e:admin-incident-workload"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-workload:run") {
  failures.push("package.json: smoke:e2e:admin-incident-workload must build with the self-hosted admin incident workload adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-incident-workload:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-incident-workload.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-incident-workload:run must execute e2e/admin-incident-workload.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-workload")) {
  failures.push("package.json: ci:full must include the admin incident workload browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incident workload browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incident-workload");
if (pkg.scripts["smoke:e2e:admin-incident-trends"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-trends:run") {
  failures.push("package.json: smoke:e2e:admin-incident-trends must build with the self-hosted admin incident trends adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-incident-trends:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-incident-trends.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-incident-trends:run must execute e2e/admin-incident-trends.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-trends")) {
  failures.push("package.json: ci:full must include the admin incident trends browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incident trends browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incident-trends");
if (pkg.scripts["smoke:e2e:admin-incident-trend-actions"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-trend-actions:run") {
  failures.push("package.json: smoke:e2e:admin-incident-trend-actions must build with the self-hosted admin incident trend actions adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-incident-trend-actions:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-incident-trend-actions.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-incident-trend-actions:run must execute e2e/admin-incident-trend-actions.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-trend-actions")) {
  failures.push("package.json: ci:full must include the admin incident trend actions browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incident trend actions browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incident-trend-actions");
if (pkg.scripts["smoke:e2e:admin-audit-events"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-audit-events:run") {
  failures.push("package.json: smoke:e2e:admin-audit-events must build with the self-hosted admin audit adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-audit-events:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-audit-events.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-audit-events:run must execute e2e/admin-audit-events.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-audit-events")) {
  failures.push("package.json: ci:full must include admin audit browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin audit events browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-audit-events");
if (pkg.scripts["smoke:e2e:admin-supplier-document-audit"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-supplier-document-audit:run") {
  failures.push("package.json: smoke:e2e:admin-supplier-document-audit must build with the self-hosted supplier document audit adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-supplier-document-audit:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-supplier-document-audit.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-supplier-document-audit:run must execute e2e/admin-supplier-document-audit.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-supplier-document-audit")) {
  failures.push("package.json: ci:full must include supplier document audit browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin supplier document audit browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-supplier-document-audit");
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-auth-api:run")) {
  failures.push("package.json: ci:core must run the self-hosted auth API smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-auth-observability:run")) {
  failures.push("package.json: ci:core must run the self-hosted auth observability smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-session-cache-fail-closed:run")) {
  failures.push("package.json: ci:core must run the session cache fail-closed smoke");
}
if (!pkg.dependencies?.redis) {
  failures.push("package.json: self-hosted API must include redis dependency for production auth backpressure");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-account-api:run")) {
  failures.push("package.json: ci:core must run the self-hosted account API smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-offer-detail:run")) {
  failures.push("package.json: ci:core must run the self-hosted offer detail smoke");
}
if (pkg.scripts["test:auth-runtime"] !== "vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts src/lib/buyer-session.test.ts") {
  failures.push("package.json: test:auth-runtime must cover the auth runtime adapter boundary and buyer session self-hosted fields");
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
if (pkg.scripts["smoke:e2e:frontend-provider-free-env"] !== "node scripts/smoke-frontend-provider-free-env.mjs") {
  failures.push("package.json: smoke:e2e:frontend-provider-free-env must run the provider-free frontend smoke wrapper");
}
if (!pkg.scripts["smoke:e2e:frontend-provider-free-env:run"]?.includes("e2e/frontend-provider-free-env.spec.ts")) {
  failures.push("package.json: smoke:e2e:frontend-provider-free-env:run must cover the provider-free frontend e2e spec");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:frontend-provider-free-env")) {
  failures.push("package.json: ci:full must include the provider-free frontend smoke");
}
for (const marker of [
  "VITE_YORSO_API_URL: \"\"",
  "frontend_provider_free_env_smoke=ok",
]) {
  requireText("scripts/smoke-frontend-provider-free-env.mjs", frontendProviderFreeSmoke, marker);
}
for (const marker of [
  "Phase 3C provider-free frontend smoke",
  "without any hosted BaaS client env or SDK dependency",
  "frontend-provider-free-env",
]) {
  requireText("e2e/frontend-provider-free-env.spec.ts", frontendProviderFreeE2E, marker);
}
for (const marker of [
  "signInWithEmail",
  "signOutCurrentAuthSession",
  "readCurrentAuthSession",
  "isSelfHostedAuthConfigured",
  "/v1/auth/sign-in",
  "/v1/auth/password-reset/request",
  "/v1/auth/password-reset/complete",
  "/v1/auth/session",
  "/v1/auth/sign-out",
  "requestPasswordReset",
  "observePasswordRecovery",
  "updateRecoveredPassword",
  "self_hosted",
  "local_contract",
  "buyerSession",
]) {
  requireText("src/lib/auth-runtime.ts", authRuntime, marker);
}
forbidText("src/lib/auth-runtime.ts", authRuntime, "@/integrations/supabase/client");
forbidText("src/lib/auth-runtime.ts", authRuntime, "legacy-auth-supabase-adapter");
forbidText("src/lib/auth-runtime.ts", authRuntime, "supabase_prototype");
forbidText("src/lib/auth-runtime.ts", authRuntime, "VITE_SUPABASE");
for (const marker of [
  "auth-runtime adapter boundary",
  "uses self-hosted email sign-in when VITE_YORSO_API_URL is configured",
  "returns self-hosted auth errors without falling back to local prototype auth",
  "reads and signs out the current self-hosted browser session",
  "uses local contract auth when self-hosted API is not configured",
  "stays on the local contract when self-hosted API is disabled",
  "uses self-hosted password reset request and token completion when configured",
  "keeps password recovery unavailable without a self-hosted recovery token",
]) {
  requireText("src/lib/auth-runtime.test.ts", authRuntimeTest, marker);
}
for (const marker of [
  "keeps auth runtime free of Supabase prototype fallback code",
  "self_hosted",
  "/v1/auth/sign-in",
  "/v1/auth/session",
  "/v1/auth/sign-out",
  "existsSync(\"src/lib/legacy-auth-supabase-adapter.ts\")).toBe(false)",
]) {
  requireText("src/lib/auth-runtime.boundary.test.ts", authRuntimeBoundaryTest, marker);
}
for (const marker of [
  "persists backend session id, user id, source and expiry for API headers",
  "source: \"self_hosted\"",
  "userId",
]) {
  requireText("src/lib/buyer-session.test.ts", buyerSessionTest, marker);
}
forbidText("src/lib/buyer-session.ts", read("src/lib/buyer-session.ts"), "supabase_prototype");
requireText("src/pages/SignIn.tsx", signInPage, "@/lib/auth-runtime");
requireText("src/pages/SignIn.tsx", signInPage, "result.session?.userId");
requireText("src/pages/SignIn.tsx", signInPage, "source: result.source");
requireText("src/pages/ResetPassword.tsx", resetPasswordPage, "@/lib/auth-runtime");
requireText(".github/workflows/ci.yml", ciWorkflow, "Run frontend provider-free env smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:frontend-provider-free-env");
if (pkg.scripts["smoke:e2e:self-hosted-auth-frontend"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:self-hosted-auth-frontend:run") {
  failures.push("package.json: smoke:e2e:self-hosted-auth-frontend must build with the self-hosted auth frontend API adapter enabled");
}
if (!pkg.scripts["smoke:e2e:self-hosted-auth-frontend:run"]?.includes("e2e/signin-self-hosted-auth-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:self-hosted-auth-frontend:run must cover self-hosted /signin frontend bridge");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:self-hosted-auth-frontend")) {
  failures.push("package.json: ci:full must include the self-hosted auth frontend smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run self-hosted auth frontend smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:self-hosted-auth-frontend");
for (const marker of [
  "Batch #74 self-hosted auth frontend guard",
  "/v1/auth/sign-in",
  "yorso_buyer_session",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "source: \"self_hosted\"",
]) {
  requireText("e2e/signin-self-hosted-auth-flow.spec.ts", selfHostedAuthFrontendE2E, marker);
}
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
for (const marker of [
  "AccountSessionAuthority",
  "resolveAuthenticatedAccountSession",
  "resolveOptionalAuthenticatedAccountSession",
  "Account session does not match the requested user.",
]) {
  requireText("apps/api/src/modules/auth/session.ts", authSession, marker);
}
for (const [file, text] of [
  ["apps/api/src/modules/account/routes.ts", accountRoutes],
  ["apps/api/src/modules/storage/routes.ts", storageRoutes],
  ["apps/api/src/modules/access/routes.ts", accessRoutes],
]) {
  requireText(file, text, "resolveAuthenticatedAccountSession");
}
for (const [file, text] of [
  ["apps/api/src/modules/offers/routes.ts", offerRoutes],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes],
]) {
  requireText(file, text, "resolveOptionalAuthenticatedAccountSession");
}
for (const marker of [
  "handleAccountRoute(",
  "accountService,\n    authService",
  "handleStorageRoute(",
  "fileService,\n    authService",
  "handleOfferCatalogRoute(request, response, context, offerCatalogService, authService",
  "handleSupplierAccessRoute(request, response, context, supplierAccessService, authService",
  "handleSupplierDirectoryRoute(",
]) {
  requireText("apps/api/src/server.ts", server, marker);
}
for (const marker of [
  "account_session_authority=ok",
  "account_session_invalid",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_session_authority=ok");
requireText("scripts/smoke-e2e-self-hosted-access-runtime.mjs", selfHostedAccessRuntimeSmoke, "self_hosted_access_runtime_session_authority=ok");
requireText("e2e/self-hosted-access-runtime.spec.ts", selfHostedAccessRuntimeE2E, "source: \"self_hosted\"");
if (pkg.scripts["test:supplier-access-frontend"] !== "vitest run src/lib/supplier-access-api.test.ts src/lib/supplier-access-api.boundary.test.ts src/lib/use-supplier-access-state.test.tsx src/lib/use-supplier-access-notifications.test.tsx src/components/offer-detail/SupplierTrustPanel.access.test.tsx src/components/suppliers/SupplierApprovalNotifier.test.tsx src/components/suppliers/SupplierAccessRefreshBanner.test.tsx src/components/suppliers/SupplierAccessNotificationCenter.test.tsx") {
  failures.push("package.json: test:supplier-access-frontend must cover the self-hosted supplier access adapter, state hook, notification feed hook, offer-detail access UI, approval notification bridge, refresh banner and notification center");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:supplier-access-frontend")) {
  failures.push("package.json: ci:core must run test:supplier-access-frontend");
}

requireText("apps/api/src/server.ts", server, "/health/live");
requireText("apps/api/src/server.ts", server, "/health/ready");
requireText("apps/api/src/server.ts", server, "/v1/health/live");
requireText("apps/api/src/server.ts", server, "/v1/health/ready");
requireText("apps/api/src/server.ts", server, "createReadinessProbe(config");
requireText("apps/api/src/server.ts", server, "/v1/account/company/schema");
requireText("apps/api/src/server.ts", server, "handleAccountRoute");
requireText("apps/api/src/server.ts", server, "handleStorageRoute");
requireText("apps/api/src/server.ts", server, "handleOfferCatalogRoute");
requireText("apps/api/src/server.ts", server, "createOfferCatalogRepository(config)");
requireText("apps/api/src/server.ts", server, "supplierAccessRepository");
requireText("apps/api/src/server.ts", server, "handleSupplierAccessRoute");
requireText("apps/api/src/server.ts", server, "createSupplierAccessRepository(config)");
requireText("apps/api/src/server.ts", server, "handleAuthRoute");
requireText("apps/api/src/server.ts", server, "createAuthRepository(config");
requireText("apps/api/src/server.ts", server, "AuthService");
requireText("apps/api/src/server.ts", server, "handleSupplierDirectoryRoute");
requireText("apps/api/src/server.ts", server, "createSupplierRepository(config)");
requireText("apps/api/src/server.ts", server, "x-yorso-backend");
requireText("apps/api/src/server.ts", server, "accountUserIdHeaderName");
requireText("apps/api/src/server.ts", server, "accountSessionIdHeaderName");
requireText("apps/api/src/server.ts", server, "createAccountRepository(config)");
requireText("apps/api/src/server.ts", server, "createFileService(config)");
requireText("apps/api/src/server.ts", server, "access-control-allow-origin");
requireText("apps/api/src/server.ts", server, "OPTIONS");
requireText("apps/api/src/config.ts", config, "assertSelfHostedProductionRuntime");
requireText("apps/api/src/config.ts", config, "healthReadinessTimeoutMs");
requireText("apps/api/src/config.ts", config, "HEALTH_READINESS_TIMEOUT_MS");
requireText("apps/api/src/config.ts", config, "shutdownDrainDelayMs");
requireText("apps/api/src/config.ts", config, "shutdownGraceTimeoutMs");
requireText("apps/api/src/config.ts", config, "YORSO_SHUTDOWN_DRAIN_DELAY_MS");
requireText("apps/api/src/config.ts", config, "YORSO_SHUTDOWN_GRACE_TIMEOUT_MS");
for (const marker of [
  "SelfHostedReadinessProbe",
  "productionScaleBaseline",
  "targetConcurrentUsers: 10_000",
  "checkPostgres",
  "checkRedis",
  "checkLocalStorage",
  "checkProductionRuntimeConfig",
  "not_ready",
]) {
  requireText("apps/api/src/routes/health.ts", read("apps/api/src/routes/health.ts"), marker);
}
for (const marker of [
  "health_readiness_local=ok",
  "health_readiness_redis_unavailable=ok",
  "health_readiness_postgres_unavailable=ok",
  "self_hosted_health_readiness_smoke=ok",
  "/v1/health/ready",
]) {
  requireText("scripts/smoke-self-hosted-health-readiness.mjs", healthReadinessSmoke, marker);
}
for (const marker of [
  "graceful_shutdown_ready_before_signal=ok",
  "graceful_shutdown_readiness_draining=ok",
  "graceful_shutdown_live_during_drain=ok",
  "graceful_shutdown_rejects_new_work=ok",
  "graceful_shutdown_process_exit=ok",
  "self_hosted_graceful_shutdown_smoke=ok",
  "YORSO_SHUTDOWN_DRAIN_DELAY_MS",
  "YORSO_SHUTDOWN_GRACE_TIMEOUT_MS",
  "server_draining",
]) {
  requireText("scripts/smoke-self-hosted-graceful-shutdown.mjs", gracefulShutdownSmoke, marker);
}
for (const marker of [
  "request_guardrails_large_body=ok",
  "request_guardrails_body_idle_timeout=ok",
  "request_guardrails_large_header=ok",
  "self_hosted_request_guardrails_smoke=ok",
  "YORSO_REQUEST_TIMEOUT_MS",
  "YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS",
  "YORSO_MAX_HEADER_BYTES",
  "YORSO_JSON_BODY_MAX_BYTES",
]) {
  requireText("scripts/smoke-self-hosted-request-guardrails.mjs", requestGuardrailsSmoke, marker);
}
for (const marker of [
  "request_observability_completed=ok",
  "request_observability_large_body=ok",
  "request_observability_body_idle_timeout=ok",
  "request_observability_large_header=ok",
  "request_observability_no_pii=ok",
  "self_hosted_request_observability_smoke=ok",
  "YORSO_REQUEST_OBSERVABILITY_DRIVER",
]) {
  requireText("scripts/smoke-self-hosted-request-observability.mjs", requestObservabilitySmoke, marker);
}
for (const marker of [
  "error_observability_response_envelope=ok",
  "error_observability_auth_error=ok",
  "error_observability_guardrail_error=ok",
  "error_observability_parser_error=ok",
  "error_observability_no_pii=ok",
  "self_hosted_error_observability_smoke=ok",
  "YORSO_ERROR_OBSERVABILITY_DRIVER",
]) {
  requireText("scripts/smoke-self-hosted-error-observability.mjs", errorObservabilitySmoke, marker);
}
for (const marker of [
  "metrics_prometheus_endpoint=ok",
  "metrics_request_histogram=ok",
  "metrics_error_counter=ok",
  "metrics_auth_counter=ok",
  "metrics_guardrail_counter=ok",
  "metrics_readiness_counter=ok",
  "metrics_no_pii=ok",
  "self_hosted_metrics_smoke=ok",
  "YORSO_METRICS_DRIVER",
]) {
  requireText("scripts/smoke-self-hosted-metrics.mjs", metricsSmoke, marker);
}
for (const marker of [
  "audit_auth_failure=ok",
  "audit_auth_success=ok",
  "audit_account_update=ok",
  "audit_access_request=ok",
  "audit_access_decision=ok",
  "audit_notification_ack=ok",
  "audit_storage_upload=ok",
  "audit_no_pii=ok",
  "self_hosted_audit_trail_smoke=ok",
  "YORSO_AUDIT_DRIVER",
]) {
  requireText("scripts/smoke-self-hosted-audit-trail.mjs", auditTrailSmoke, marker);
}
for (const marker of [
  "AuditSink",
  "ConsoleAuditSink",
  "PostgresAuditSink",
  "NoopAuditSink",
  "MemoryAuditSink",
  "api_audit_event",
  "api_audit_dropped",
  "yorso_api_audit_events",
  "auditMaxInFlight",
  "auditHash",
  "emitAuditEvent",
  "actorUserHash",
  "sessionHash",
  "resourceHash",
]) {
  requireText("apps/api/src/audit.ts", audit, marker);
}
for (const marker of [
  "create table if not exists yorso_api_audit_events",
  "idx_yorso_api_audit_events_occurred_at",
  "idx_yorso_api_audit_events_action_outcome_time",
  "idx_yorso_api_audit_events_actor_time",
  "idx_yorso_api_audit_events_resource_time",
  "idx_yorso_api_audit_events_correlation",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0013_api_audit_events.sql", apiAuditEventsMigration, marker);
}
for (const marker of [
  "PostgresAuditSink",
  "audit_persistence_insert=ok",
  "audit_persistence_hash_only=ok",
  "audit_persistence_backpressure=ok",
  "self_hosted_audit_persistence_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-audit-persistence.mjs", auditPersistenceSmoke, marker);
}
for (const marker of [
  "adminUserRoleSchema",
  "adminAuditQuerySchema",
  "adminAuditExportQuerySchema",
  "adminAuditStatusClassSchema",
  "adminAuditListResponseSchema",
]) {
  requireText("packages/contracts/src/admin-audit.ts", adminAuditContract, marker);
}
for (const marker of [
  "adminRuntimeStatusSchema",
  "targetConcurrentUsers",
    "secretsIncluded",
  "requestGuardrails",
  "adminAudit",
]) {
  requireText("packages/contracts/src/admin-runtime.ts", adminRuntimeContract, marker);
}
for (const marker of [
  "hasRole",
  "AdminUserRole",
]) {
  requireText("apps/api/src/modules/auth/repository.ts", authRepository, marker);
  requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, marker);
  requireText("apps/api/src/modules/auth/service.ts", authService, marker);
}
for (const marker of [
  "create table if not exists yorso_user_roles",
  "idx_yorso_user_roles_role_user",
  "idx_yorso_api_audit_events_status_time",
  "idx_yorso_api_audit_events_route_time",
]) {
  requireText("packages/db/migrations/0014_admin_audit_access.sql", adminAuditAccessMigration, marker);
}
for (const marker of [
  "idx_yorso_api_audit_events_route_status_time",
  "idx_yorso_api_audit_events_outcome_status_time",
  "create or replace function yorso_purge_api_audit_events",
]) {
  requireText("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql", adminAuditRetentionQueryHardeningMigration, marker);
}
for (const marker of [
  "idx_yorso_api_audit_events_retention_scan",
  "create or replace function yorso_purge_api_audit_events_batch",
  "p_limit must be between 1 and 5000",
]) {
  requireText("packages/db/migrations/0016_admin_audit_retention_runtime.sql", adminAuditRetentionRuntimeMigration, marker);
}
for (const marker of [
  "PostgresAdminAuditRepository",
  "from yorso_api_audit_events",
  "order by occurred_at desc, audit_id desc",
  "decodeAuditCursorValue",
  "status_code between",
  "route = ?",
]) {
  requireText("apps/api/src/modules/admin-audit/postgres-repository.ts", adminAuditPostgresRepository, marker);
}
for (const marker of [
  "MemoryAdminAuditRepository",
  "encodeAuditCursor",
  "decodeAuditCursorValue",
]) {
  requireText("apps/api/src/modules/admin-audit/repository.ts", adminAuditRepository, marker);
}
for (const marker of [
  "AdminAuditService",
  "AdminAuditQueryError",
  "admin_audit_export_window_too_large",
  "adminAuditQuerySchema",
  "adminAuditExportQuerySchema",
  "adminAuditRetentionRequestSchema",
  "runRetention",
]) {
  requireText("apps/api/src/modules/admin-audit/service.ts", adminAuditService, marker);
}
for (const marker of [
  "/v1/admin/audit-events",
  "/v1/admin/audit-events/export",
  "/v1/admin/audit-events/retention",
  "admin_role_required",
  "application/x-ndjson",
  "text/csv",
  "formatAuditEventsCsv",
  "admin.audit_events.read",
  "admin.audit_events.export",
  "observeAdminAudit",
  "resolveAuthenticatedAccountSession",
]) {
  requireText("apps/api/src/modules/admin-audit/routes.ts", adminAuditRoutes, marker);
}
for (const marker of [
  "createAdminAuditRepository",
  "PostgresAdminAuditRepository",
  "MemoryAdminAuditRepository",
]) {
  requireText("apps/api/src/modules/admin-audit/factory.ts", adminAuditFactory, marker);
}
for (const marker of [
  "createAdminAuditRepository",
  "AdminAuditService",
  "handleAdminAuditRoute",
  "AdminRuntimeService",
  "handleAdminRuntimeRoute",
]) {
  requireText("apps/api/src/server.ts", server, marker);
}
for (const marker of [
  "AdminRuntimeService",
  "adminRuntimeStatusSchema",
  "adminRuntimeDiagnosticsSchema",
  "buildDiagnosticChecks",
  "targetConcurrentUsers: 10_000",
  "hostedBaasProductionBackend: false",
  "hostedBaasProductionBackend: false",
  "secretsIncluded: false",
]) {
  requireText("apps/api/src/modules/admin-runtime/service.ts", adminRuntimeService, marker);
}
for (const marker of [
  "/v1/admin/runtime/status",
  "/v1/admin/runtime/diagnostics",
  "admin.runtime.status.read",
  "admin.runtime.diagnostics.read",
  "admin_role_required",
  "resolveAuthenticatedAccountSession",
  "observeAdminRuntime",
]) {
  requireText("apps/api/src/modules/admin-runtime/routes.ts", adminRuntimeRoutes, marker);
}
for (const marker of [
  "admin_audit_auth_guard=ok",
  "admin_audit_role_guard=ok",
  "admin_audit_list=ok",
  "admin_audit_route_status_filter=ok",
  "admin_audit_export=ok",
  "admin_audit_csv_export=ok",
  "admin_audit_export_window_guard=ok",
  "admin_audit_metrics=ok",
  "admin_audit_retention_dry_run=ok",
  "admin_audit_retention_apply=ok",
  "admin_audit_retention_metrics=ok",
  "admin_audit_validation_guard=ok",
  "self_hosted_admin_audit_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-admin-audit.mjs", adminAuditSmoke, marker);
}
for (const marker of [
  "admin_runtime_status_auth_guard=ok",
  "admin_runtime_status_role_guard=ok",
  "admin_runtime_status_read=ok",
  "admin_runtime_diagnostics_read=ok",
  "admin_runtime_status_no_secrets=ok",
  "admin_runtime_status_metrics=ok",
  "self_hosted_admin_runtime_status_smoke=ok",
  "/v1/admin/runtime/status",
  "/v1/admin/runtime/diagnostics",
  "targetConcurrentUsers",
    "hostedBaasProductionBackend",
]) {
  requireText("scripts/smoke-self-hosted-admin-runtime-status.mjs", adminRuntimeSmoke, marker);
}
for (const marker of [
  "admin_access_review_auth_guard=ok",
  "admin_access_review_role_guard=ok",
  "admin_access_review_list=ok",
  "admin_access_review_pending=ok",
  "admin_access_review_approve=ok",
  "admin_access_review_filters=ok",
  "admin_access_review_decision_notification=ok",
  "admin_access_review_validation_guard=ok",
  "self_hosted_admin_access_review_smoke=ok",
  "/v1/admin/access-requests",
  "/v1/admin/access-requests/${requestId}/decision",
]) {
  requireText("scripts/smoke-self-hosted-admin-access-review.mjs", adminAccessReviewSmoke, marker);
}
for (const marker of [
  "admin_access_grants_auth_guard=ok",
  "admin_access_grants_role_guard=ok",
  "admin_access_grants_list=ok",
  "admin_access_grants_revoke=ok",
  "admin_access_grants_revoke_masks_catalog=ok",
  "admin_access_grants_filters=ok",
  "admin_access_grants_validation_guard=ok",
  "self_hosted_admin_access_grants_smoke=ok",
  "/v1/admin/access-grants",
  "/v1/admin/access-grants/${encodeURIComponent(grantList.items[0].id)}/revoke",
]) {
  requireText("scripts/smoke-self-hosted-admin-access-grants.mjs", adminAccessGrantsSmoke, marker);
}
for (const marker of [
  "/v1/admin/access-requests",
  "/v1/admin/access-requests/:requestId/decision",
  "/v1/admin/access-grants",
  "/v1/admin/access-grants/:grantId/revoke",
  "admin.access_requests.read",
  "admin.access_requests.decision",
  "admin.access_grants.read",
  "admin.access_grants.revoke",
  "admin_role_required",
  "resolveAuthenticatedAccountSession",
]) {
  requireText("apps/api/src/modules/access/routes.ts", accessRoutes, marker);
}
for (const marker of [
  "listReviewRequests",
  "listAdminGrants",
  "revokeAdminGrant",
  "supplierAccessReviewQuerySchema",
  "supplierAccessReviewListResponseSchema",
  "supplierAccessGrantQuerySchema",
  "supplierAccessGrantListResponseSchema",
  "supplierAccessGrantRevokeResponseSchema",
]) {
  requireText("apps/api/src/modules/access/service.ts", accessService, marker);
}
for (const marker of [
  "listReviewRequests",
  "listAdminGrants",
  "revokeGrant",
  "SupplierAccessReviewItem",
  "SupplierAccessReviewSummary",
  "SupplierAccessGrantAdminItem",
  "SupplierAccessGrantSummary",
]) {
  requireText("apps/api/src/modules/access/repository.ts", accessRepository, marker);
  requireText("apps/api/src/modules/access/postgres-repository.ts", accessPostgresRepository, marker);
}
for (const marker of [
  "supplierAccessReviewQuerySchema",
  "supplierAccessReviewItemSchema",
  "supplierAccessReviewListResponseSchema",
  "supplierAccessGrantQuerySchema",
  "supplierAccessGrantAdminItemSchema",
  "supplierAccessGrantListResponseSchema",
  "supplierAccessGrantRevokeResponseSchema",
  "SupplierAccessReviewListResponse",
  "SupplierAccessGrantListResponse",
]) {
  requireText("packages/contracts/src/supplier-access.ts", supplierAccessContract, marker);
}
for (const marker of [
  "createAdminAccessReviewApiClient",
  "/v1/admin/access-requests",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_access_review_api_disabled",
  "admin_access_review_session_required",
  "admin_role_required",
]) {
  requireText("src/lib/admin-access-review-api.ts", adminAccessReviewApi, marker);
}
for (const marker of [
  "disabled without self-hosted API URL",
  "lists review requests with session headers",
  "posts approve decisions",
  "maps forbidden and invalid response errors",
]) {
  requireText("src/lib/admin-access-review-api.test.ts", adminAccessReviewApiTest, marker);
}
for (const marker of [
  "useAdminAccessReview",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
  "client.decide",
]) {
  requireText("src/lib/use-admin-access-review.ts", useAdminAccessReview, marker);
}
for (const marker of [
  "returns disabled and session-required states",
  "loads review queue and refreshes after decision",
  "maps admin role failures to forbidden state",
]) {
  requireText("src/lib/use-admin-access-review.test.tsx", useAdminAccessReviewTest, marker);
}
for (const marker of [
  "admin-access-review-page",
  "admin-access-review-queue",
  "admin-access-review-summary",
  "admin-access-review-disabled",
  "admin-access-review-session-required",
  "admin-access-review-forbidden",
  "admin-access-review-search",
  "admin-access-review-status-filter",
  "admin-access-review-pagination",
  "/admin/runtime",
]) {
  requireText("src/pages/admin/AdminAccessRequests.tsx", adminAccessReviewPage, marker);
}
for (const marker of [
  "Self-hosted API is not connected",
  "loads review queue, sends admin decision",
  "Нужна роль администратора",
  "admin-access-review-approve",
]) {
  requireText("src/pages/admin/AdminAccessRequests.test.tsx", adminAccessReviewPageTest, marker);
}
for (const marker of [
  "Batch #96 browser guard",
  "/admin/access-requests",
  "/v1/admin/access-requests",
  "/v1/admin/access-requests/:requestId/decision",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-access-review-queue",
  "admin-access-review-forbidden",
]) {
  requireText("e2e/admin-access-review.spec.ts", adminAccessReviewE2E, marker);
}
for (const marker of [
  "createAdminAccessGrantsApiClient",
  "/v1/admin/access-grants",
  "/v1/admin/access-grants/${encodeURIComponent(grantId)}/revoke",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_access_grants_api_disabled",
  "admin_access_grants_session_required",
  "admin_role_required",
]) {
  requireText("src/lib/admin-access-grants-api.ts", adminAccessGrantsApi, marker);
}
for (const marker of [
  "disabled without self-hosted API URL",
  "lists grants with session headers",
  "posts revoke through the admin grants endpoint",
  "maps forbidden and invalid response errors",
]) {
  requireText("src/lib/admin-access-grants-api.test.ts", adminAccessGrantsApiTest, marker);
}
for (const marker of [
  "useAdminAccessGrants",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
  "client.revoke",
]) {
  requireText("src/lib/use-admin-access-grants.ts", useAdminAccessGrants, marker);
}
for (const marker of [
  "returns disabled and session-required states",
  "loads grants and refreshes after revoke",
  "maps admin role failures to forbidden state",
]) {
  requireText("src/lib/use-admin-access-grants.test.tsx", useAdminAccessGrantsTest, marker);
}
for (const marker of [
  "admin-access-grants-page",
  "admin-access-grants-table",
  "admin-access-grants-summary",
  "admin-access-grants-disabled",
  "admin-access-grants-session-required",
  "admin-access-grants-forbidden",
  "admin-access-grants-search",
  "admin-access-grants-status-filter",
  "admin-access-grants-pagination",
  "/admin/access-requests",
]) {
  requireText("src/pages/admin/AdminAccessGrants.tsx", adminAccessGrantsPage, marker);
}
for (const marker of [
  "Self-hosted API is not connected",
  "loads grants, revokes access",
  "Нужна роль администратора",
  "admin-access-grants-revoke",
]) {
  requireText("src/pages/admin/AdminAccessGrants.test.tsx", adminAccessGrantsPageTest, marker);
}
for (const marker of [
  "Batch #97 browser guard",
  "/admin/access-grants",
  "/v1/admin/access-grants",
  "/v1/admin/access-grants/:grantId/revoke",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-access-grants-table",
  "admin-access-grants-forbidden",
]) {
  requireText("e2e/admin-access-grants.spec.ts", adminAccessGrantsE2E, marker);
}
for (const marker of [
  "adminIncidentSchema",
  "adminIncidentListResponseSchema",
  "adminIncidentAcknowledgeResponseSchema",
  "adminIncidentWorkflowRequestSchema",
  "adminIncidentExecutionResponseSchema",
  "adminIncidentExecutionExportQuerySchema",
  "adminIncidentExecutionUpdateRequestSchema",
  "adminIncidentExecutionUpdateResponseSchema",
  "adminIncidentWorkloadQuerySchema",
  "adminIncidentWorkloadResponseSchema",
  "adminIncidentCorrelationResponseSchema",
  "adminIncidentCorrelationSignalSchema",
  "adminIncidentTimelineEventSchema",
  "adminIncidentAssignmentFilterSchema",
  "adminIncidentSlaStatusSchema",
  "critical",
  "acknowledged",
  "resolved",
]) {
  requireText("packages/contracts/src/admin-incidents.ts", adminIncidentsContract, marker);
}
for (const marker of [
  "AdminIncidentRepository",
  "MemoryAdminIncidentRepository",
  "listAcknowledgements",
  "upsertAcknowledgement",
  "listEvents",
  "appendEvent",
  "upsertWorkflowState",
  "getExecutionRecord",
  "listExecutionRecords",
  "upsertExecutionRecord",
]) {
  requireText("apps/api/src/modules/admin-incidents/repository.ts", adminIncidentsRepository, marker);
}
for (const marker of [
  "PostgresAdminIncidentRepository",
  "yorso_admin_incident_acknowledgements",
  "yorso_admin_incident_events",
  "yorso_admin_incident_execution_items",
  "on conflict (incident_id) do update",
  "on conflict (incident_id, item_id) do update",
  "max: 5",
]) {
  requireText("apps/api/src/modules/admin-incidents/postgres-repository.ts", adminIncidentsPostgresRepository, marker);
}
for (const marker of [
  "AdminIncidentService",
  "runtimeService.getDiagnostics",
  "auditService.listAuditEvents",
  "acknowledgeIncident",
  "updateIncidentWorkflow",
  "listEvents",
  "upsertWorkflowState",
  "query.assigned",
  "query.escalationLevel",
  "query.slaStatus",
  "getIncidentExecution",
  "exportIncidentExecution",
  "updateIncidentExecutionItem",
  "listIncidentExecutionQueue",
  "exportIncidentExecutionQueue",
  "bulkUpdateIncidentExecutionQueue",
  "getIncidentExecutionWorkload",
  "exportIncidentExecutionWorkload",
  "getIncidentCorrelation",
  "getIncidentTrends",
  "exportIncidentTrends",
  "getIncidentTrendAnomalies",
  "getIncidentTrendBriefing",
  "getIncidentTrendActions",
  "decideIncidentTrendAction",
  "listIncidentTrendActionQueue",
  "exportIncidentTrendActionQueue",
  "bulkDecideIncidentTrendActions",
  "formatIncidentTrendsCsv",
  "formatTrendActionQueueCsv",
  "buildTrendActions",
  "applyTrendActionToIncidents",
  "buildIncidentExecution",
  "toExecutionQueueItem",
  "formatIncidentExecutionQueueCsv",
  "formatIncidentExecutionWorkloadCsv",
  "buildIncidentExecution",
  "admin_incident_execution_item_not_found",
  "10,000 concurrent users",
]) {
  requireText("apps/api/src/modules/admin-incidents/service.ts", adminIncidentsService, marker);
}
for (const marker of [
  "/v1/admin/incidents",
  "/workflow",
  "resolveAuthenticatedAccountSession",
  "admin_role_required",
  "admin.incidents.list",
  "admin.incidents.acknowledge",
  "admin.incidents.workflow.update",
  "admin.incidents.execution.read",
  "admin.incidents.execution.export",
  "admin.incidents.execution.update",
  "admin.incidents.execution_queue.read",
  "admin.incidents.execution_queue.export",
  "admin.incidents.execution_queue.bulk_update",
  "admin.incidents.execution_workload.read",
  "admin.incidents.execution_workload.export",
  "admin.incidents.execution_workload.forecast",
  "admin.incidents.correlation.read",
  "admin.incidents.trends.read",
  "admin.incidents.trends.export",
  "admin.incidents.trends.anomalies",
  "admin.incidents.trends.briefing",
  "admin.incidents.trends.actions.read",
  "admin.incidents.trends.actions.decision",
  "admin.incidents.trend_action_queue.read",
  "admin.incidents.trend_action_queue.export",
  "admin.incidents.trend_action_queue.bulk_decision",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-workload",
  "/v1/admin/incidents/execution-workload/export",
  "/v1/admin/incidents/execution-workload/forecast",
  "/v1/admin/incidents/trends",
  "/v1/admin/incidents/trends/export",
  "/v1/admin/incidents/trends/anomalies",
  "/v1/admin/incidents/trends/briefing",
  "/v1/admin/incidents/trends/actions",
  "/v1/admin/incidents/trend-action-queue",
  "/v1/admin/incidents/trend-action-queue/export",
  "/v1/admin/incidents/trend-action-queue/bulk",
  "/correlation",
  "sendAccountSessionError",
]) {
  requireText("apps/api/src/modules/admin-incidents/routes.ts", adminIncidentsRoutes, marker);
}
for (const marker of [
  "createAdminIncidentsApiClient",
  "/v1/admin/incidents",
  "workflow",
  "execution",
  "executionExportJson",
  "executionExportCsv",
  "updateExecutionItem",
  "executionQueue",
  "executionQueueExportJson",
  "executionQueueExportCsv",
  "bulkUpdateExecutionQueue",
  "executionWorkload",
  "executionWorkloadExportJson",
  "executionWorkloadExportCsv",
  "executionWorkloadForecast",
  "correlation",
  "trends",
  "trendsExportJson",
  "trendsExportCsv",
  "trendAnomalies",
  "trendBriefing",
  "trendActions",
  "decideTrendAction",
  "trendActionQueue",
  "trendActionQueueExportJson",
  "trendActionQueueExportCsv",
  "bulkDecideTrendActions",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-workload",
  "/v1/admin/incidents/trends",
  "/v1/admin/incidents/trends/actions",
  "/v1/admin/incidents/trend-action-queue",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_incidents_api_disabled",
  "admin_incidents_session_required",
  "admin_role_required",
]) {
  requireText("src/lib/admin-incidents-api.ts", adminIncidentsApi, marker);
}
for (const marker of [
  "stays disabled when VITE_YORSO_API_URL is empty",
  "loads incidents with filters and self-hosted session headers",
  "acknowledges incidents without leaking session data",
  "assigned=assigned",
  "escalationLevel=engineering",
  "slaStatus=breached",
  "/workflow",
  "/execution",
  "/execution/export?format=json",
  "/execution/export?format=csv",
  "updateExecutionItem",
  "/execution-queue?limit=50",
  "/execution-queue/export?format=json",
  "/execution-queue/export?format=csv",
  "/execution-queue/bulk",
  "/execution-workload?limit=20",
  "/execution-workload/export?format=json",
  "/execution-workload/export?format=csv",
  "/execution-workload/forecast?",
  "/correlation?limit=25",
]) {
  requireText("src/lib/admin-incidents-api.test.ts", adminIncidentsApiTest, marker);
}
for (const marker of [
  "routes trend analytics, exports, anomalies and briefing",
  "/v1/admin/incidents/trends?",
  "/trends/export",
  "/trends/anomalies",
  "/trends/briefing",
  "/trends/actions",
  "decideTrendAction",
  "/trend-action-queue",
  "trendActionQueue",
  "bulkDecideTrendActions",
  "x-yorso-user-id",
  "x-yorso-session-id",
]) {
  requireText("src/lib/admin-incidents-trends-api.test.ts", adminIncidentsTrendsApiTest, marker);
}
for (const marker of [
  "useAdminIncidents",
  "client.list",
  "client.acknowledge",
  "client.workflow",
  "assigned",
  "escalationLevel",
  "slaStatus",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-incidents.ts", useAdminIncidents, marker);
}
for (const marker of [
  "loads incidents and supports acknowledge refresh",
  "workflow",
  "maps 403 responses to forbidden state",
]) {
  requireText("src/lib/use-admin-incidents.test.tsx", useAdminIncidentsTest, marker);
}
for (const marker of [
  "admin-incidents-page",
  "admin-incidents-summary",
  "admin-incidents-workload-summary",
  "admin-incidents-escalation-load",
  "admin-incidents-source-mix",
  "admin-incidents-filters",
  "admin-incidents-list",
  "admin-incident-row",
  "admin-incidents-assigned-filter",
  "admin-incidents-escalation-filter",
  "admin-incidents-sla-filter",
  "admin-incident-assignee",
  "admin-incident-escalate",
  "admin-incident-timeline",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminIncidents.tsx", adminIncidentsPage, marker);
}
for (const marker of [
  "admin-incident-open-detail",
  "/admin/incidents/",
]) {
  requireText("src/pages/admin/AdminIncidents.tsx", adminIncidentsPage, marker);
}
for (const marker of [
  "useAdminIncidentDetail",
  "client.detail",
  "client.handoffJson",
  "client.handoffMarkdown",
  "client.remediation",
  "client.postmortemJson",
  "client.postmortemMarkdown",
  "handoffStatus",
  "remediationStatus",
  "postmortemStatus",
  "executionStatus",
  "executionExportStatus",
  "exportExecutionJson",
  "exportExecutionCsv",
  "loadExecution",
  "updateExecutionItem",
  "admin_incidents_session_required",
]) {
  requireText("src/lib/use-admin-incident-detail.ts", useAdminIncidentDetail, marker);
}
for (const marker of [
  "loads detail, updates workflow and exports sanitized handoff",
  "handoffId",
  "loadRemediationPlan",
  "remediationPlan",
  "exportPostmortemJson",
  "postmortemJson",
  "loadExecution",
  "updateExecutionItem",
  "admin@yorso.test",
]) {
  requireText("src/lib/use-admin-incident-detail.test.tsx", useAdminIncidentDetailTest, marker);
}
for (const marker of [
  "useAdminIncidentExecutionQueue",
  "client.executionQueue",
  "client.executionQueueExportJson",
  "client.executionQueueExportCsv",
  "client.bulkUpdateExecutionQueue",
  "status: \"disabled\"",
  "admin_incidents_session_required",
]) {
  requireText("src/lib/use-admin-incident-execution-queue.ts", useAdminIncidentExecutionQueue, marker);
}
for (const marker of [
  "returns disabled without a configured self-hosted API",
  "loads queue filters and replaces items after bulk update",
  "overdueOnly=true",
  "remediation:01:confirm-scope",
]) {
  requireText("src/lib/use-admin-incident-execution-queue.test.tsx", useAdminIncidentExecutionQueueTest, marker);
}
for (const marker of [
  "useAdminIncidentWorkload",
  "client.executionWorkload",
  "client.executionWorkloadExportJson",
  "client.executionWorkloadExportCsv",
  "client.executionWorkloadForecast",
  "client.correlation",
  "status: \"disabled\"",
  "admin_incidents_session_required",
]) {
  requireText("src/lib/use-admin-incident-workload.ts", useAdminIncidentWorkload, marker);
}
for (const marker of [
  "returns disabled without a configured self-hosted API",
  "loads workload filters, exports and correlation drill-down",
  "execution-workload?limit=20",
  "loadForecast",
  "correlationId",
]) {
  requireText("src/lib/use-admin-incident-workload.test.tsx", useAdminIncidentWorkloadTest, marker);
}
for (const marker of [
  "useAdminIncidentTrends",
  "client.trends",
  "client.trendsExportJson",
  "client.trendsExportCsv",
  "client.trendAnomalies",
  "client.trendBriefing",
  "client.trendActions",
  "client.decideTrendAction",
  "status: \"disabled\"",
  "admin_incidents_session_required",
]) {
  requireText("src/lib/use-admin-incident-trends.ts", useAdminIncidentTrends, marker);
}
for (const marker of [
  "returns disabled without a configured self-hosted API",
  "loads trend filters, exports",
  "trend action proposals",
  "/v1/admin/incidents/trends?",
  "loadAnomalies",
  "loadBriefing",
  "loadActions",
  "decideAction",
  "admin@yorso.test",
]) {
  requireText("src/lib/use-admin-incident-trends.test.tsx", useAdminIncidentTrendsTest, marker);
}
for (const marker of [
  "useAdminIncidentTrendActionQueue",
  "client.trendActionQueue",
  "client.trendActionQueueExportJson",
  "client.trendActionQueueExportCsv",
  "client.bulkDecideTrendActions",
  "status: \"disabled\"",
  "admin_incidents_session_required",
]) {
  requireText("src/lib/use-admin-incident-trend-action-queue.ts", useAdminIncidentTrendActionQueue, marker);
}
for (const marker of [
  "returns disabled without a configured self-hosted API",
  "loads queue filters, exports and bulk decisions",
  "/trend-action-queue/bulk",
  "admin@yorso.test",
]) {
  requireText("src/lib/use-admin-incident-trend-action-queue.test.tsx", useAdminIncidentTrendActionQueueTest, marker);
}
for (const marker of [
  "admin-incident-detail-page",
  "admin-incident-detail-hero",
  "admin-incident-detail-readiness",
  "admin-incident-readiness-",
  "admin-incident-detail-workflow",
  "admin-incident-detail-handoff",
  "admin-incident-detail-handoff-json",
  "admin-incident-detail-handoff-markdown",
  "admin-incident-detail-remediation",
  "admin-incident-detail-remediation-load",
  "admin-incident-detail-remediation-plan",
  "admin-incident-detail-note-unsafe",
  "admin-incident-detail-postmortem",
  "admin-incident-detail-postmortem-json",
  "admin-incident-detail-postmortem-markdown",
  "admin-incident-detail-execution",
  "admin-incident-detail-execution-load",
  "admin-incident-detail-execution-json",
  "admin-incident-detail-execution-csv",
  "admin-incident-detail-execution-export-preview",
  "admin-incident-detail-execution-csv-preview",
  "admin-incident-detail-execution-plan",
  "admin-incident-detail-execution-note-unsafe",
  "AdminOperatorNav",
  "useAdminIncidentDetail",
]) {
  requireText("src/pages/admin/AdminIncidentDetail.tsx", adminIncidentDetailPage, marker);
}
for (const marker of [
  "renders detail, workflow and handoff without leaking raw identifiers",
  "admin-incident-detail-handoff-preview",
  "admin-incident-detail-handoff-markdown-preview",
  "admin-incident-detail-remediation-plan",
  "admin-incident-detail-postmortem-preview",
  "admin-incident-detail-postmortem-markdown-preview",
  "admin-incident-detail-execution-plan",
  "admin-incident-detail-execution-status",
  "admin-incident-detail-execution-export-preview",
  "admin-incident-detail-execution-csv-preview",
  "admin-incident-execution-done",
  "Owner assigned",
  "3/5",
  "4/5",
  "admin@yorso.test",
]) {
  requireText("src/pages/admin/AdminIncidentDetail.test.tsx", adminIncidentDetailPageTest, marker);
}
for (const marker of [
  "admin-incident-execution-queue-page",
  "admin-incident-execution-filters",
  "admin-incident-execution-summary",
  "admin-incident-execution-items",
  "admin-incident-execution-bulk",
  "admin-incident-execution-export-json",
  "admin-incident-execution-export-csv",
  "admin-incident-execution-bulk-start",
  "AdminOperatorNav",
  "useAdminIncidentExecutionQueue",
]) {
  requireText("src/pages/admin/AdminIncidentExecutionQueue.tsx", adminIncidentExecutionQueuePage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders execution queue, exports and bulk updates selected items",
  "admin-incident-execution-export-status",
  "admin-incident-execution-bulk-start",
  "admin@yorso.test",
]) {
  requireText("src/pages/admin/AdminIncidentExecutionQueue.test.tsx", adminIncidentExecutionQueuePageTest, marker);
}
for (const marker of [
  "admin-incident-workload-page",
  "admin-incident-workload-filters",
  "admin-incident-workload-summary",
  "admin-incident-workload-hot-incidents",
  "admin-incident-workload-owner-load",
  "admin-incident-workload-correlation",
  "admin-incident-workload-export-json",
  "admin-incident-workload-export-csv",
  "admin-incident-workload-correlation-signals",
  "AdminOperatorNav",
  "useAdminIncidentWorkload",
]) {
  requireText("src/pages/admin/AdminIncidentWorkload.tsx", adminIncidentWorkloadPage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders workload, exports and correlation drill-down",
  "admin-incident-workload-export-status",
  "admin-incident-workload-correlation-signals",
  "admin@yorso.test",
]) {
  requireText("src/pages/admin/AdminIncidentWorkload.test.tsx", adminIncidentWorkloadPageTest, marker);
}
for (const marker of [
  "admin-incident-trends-page",
  "admin-incident-trends-filters",
  "admin-incident-trends-summary",
  "admin-incident-trends-buckets",
  "admin-incident-trends-route-risks",
  "admin-incident-trends-sla",
  "admin-incident-trends-anomalies",
  "admin-incident-trends-briefing",
  "admin-incident-trends-actions",
  "admin-incident-trends-actions-load",
  "admin-incident-trend-action-accept-",
  "admin-incident-trend-action-dismiss-",
  "admin-incident-trends-export-json",
  "admin-incident-trends-export-csv",
  "AdminOperatorNav",
  "useAdminIncidentTrends",
]) {
  requireText("src/pages/admin/AdminIncidentTrends.tsx", adminIncidentTrendsPage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders trends, exports",
  "trend actions",
  "admin-incident-trends-export-status",
  "admin-incident-trends-anomalies-load",
  "admin-incident-trends-briefing-load",
  "admin-incident-trends-actions-load",
  "admin-incident-trend-action-accept-",
  "admin@yorso.test",
]) {
  requireText("src/pages/admin/AdminIncidentTrends.test.tsx", adminIncidentTrendsPageTest, marker);
}
for (const marker of [
  "admin-incident-trend-actions-page",
  "admin-incident-trend-actions-filters",
  "admin-incident-trend-actions-summary",
  "admin-incident-trend-actions-list",
  "admin-incident-trend-actions-bulk",
  "admin-incident-trend-actions-export-json",
  "admin-incident-trend-actions-export-csv",
  "admin-incident-trend-actions-bulk-accept",
  "admin-incident-trend-actions-bulk-dismiss",
  "AdminOperatorNav",
  "useAdminIncidentTrendActionQueue",
]) {
  requireText("src/pages/admin/AdminIncidentTrendActions.tsx", adminIncidentTrendActionsPage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders queue, exports and bulk decisions",
  "admin-incident-trend-actions-export-status",
  "admin-incident-trend-actions-bulk-dismiss",
  "admin@yorso.test",
]) {
  requireText("src/pages/admin/AdminIncidentTrendActions.test.tsx", adminIncidentTrendActionsPageTest, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders incidents and acknowledges from the console",
  "admin-incident-assign",
  "admin-incident-escalate",
  "Confirm scope",
  "Assignment coverage",
  "Breach rate",
  "Нужна роль администратора",
]) {
  requireText("src/pages/admin/AdminIncidents.test.tsx", adminIncidentsPageTest, marker);
}
for (const marker of [
  "Batch #101 browser guard",
  "Batch #102 browser guard",
  "admin-incident-open-detail",
  "/admin/incidents",
  "/v1/admin/incidents",
  "/v1/admin/incidents/export",
  "/workflow",
  "/workflow/bulk",
  "assigned=assigned",
  "escalationLevel=engineering",
  "admin-incidents-bulk-workflow",
  "admin-incidents-bulk-assign",
  "admin-incidents-workload-summary",
  "admin-incidents-escalation-load",
  "admin-incidents-source-mix",
  "admin-incidents-export-json",
  "admin-incidents-export-csv",
  "Confirm scope",
  "slaStatus=breached",
  "admin-incidents-page",
  "admin-incidents-list",
  "admin-incidents-forbidden",
]) {
  requireText("e2e/admin-incidents.spec.ts", adminIncidentsE2E, marker);
}
for (const marker of [
  "Batch #103 browser guard",
  "/admin/incidents/:incidentId",
  "/handoff",
  "/remediation",
  "/postmortem",
  "/execution",
  "/execution/export?format=json",
  "/execution/export?format=csv",
  "admin-incident-detail-page",
  "admin-incident-detail-readiness",
  "admin-incident-detail-handoff-json",
  "admin-incident-detail-handoff-markdown",
  "admin-incident-detail-remediation-load",
  "admin-incident-detail-remediation-plan",
  "admin-incident-detail-postmortem-json",
  "admin-incident-detail-postmortem-markdown",
  "admin-incident-detail-execution-load",
  "admin-incident-detail-execution-json",
  "admin-incident-detail-execution-csv",
  "admin-incident-detail-execution-plan",
  "admin@yorso.test",
  "session_admin_incident_detail_e2e_103",
  "Owner assigned",
  "4/5",
]) {
  requireText("e2e/admin-incident-detail.spec.ts", adminIncidentDetailE2E, marker);
}
for (const marker of [
  "Batch #105 browser guard",
  "/admin/incident-execution",
  "/v1/admin/incidents/execution-queue",
  "/execution-queue/export",
  "/execution-queue/bulk",
  "admin-incident-execution-queue-page",
  "admin-incident-execution-status-filter",
  "admin-incident-execution-overdue-filter",
  "admin-incident-execution-bulk-start",
  "admin@yorso.test",
  "session_admin_incident_execution_queue_e2e_105",
]) {
  requireText("e2e/admin-incident-execution-queue.spec.ts", adminIncidentExecutionQueueE2E, marker);
}
for (const marker of [
  "Batch #106 browser guard",
  "/admin/incident-workload",
  "/v1/admin/incidents/execution-workload",
  "/execution-workload/export",
  "/execution-workload/forecast",
  "/correlation",
  "admin-incident-workload-page",
  "admin-incident-workload-status-filter",
  "admin-incident-workload-overdue-filter",
  "admin-incident-workload-export-json",
  "admin-incident-workload-export-csv",
  "admin-incident-workload-forecast-summary",
  "admin-incident-workload-correlation-signals",
  "admin@yorso.test",
  "session_admin_incident_workload_e2e_106",
]) {
  requireText("e2e/admin-incident-workload.spec.ts", adminIncidentWorkloadE2E, marker);
}
for (const marker of [
  "Batch #107 browser guard",
  "Batch #108 browser guard",
  "/admin/incident-trends",
  "/v1/admin/incidents/trends",
  "/trends/export",
  "/trends/anomalies",
  "/trends/briefing",
  "/trends/actions",
  "admin-incident-trends-page",
  "admin-incident-trends-export-json",
  "admin-incident-trends-export-csv",
  "admin-incident-trends-anomalies",
  "admin-incident-trends-briefing",
  "admin-incident-trends-actions",
  "admin-incident-trend-action-accept-",
  "admin@yorso.test",
  "session_admin_incident_trends_e2e_107",
]) {
  requireText("e2e/admin-incident-trends.spec.ts", adminIncidentTrendsE2E, marker);
}
for (const marker of [
  "Batch #109 browser guard",
  "/admin/incident-trend-actions",
  "/v1/admin/incidents/trend-action-queue",
  "/trend-action-queue/export",
  "/trend-action-queue/bulk",
  "admin-incident-trend-actions-page",
  "admin-incident-trend-actions-summary",
  "admin-incident-trend-actions-export-json",
  "admin-incident-trend-actions-export-csv",
  "admin-incident-trend-actions-bulk-dismiss",
  "admin-operator-nav-incident-trend-actions",
  "admin@yorso.test",
  "session_admin_trend_actions_e2e_109",
]) {
  requireText("e2e/admin-incident-trend-actions.spec.ts", adminIncidentTrendActionsE2E, marker);
}
for (const marker of [
  "adminOperationsOverviewSchema",
  "operatorLinks",
  "operatorActions",
  "adminOperationsAuditSummarySchema",
  "adminOperationsReadinessItemSchema",
  "adminIncidentListResponseSchema",
  "incidents",
  "targetConcurrentUsers",
  "SupplierAccessReviewItem",
  "SupplierAccessGrantAdminItem",
]) {
  requireText("packages/contracts/src/admin-operations.ts", adminOperationsContract, marker);
}
for (const marker of [
  "AdminOperationsService",
  "listReviewRequests",
  "listAdminGrants",
  "listAuditEvents",
  "listIncidents",
  "summarizeAuditEvents",
  "buildReadiness",
  "limit: \"5\"",
  "10,000",
  "No writes",
]) {
  requireText("apps/api/src/modules/admin-operations/service.ts", adminOperationsService, marker);
}
for (const marker of [
  "/v1/admin/operations/overview",
  "resolveAuthenticatedAccountSession",
  "admin_role_required",
  "admin.operations.overview.read",
  "sendAccountSessionError",
]) {
  requireText("apps/api/src/modules/admin-operations/routes.ts", adminOperationsRoutes, marker);
}
for (const marker of [
  "handleAdminOperationsRoute",
  "AdminOperationsService",
]) {
  requireText("apps/api/src/server.ts", server, marker);
}
for (const marker of [
  "AdminOperatorNav",
  "/admin/access-requests",
  "/admin/access-grants",
  "/admin/runtime",
  "/admin/audit",
  "/admin/incidents",
  "/admin/incident-trends",
  "admin-operator-nav-audit",
  "admin-operator-nav-incidents",
  "admin-operator-nav-incident-trends",
  "admin-operator-nav-overview",
]) {
  requireText("src/components/admin/AdminOperatorNav.tsx", adminOperatorNav, marker);
}
for (const marker of [
  "createAdminOperationsApiClient",
  "/v1/admin/operations/overview",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_operations_api_disabled",
  "admin_operations_session_required",
  "admin_role_required",
  "targetConcurrentUsers !== 10_000",
]) {
  requireText("src/lib/admin-operations-api.ts", adminOperationsApi, marker);
}
for (const marker of [
  "stays disabled when VITE_YORSO_API_URL is empty",
  "loads overview with self-hosted session headers",
  "maps admin role and invalid response failures",
]) {
  requireText("src/lib/admin-operations-api.test.ts", adminOperationsApiTest, marker);
}
for (const marker of [
  "useAdminOperationsOverview",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
  "client.overview",
]) {
  requireText("src/lib/use-admin-operations-overview.ts", useAdminOperationsOverview, marker);
}
for (const marker of [
  "returns disabled state without VITE_YORSO_API_URL",
  "loads overview and supports explicit refresh",
  "maps 403 responses to forbidden state",
]) {
  requireText("src/lib/use-admin-operations-overview.test.tsx", useAdminOperationsOverviewTest, marker);
}
for (const marker of [
  "admin-operations-page",
  "admin-operations-overview",
  "admin-operations-review-card",
  "admin-operations-grants-card",
  "admin-operations-runtime-card",
  "admin-operations-audit-card",
  "admin-operations-incidents-card",
  "admin-operations-readiness",
  "admin-operations-actions",
  "admin-operations-incident-feed",
  "admin-operations-audit-feed",
  "admin-operations-capacity-plan",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminOperations.tsx", adminOperationsPage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders sanitized operator overview for admins",
  "Нужна роль администратора",
]) {
  requireText("src/pages/admin/AdminOperations.test.tsx", adminOperationsPageTest, marker);
}
for (const marker of [
  "Batch #99 browser guard",
  "Batch #100 browser guard",
  "Batch #101 browser guard",
  "/admin",
  "/v1/admin/operations/overview",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-operations-overview",
  "admin-operations-audit-feed",
  "admin-operations-incident-feed",
  "admin-operations-readiness",
  "admin-operations-forbidden",
]) {
  requireText("e2e/admin-operations.spec.ts", adminOperationsE2E, marker);
}
for (const marker of [
  "admin_operations_auth_guard=ok",
  "admin_operations_role_guard=ok",
  "admin_operations_overview=ok",
  "admin_operations_review_summary=ok",
  "admin_operations_grants_summary=ok",
  "admin_operations_audit_summary=ok",
  "admin_operations_incidents_summary=ok",
  "admin_operations_readiness=ok",
  "admin_operations_operator_actions=ok",
  "admin_operations_no_secrets=ok",
  "self_hosted_admin_operations_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-admin-operations.mjs", adminOperationsSmoke, marker);
}
for (const marker of [
  "Batch #99",
  "Batch #100",
  "Batch #101",
  "/v1/admin/operations/overview",
  "/admin/audit",
  "admin_operations_overview=ok",
  "admin_operations_audit_summary=ok",
  "admin_operations_incidents_summary=ok",
]) {
  requireText("docs/backend/self-hosted-admin-operations-smoke.md", adminOperationsSmokeDocs, marker);
}
for (const marker of [
  "Batch #101",
  "Batch #102",
  "Batch #103",
  "Batch #104",
  "Batch #105",
  "Batch #107",
  "Batch #108",
  "Batch #109",
  "/v1/admin/incidents",
  "/v1/admin/incidents/export",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-queue/export",
  "/v1/admin/incidents/execution-queue/bulk",
  "/v1/admin/incidents/trends",
  "/v1/admin/incidents/trends/export",
  "/v1/admin/incidents/trends/anomalies",
  "/v1/admin/incidents/trends/briefing",
  "/v1/admin/incidents/trends/actions",
  "/v1/admin/incidents/trends/actions/:actionId/decision",
  "/v1/admin/incidents/trend-action-queue",
  "/v1/admin/incidents/trend-action-queue/export",
  "/v1/admin/incidents/trend-action-queue/bulk",
  "/v1/admin/incidents/:incidentId/handoff",
  "/v1/admin/incidents/:incidentId/remediation",
  "/v1/admin/incidents/:incidentId/postmortem",
  "/v1/admin/incidents/:incidentId/execution",
  "/v1/admin/incidents/:incidentId/workflow",
  "/v1/admin/incidents/workflow/bulk",
  "runbook",
  "/admin/incidents",
  "/admin/incident-trend-actions",
  "admin_incidents_acknowledge=ok",
  "admin_incidents_assign=ok",
  "admin_incidents_escalate=ok",
  "admin_incidents_comment=ok",
  "admin_incidents_bulk_workflow=ok",
  "admin_incidents_workload_summary=ok",
  "admin_incidents_export_json=ok",
  "admin_incidents_export_csv=ok",
  "admin_incidents_handoff_json=ok",
  "admin_incidents_handoff_markdown=ok",
  "admin_incidents_remediation_plan=ok",
  "admin_incidents_postmortem_json=ok",
  "admin_incidents_postmortem_markdown=ok",
  "admin_incidents_execution_plan=ok",
  "admin_incidents_execution_export_json=ok",
  "admin_incidents_execution_export_csv=ok",
  "admin_incidents_execution_start=ok",
  "admin_incidents_execution_done=ok",
  "admin_incidents_execution_blocked=ok",
  "admin_incidents_execution_note_hygiene_guard=ok",
  "admin_incidents_execution_missing_item_guard=ok",
  "admin_incidents_execution_queue=ok",
  "admin_incidents_execution_queue_filters=ok",
  "admin_incidents_execution_queue_export_json=ok",
  "admin_incidents_execution_queue_export_csv=ok",
  "admin_incidents_execution_queue_bulk=ok",
  "admin_incidents_execution_queue_note_hygiene_guard=ok",
  "admin_incidents_workload=ok",
  "admin_incidents_workload_filters=ok",
  "admin_incidents_workload_export_json=ok",
  "admin_incidents_workload_export_csv=ok",
  "admin_incidents_correlation=ok",
  "admin_incidents_trends=ok",
  "admin_incidents_trends_filters=ok",
  "admin_incidents_trends_export_json=ok",
  "admin_incidents_trends_export_csv=ok",
  "admin_incidents_trends_anomalies=ok",
  "admin_incidents_trends_briefing=ok",
  "admin_incidents_trend_actions=ok",
  "admin_incidents_trend_action_accept=ok",
  "admin_incidents_trend_action_dismiss=ok",
  "admin_incidents_trend_action_validation_guard=ok",
  "admin_incidents_trend_action_queue=ok",
  "admin_incidents_trend_action_queue_filters=ok",
  "admin_incidents_trend_action_queue_export_json=ok",
  "admin_incidents_trend_action_queue_export_csv=ok",
  "admin_incidents_trend_action_queue_bulk=ok",
  "admin_incidents_trend_action_queue_note_hygiene_guard=ok",
  "admin_incidents_note_hygiene_guard=ok",
  "admin_incidents_workflow_filters=ok",
  "admin_incidents_workflow_validation_guard=ok",
  "admin_incidents_bulk_workflow_validation_guard=ok",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/self-hosted-admin-incidents-smoke.md", adminIncidentsSmokeDocs, marker);
}
for (const marker of [
  "admin_incidents_auth_guard=ok",
  "admin_incidents_acknowledge=ok",
  "admin_incidents_assign=ok",
  "admin_incidents_escalate=ok",
  "admin_incidents_comment=ok",
  "admin_incidents_bulk_workflow=ok",
  "admin_incidents_workload_summary=ok",
  "admin_incidents_export_json=ok",
  "admin_incidents_export_csv=ok",
  "admin_incidents_handoff_json=ok",
  "admin_incidents_handoff_markdown=ok",
  "admin_incidents_remediation_plan=ok",
  "admin_incidents_postmortem_json=ok",
  "admin_incidents_postmortem_markdown=ok",
  "admin_incidents_execution_plan=ok",
  "admin_incidents_execution_export_json=ok",
  "admin_incidents_execution_export_csv=ok",
  "admin_incidents_execution_start=ok",
  "admin_incidents_execution_done=ok",
  "admin_incidents_execution_blocked=ok",
  "admin_incidents_execution_note_hygiene_guard=ok",
  "admin_incidents_execution_missing_item_guard=ok",
  "admin_incidents_execution_queue=ok",
  "admin_incidents_execution_queue_filters=ok",
  "admin_incidents_execution_queue_export_json=ok",
  "admin_incidents_execution_queue_export_csv=ok",
  "admin_incidents_execution_queue_bulk=ok",
  "admin_incidents_execution_queue_note_hygiene_guard=ok",
  "admin_incidents_workload=ok",
  "admin_incidents_workload_filters=ok",
  "admin_incidents_workload_export_json=ok",
  "admin_incidents_workload_export_csv=ok",
  "admin_incidents_correlation=ok",
  "admin_incidents_trends=ok",
  "admin_incidents_trends_filters=ok",
  "admin_incidents_trends_export_json=ok",
  "admin_incidents_trends_export_csv=ok",
  "admin_incidents_trends_anomalies=ok",
  "admin_incidents_trends_briefing=ok",
  "admin_incidents_trend_actions=ok",
  "admin_incidents_trend_action_accept=ok",
  "admin_incidents_trend_action_dismiss=ok",
  "admin_incidents_trend_action_validation_guard=ok",
  "admin_incidents_trend_action_queue=ok",
  "admin_incidents_trend_action_queue_filters=ok",
  "admin_incidents_trend_action_queue_export_json=ok",
  "admin_incidents_trend_action_queue_export_csv=ok",
  "admin_incidents_trend_action_queue_bulk=ok",
  "admin_incidents_trend_action_queue_note_hygiene_guard=ok",
  "admin_incidents_note_hygiene_guard=ok",
  "admin_incidents_workflow_filters=ok",
  "admin_incidents_workflow_validation_guard=ok",
  "admin_incidents_bulk_workflow_validation_guard=ok",
  "self_hosted_admin_incidents_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-admin-incidents.mjs", adminIncidentsSmoke, marker);
}
for (const marker of [
  "alter table yorso_admin_incident_acknowledgements",
  "create table if not exists yorso_admin_incident_events",
  "idx_yorso_admin_incident_events_incident_time",
  "idx_yorso_admin_incident_ack_assignee_updated",
  "10,000 concurrent-user",
]) {
  requireText("packages/db/migrations/0020_admin_incident_workflow.sql", adminIncidentWorkflowMigration, marker);
}
for (const marker of [
  "create table if not exists yorso_admin_incident_execution_items",
  "primary key (incident_id, item_id)",
  "idx_yorso_admin_incident_execution_incident_status",
  "idx_yorso_admin_incident_execution_assignee_status",
  "idx_yorso_admin_incident_execution_source_status",
  "10,000 concurrent-user",
]) {
  requireText("packages/db/migrations/0021_admin_incident_execution.sql", adminIncidentExecutionMigration, marker);
}
for (const marker of [
  "create table if not exists yorso_admin_incident_trend_actions",
  "action_id text primary key",
  "decided_by_user_id uuid not null references yorso_users(id)",
  "idx_yorso_admin_trend_actions_status_updated",
  "idx_yorso_admin_trend_actions_kind_priority",
  "idx_yorso_admin_trend_actions_related_gin",
  "Batch #108",
]) {
  requireText("packages/db/migrations/0024_admin_incident_trend_actions.sql", adminIncidentTrendActionsMigration, marker);
}
for (const marker of [
  "Batch #109",
  "idx_yorso_admin_trend_actions_owner_priority",
  "idx_yorso_admin_trend_actions_status_kind_priority",
  "idx_yorso_admin_trend_actions_decider_updated",
]) {
  requireText("packages/db/migrations/0025_admin_incident_trend_action_queue.sql", adminIncidentTrendActionQueueMigration, marker);
}
for (const marker of [
  "Backend Phase 2E",
  "email_code_expires_at",
  "email_code_attempt_count",
  "phone_code_expires_at",
  "phone_code_attempt_count",
  "verification_code_sealed",
]) {
  requireText("packages/db/migrations/0028_registration_verification_code_policy.sql", registrationVerificationCodePolicyMigration, marker);
}
for (const marker of [
  "Backend Phase 2F",
  "create table if not exists yorso_auth_password_recovery_tokens",
  "create table if not exists yorso_auth_password_recovery_outbox",
  "token_lookup_hash text not null unique",
  "recovery_token_sealed text not null",
  "idx_yorso_auth_password_recovery_outbox_ready",
]) {
  requireText("packages/db/migrations/0029_auth_password_recovery.sql", authPasswordRecoveryMigration, marker);
}
for (const marker of [
  "password_reset_rate_limited",
  "idx_yorso_auth_password_recovery_cleanup_expired",
  "idx_yorso_auth_password_recovery_cleanup_used",
  "idx_yorso_auth_password_recovery_outbox_terminal_cleanup",
]) {
  requireText("packages/db/migrations/0030_auth_password_recovery_abuse_cleanup.sql", authPasswordRecoveryAbuseCleanupMigration, marker);
}
for (const marker of [
  "Backend Phase 4B",
  "production_facts jsonb not null",
  "logistics_facts jsonb not null",
  "yorso_suppliers_production_facts_object",
  "API-owned and safe for locked buyer views",
]) {
  requireText("packages/db/migrations/0031_supplier_profile_dossier_facts.sql", supplierProfileDossierFactsMigration, marker);
}
for (const marker of [
  "Backend Phase 4C",
  "shipment_cases jsonb not null",
  "profile_faq_items jsonb not null",
  "yorso_suppliers_shipment_cases_array",
  "API-owned and safe for locked buyer views",
]) {
  requireText("packages/db/migrations/0032_supplier_profile_evidence_blocks.sql", supplierProfileEvidenceBlocksMigration, marker);
}
for (const marker of [
  "Backend Phase 4D",
  "legal_details jsonb",
  "yorso_suppliers_legal_details_object_or_null",
  "qualified_unlocked",
  "not safe for locked buyer views",
]) {
  requireText("packages/db/migrations/0033_supplier_profile_legal_details.sql", supplierProfileLegalDetailsMigration, marker);
}
for (const marker of [
  "Backend Phase 4E",
  "supplier_documents jsonb not null",
  "yorso_suppliers_supplier_documents_array",
  "qualified_unlocked",
  "locked buyer responses must contain null",
]) {
  requireText("packages/db/migrations/0034_supplier_profile_restricted_documents.sql", supplierProfileRestrictedDocumentsMigration, marker);
}
for (const marker of [
  "Backend Phase 4F",
  "yorso_supplier_document_download_grants",
  "yorso_supplier_document_grant_status",
  "idx_yorso_supplier_document_grants_buyer_recent",
  "must never expose file_asset_id, storage keys or direct file URLs",
]) {
  requireText("packages/db/migrations/0035_supplier_document_download_grants.sql", supplierDocumentDownloadGrantsMigration, marker);
}
for (const marker of [
  "Backend Phase 4G",
  "yorso_supplier_document_download_events",
  "yorso_supplier_document_download_status",
  "idx_yorso_supplier_document_download_events_buyer_recent",
  "never returned to browser clients",
]) {
  requireText("packages/db/migrations/0036_supplier_document_download_events.sql", supplierDocumentDownloadEventsMigration, marker);
}
for (const marker of [
  "Backend Phase 4M",
  "yorso_supplier_document_management_events",
  "yorso_supplier_document_management_action",
  "supplier_document.approve",
  "supplier_document.reject",
  "idx_yorso_supplier_document_management_events_supplier_recent",
  "never file asset ids, object keys or storage URLs",
]) {
  requireText("packages/db/migrations/0037_supplier_document_management_events.sql", supplierDocumentManagementEventsMigration, marker);
}
for (const marker of [
  "PasswordRecoveryTokenIssuer",
  "createPasswordRecoveryTokenCodec",
  "hashPasswordRecoveryToken",
  "aes-256-gcm",
  "yorso-password-recovery-token:v1",
]) {
  requireText("apps/api/src/modules/auth/password-recovery.ts", authPasswordRecovery, marker);
}
for (const marker of [
  "PasswordRecoveryCleanupWorker",
  "cleanupPasswordRecovery",
  "expiredTokenRetentionMs",
  "deliveryRetentionMs",
]) {
  requireText("apps/api/src/modules/auth/password-recovery-cleanup.ts", authPasswordRecoveryCleanup, marker);
}
for (const marker of [
  "RegistrationVerificationCodeIssuer",
  "createRegistrationVerificationCodeCodec",
  "aes-256-gcm",
  "yorso-registration-verification-code:v1",
]) {
  requireText("apps/api/src/modules/auth/verification-code.ts", authVerificationCode, marker);
}
for (const marker of [
  "Backend Phase 2E",
  "registration verification code policy",
  "verification_code_sealed",
  "registration_code_expired",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-2e-registration-verification-code-policy.md", phase2eRegistrationVerificationCodePolicy, marker);
}
for (const marker of [
  "Backend Phase 2F",
  "self-hosted password recovery",
  "Plan / Fact",
  "No raw reset token",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-2f-password-recovery-source-of-truth.md", phase2fPasswordRecoverySourceOfTruth, marker);
}
for (const marker of [
  "Backend Phase 2G",
  "password recovery delivery runtime",
  "file_spool sender",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-2g-password-recovery-delivery-runtime.md", phase2gPasswordRecoveryDeliveryRuntime, marker);
}
for (const marker of [
  "Backend Phase 2H",
  "password recovery abuse-control",
  "cleanupPasswordRecovery",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-2h-password-recovery-abuse-cleanup.md", phase2hPasswordRecoveryAbuseCleanup, marker);
}
for (const marker of [
  "Backend Phase 2I",
  "password recovery cleanup runtime",
  "createPasswordRecoveryCleanupRuntime",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-2i-password-recovery-cleanup-runtime.md", phase2iPasswordRecoveryCleanupRuntime, marker);
}
for (const marker of [
  "Backend Phase 2J",
  "Auth Surface Closure",
  "Supabase prototype auth fallback removed",
  "Remaining Supabase / Prototype Debt Outside Phase 2J",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-2j-auth-surface-closure-audit.md", phase2jAuthSurfaceClosureAudit, marker);
}
for (const marker of [
  "Backend Phase 3A",
  "Catalog Supabase Fallback Removal",
  "Plan / Fact",
  "No catalog path falls back to hosted BaaS or prototype tables",
  "Remaining Supabase / Prototype Debt After Phase 3A",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-3a-catalog-supabase-fallback-removal.md", phase3aCatalogSupabaseFallbackRemoval, marker);
}
for (const marker of [
  "Backend Phase 3B",
  "Supplier Access Supabase Fallback Removal",
  "Plan / Fact",
  "No supplier-access path falls back to Supabase",
  "Remaining Supabase / Prototype Debt After Phase 3B",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-3b-supplier-access-supabase-fallback-removal.md", phase3bSupplierAccessSupabaseFallbackRemoval, marker);
}
for (const marker of [
  "Backend Phase 4A",
  "Supplier Directory/Profile Source Of Truth Audit",
  "configured supplier API fail-closed",
  "no configured supplier prototype fallback",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4a-supplier-directory-source-of-truth-audit.md", phase4aSupplierDirectorySourceOfTruthAudit, marker);
}
for (const marker of [
  "Backend Phase 4B",
  "Supplier Profile Backend-Owned Dossier Completeness",
  "productionFacts",
  "logisticsFacts",
  "Plan / Fact",
  "No frontend hash-based production/logistics synthesis remains",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4b-supplier-profile-dossier-completeness.md", phase4bSupplierProfileDossierCompleteness, marker);
}
for (const marker of [
  "Backend Phase 4C",
  "Supplier Profile Backend-Owned Evidence Blocks",
  "shipmentCases",
  "faqItems",
  "No frontend hash-based shipment/FAQ synthesis remains",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4c-supplier-profile-evidence-blocks.md", phase4cSupplierProfileEvidenceBlocks, marker);
}
for (const marker of [
  "Backend Phase 4D",
  "Supplier Profile Legal/Compliance Details Source Boundary",
  "legalDetails",
  "legal_details",
  "qualified_unlocked",
  "not safe for locked buyer views",
  "No frontend hash-based legal/compliance synthesis remains",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4d-supplier-profile-legal-details.md", phase4dSupplierProfileLegalDetails, marker);
}
for (const marker of [
  "Backend Phase 4E",
  "Supplier Profile Restricted Document Payload Boundary",
  "supplierDocuments",
  "supplier_documents",
  "Plan / Fact",
  "qualified_unlocked",
  "locked buyer responses must contain null",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4e-supplier-profile-restricted-documents.md", phase4eSupplierProfileRestrictedDocuments, marker);
}
for (const marker of [
  "Backend Phase 4F",
  "Supplier Document Download Grant Endpoint",
  "supplierDocumentDownloadGrant",
  "supplier_document_download_grants",
  "Plan / Fact",
  "qualified-only",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4f-supplier-document-download-grants.md", phase4fSupplierDocumentDownloadGrants, marker);
}
for (const marker of [
  "Backend Phase 4G",
  "Supplier Document Grant Consumption / File Serving Endpoint",
  "GET /v1/suppliers/:supplierId/documents/:documentId/download",
  "supplier_document_download_events",
  "Plan / Fact",
  "grant_expired",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4g-supplier-document-download-serving.md", phase4gSupplierDocumentDownloadServing, marker);
}
for (const marker of [
  "Backend Phase 4H",
  "Supplier Document Download UI Integration",
  "downloadSupplierDocument",
  "supplier-document-download",
  "Plan / Fact",
  "fileAssetId",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4h-supplier-document-download-ui.md", phase4hSupplierDocumentDownloadUi, marker);
}
for (const marker of [
  "Backend Phase 4I",
  "Supplier Document Download Audit Listing",
  "/v1/admin/supplier-documents/download-events",
  "supplierDocumentDownloadEventAdminListResponseSchema",
  "admin.supplier_document_download_events.read",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4i-supplier-document-download-audit-listing.md", phase4iSupplierDocumentDownloadAuditListing, marker);
}
for (const marker of [
  "Backend Phase 4J",
  "Supplier Document Grant Audit Listing",
  "/v1/admin/supplier-documents/download-grants",
  "supplierDocumentDownloadGrantAdminListResponseSchema",
  "admin.supplier_document_download_grants.read",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4j-supplier-document-grant-audit-listing.md", phase4jSupplierDocumentGrantAuditListing, marker);
}
for (const marker of [
  "Backend Phase 4K",
  "Supplier Document Audit Admin UI",
  "/admin/supplier-document-audit",
  "createAdminSupplierDocumentAuditApiClient",
  "useAdminSupplierDocumentAudit",
  "admin-supplier-document-audit.spec.ts",
  "Plan / Fact",
  "10,000 Concurrent-User Review",
]) {
  requireText("docs/backend/phase-4k-supplier-document-audit-admin-ui.md", phase4kSupplierDocumentAuditAdminUi, marker);
}
for (const marker of [
  "Backend Phase 4L",
  "Supplier Document Management Rules Gate",
  "supplierDocumentManagementCreateRequestSchema",
  "supplierDocumentManagementAuditEventSchema",
  "evaluateSupplierDocumentManagementPolicy",
  "supplierDocumentManagementAuditActionByAction",
  "approved_document_immutable",
  "admin_role_required",
  "Plan / Fact",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/phase-4l-supplier-document-management-rules.md", phase4lSupplierDocumentManagementRules, marker);
}
for (const marker of [
  "Backend Phase 4M",
  "Supplier Owner Document Create Runtime",
  "/v1/suppliers/:supplierId/documents",
  "createSupplierDocumentForOwner",
  "supplierDocumentManagementCreateResponseSchema",
  "yorso_supplier_document_management_events",
  "supplier_document_owner_create_review=ok",
  "supplier_document.create",
  "План / факт",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/phase-4m-supplier-document-owner-create.md", phase4mSupplierDocumentOwnerCreate, marker);
}
for (const marker of [
  "Backend Phase 4N",
  "Supplier Document Admin Decision Runtime",
  "/v1/admin/supplier-documents/:supplierId/documents/:documentId/decision",
  "decideSupplierDocumentAsAdmin",
  "supplierDocumentManagementDecisionRequestSchema",
  "supplierDocumentManagementDecisionResponseSchema",
  "yorso_supplier_document_management_events",
  "supplier_document_admin_decision_review=ok",
  "supplier_document.approve",
  "supplier_document.reject",
  "План / факт",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/phase-4n-supplier-document-admin-decision.md", phase4nSupplierDocumentAdminDecision, marker);
}
for (const marker of [
  "Backend Phase 4O",
  "Supplier Document Owner Correction Runtime",
  "/v1/suppliers/:supplierId/documents/:documentId",
  "updateSupplierDocumentForOwner",
  "deleteSupplierDocumentForOwner",
  "supplierDocumentManagementUpdateResponseSchema",
  "supplierDocumentManagementDeleteResponseSchema",
  "yorso_supplier_document_management_events",
  "supplier_document_owner_update_delete=ok",
  "supplier_document.update_metadata",
  "supplier_document.delete",
  "approved_document_immutable",
  "План / факт",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/phase-4o-supplier-document-owner-correction.md", phase4oSupplierDocumentOwnerCorrection, marker);
}
for (const [file, text, marker] of [
  ["packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementCreateResponseSchema"],
  ["packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementDecisionResponseSchema"],
  ["packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementUpdateResponseSchema"],
  ["packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementDeleteResponseSchema"],
  ["apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "/^\\/v1\\/admin\\/supplier-documents\\/([^/]+)\\/documents\\/([^/]+)\\/decision$/"],
  ["apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "decideSupplierDocumentAsAdmin"],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "/^\\/v1\\/suppliers\\/([^/]+)\\/documents$/"],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "/^\\/v1\\/suppliers\\/([^/]+)\\/documents\\/([^/]+)$/"],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "createSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "updateSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "deleteSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "createSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "decideSupplierDocumentAsAdmin"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "updateSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "deleteSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "hasSupplierOwnerCompany"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocumentManagementCreateResponseSchema"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocumentManagementDecisionResponseSchema"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocumentManagementUpdateResponseSchema"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocumentManagementDeleteResponseSchema"],
  ["apps/api/src/modules/suppliers/service.ts", supplierService, "redactSupplierDocumentManagementItem"],
  ["apps/api/src/modules/suppliers/repository.ts", supplierRepository, "createSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/repository.ts", supplierRepository, "decideSupplierDocumentAsAdmin"],
  ["apps/api/src/modules/suppliers/repository.ts", supplierRepository, "updateSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/repository.ts", supplierRepository, "deleteSupplierDocumentForOwner"],
  ["apps/api/src/modules/suppliers/repository.ts", supplierRepository, "hasSupplierOwnerCompany"],
  ["apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "yorso_supplier_document_management_events"],
  ["apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "jsonb_set("],
  ["apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "jsonb_agg(remaining.value order by remaining.ordinality)"],
  ["apps/api/src/server.test.ts", serverTest, "lets a supplier owner create a review document"],
  ["apps/api/src/server.test.ts", serverTest, "lets an admin approve and reject review supplier documents"],
  ["apps/api/src/server.test.ts", serverTest, "lets supplier owners update and delete non-approved documents"],
  ["scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_owner_create_review=ok"],
  ["scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_admin_decision_review=ok"],
  ["scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_owner_update_delete=ok"],
  ["packages/db/migrations/0037_supplier_document_management_events.sql", supplierDocumentManagementEventsMigration, "yorso_supplier_document_management_events"],
]) {
  requireText(file, text, marker);
}
for (const [file, text, marker] of [
  ["src/lib/supplier-directory-api.ts", supplierDirectoryApi, "downloadSupplierDocument"],
  ["src/lib/supplier-directory-api.ts", supplierDirectoryApi, "requestDocumentDownloadGrant"],
  ["src/pages/SupplierProfile.tsx", supplierProfilePage, "supplier-document-download"],
  ["src/pages/SupplierProfile.tsx", supplierProfilePage, "triggerSupplierDocumentDownload"],
  ["src/lib/supplier-documents.ts", read("src/lib/supplier-documents.ts"), "redactSupplierDocumentFileAssets"],
  ["e2e/supplier-directory-profile-api-flow.spec.ts", read("e2e/supplier-directory-profile-api-flow.spec.ts"), "documentDownloadRequests"],
  ["e2e/supplier-directory-profile-api-flow.spec.ts", read("e2e/supplier-directory-profile-api-flow.spec.ts"), "supplier-document-download"],
]) {
  requireText(file, text, marker);
}
for (const marker of [
  "PasswordRecoveryDeliveryWorker",
  "leasePasswordRecoveryDeliveryJobs",
  "markPasswordRecoveryDeliverySent",
  "markPasswordRecoveryDeliveryFailed",
]) {
  requireText("apps/api/src/modules/auth/password-recovery-delivery-worker.ts", authPasswordRecoveryDeliveryWorker, marker);
}
for (const marker of [
  "FileSpoolPasswordRecoverySender",
  "password_recovery_delivery",
  "resetUrl",
  "mode: 0o600",
]) {
  requireText("apps/api/src/modules/auth/password-recovery-delivery-sender.ts", authPasswordRecoveryDeliverySender, marker);
}
for (const marker of [
  "createPasswordRecoveryDeliveryRuntime",
  "observePasswordRecoveryDeliveryWorker",
  "passwordRecoveryDeliveryWorkerEnabled",
]) {
  requireText("apps/api/src/modules/auth/password-recovery-delivery-runtime.ts", authPasswordRecoveryDeliveryRuntime, marker);
}
for (const marker of [
  "PasswordRecoveryCleanupScheduler",
  "already_running",
  "worker_error",
]) {
  requireText("apps/api/src/modules/auth/password-recovery-cleanup-scheduler.ts", authPasswordRecoveryCleanupScheduler, marker);
}
for (const marker of [
  "createPasswordRecoveryCleanupRuntime",
  "observePasswordRecoveryCleanupWorker",
  "passwordRecoveryCleanupWorkerEnabled",
]) {
  requireText("apps/api/src/modules/auth/password-recovery-cleanup-runtime.ts", authPasswordRecoveryCleanupRuntime, marker);
}
for (const marker of [
  "Batch #108",
  "trend action loop",
  "10,000 concurrent users",
  "/v1/admin/incidents/trends/actions",
  "/v1/admin/incidents/trends/actions/:actionId/decision",
]) {
  requireText("docs/backend/admin-incident-trend-actions.md", adminIncidentTrendActionsDocs, marker);
}
for (const marker of [
  "Batch #108",
  "GET /v1/admin/incidents/trends/actions",
  "POST /v1/admin/incidents/trends/actions/:actionId/decision",
  "adminIncidentTrendActionSchema",
  "adminIncidentTrendActionDecisionRequestSchema",
]) {
  requireText("docs/backend/admin-incident-trend-actions-api-contract.md", adminIncidentTrendActionsApiDocs, marker);
}
for (const marker of [
  "Batch #108",
  "yorso_admin_incident_trend_actions",
  "idx_yorso_admin_trend_actions_status_updated",
  "idx_yorso_admin_trend_actions_related_gin",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/admin-incident-trend-actions-indexing.md", adminIncidentTrendActionsIndexingDocs, marker);
}
for (const marker of [
  "Batch #109",
  "trend action queue",
  "10,000 concurrent users",
  "/v1/admin/incidents/trend-action-queue",
  "/admin/incident-trend-actions",
]) {
  requireText("docs/backend/admin-incident-trend-action-queue.md", adminIncidentTrendActionQueueDocs, marker);
}
for (const marker of [
  "Batch #109",
  "GET /v1/admin/incidents/trend-action-queue",
  "GET /v1/admin/incidents/trend-action-queue/export",
  "POST /v1/admin/incidents/trend-action-queue/bulk",
  "adminIncidentTrendActionQueueResponseSchema",
  "adminIncidentTrendActionQueueBulkDecisionRequestSchema",
]) {
  requireText("docs/backend/admin-incident-trend-action-queue-api-contract.md", adminIncidentTrendActionQueueApiDocs, marker);
}
for (const marker of [
  "Batch #109",
  "0025_admin_incident_trend_action_queue",
  "idx_yorso_admin_trend_actions_owner_priority",
  "idx_yorso_admin_trend_actions_status_kind_priority",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/admin-incident-trend-action-queue-indexing.md", adminIncidentTrendActionQueueIndexingDocs, marker);
}
for (const marker of [
  "createAdminAuditApiClient",
  "/v1/admin/audit-events",
  "/v1/admin/audit-events/export",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_audit_api_disabled",
  "admin_audit_session_required",
  "admin_role_required",
]) {
  requireText("src/lib/admin-audit-api.ts", adminAuditFrontendApi, marker);
}
for (const marker of [
  "stays disabled when VITE_YORSO_API_URL is empty",
  "sends filters with self-hosted session headers",
  "maps admin role and invalid response failures",
]) {
  requireText("src/lib/admin-audit-api.test.ts", adminAuditFrontendApiTest, marker);
}
for (const marker of [
  "useAdminAuditEvents",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
  "client.list",
]) {
  requireText("src/lib/use-admin-audit-events.ts", useAdminAuditEvents, marker);
}
for (const marker of [
  "returns disabled state without VITE_YORSO_API_URL",
  "loads audit events and supports refresh",
  "maps 403 responses to forbidden state",
]) {
  requireText("src/lib/use-admin-audit-events.test.tsx", useAdminAuditEventsTest, marker);
}
for (const marker of [
  "admin-audit-page",
  "admin-audit-events",
  "admin-audit-filters",
  "admin-audit-export-csv",
  "admin-audit-disabled",
  "admin-audit-session-required",
  "admin-audit-forbidden",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminAuditEvents.tsx", adminAuditEventsPage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders audit events and sends filters",
  "Нужна роль администратора",
]) {
  requireText("src/pages/admin/AdminAuditEvents.test.tsx", adminAuditEventsPageTest, marker);
}
for (const marker of [
  "Batch #100 browser guard",
  "/admin/audit",
  "/v1/admin/audit-events",
  "/v1/admin/audit-events/export",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-audit-page",
  "admin-audit-events",
  "admin-audit-forbidden",
]) {
  requireText("e2e/admin-audit-events.spec.ts", adminAuditEventsE2E, marker);
}
for (const marker of [
  "Batch #100",
  "/admin/audit",
  "npm run test:admin-audit-frontend",
  "npm run smoke:e2e:admin-audit-events",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/self-hosted-admin-audit-events-page.md", adminAuditEventsPageDocs, marker);
}
for (const marker of [
  "createAdminSupplierDocumentAuditApiClient",
  "/v1/admin/supplier-documents/download-grants",
  "/v1/admin/supplier-documents/download-events",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_supplier_document_audit_api_disabled",
  "admin_supplier_document_audit_session_required",
  "admin_role_required",
  "fileAssetId",
  "downloadPath",
]) {
  requireText("src/lib/admin-supplier-document-audit-api.ts", adminSupplierDocumentAuditApi, marker);
}
for (const marker of [
  "lists grant audit with filters",
  "lists download event audit through the events endpoint",
  "rejects storage-leaking responses",
]) {
  requireText("src/lib/admin-supplier-document-audit-api.test.ts", adminSupplierDocumentAuditApiTest, marker);
}
for (const marker of [
  "useAdminSupplierDocumentAudit",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
  "client.list",
]) {
  requireText("src/lib/use-admin-supplier-document-audit.ts", useAdminSupplierDocumentAudit, marker);
}
for (const marker of [
  "returns disabled state without VITE_YORSO_API_URL",
  "loads audit rows and supports refresh",
  "maps 403 responses to forbidden state",
]) {
  requireText("src/lib/use-admin-supplier-document-audit.test.tsx", useAdminSupplierDocumentAuditTest, marker);
}
for (const marker of [
  "admin-document-audit-page",
  "admin-document-audit-rows",
  "admin-document-audit-filters",
  "admin-document-audit-disabled",
  "admin-document-audit-session-required",
  "admin-document-audit-forbidden",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminSupplierDocumentAudit.tsx", adminSupplierDocumentAuditPage, marker);
}
for (const marker of [
  "shows disabled and session-required states explicitly",
  "renders grant audit rows without leaking storage fields",
  "Нужна роль администратора",
]) {
  requireText("src/pages/admin/AdminSupplierDocumentAudit.test.tsx", adminSupplierDocumentAuditPageTest, marker);
}
for (const marker of [
  "Phase 4K browser guard",
  "/admin/supplier-document-audit",
  "/v1/admin/supplier-documents/download-grants",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-document-audit-page",
  "admin-document-audit-forbidden",
]) {
  requireText("e2e/admin-supplier-document-audit.spec.ts", adminSupplierDocumentAuditE2E, marker);
}
for (const marker of [
  "createAdminRuntimeApiClient",
  "/v1/admin/runtime/status",
  "/v1/admin/runtime/diagnostics",
  "AdminRuntimeDiagnostics",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "admin_runtime_api_disabled",
  "admin_runtime_session_required",
  "admin_role_required",
  "targetConcurrentUsers !== 10_000",
  "hostedBaasProductionBackend !== false",
  "hostedBaasProductionBackend !== false",
  "secretsIncluded !== false",
]) {
  requireText("src/lib/admin-runtime-api.ts", adminRuntimeApi, marker);
}
for (const marker of [
  "stays disabled when VITE_YORSO_API_URL is empty",
  "loads sanitized runtime status with self-hosted session headers",
  "loads sanitized diagnostics through the same self-hosted session boundary",
  "maps admin role failures to admin_role_required",
]) {
  requireText("src/lib/admin-runtime-api.test.ts", adminRuntimeApiTest, marker);
}
for (const marker of [
  "useAdminRuntimeStatus",
  "AdminRuntimeApiError",
  "client.diagnostics",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-runtime-status.ts", useAdminRuntimeStatus, marker);
}
for (const marker of [
  "returns disabled state without VITE_YORSO_API_URL",
  "loads runtime status and supports explicit refresh",
  "maps 403 responses to forbidden state",
]) {
  requireText("src/lib/use-admin-runtime-status.test.tsx", useAdminRuntimeStatusTest, marker);
}
for (const marker of [
  "admin-runtime-page",
  "admin-runtime-policy",
  "admin-runtime-guardrails",
  "admin-runtime-auth",
  "admin-runtime-audit",
  "admin-runtime-lifecycle",
  "admin-runtime-diagnostics",
  "admin-runtime-capacity-plan",
  "admin-runtime-no-secrets",
  "10,000 concurrent users",
  "10 000 одновременных пользователей",
  "Hosted BaaS production backend",
  "Hosted BaaS production backend",
]) {
  requireText("src/pages/admin/AdminRuntimeStatus.tsx", adminRuntimePage, marker);
}
for (const marker of [
  "Self-hosted API is not connected",
  "admin-runtime-diagnostics-overall",
  "admin-runtime-session-required",
  "admin-runtime-forbidden",
  "postgres://",
  "Нужна роль администратора",
]) {
  requireText("src/pages/admin/AdminRuntimeStatus.test.tsx", adminRuntimePageTest, marker);
}
for (const marker of [
  "Batch #94 browser guard",
  "Batch #95 diagnostics",
  "/admin/runtime",
  "/v1/admin/runtime/status",
  "/v1/admin/runtime/diagnostics",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-runtime-scale",
  "admin-runtime-diagnostics",
  "admin-runtime-no-secrets",
  "postgres://",
]) {
  requireText("e2e/admin-runtime-status.spec.ts", adminRuntimeE2E, marker);
}
for (const marker of [
  "YORSO_API_URL",
  "YORSO_ADMIN_EMAIL",
  "YORSO_ADMIN_PASSWORD",
  "/v1/admin/audit-events/retention",
  "admin_audit_retention=",
]) {
  requireText("scripts/admin-audit-retention.mjs", adminAuditRetentionCli, marker);
}
for (const marker of [
  "RequestTelemetrySink",
  "api_request_event",
  "request.completed",
  "request.guardrail_triggered",
  "latencyBucket",
  "normalizeRoute",
  "request_header_too_large",
  "sanitizeRequestTelemetryEvent",
]) {
  requireText("apps/api/src/request-observability.ts", requestObservability, marker);
}
for (const marker of [
  "ErrorTelemetrySink",
  "api_error_event",
  "error.response",
  "error.client_parse",
  "errorId",
  "correlationId",
  "sanitizeErrorTelemetryEvent",
  "request_header_too_large",
]) {
  requireText("apps/api/src/error-observability.ts", errorObservability, marker);
}
for (const marker of [
  "MetricsRegistry",
  "InMemoryPrometheusMetricsRegistry",
  "renderPrometheusText",
  "yorso_api_requests_total",
  "yorso_api_request_duration_seconds",
  "yorso_api_errors_total",
  "yorso_api_auth_events_total",
  "yorso_api_admin_audit_requests_total",
  "yorso_api_admin_audit_rows_total",
  "observeAdminAudit",
  "observePasswordRecoveryCleanupWorker",
  "yorso_api_password_recovery_cleanup_worker_runs_total",
  "yorso_api_password_recovery_cleanup_worker_rows_total",
  "yorso_api_readiness_checks_total",
  "yorso_api_production_baseline_concurrent_users",
]) {
  requireText("apps/api/src/metrics.ts", metrics, marker);
}
for (const marker of [
  "requestTimeoutMs",
  "requestBodyIdleTimeoutMs",
  "headersTimeoutMs",
  "keepAliveTimeoutMs",
  "maxHeaderBytes",
  "jsonBodyMaxBytes",
  "errorObservabilityDriver",
  "YORSO_ERROR_OBSERVABILITY_DRIVER",
  "metricsDriver",
  "YORSO_METRICS_DRIVER",
  "auditDriver",
  "YORSO_AUDIT_DRIVER",
  "auditMaxInFlight",
  "YORSO_AUDIT_MAX_IN_FLIGHT",
  "Production self-hosted API must use YORSO_AUDIT_DRIVER=postgres.",
  "requestObservabilityDriver",
  "YORSO_REQUEST_OBSERVABILITY_DRIVER",
  "passwordRecoveryCleanupWorkerEnabled",
  "YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED",
  "passwordRecoveryCleanupWorkerIntervalMs",
  "YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_INTERVAL_MS",
  "passwordRecoveryCleanupWorkerBatchSize",
  "YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_BATCH_SIZE",
  "YORSO_REQUEST_TIMEOUT_MS",
  "YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS",
  "YORSO_HEADERS_TIMEOUT_MS",
  "YORSO_KEEP_ALIVE_TIMEOUT_MS",
  "YORSO_MAX_HEADER_BYTES",
  "YORSO_JSON_BODY_MAX_BYTES",
]) {
  requireText("apps/api/src/config.ts", config, marker);
}
for (const marker of [
  "createRequestTelemetrySink",
  "createErrorTelemetrySink",
  "buildRequestTelemetryEvent",
  "buildErrorTelemetryEvent",
  "buildClientParseErrorTelemetryEvent",
  "api_internal_error",
  "buildClientParseTelemetryEvent",
  "maxHeaderSize: config.maxHeaderBytes",
  "server.requestTimeout = config.requestTimeoutMs",
  "server.headersTimeout = config.headersTimeoutMs",
  "server.keepAliveTimeout = config.keepAliveTimeoutMs",
  "server.on(\"clientError\"",
  "x-correlation-id",
  "x-error-id",
  "request_timeout",
  "jsonBodyOptions",
]) {
  requireText("apps/api/src/server.ts", server, marker);
}
for (const marker of [
  "JsonBodyReadOptions",
  "ApiErrorContext",
  "markApiError",
  "errorId",
  "correlationId",
  "request_body_timeout",
  "request_body_too_large",
  "content-length",
  "withBodyIdleTimeout",
]) {
  requireText("apps/api/src/http.ts", read("apps/api/src/http.ts"), marker);
}
for (const marker of [
  "ApiLifecycle",
  "shutdownApiServer",
  "activeRequests",
  "waitForIdle",
  "closeAllConnections",
  "YORSO API drain started",
  "YORSO API drain completed",
]) {
  requireText("apps/api/src/lifecycle.ts", lifecycle, marker);
}
for (const marker of [
  "shutdownApiServer",
  "SIGTERM",
  "SIGINT",
  "shutdownDrainDelayMs",
  "shutdownGraceTimeoutMs",
]) {
  requireText("apps/api/src/index.ts", index, marker);
}
for (const marker of [
  "ApiLifecycle",
  "lifecycle.isDraining()",
  "server_draining",
  "lifecycle.beginRequest()",
  "lifecycle.endRequest()",
  "createReadinessProbe(config",
  "lifecycle,",
]) {
  requireText("apps/api/src/server.ts", server, marker);
}
for (const marker of [
  "shutdownDrain",
  "checkShutdownDrain",
  "server_draining",
  "readinessChecks: [\"shutdown_drain\", \"postgres\", \"redis\", \"local_storage\", \"production_runtime_config\"]",
]) {
  requireText("apps/api/src/routes/health.ts", read("apps/api/src/routes/health.ts"), marker);
}
for (const marker of [
  "API lifecycle drain",
  "tracks active requests",
  "marks draining state",
]) {
  requireText("apps/api/src/lifecycle.test.ts", lifecycleTest, marker);
}
requireText("apps/api/src/config.ts", config, "accountRepository: z.enum([\"memory\", \"postgres\"])");
requireText("apps/api/src/config.ts", config, "storageDriver: z.enum([\"local\"])");
requireText("apps/api/src/config.ts", config, "storageLocalRoot");
requireText("apps/api/src/config.ts", config, "maxUploadBytes");
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
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "resolveAuthenticatedAccountSession(request");
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
requireText("apps/api/src/modules/auth/factory.ts", authFactory, "createAuthRepository");
requireText("apps/api/src/modules/auth/factory.ts", authFactory, "PostgresAuthRepository");
requireText("apps/api/src/modules/auth/factory.ts", authFactory, "MemoryAuthRepository");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "class PostgresAuthRepository");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "from yorso_users u");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "join yorso_auth_credentials");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "insert into yorso_auth_sessions");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "insert into yorso_auth_password_recovery_tokens");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "insert into yorso_auth_password_recovery_outbox");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "completePasswordRecovery");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "leasePasswordRecoveryDeliveryJobs");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "cleanupPasswordRecovery");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "for update of outbox skip locked");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "recovery_token_sealed");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "insert into yorso_auth_security_events");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "countRecentSecurityEvents");
requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, "revoked_at");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "interface AuthRepository");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "recordSecurityEvent");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "countRecentSecurityEvents");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "createPasswordRecovery");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "findPasswordRecoveryByTokenHash");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "leasePasswordRecoveryDeliveryJobs");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "markPasswordRecoveryDeliverySent");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "markPasswordRecoveryDeliveryFailed");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "cleanupPasswordRecovery");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "deleteSessionsForUser");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "class MemoryAuthRepository");
requireText("apps/api/src/modules/auth/repository.ts", authRepository, "buyer@example.com");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "/v1/auth/sign-in");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "/v1/auth/password-reset/request");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "/v1/auth/password-reset/complete");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "/v1/auth/session");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "/v1/auth/sign-out");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "accountSessionIdHeaderName");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "AuthServiceError");
requireText("apps/api/src/modules/auth/service.ts", authService, "authSignInSchema.parse");
requireText("apps/api/src/modules/auth/service.ts", authService, "authPasswordResetRequestSchema.parse");
requireText("apps/api/src/modules/auth/service.ts", authService, "completePasswordReset");
requireText("apps/api/src/modules/auth/service.ts", authService, "deleteSessionsForUser");
requireText("apps/api/src/modules/auth/service.ts", authService, "auth_invalid_credentials");
requireText("apps/api/src/modules/auth/service.ts", authService, "auth_rate_limited");
requireText("apps/api/src/modules/auth/service.ts", authService, "sign_in_rate_limited");
requireText("apps/api/src/modules/auth/service.ts", authService, "rateLimiter.checkSignIn");
requireText("apps/api/src/modules/auth/service.ts", authService, "rateLimiter.recordFailedSignIn");
requireText("apps/api/src/modules/auth/service.ts", authService, "rateLimiter.checkPasswordReset");
requireText("apps/api/src/modules/auth/service.ts", authService, "rateLimiter.recordPasswordReset");
requireText("apps/api/src/modules/auth/service.ts", authService, "password_reset_rate_limited");
requireText("apps/api/src/modules/auth/service.ts", authService, "retryAfterSeconds");
requireText("apps/api/src/modules/auth/service.ts", authService, "sha256:");
for (const marker of [
  "createClient",
  "RedisAuthRateLimiter",
  "MemoryAuthRateLimiter",
  "SecurityEventAuthRateLimiter",
  "checkPasswordReset",
  "recordPasswordReset",
  "passwordResetMaxRequests",
  "hashIdentity",
  "failMode",
  "pExpire",
]) {
  requireText("apps/api/src/modules/auth/rate-limit.ts", authRateLimit, marker);
}
for (const marker of [
  "createAuthSessionCache",
  "RedisAuthSessionCache",
  "MemoryAuthSessionCache",
  "DisabledAuthSessionCache",
  "authSessionCacheConfigFromApiConfig",
  "auth_session_cache_redis_error",
  "cacheKey",
  "failMode",
]) {
  requireText("apps/api/src/modules/auth/session-cache.ts", authSessionCache, marker);
}
requireText("apps/api/src/server.ts", server, "createAuthRateLimiter(config, authRepository)");
requireText("apps/api/src/server.ts", server, "createAuthSessionCache(config)");
requireText("apps/api/src/server.ts", server, "createAuthTelemetrySink(config)");
requireText("apps/api/src/config.ts", config, "authRateLimitDriver");
requireText("apps/api/src/config.ts", config, "AUTH_RATE_LIMIT_DRIVER");
requireText("apps/api/src/config.ts", config, "Production self-hosted API must use AUTH_RATE_LIMIT_DRIVER=redis.");
requireText("apps/api/src/config.ts", config, "authSessionCacheDriver");
requireText("apps/api/src/config.ts", config, "AUTH_SESSION_CACHE_DRIVER");
requireText("apps/api/src/config.ts", config, "Production self-hosted API must use AUTH_SESSION_CACHE_DRIVER=redis.");
requireText("apps/api/src/config.ts", config, "authObservabilityDriver");
requireText("apps/api/src/config.ts", config, "AUTH_OBSERVABILITY_DRIVER");
requireText("apps/api/src/config.ts", config, "Production self-hosted API must use AUTH_OBSERVABILITY_DRIVER=console.");
requireText("apps/api/src/config.ts", config, "errorObservabilityDriver");
requireText("apps/api/src/config.ts", config, "YORSO_ERROR_OBSERVABILITY_DRIVER");
requireText("apps/api/src/config.ts", config, "Production self-hosted API must use YORSO_ERROR_OBSERVABILITY_DRIVER=console.");
requireText("apps/api/src/config.ts", config, "metricsDriver");
requireText("apps/api/src/config.ts", config, "YORSO_METRICS_DRIVER");
requireText("apps/api/src/config.ts", config, "Production self-hosted API must use YORSO_METRICS_DRIVER=prometheus.");
requireText("apps/api/src/config.ts", config, "auditDriver");
requireText("apps/api/src/config.ts", config, "YORSO_AUDIT_DRIVER");
requireText("apps/api/src/config.ts", config, "auditMaxInFlight");
requireText("apps/api/src/config.ts", config, "YORSO_AUDIT_MAX_IN_FLIGHT");
requireText("apps/api/src/config.ts", config, "Production self-hosted API must use YORSO_AUDIT_DRIVER=postgres.");
requireText("apps/api/src/server.ts", server, "createAuditSink(config)");
requireText("apps/api/src/server.ts", server, "auditSink");
requireText("apps/api/src/modules/auth/routes.ts", authRoutes, "auth.sign_in");
requireText("apps/api/src/modules/account/routes.ts", accountRoutes, "account.company.update");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "access.supplier.request");
requireText("apps/api/src/modules/access/routes.ts", accessRoutes, "access.supplier.decision");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "storage.company_media.upload");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "storage.document.create");
requireText("apps/api/src/server.ts", server, "createMetricsRegistry(config)");
requireText("apps/api/src/server.ts", server, "renderMetricsResponse(metricsRegistry");
requireText("apps/api/src/server.ts", server, "metricsRegistry.observeRequest");
requireText("apps/api/src/server.ts", server, "metricsRegistry.observeError");
requireText("apps/api/src/server.ts", server, "metricsRegistry.observeAuth");
requireText("apps/api/src/modules/auth/service.ts", authService, "sessionCache.getSession");
requireText("apps/api/src/modules/auth/service.ts", authService, "sessionCache.setSession");
requireText("apps/api/src/modules/auth/service.ts", authService, "sessionCache.deleteSession");
requireText("apps/api/src/modules/auth/service.ts", authService, "auth_session_cache_unavailable");
requireText("apps/api/src/modules/auth/service.ts", authService, "emitTelemetry");
for (const [name, text] of [
  ["apps/api/src/modules/auth/factory.ts", authFactory],
  ["apps/api/src/modules/auth/rate-limit.ts", authRateLimit],
  ["apps/api/src/modules/auth/session-cache.ts", authSessionCache],
  ["apps/api/src/modules/auth/observability.ts", authObservability],
  ["apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository],
  ["apps/api/src/modules/auth/repository.ts", authRepository],
  ["apps/api/src/modules/auth/routes.ts", authRoutes],
  ["apps/api/src/modules/auth/service.ts", authService],
]) {
  if (/supabase|auth0|clerk|firebase|appwrite/i.test(text)) {
    failures.push(`${name}: auth module must not depend on hosted BaaS/Auth providers`);
  }
}
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
requireText("apps/api/src/modules/storage/postgres-repository.ts", storagePostgresRepository, "getFileAssetById");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "interface FileRepository");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "class MemoryFileRepository");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "getFileAssetByObjectKeyForUser");
requireText("apps/api/src/modules/storage/repository.ts", storageRepository, "getFileAssetById");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/company/media/logo");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/company/media/cover");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/documents");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/files/");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "/v1/account/files/by-object-key");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "resolveAuthenticatedAccountSession(request");
requireText("apps/api/src/modules/storage/routes.ts", storageRoutes, "allowQueryUserId: true");
requireText("apps/api/src/modules/storage/service.ts", storageService, "class FileService");
requireText("apps/api/src/modules/storage/service.ts", storageService, "checksumSha256");
requireText("apps/api/src/modules/storage/service.ts", storageService, "contentBase64");
requireText("apps/api/src/modules/storage/service.ts", storageService, "getFileByObjectKeyForUser");
requireText("apps/api/src/modules/storage/service.ts", storageService, "getFileByAssetId");
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
requireText("apps/api/src/modules/offers/routes.ts", offerRoutes, "resolveOptionalAuthenticatedAccountSession");
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
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "production_facts");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "logistics_facts");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "yorso_supplier_document_download_grants");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "yorso_supplier_document_download_events");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "listDocumentDownloadGrants");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "listDocumentDownloadEvents");
requireText("apps/api/src/modules/suppliers/postgres-repository.ts", supplierPostgresRepository, "order by created_at desc, id asc");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "interface SupplierRepository");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "class MemorySupplierRepository");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "productionFacts(");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "logisticsFacts(");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "recordDocumentDownloadGrant");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "recordDocumentDownloadEvent");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "listDocumentDownloadGrants");
requireText("apps/api/src/modules/suppliers/repository.ts", supplierRepository, "listDocumentDownloadEvents");
requireText("apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "/v1/admin/supplier-documents/download-events");
requireText("apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "admin.supplier_document_download_events.read");
requireText("apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "/v1/admin/supplier-documents/download-grants");
requireText("apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "admin.supplier_document_download_grants.read");
requireText("apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "admin_role_required");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "/v1/suppliers");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "/v1/suppliers/");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "documents");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "resolveAuthenticatedAccountSession");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "resolveOptionalAuthenticatedAccountSession");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "supplier_not_found");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "supplier_document_access_required");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "supplier_document_grant_expired");
requireText("apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "sendSupplierDocumentFile");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDirectoryQuerySchema.parse");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "createSupplierDocumentDownloadGrant");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "consumeSupplierDocumentDownloadGrant");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "listAdminDocumentDownloadEvents");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocumentDownloadEventAdminListResponseSchema");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocumentDownloadGrantResponseSchema");
requireText("apps/api/src/modules/suppliers/service.ts", supplierService, "supplierDocuments: unlocked ? supplier.supplierDocuments : null");
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
requireText("infra/docker-compose.yml", compose, "STORAGE_DRIVER: local");
requireText("infra/docker-compose.yml", compose, "yorso-api-uploads");
if (/SUPABASE/i.test(compose)) {
  failures.push("infra/docker-compose.yml: production API compose service must not require Supabase env");
}
requireText("docs/backend/self-hosted-backend-architecture.md", docs, "YORSO API");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./account-company.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./account-session.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./auth.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./offer-catalog.js\";");
requireText("packages/contracts/src/index.ts", contractsIndex, "export * from \"./supplier-access.js\";");
requireText("packages/contracts/src/account-session.ts", accountSessionContract, "accountUserIdHeaderName");
requireText("packages/contracts/src/account-session.ts", accountSessionContract, "accountSessionHeadersSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authSignInSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authPasswordResetRequestSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authPasswordResetCompleteSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authPasswordResetRequestResponseSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authPasswordResetCompleteResponseSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authSessionSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authSessionResponseSchema");
requireText("packages/contracts/src/auth.ts", authContract, "authSignOutResponseSchema");
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
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierProductionFactsSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierLogisticsFactsSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentPayloadSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentTypeSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentStatusSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentDownloadGrantSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentDownloadGrantResponseSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentDownloadEventAdminQuerySchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentDownloadEventAdminListResponseSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementCreateRequestSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementUpdateRequestSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementDecisionRequestSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementAuditEventSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementCreateResponseSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementDecisionResponseSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementUpdateResponseSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocumentManagementDeleteResponseSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "productionFacts: supplierProductionFactsSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "logisticsFacts: supplierLogisticsFactsSchema");
requireText("packages/contracts/src/supplier-directory.ts", supplierDirectoryContract, "supplierDocuments: z.array(supplierDocumentPayloadSchema)");
for (const marker of [
  "evaluateSupplierDocumentManagementPolicy",
  "supplierDocumentManagementAuditActionByAction",
  "approved_document_immutable",
  "admin_role_required",
  "invalid_status_transition",
]) {
  requireText("apps/api/src/modules/suppliers/document-management-policy.ts", supplierDocumentManagementPolicy, marker);
}
for (const marker of [
  "supplierDocumentManagementCreateRequestSchema",
  "fileAssetId",
  "downloadPath",
  "supplierDocumentManagementAuditEventSchema",
  "supplierDocumentManagementCreateResponseSchema",
  "supplierDocumentManagementDecisionResponseSchema",
  "supplierDocumentManagementUpdateResponseSchema",
  "supplierDocumentManagementDeleteResponseSchema",
]) {
  requireText("src/test/supplier-document-management-contract.test.ts", supplierDocumentManagementContractTest, marker);
}
for (const marker of [
  "supplier_owner",
  "approved_document_immutable",
  "admin_role_required",
  "supplierDocumentManagementAuditActionByAction",
]) {
  requireText("apps/api/src/modules/suppliers/document-management-policy.test.ts", supplierDocumentManagementPolicyTest, marker);
}
requireText("apps/api/src/modules/auth/session.ts", authSession, "resolveOptionalAccountSession");
for (const marker of [
  "auth_sign_in=ok",
  "auth_session=ok",
  "auth_sign_out=ok",
  "auth_sign_out_blocks_account=ok",
  "auth_sign_out_blocks_access=ok",
  "auth_sign_out_blocks_offer_unlock=ok",
  "auth_sign_out_preserves_public_catalog=ok",
  "auth_rate_limit_retry_after=ok",
  "auth_rate_limit_guard=ok",
  "password_reset_rate_limit_guard=ok",
  "auth_session_cache_invalidation=ok",
  "auth_invalid_credentials_guard=ok",
  "auth_validation_guard=ok",
  "self_hosted_auth_api_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-auth-api.mjs", authApiSmoke, marker);
}
for (const marker of [
  "AUTH_OBSERVABILITY_DRIVER: \"console\"",
  "auth_observability_sign_in_failed=ok",
  "auth_observability_rate_limited=ok",
  "auth_observability_sign_in_succeeded=ok",
  "auth_observability_sign_out_succeeded=ok",
  "auth_observability_session_invalid=ok",
  "auth_observability_no_pii=ok",
  "self_hosted_auth_observability_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-auth-observability.mjs", authObservabilitySmoke, marker);
}
for (const marker of [
  "AUTH_SESSION_CACHE_DRIVER: \"redis\"",
  "AUTH_SESSION_CACHE_FAIL_MODE: \"closed\"",
  "auth_session_cache_fail_closed_sign_in=ok",
  "auth_session_cache_fail_closed_session=ok",
  "auth_session_cache_fail_closed_account=ok",
  "auth_session_cache_fail_closed_catalog=ok",
  "auth_session_cache_fail_closed_public_catalog=ok",
  "self_hosted_session_cache_fail_closed_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-session-cache-fail-closed.mjs", sessionCacheFailClosedSmoke, marker);
}
for (const marker of [
  "AuthTelemetrySink",
  "ConsoleAuthTelemetrySink",
  "MemoryAuthTelemetrySink",
  "sanitizeAuthTelemetryEvent",
  "auth_runtime_event",
  "schemaVersion",
]) {
  requireText("apps/api/src/modules/auth/observability.ts", authObservability, marker);
}
for (const marker of [
  "auth.sign_in.failed",
  "auth.sign_in.rate_limited",
  "auth.sign_in.succeeded",
  "auth.sign_out.succeeded",
  "auth.session.invalid",
  "not.toContain(\"buyer@example.com\")",
]) {
  requireText("apps/api/src/modules/auth/observability.test.ts", authObservabilityTest, marker);
}
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
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplierDocuments");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_verified_filter=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_sort_pagination=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_requires_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_grant_requires_access=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_download_missing_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_private_search_requires_grant=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_directory_unlocked=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_grant_unlocked=ok");
requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, "supplier_document_download_stream=ok");
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
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "productionFacts");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "logisticsFacts");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "localPreviewSupplierProductionFacts");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "supplierDocuments");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "localPreviewSupplierDocuments");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "requestDocumentDownloadGrant");
requireText("src/lib/supplier-directory-api.ts", supplierDirectoryApi, "supplier_document_grant_requires_api");
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
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "emptyApiListState");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "emptyApiDetailState");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "current.source === \"api\" ? current.suppliers : []");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "current.source === \"api\" ? current.supplier : undefined");
requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, "localPreviewSupplierProductionFacts");
requireText("src/lib/supplier-directory-view.ts", supplierDirectoryView, "productionFacts: item.productionFacts");
requireText("src/lib/supplier-directory-view.ts", supplierDirectoryView, "logisticsFacts: item.logisticsFacts");
requireText("src/lib/supplier-directory-view.ts", supplierDirectoryView, "supplierDocuments: unlocked ? redactSupplierDocumentFileAssets(item.supplierDocuments) : null");
requireText("src/lib/supplier-dossier-facts.ts", supplierDossierFacts, "localPreviewSupplierProductionFacts");
requireText("src/lib/supplier-dossier-facts.ts", supplierDossierFacts, "localPreviewSupplierLogisticsFacts");
requireText("src/pages/SupplierProfile.tsx", supplierProfilePage, "supplier?.productionFacts");
requireText("src/pages/SupplierProfile.tsx", supplierProfilePage, "supplier?.logisticsFacts");
requireText("src/pages/SupplierProfile.tsx", supplierProfilePage, "supplier.supplierDocuments");
requireText("src/pages/SupplierProfile.tsx", supplierProfilePage, "supplier-documents-locked");
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
requireText("src/lib/catalog-api.ts", catalogApi, "No catalog path falls back to hosted BaaS or prototype tables");
requireText("src/lib/catalog-api.ts", catalogApi, "offerCatalog.listOffers");
requireText("src/lib/catalog-api.ts", catalogApi, "offerCatalog.getOfferById");
forbidText("src/lib/catalog-api.ts", catalogApi, "legacy-catalog-supabase-adapter");
forbidText("src/lib/catalog-api.ts", catalogApi, "fetchLegacyCatalogOffers");
forbidText("src/lib/catalog-api.ts", catalogApi, "fetchLegacyCatalogOfferById");
forbidText("src/lib/catalog-api.ts", catalogApi, "SupplierPublicRow");
if (existsSync("src/lib/legacy-catalog-supabase-adapter.ts")) {
  failures.push("src/lib/legacy-catalog-supabase-adapter.ts: removed catalog Supabase fallback file must stay absent");
}
requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, "uses self-hosted offer catalog as the catalog source of truth");
requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, "delegates API-disabled preview to offer-catalog local fixtures, not hosted BaaS");
requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, "removes the catalog hosted-provider fallback adapter from the facade path");
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
requireText("src/lib/supplier-access-api.ts", supplierAccessApi, "never fall back to hosted auth, RLS or prototype tables");
forbidText("src/lib/supplier-access-api.ts", supplierAccessApi, "legacy-supplier-access-supabase-adapter");
forbidText("src/lib/supplier-access-api.ts", supplierAccessApi, "readLegacySupplierAccessRequest");
forbidText("src/lib/supplier-access-api.ts", supplierAccessApi, "requestLegacySupplierAccess");
forbidText("src/lib/supplier-access-api.ts", supplierAccessApi, "isLegacySupplierAccessSupabaseConfigured");
if (existsSync("src/lib/legacy-supplier-access-supabase-adapter.ts")) {
  failures.push("src/lib/legacy-supplier-access-supabase-adapter.ts: removed supplier-access Supabase fallback file must stay absent");
}
requireText("src/lib/supplier-access-api.boundary.test.ts", supplierAccessApiBoundaryTest, "keeps API-disabled preview local-only without hosted auth or RLS fallback");
requireText("src/lib/supplier-access-api.boundary.test.ts", supplierAccessApiBoundaryTest, "keeps hosted-provider fallbacks and the deleted legacy adapter out of supplier-access-api.ts");
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
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Self-Hosted Auth API Smoke");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "npm run smoke:self-hosted-auth-api");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "self_hosted_auth_api_smoke=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Batch #76");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Batch #77");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Batch #78");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Batch #79");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Batch #80");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "Batch #81");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "auth_sign_out_blocks_offer_unlock=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "auth_rate_limit_guard=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "password_reset_rate_limit_guard=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "auth_rate_limit_retry_after=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "auth_session_cache_invalidation=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "self_hosted_session_cache_fail_closed_smoke=ok");
requireText("docs/backend/self-hosted-auth-api-smoke.md", authApiSmokeDocs, "self_hosted_auth_observability_smoke=ok");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "npm run smoke:self-hosted-account-api");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "self_hosted_account_api_smoke=ok");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "supplier_document_owner_create_review=ok");
requireText("docs/backend/self-hosted-account-api-smoke.md", accountApiSmokeDocs, "supplier_document_admin_decision_review=ok");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "Self-Hosted Offer Detail Smoke");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "npm run smoke:self-hosted-offer-detail");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "offer_detail_locked=ok");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "offer_detail_unlocked=ok");
requireText("docs/backend/self-hosted-offer-detail-smoke.md", offerDetailSmokeDocs, "self_hosted_offer_detail_smoke=ok");
for (const marker of [
  "Self-Hosted Admin Access Review Smoke",
  "npm run smoke:self-hosted-admin-access-review",
  "admin_access_review_auth_guard=ok",
  "admin_access_review_role_guard=ok",
  "admin_access_review_approve=ok",
  "admin_access_review_decision_notification=ok",
  "self_hosted_admin_access_review_smoke=ok",
  "0017_supplier_access_review_queue.sql",
]) {
  requireText("docs/backend/self-hosted-admin-access-review-smoke.md", adminAccessReviewSmokeDocs, marker);
}
for (const marker of [
  "Batch #97",
  "npm run smoke:self-hosted-admin-access-grants",
  "admin_access_grants_auth_guard=ok",
  "admin_access_grants_role_guard=ok",
  "admin_access_grants_revoke=ok",
  "admin_access_grants_revoke_masks_catalog=ok",
  "self_hosted_admin_access_grants_smoke=ok",
  "0018_admin_access_grants_console.sql",
]) {
  requireText("docs/backend/self-hosted-admin-access-grants-smoke.md", adminAccessGrantsSmokeDocs, marker);
}
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
forbidText("apps/api/src/modules/admin-runtime/routes.ts", adminRuntimeRoutes, "@/integrations/supabase/client");
forbidText("apps/api/src/modules/admin-runtime/service.ts", adminRuntimeService, "@/integrations/supabase/client");
forbidText("src/lib/admin-runtime-api.ts", adminRuntimeApi, "@/integrations/supabase/client");
forbidText("src/lib/use-admin-runtime-status.ts", useAdminRuntimeStatus, "@/integrations/supabase/client");
forbidText("src/pages/admin/AdminRuntimeStatus.tsx", adminRuntimePage, "@/integrations/supabase/client");
forbidText("src/lib/admin-access-review-api.ts", adminAccessReviewApi, "@/integrations/supabase/client");
forbidText("src/lib/use-admin-access-review.ts", useAdminAccessReview, "@/integrations/supabase/client");
forbidText("src/pages/admin/AdminAccessRequests.tsx", adminAccessReviewPage, "@/integrations/supabase/client");
forbidText("src/lib/admin-access-grants-api.ts", adminAccessGrantsApi, "@/integrations/supabase/client");
forbidText("src/lib/use-admin-access-grants.ts", useAdminAccessGrants, "@/integrations/supabase/client");
forbidText("src/pages/admin/AdminAccessGrants.tsx", adminAccessGrantsPage, "@/integrations/supabase/client");
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
forbidText("apps/api/src/modules/suppliers/admin-routes.ts", supplierAdminRoutes, "@/integrations/supabase/client");
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
forbidText("src/pages/SupplierProfile.tsx", supplierProfilePage, "buildProductionFacts");
forbidText("src/pages/SupplierProfile.tsx", supplierProfilePage, "buildLogisticsFacts");
forbidText("src/pages/SupplierProfile.tsx", supplierProfilePage, "hashSeed");
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
console.log("- Supplier profile production and logistics dossier facts are backend-owned in the supplier directory contract.");
console.log("- Supplier owner document create writes review documents through self-hosted ownership, file and audit boundaries.");
console.log("- Supplier document admin decisions approve/reject review documents through self-hosted admin, policy and audit boundaries.");
console.log("- Supplier owner document correction updates/deletes non-approved documents through self-hosted ownership, policy and audit boundaries.");
console.log("- Offer catalog API exposes access-shaped offer discovery without Supabase production coupling.");
console.log("- Supplier access API exposes request, decision, grant and notification flow without Supabase production coupling.");
console.log("- Supplier access UX consumes self-hosted request status and approval notifications with local fallback.");
console.log("- Account routes require explicit self-hosted session headers instead of hidden demo-user fallback.");
console.log("- Auth API issues, reads and revokes self-hosted sessions without hosted auth providers.");
console.log("- Auth pages use self-hosted/local auth only; the Supabase prototype auth fallback is removed.");
console.log("- Runtime auth API smoke is wired into ci:core.");
console.log("- Runtime account API smoke is wired into ci:core.");
console.log("- Account UI can bridge company media and documents to the self-hosted file API with local fallback.");
console.log("- infra/docker-compose.yml includes the API service without Supabase production env.");
