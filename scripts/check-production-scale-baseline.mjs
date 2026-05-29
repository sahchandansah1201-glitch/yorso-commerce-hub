#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  ".github/workflows/ci.yml",
  "docs/backend/production-scale-baseline.md",
  "docs/backend/phase-2e-registration-verification-code-policy.md",
  "docs/backend/phase-2f-password-recovery-source-of-truth.md",
  "docs/backend/self-hosted-production-policy.md",
  "docs/backend/self-hosted-production-deploy.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-validation.md",
  "docs/backend/engineering-quality-gates.md",
  "docs/project-memory/ENGINEERING_LESSONS.md",
  ".env.production.example",
  "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
  "packages/db/migrations/0009_supplier_directory_pagination_sort.sql",
  "packages/db/migrations/0006_offer_catalog.sql",
  "packages/db/migrations/0010_offer_catalog_pagination_sort.sql",
  "packages/db/migrations/0007_supplier_access_flow.sql",
  "packages/db/migrations/0008_access_notification_ack.sql",
  "packages/db/migrations/0011_auth_sessions.sql",
  "packages/db/migrations/0012_auth_security_events.sql",
  "packages/db/migrations/0013_api_audit_events.sql",
  "packages/db/migrations/0014_admin_audit_access.sql",
  "packages/db/migrations/0015_admin_audit_retention_query_hardening.sql",
  "packages/db/migrations/0016_admin_audit_retention_runtime.sql",
  "packages/db/migrations/0017_supplier_access_review_queue.sql",
  "packages/db/migrations/0018_admin_access_grants_console.sql",
  "packages/db/migrations/0019_admin_incident_acknowledgements.sql",
  "packages/db/migrations/0020_admin_incident_workflow.sql",
  "packages/db/migrations/0021_admin_incident_execution.sql",
  "packages/db/migrations/0022_admin_incident_workload_correlation.sql",
  "packages/db/migrations/0023_admin_incident_trend_analytics.sql",
  "packages/db/migrations/0024_admin_incident_trend_actions.sql",
  "packages/db/migrations/0025_admin_incident_trend_action_queue.sql",
  "packages/db/migrations/0028_registration_verification_code_policy.sql",
  "packages/db/migrations/0029_auth_password_recovery.sql",
  "apps/api/src/modules/auth/password-recovery.ts",
  "docs/backend/admin-incident-trend-actions.md",
  "docs/backend/admin-incident-trend-actions-api-contract.md",
  "docs/backend/admin-incident-trend-actions-indexing.md",
  "docs/backend/admin-incident-trend-action-queue.md",
  "docs/backend/admin-incident-trend-action-queue-api-contract.md",
  "docs/backend/admin-incident-trend-action-queue-indexing.md",
  "scripts/admin-audit-retention.mjs",
  "packages/db/migration-manifest.json",
  "package.json",
  "packages/contracts/src/auth.ts",
  "apps/api/src/modules/auth/factory.ts",
  "apps/api/src/modules/auth/postgres-repository.ts",
  "apps/api/src/modules/auth/repository.ts",
  "apps/api/src/modules/auth/routes.ts",
  "apps/api/src/modules/auth/rate-limit.ts",
  "apps/api/src/modules/auth/session-cache.ts",
  "apps/api/src/modules/auth/observability.ts",
  "apps/api/src/lifecycle.ts",
  "apps/api/src/modules/auth/session.ts",
  "apps/api/src/modules/auth/service.ts",
  "apps/api/src/routes/health.ts",
  "apps/api/src/audit.ts",
  "apps/api/src/modules/admin-audit/repository.ts",
  "apps/api/src/modules/admin-audit/postgres-repository.ts",
  "apps/api/src/modules/admin-audit/routes.ts",
  "apps/api/src/modules/admin-audit/service.ts",
  "apps/api/src/modules/admin-runtime/routes.ts",
  "apps/api/src/modules/admin-runtime/service.ts",
  "apps/api/src/modules/admin-incidents/factory.ts",
  "apps/api/src/modules/admin-incidents/postgres-repository.ts",
  "apps/api/src/modules/admin-incidents/repository.ts",
  "apps/api/src/modules/admin-incidents/routes.ts",
  "apps/api/src/modules/admin-incidents/service.ts",
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
  "apps/api/src/error-observability.ts",
  "apps/api/src/metrics.ts",
  "apps/api/src/request-observability.ts",
  "apps/api/src/modules/account/routes.ts",
  "apps/api/src/modules/access/routes.ts",
  "apps/api/src/modules/storage/routes.ts",
  "apps/api/src/modules/offers/routes.ts",
  "apps/api/src/modules/suppliers/routes.ts",
  "scripts/smoke-self-hosted-auth-api.mjs",
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
  "scripts/smoke-self-hosted-auth-observability.mjs",
  "scripts/smoke-self-hosted-session-cache-fail-closed.mjs",
  "scripts/smoke-self-hosted-account-api.mjs",
  "scripts/smoke-self-hosted-offer-detail.mjs",
  "scripts/smoke-e2e-self-hosted-access-runtime.mjs",
  "scripts/smoke-frontend-no-supabase-env.mjs",
  "scripts/lib/e2e-script-policy.mjs",
  "scripts/check-engineering-lessons.mjs",
  "scripts/check-self-hosted-production-runtime.mjs",
  "src/test/engineering-lessons-guard.test.ts",
  "src/lib/auth-runtime.ts",
  "src/lib/auth-runtime.test.ts",
  "src/lib/auth-runtime.boundary.test.ts",
  "src/lib/buyer-session.test.ts",
  "src/lib/legacy-auth-supabase-adapter.ts",
  "src/pages/SignIn.tsx",
  "src/pages/ResetPassword.tsx",
  "apps/api/src/modules/offers/repository.ts",
  "apps/api/src/modules/offers/postgres-repository.ts",
  "src/integrations/supabase/client.ts",
  "src/lib/catalog-api.ts",
  "src/lib/catalog-api.boundary.test.ts",
  "src/lib/legacy-catalog-supabase-adapter.ts",
  "src/lib/offer-catalog-api.ts",
  "src/lib/use-offer-catalog.ts",
  "src/lib/use-offer-detail.ts",
  "src/components/catalog/SelectedOfferPanel.tsx",
  "src/lib/supplier-directory-api.ts",
  "src/lib/use-supplier-directory.ts",
  "src/lib/supplier-access-api.ts",
  "src/lib/supplier-access-api.boundary.test.ts",
  "src/lib/supplier-access-requests.ts",
  "src/lib/legacy-supplier-access-supabase-adapter.ts",
  "src/lib/supplier-approval-notifications.ts",
  "src/components/suppliers/SupplierApprovalNotifier.tsx",
  "src/lib/use-supplier-access-notifications.ts",
  "src/components/suppliers/SupplierAccessNotificationCenter.tsx",
  "src/components/suppliers/SupplierAccessRefreshBanner.tsx",
  "src/components/landing/Header.tsx",
  "src/pages/Suppliers.tsx",
  "src/pages/Offers.tsx",
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
  "e2e/frontend-no-supabase-env.spec.ts",
  "e2e/signin-self-hosted-auth-flow.spec.ts",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const ciWorkflow = read(".github/workflows/ci.yml");
const baseline = read("docs/backend/production-scale-baseline.md");
const phase2eRegistrationVerificationCodePolicy = read("docs/backend/phase-2e-registration-verification-code-policy.md");
const phase2fPasswordRecoverySourceOfTruth = read("docs/backend/phase-2f-password-recovery-source-of-truth.md");
const productionPolicy = read("docs/backend/self-hosted-production-policy.md");
const productionDeploy = read("docs/backend/self-hosted-production-deploy.md");
const productionEnv = read(".env.production.example");
const architecture = read("docs/backend/self-hosted-backend-architecture.md");
const validation = read("docs/backend/self-hosted-validation.md");
const engineeringQualityGates = read("docs/backend/engineering-quality-gates.md");
const engineeringLessons = read("docs/project-memory/ENGINEERING_LESSONS.md");
const engineeringLessonsCheck = read("scripts/check-engineering-lessons.mjs");
const e2eScriptPolicy = read("scripts/lib/e2e-script-policy.mjs");
const engineeringLessonsTest = read("src/test/engineering-lessons-guard.test.ts");
const supplierScaling = read("packages/db/migrations/0005_supplier_directory_search_scaling.sql");
const supplierPaginationSort = read("packages/db/migrations/0009_supplier_directory_pagination_sort.sql");
const offerCatalog = read("packages/db/migrations/0006_offer_catalog.sql");
const offerPaginationSort = read("packages/db/migrations/0010_offer_catalog_pagination_sort.sql");
const supplierAccess = read("packages/db/migrations/0007_supplier_access_flow.sql");
const accessNotificationAck = read("packages/db/migrations/0008_access_notification_ack.sql");
const authSessions = read("packages/db/migrations/0011_auth_sessions.sql");
const authSecurityEvents = read("packages/db/migrations/0012_auth_security_events.sql");
const apiAuditEvents = read("packages/db/migrations/0013_api_audit_events.sql");
const adminAuditAccess = read("packages/db/migrations/0014_admin_audit_access.sql");
const adminAuditRetentionQueryHardening = read("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql");
const adminAuditRetentionRuntime = read("packages/db/migrations/0016_admin_audit_retention_runtime.sql");
const supplierAccessReviewQueue = read("packages/db/migrations/0017_supplier_access_review_queue.sql");
const adminIncidentWorkflowMigration = read("packages/db/migrations/0020_admin_incident_workflow.sql");
const adminIncidentExecutionMigration = read("packages/db/migrations/0021_admin_incident_execution.sql");
const adminIncidentWorkloadCorrelationMigration = read("packages/db/migrations/0022_admin_incident_workload_correlation.sql");
const adminIncidentTrendAnalyticsMigration = read("packages/db/migrations/0023_admin_incident_trend_analytics.sql");
const adminIncidentTrendActionsMigration = read("packages/db/migrations/0024_admin_incident_trend_actions.sql");
const adminIncidentTrendActionQueueMigration = read("packages/db/migrations/0025_admin_incident_trend_action_queue.sql");
const registrationVerificationCodePolicyMigration = read("packages/db/migrations/0028_registration_verification_code_policy.sql");
const authPasswordRecoveryMigration = read("packages/db/migrations/0029_auth_password_recovery.sql");
const authPasswordRecovery = read("apps/api/src/modules/auth/password-recovery.ts");
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const pkg = JSON.parse(read("package.json"));
const authContract = read("packages/contracts/src/auth.ts");
const authFactory = read("apps/api/src/modules/auth/factory.ts");
const authPostgresRepository = read("apps/api/src/modules/auth/postgres-repository.ts");
const authRepository = read("apps/api/src/modules/auth/repository.ts");
const authRoutes = read("apps/api/src/modules/auth/routes.ts");
const authRateLimit = read("apps/api/src/modules/auth/rate-limit.ts");
const authSessionCache = read("apps/api/src/modules/auth/session-cache.ts");
const authObservability = read("apps/api/src/modules/auth/observability.ts");
const apiLifecycle = read("apps/api/src/lifecycle.ts");
const authSession = read("apps/api/src/modules/auth/session.ts");
const authService = read("apps/api/src/modules/auth/service.ts");
const healthRoutes = read("apps/api/src/routes/health.ts");
const audit = read("apps/api/src/audit.ts");
const adminAuditRepository = read("apps/api/src/modules/admin-audit/repository.ts");
const adminAuditPostgresRepository = read("apps/api/src/modules/admin-audit/postgres-repository.ts");
const adminAuditRoutes = read("apps/api/src/modules/admin-audit/routes.ts");
const adminAuditService = read("apps/api/src/modules/admin-audit/service.ts");
const adminRuntimeRoutes = read("apps/api/src/modules/admin-runtime/routes.ts");
const adminRuntimeService = read("apps/api/src/modules/admin-runtime/service.ts");
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
const useAdminIncidents = read("src/lib/use-admin-incidents.ts");
const useAdminIncidentsTest = read("src/lib/use-admin-incidents.test.tsx");
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
const adminIncidentExecutionQueuePage = read("src/pages/admin/AdminIncidentExecutionQueue.tsx");
const adminIncidentExecutionQueuePageTest = read("src/pages/admin/AdminIncidentExecutionQueue.test.tsx");
const adminIncidentWorkloadPage = read("src/pages/admin/AdminIncidentWorkload.tsx");
const adminIncidentWorkloadPageTest = read("src/pages/admin/AdminIncidentWorkload.test.tsx");
const adminIncidentTrendsPage = read("src/pages/admin/AdminIncidentTrends.tsx");
const adminIncidentTrendsPageTest = read("src/pages/admin/AdminIncidentTrends.test.tsx");
const adminIncidentTrendActionsPage = read("src/pages/admin/AdminIncidentTrendActions.tsx");
const adminIncidentTrendActionsPageTest = read("src/pages/admin/AdminIncidentTrendActions.test.tsx");
const adminIncidentsE2E = read("e2e/admin-incidents.spec.ts");
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
const errorObservability = read("apps/api/src/error-observability.ts");
const metrics = read("apps/api/src/metrics.ts");
const requestObservability = read("apps/api/src/request-observability.ts");
const accountRoutes = read("apps/api/src/modules/account/routes.ts");
const accessRoutes = read("apps/api/src/modules/access/routes.ts");
const storageRoutes = read("apps/api/src/modules/storage/routes.ts");
const offerRoutes = read("apps/api/src/modules/offers/routes.ts");
const supplierRoutes = read("apps/api/src/modules/suppliers/routes.ts");
const authApiSmoke = read("scripts/smoke-self-hosted-auth-api.mjs");
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
const adminAuditRetentionCli = read("scripts/admin-audit-retention.mjs");
const authObservabilitySmoke = read("scripts/smoke-self-hosted-auth-observability.mjs");
const sessionCacheFailClosedSmoke = read("scripts/smoke-self-hosted-session-cache-fail-closed.mjs");
const accountApiSmoke = read("scripts/smoke-self-hosted-account-api.mjs");
const offerDetailSmoke = read("scripts/smoke-self-hosted-offer-detail.mjs");
const selfHostedAccessRuntimeSmoke = read("scripts/smoke-e2e-self-hosted-access-runtime.mjs");
const frontendNoSupabaseSmoke = read("scripts/smoke-frontend-no-supabase-env.mjs");
const productionRuntimeCheck = read("scripts/check-self-hosted-production-runtime.mjs");
const authRuntime = read("src/lib/auth-runtime.ts");
const authRuntimeTest = read("src/lib/auth-runtime.test.ts");
const authRuntimeBoundaryTest = read("src/lib/auth-runtime.boundary.test.ts");
const buyerSessionTest = read("src/lib/buyer-session.test.ts");
const legacyAuthSupabaseAdapter = read("src/lib/legacy-auth-supabase-adapter.ts");
const signInPage = read("src/pages/SignIn.tsx");
const resetPasswordPage = read("src/pages/ResetPassword.tsx");
const offerRepository = read("apps/api/src/modules/offers/repository.ts");
const offerPostgresRepository = read("apps/api/src/modules/offers/postgres-repository.ts");
const supabaseClient = read("src/integrations/supabase/client.ts");
const catalogApi = read("src/lib/catalog-api.ts");
const catalogApiBoundaryTest = read("src/lib/catalog-api.boundary.test.ts");
const legacyCatalogSupabaseAdapter = read("src/lib/legacy-catalog-supabase-adapter.ts");
const offerApi = read("src/lib/offer-catalog-api.ts");
const useOfferCatalog = read("src/lib/use-offer-catalog.ts");
const useOfferDetail = read("src/lib/use-offer-detail.ts");
const selectedOfferPanel = read("src/components/catalog/SelectedOfferPanel.tsx");
const supplierApi = read("src/lib/supplier-directory-api.ts");
const useSupplierDirectory = read("src/lib/use-supplier-directory.ts");
const supplierAccessApi = read("src/lib/supplier-access-api.ts");
const supplierAccessApiBoundaryTest = read("src/lib/supplier-access-api.boundary.test.ts");
const supplierAccessRequests = read("src/lib/supplier-access-requests.ts");
const legacySupplierAccessSupabaseAdapter = read("src/lib/legacy-supplier-access-supabase-adapter.ts");
const supplierApprovalNotifications = read("src/lib/supplier-approval-notifications.ts");
const supplierApprovalNotifier = read("src/components/suppliers/SupplierApprovalNotifier.tsx");
const useSupplierAccessNotifications = read("src/lib/use-supplier-access-notifications.ts");
const supplierAccessNotificationCenter = read("src/components/suppliers/SupplierAccessNotificationCenter.tsx");
const supplierAccessRefreshBanner = read("src/components/suppliers/SupplierAccessRefreshBanner.tsx");
const header = read("src/components/landing/Header.tsx");
const suppliersPage = read("src/pages/Suppliers.tsx");
const offersPage = read("src/pages/Offers.tsx");
const offersCatalogPagingE2E = read("e2e/offers-catalog-paging.spec.ts");
const suppliersDirectoryPagingE2E = read("e2e/suppliers-directory-paging.spec.ts");
const supplierProfileDetailE2E = read("e2e/supplier-profile-detail.spec.ts");
const supplierDirectoryProfileFlowE2E = read("e2e/supplier-directory-profile-flow.spec.ts");
const supplierDirectoryProfileApiFlowE2E = read("e2e/supplier-directory-profile-api-flow.spec.ts");
const offerDetailRuntimeE2E = read("e2e/offer-detail-runtime.spec.ts");
const offerCatalogDetailFlowE2E = read("e2e/offer-catalog-detail-flow.spec.ts");
const offerCatalogDetailApiFlowE2E = read("e2e/offer-catalog-detail-api-flow.spec.ts");
const supplierAccessNotificationCenterApiFlowE2E = read("e2e/supplier-access-notification-center-api-flow.spec.ts");
const selfHostedAccessRuntimeE2E = read("e2e/self-hosted-access-runtime.spec.ts");
const frontendNoSupabaseE2E = read("e2e/frontend-no-supabase-env.spec.ts");
const selfHostedAuthFrontendE2E = read("e2e/signin-self-hosted-auth-flow.spec.ts");

if (!pkg.dependencies?.redis) {
  failures.push("package.json: redis dependency is required for Batch #78 production auth backpressure");
}

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

for (const marker of [
  "10,000 concurrent web users",
  "Required Capacity Review",
  "Connection strategy",
  "Queue/backpressure",
  "Observability",
  "Load test",
  "third-party application backends must not be production dependencies",
  "Batch #36 promotes the target",
  "self-hosted offer detail smoke",
  "Batch #50",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "Batch #51",
  "Batch #52",
  "Batch #53",
  "Batch #54",
  "Batch #55",
  "Batch #56",
  "Batch #57",
  "Batch #58",
  "Batch #59",
  "Batch #60",
  "Batch #61",
  "Batch #62",
  "Batch #63",
  "Batch #64",
  "Batch #65",
  "Batch #66",
  "Batch #67",
  "Batch #68",
  "Batch #69",
  "Batch #70",
  "Batch #71",
  "Batch #72",
  "Batch #73",
  "Batch #74",
  "Batch #75",
  "Batch #76",
  "Batch #77",
  "Batch #78",
  "Batch #79",
  "Batch #80",
  "Batch #81",
  "Batch #82",
  "Batch #83",
  "Batch #84",
  "Batch #85",
  "Batch #86",
  "Batch #87",
  "Batch #88",
  "Batch #89",
  "Batch #90",
  "Batch #91",
  "Batch #92",
  "Batch #93",
  "Batch #94",
  "Batch #95",
  "Batch #96",
  "Batch #97",
  "notification center",
  "self-hosted auth/session foundation",
  "self-hosted auth frontend bridge",
  "backend session authority",
  "revoked-session behavior",
  "sign-in backpressure",
  "AUTH_RATE_LIMIT_DRIVER=redis",
  "Redis sign-in backpressure",
  "AUTH_SESSION_CACHE_DRIVER=redis",
  "Redis session cache",
  "session-cache fail-closed smoke",
  "auth observability JSONL",
  "readiness checks",
  "self-hosted health readiness smoke",
  "graceful shutdown drain",
  "self-hosted graceful shutdown smoke",
  "request timeout",
  "body idle timeout",
  "self-hosted request guardrails smoke",
  "request observability",
  "api_request_event",
  "self-hosted request observability smoke",
  "error observability",
  "api_error_event",
  "self-hosted error observability smoke",
  "Prometheus metrics endpoint",
  "yorso_api_requests_total",
  "self-hosted metrics smoke",
  "self-hosted audit persistence smoke",
  "self-hosted admin audit smoke",
  "yorso_api_audit_events",
  "yorso_user_roles",
  "admin.audit_events.read",
  "admin.audit_events.export",
  "admin audit retention",
  "admin runtime status",
  "admin runtime UI",
  "admin runtime diagnostics",
  "supplier access review console",
  "self-hosted admin runtime status smoke",
  "self-hosted admin access review smoke",
  "API-backed admin runtime status browser e2e",
  "API-backed admin access review browser e2e",
  "/v1/admin/runtime/diagnostics",
  "/v1/admin/access-requests",
  "/v1/admin/access-requests/:requestId/decision",
  "admin-runtime-diagnostics",
  "admin-access-review-queue",
  "yorso_api_admin_runtime_status_requests_total",
  "YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS",
  "YORSO_ADMIN_AUDIT_RETENTION_DAYS",
  "api_audit_dropped",
  "YORSO_AUDIT_DRIVER=postgres",
  "YORSO_AUDIT_MAX_IN_FLIGHT",
  "real self-hosted API browser smoke",
  "optional Supabase frontend smoke",
  "auth runtime adapter boundary",
  "legacy auth Supabase adapter boundary",
  "self-hosted production policy",
  "self-hosted production runtime guard",
  ".env.production.example",
  "legacy catalog Supabase adapter boundary",
  "legacy supplier access Supabase adapter boundary",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
  "offer detail runtime browser e2e",
  "offer catalog detail flow browser e2e",
  "supplier directory profile flow browser e2e",
  "API-backed supplier directory profile flow browser e2e",
  "API-backed offer catalog detail flow browser e2e",
  "API-backed supplier access notification center browser e2e",
  "API-backed access browser suite",
  "Supabase, Firebase, Appwrite, Clerk",
  "third-party application backends must not be production dependencies",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}

for (const marker of [
  "YORSO production must run as one self-hosted product on owned server",
  "Production runtime must not depend on Supabase, Firebase, Appwrite, Clerk",
  "Supabase files in this repository are not production architecture.",
  "Backend Boundary",
  "Deployment Boundary",
  "Batch #71",
  "Batch #72",
  "check:self-hosted-production-runtime",
  ".env.production.example",
]) {
  requireText("docs/backend/self-hosted-production-policy.md", productionPolicy, marker);
}

for (const marker of [
  "Batch: #72",
  "Self-Hosted Production Deploy",
  "Minimum production topology",
  "Production env must not contain",
  "check:self-hosted-production-runtime",
]) {
  requireText("docs/backend/self-hosted-production-deploy.md", productionDeploy, marker);
}

for (const marker of [
  "NODE_ENV=production",
  "VITE_YORSO_API_URL=https://api.yorso.example",
  "ACCOUNT_REPOSITORY=postgres",
  "DATABASE_URL=postgres://",
  "REDIS_URL=redis://redis:6379",
  "AUTH_RATE_LIMIT_DRIVER=redis",
  "AUTH_RATE_LIMIT_FAIL_MODE=closed",
  "AUTH_SESSION_CACHE_DRIVER=redis",
  "AUTH_SESSION_CACHE_FAIL_MODE=closed",
  "YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=true",
  "YORSO_REGISTRATION_DELIVERY_SENDER=file_spool",
  "YORSO_REGISTRATION_DELIVERY_SPOOL_DIR=/var/lib/yorso/registration-delivery",
  "YORSO_REGISTRATION_VERIFICATION_CODE_SECRET=replace-with-owned-registration-code-secret-32-bytes-minimum",
  "STORAGE_DRIVER=local",
]) {
  requireText(".env.production.example", productionEnv, marker);
}

if (/SUPABASE|FIREBASE|APPWRITE|CLERK|AUTH0/i.test(productionEnv)) {
  failures.push(".env.production.example: production runtime must not contain hosted BaaS/SaaS provider settings");
}

if (pkg.scripts["check:self-hosted-production-runtime"] !== "node scripts/check-self-hosted-production-runtime.mjs") {
  failures.push("package.json: check:self-hosted-production-runtime must run the production runtime guard");
}

if (!pkg.scripts["ci:core"]?.includes("npm run check:self-hosted-production-runtime")) {
  failures.push("package.json: ci:core must run check:self-hosted-production-runtime");
}

for (const marker of [
  ".env.production.example",
  "docs/backend/self-hosted-production-deploy.md",
  "ci:core enforces check:self-hosted-production-runtime",
]) {
  requireText("scripts/check-self-hosted-production-runtime.mjs", productionRuntimeCheck, marker);
}

for (const marker of [
  "10,000 concurrent web users",
  "10,000 direct PostgreSQL connections are not an acceptable architecture",
  "PgBouncer",
  "Redis",
  "queue workers",
  "0005_supplier_directory_search_scaling",
  "0009_supplier_directory_pagination_sort",
  "0006_offer_catalog",
  "0007_supplier_access_flow",
  "0008_access_notification_ack",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "SupplierAccessRefreshBanner",
  "SupplierAccessNotificationCenter",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
  "offer catalog detail flow browser e2e",
  "API-backed offer catalog detail flow browser e2e",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}

for (const marker of [
  "check:production-scale-baseline",
  "10,000 concurrent-user read path",
  "supplier-directory trigram search indexes",
  "offer-catalog trigram search indexes",
  "self-hosted offer detail smoke",
  "supplier-access request and grant indexes",
  "access notification acknowledgement",
  "supplier-access change event",
  "refresh banner",
  "notification center",
  "supplier directory pagination",
  "offer catalog pagination",
  "offer catalog browser e2e",
  "supplier directory browser e2e",
  "supplier profile detail browser e2e",
  "API-backed offer catalog detail flow",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}

for (const marker of [
  "create extension if not exists pg_trgm",
  "gin_trgm_ops",
  "idx_yorso_suppliers_directory_public_search_text",
  "idx_yorso_suppliers_directory_private_search_text",
  "idx_yorso_suppliers_directory_product_focus_search",
  "idx_yorso_suppliers_directory_certifications_search",
  "idx_yorso_suppliers_directory_verification_level",
  "high-concurrency catalog traffic",
]) {
  requireText("packages/db/migrations/0005_supplier_directory_search_scaling.sql", supplierScaling, marker);
}

for (const marker of [
  "idx_yorso_suppliers_directory_published_updated",
  "idx_yorso_suppliers_directory_published_country",
  "idx_yorso_suppliers_directory_published_verification_updated",
  "idx_yorso_suppliers_directory_published_response_updated",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0009_supplier_directory_pagination_sort.sql", supplierPaginationSort, marker);
}

for (const marker of [
  "idx_yorso_offers_catalog_public_search_text",
  "idx_yorso_offers_catalog_private_search_text",
  "idx_yorso_offers_catalog_certifications_search",
  "idx_yorso_offers_catalog_category",
  "idx_yorso_offers_catalog_origin_code",
  "idx_yorso_offers_catalog_supplier_country_code",
  "gin_trgm_ops",
  "high-concurrency catalog traffic",
]) {
  requireText("packages/db/migrations/0006_offer_catalog.sql", offerCatalog, marker);
}

for (const marker of [
  "idx_yorso_offers_catalog_published_updated",
  "idx_yorso_offers_catalog_published_category",
  "idx_yorso_offers_catalog_published_origin",
  "idx_yorso_offers_catalog_published_moq",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0010_offer_catalog_pagination_sort.sql", offerPaginationSort, marker);
}

for (const marker of [
  "idx_yorso_supplier_access_requests_buyer",
  "idx_yorso_supplier_access_requests_supplier_status",
  "idx_yorso_access_grants_buyer_supplier_scope",
  "idx_yorso_access_notifications_buyer_status_created",
]) {
  requireText("packages/db/migrations/0007_supplier_access_flow.sql", supplierAccess, marker);
}

for (const marker of [
  "notification_read",
  "PATCH /v1/access/notifications",
  "idx_yorso_access_notifications_buyer_status_created",
]) {
  requireText("packages/db/migrations/0008_access_notification_ack.sql", accessNotificationAck, marker);
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
if (!manifest.migrations?.some((migration) => migration.id === "0017_supplier_access_review_queue")) {
  failures.push("packages/db/migration-manifest.json: missing 0017_supplier_access_review_queue");
}
if (!manifest.migrations?.some((migration) => migration.id === "0019_admin_incident_acknowledgements")) {
  failures.push("packages/db/migration-manifest.json: missing 0019_admin_incident_acknowledgements");
}
if (!manifest.migrations?.some((migration) => migration.id === "0028_registration_verification_code_policy")) {
  failures.push("packages/db/migration-manifest.json: missing 0028_registration_verification_code_policy");
}
if (!manifest.migrations?.some((migration) => migration.id === "0029_auth_password_recovery")) {
  failures.push("packages/db/migration-manifest.json: missing 0029_auth_password_recovery");
}

if (pkg.scripts["check:production-scale-baseline"] !== "node scripts/check-production-scale-baseline.mjs") {
  failures.push("package.json: check:production-scale-baseline script missing or incorrect");
}

if (!pkg.scripts["ci:core"]?.includes("npm run check:production-scale-baseline")) {
  failures.push("package.json: ci:core must run check:production-scale-baseline");
}

if (pkg.scripts["check:engineering-lessons"] !== "node scripts/check-engineering-lessons.mjs") {
  failures.push("package.json: check:engineering-lessons script missing or incorrect");
}
if (pkg.scripts["test:engineering-lessons"] !== "vitest run src/test/engineering-lessons-guard.test.ts") {
  failures.push("package.json: test:engineering-lessons script missing or incorrect");
}
if (!pkg.scripts["ci:core"]?.includes("npm run check:engineering-lessons")) {
  failures.push("package.json: ci:core must run check:engineering-lessons");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:engineering-lessons")) {
  failures.push("package.json: ci:core must run test:engineering-lessons");
}
for (const marker of [
  "Batch #98",
  "check:engineering-lessons",
  "test:engineering-lessons",
  "API-backed e2e release policy",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #101",
  "admin incident response",
  "/v1/admin/incidents",
  "smoke:self-hosted-admin-incidents",
  "smoke:e2e:admin-incidents",
  "10,000 concurrent users baseline",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #102",
  "admin incident workflow",
  "/v1/admin/incidents/:incidentId/workflow",
  "/v1/admin/incidents/workflow/bulk",
  "/v1/admin/incidents/export",
  "yorso_admin_incident_events",
  "admin_incidents_assign=ok",
  "admin_incidents_escalate=ok",
  "admin_incidents_comment=ok",
  "admin_incidents_bulk_workflow=ok",
  "admin_incidents_workload_summary=ok",
  "admin_incidents_export_json=ok",
  "admin_incidents_export_csv=ok",
  "admin_incidents_workflow_validation_guard=ok",
  "admin_incidents_bulk_workflow_validation_guard=ok",
  "10,000 concurrent",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #103",
  "admin incident detail",
  "/v1/admin/incidents/:incidentId/handoff",
  "/v1/admin/incidents/:incidentId/remediation",
  "/v1/admin/incidents/:incidentId/postmortem",
  "/admin/incidents/:incidentId",
  "operator readiness",
  "admin_incidents_handoff_json=ok",
  "admin_incidents_handoff_markdown=ok",
  "admin_incidents_remediation_plan=ok",
  "admin_incidents_postmortem_json=ok",
  "admin_incidents_postmortem_markdown=ok",
  "admin_incidents_note_hygiene_guard=ok",
  "admin-incident-detail-readiness",
  "admin-incident-readiness-owner",
  "smoke:e2e:admin-incident-detail",
  "10,000 concurrent",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #104",
  "admin incident execution",
  "/v1/admin/incidents/:incidentId/execution",
  "yorso_admin_incident_execution_items",
  "admin-incident-detail-execution",
  "admin-incident-detail-execution-load",
  "admin-incident-detail-execution-plan",
  "admin_incidents_execution_plan=ok",
  "admin_incidents_execution_export_json=ok",
  "admin_incidents_execution_export_csv=ok",
  "admin_incidents_execution_start=ok",
  "admin_incidents_execution_done=ok",
  "admin_incidents_execution_blocked=ok",
  "admin_incidents_execution_note_hygiene_guard=ok",
  "admin_incidents_execution_missing_item_guard=ok",
  "10,000 concurrent",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #105",
  "admin incident execution queue",
  "/admin/incident-execution",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-queue/export",
  "/v1/admin/incidents/execution-queue/bulk",
  "admin-incident-execution-queue-page",
  "admin-incident-execution-filters",
  "admin-incident-execution-summary",
  "admin-incident-execution-bulk",
  "smoke:e2e:admin-incident-execution-queue",
  "admin_incidents_execution_queue=ok",
  "admin_incidents_execution_queue_filters=ok",
  "admin_incidents_execution_queue_export_json=ok",
  "admin_incidents_execution_queue_export_csv=ok",
  "admin_incidents_execution_queue_bulk=ok",
  "admin_incidents_execution_queue_note_hygiene_guard=ok",
  "10,000 concurrent",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #106",
  "admin incident workload",
  "/admin/incident-workload",
  "/v1/admin/incidents/execution-workload",
  "/v1/admin/incidents/execution-workload/export",
  "/v1/admin/incidents/:incidentId/correlation",
  "admin-incident-workload-page",
  "admin-incident-workload-correlation",
  "smoke:e2e:admin-incident-workload",
  "admin_incidents_workload=ok",
  "admin_incidents_workload_export_json=ok",
  "admin_incidents_workload_export_csv=ok",
  "admin_incidents_correlation=ok",
  "0022_admin_incident_workload_correlation",
  "10,000 concurrent",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #107",
  "admin incident trend analytics",
  "/admin/incident-trends",
  "/v1/admin/incidents/trends",
  "/v1/admin/incidents/trends/export",
  "/v1/admin/incidents/trends/anomalies",
  "/v1/admin/incidents/trends/briefing",
  "admin-incident-trends-page",
  "admin-incident-trends-buckets",
  "smoke:e2e:admin-incident-trends",
  "admin_incidents_trends=ok",
  "admin_incidents_trends_export_json=ok",
  "admin_incidents_trends_export_csv=ok",
  "admin_incidents_trends_anomalies=ok",
  "admin_incidents_trends_briefing=ok",
  "0023_admin_incident_trend_analytics",
  "10,000 concurrent",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #108",
  "admin incident trend actions",
  "trend action loop",
  "/v1/admin/incidents/trends/actions",
  "/v1/admin/incidents/trends/actions/:actionId/decision",
  "admin-incident-trends-actions",
  "admin_incidents_trend_actions=ok",
  "admin_incidents_trend_action_accept=ok",
  "admin_incidents_trend_action_dismiss=ok",
  "admin_incidents_trend_action_validation_guard=ok",
  "0024_admin_incident_trend_actions",
  "10,000 concurrent users",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}
for (const marker of [
  "Batch #101 Admin Incident Response",
  "/v1/admin/incidents",
  "yorso_admin_incident_acknowledgements",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #102 Admin Incident Workflow",
  "/v1/admin/incidents/:incidentId/workflow",
  "/v1/admin/incidents/workflow/bulk",
  "/v1/admin/incidents/export",
  "yorso_admin_incident_events",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #103 Admin Incident Detail Handoff",
  "/v1/admin/incidents/:incidentId/handoff",
  "/v1/admin/incidents/:incidentId/remediation",
  "/v1/admin/incidents/:incidentId/postmortem",
  "/admin/incidents/:incidentId",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #104 Admin Incident Execution Tracker",
  "/v1/admin/incidents/:incidentId/execution",
  "yorso_admin_incident_execution_items",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #105 Admin Incident Execution Queue",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-queue/export",
  "/v1/admin/incidents/execution-queue/bulk",
  "/admin/incident-execution",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #106 Admin Incident Workload And Correlation",
  "/v1/admin/incidents/execution-workload",
  "/v1/admin/incidents/execution-workload/export",
  "/v1/admin/incidents/:incidentId/correlation",
  "/admin/incident-workload",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #107 Admin Incident Trend Analytics",
  "/v1/admin/incidents/trends",
  "/v1/admin/incidents/trends/export",
  "/v1/admin/incidents/trends/anomalies",
  "/v1/admin/incidents/trends/briefing",
  "/admin/incident-trends",
  "0023_admin_incident_trend_analytics",
  "no Supabase",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}
for (const marker of [
  "Batch #101 Admin Incident Response Validation",
  "npm run test:admin-incidents-frontend",
  "npm run smoke:self-hosted-admin-incidents",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}
for (const marker of [
  "Batch #102 Admin Incident Workflow Validation",
  "/v1/admin/incidents/:incidentId/workflow",
  "/v1/admin/incidents/workflow/bulk",
  "/v1/admin/incidents/export",
  "0020_admin_incident_workflow.sql",
  "npm run test:db-migrations",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}
for (const marker of [
  "Batch #103 Admin Incident Detail Handoff Validation",
  "npm run test:admin-incidents-frontend",
  "npm run smoke:self-hosted-admin-incidents",
  "npm run smoke:e2e:admin-incident-detail",
  "admin_incidents_postmortem_json=ok",
  "admin_incidents_note_hygiene_guard=ok",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}
for (const marker of [
  "Batch #104 Admin Incident Execution Tracker Validation",
  "/v1/admin/incidents/:incidentId/execution",
  "0021_admin_incident_execution.sql",
  "admin_incidents_execution_plan=ok",
  "admin_incidents_execution_export_json=ok",
  "admin_incidents_execution_export_csv=ok",
  "admin_incidents_execution_done=ok",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}
for (const marker of [
  "Batch #105 Admin Incident Execution Queue Validation",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-queue/export?format=json|csv",
  "/v1/admin/incidents/execution-queue/bulk",
  "npm run smoke:e2e:admin-incident-execution-queue",
  "admin_incidents_execution_queue=ok",
  "admin_incidents_execution_queue_bulk=ok",
  "admin_incidents_execution_queue_note_hygiene_guard=ok",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}
for (const marker of [
  "Batch #98",
  "API-backed e2e specs",
  "shared Vite `dist/` directory",
  "Memory repository smoke tests",
]) {
  requireText("docs/backend/engineering-quality-gates.md", engineeringQualityGates, marker);
}
for (const marker of [
  "Batch #98",
  "VITE_YORSO_API_URL",
  "shared `dist/`",
  "memory repository",
  "stable contract fields",
]) {
  requireText("docs/project-memory/ENGINEERING_LESSONS.md", engineeringLessons, marker);
}
for (const marker of [
  "analyzeE2EScriptPolicy",
  "API-backed spec",
  "smoke:e2e:run",
  "admin grants supplier id",
]) {
  requireText("scripts/check-engineering-lessons.mjs", engineeringLessonsCheck, marker);
}
for (const marker of [
  "API_BACKED_E2E_ENV",
  "GENERIC_BROWSER_SMOKE_SCRIPT",
  "hasParallelBuildRisk",
]) {
  requireText("scripts/lib/e2e-script-policy.mjs", e2eScriptPolicy, marker);
}
for (const marker of [
  "keeps API-backed e2e specs out of the generic browser smoke",
  "fails a synthetic package when an API-backed spec is also in smoke:e2e:run",
  "admin grants supplier id",
]) {
  requireText("src/test/engineering-lessons-guard.test.ts", engineeringLessonsTest, marker);
}

if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-offer-detail:run")) {
  failures.push("package.json: ci:core must run the self-hosted offer detail smoke");
}

if (pkg.scripts["smoke:self-hosted-auth-api"] !== "npm run api:build && npm run smoke:self-hosted-auth-api:run") {
  failures.push("package.json: smoke:self-hosted-auth-api must build and run the self-hosted auth API smoke");
}
if (pkg.scripts["smoke:self-hosted-auth-api:run"] !== "node scripts/smoke-self-hosted-auth-api.mjs") {
  failures.push("package.json: smoke:self-hosted-auth-api:run must execute scripts/smoke-self-hosted-auth-api.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-auth-api:run")) {
  failures.push("package.json: ci:core must run the self-hosted auth API smoke");
}
if (pkg.scripts["smoke:self-hosted-health-readiness"] !== "npm run api:build && npm run smoke:self-hosted-health-readiness:run") {
  failures.push("package.json: smoke:self-hosted-health-readiness must build and run the readiness smoke");
}
if (pkg.scripts["smoke:self-hosted-health-readiness:run"] !== "node scripts/smoke-self-hosted-health-readiness.mjs") {
  failures.push("package.json: smoke:self-hosted-health-readiness:run must execute scripts/smoke-self-hosted-health-readiness.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-health-readiness:run")) {
  failures.push("package.json: ci:core must run the self-hosted health readiness smoke");
}
if (pkg.scripts["smoke:self-hosted-graceful-shutdown"] !== "npm run api:build && npm run smoke:self-hosted-graceful-shutdown:run") {
  failures.push("package.json: smoke:self-hosted-graceful-shutdown must build and run the graceful shutdown smoke");
}
if (pkg.scripts["smoke:self-hosted-graceful-shutdown:run"] !== "node scripts/smoke-self-hosted-graceful-shutdown.mjs") {
  failures.push("package.json: smoke:self-hosted-graceful-shutdown:run must execute scripts/smoke-self-hosted-graceful-shutdown.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-graceful-shutdown:run")) {
  failures.push("package.json: ci:core must run the graceful shutdown smoke");
}
if (pkg.scripts["smoke:self-hosted-request-guardrails"] !== "npm run api:build && npm run smoke:self-hosted-request-guardrails:run") {
  failures.push("package.json: smoke:self-hosted-request-guardrails must build and run the request guardrails smoke");
}
if (pkg.scripts["smoke:self-hosted-request-guardrails:run"] !== "node scripts/smoke-self-hosted-request-guardrails.mjs") {
  failures.push("package.json: smoke:self-hosted-request-guardrails:run must execute scripts/smoke-self-hosted-request-guardrails.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-request-guardrails:run")) {
  failures.push("package.json: ci:core must run the request guardrails smoke");
}
if (pkg.scripts["smoke:self-hosted-request-observability"] !== "npm run api:build && npm run smoke:self-hosted-request-observability:run") {
  failures.push("package.json: smoke:self-hosted-request-observability must build and run the request observability smoke");
}
if (pkg.scripts["smoke:self-hosted-request-observability:run"] !== "node scripts/smoke-self-hosted-request-observability.mjs") {
  failures.push("package.json: smoke:self-hosted-request-observability:run must execute scripts/smoke-self-hosted-request-observability.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-request-observability:run")) {
  failures.push("package.json: ci:core must run the request observability smoke");
}
if (pkg.scripts["smoke:self-hosted-error-observability"] !== "npm run api:build && npm run smoke:self-hosted-error-observability:run") {
  failures.push("package.json: smoke:self-hosted-error-observability must build and run the error observability smoke");
}
if (pkg.scripts["smoke:self-hosted-error-observability:run"] !== "node scripts/smoke-self-hosted-error-observability.mjs") {
  failures.push("package.json: smoke:self-hosted-error-observability:run must execute scripts/smoke-self-hosted-error-observability.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-error-observability:run")) {
  failures.push("package.json: ci:core must run the error observability smoke");
}
if (pkg.scripts["smoke:self-hosted-metrics"] !== "npm run api:build && npm run smoke:self-hosted-metrics:run") {
  failures.push("package.json: smoke:self-hosted-metrics must build and run the metrics smoke");
}
if (pkg.scripts["smoke:self-hosted-metrics:run"] !== "node scripts/smoke-self-hosted-metrics.mjs") {
  failures.push("package.json: smoke:self-hosted-metrics:run must execute scripts/smoke-self-hosted-metrics.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-metrics:run")) {
  failures.push("package.json: ci:core must run the self-hosted metrics smoke");
}
if (pkg.scripts["smoke:self-hosted-audit-trail"] !== "npm run api:build && npm run smoke:self-hosted-audit-trail:run") {
  failures.push("package.json: smoke:self-hosted-audit-trail must build and run the audit trail smoke");
}
if (pkg.scripts["smoke:self-hosted-audit-trail:run"] !== "node scripts/smoke-self-hosted-audit-trail.mjs") {
  failures.push("package.json: smoke:self-hosted-audit-trail:run must execute scripts/smoke-self-hosted-audit-trail.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-audit-trail:run")) {
  failures.push("package.json: ci:core must run the self-hosted audit trail smoke");
}
if (pkg.scripts["smoke:self-hosted-audit-persistence"] !== "npm run api:build && npm run smoke:self-hosted-audit-persistence:run") {
  failures.push("package.json: smoke:self-hosted-audit-persistence must build and run the audit persistence smoke");
}
if (pkg.scripts["smoke:self-hosted-audit-persistence:run"] !== "node scripts/smoke-self-hosted-audit-persistence.mjs") {
  failures.push("package.json: smoke:self-hosted-audit-persistence:run must execute scripts/smoke-self-hosted-audit-persistence.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-audit-persistence:run")) {
  failures.push("package.json: ci:core must run the self-hosted audit persistence smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-audit"] !== "npm run api:build && npm run smoke:self-hosted-admin-audit:run") {
  failures.push("package.json: smoke:self-hosted-admin-audit must build and run the admin audit smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-audit:run"] !== "node scripts/smoke-self-hosted-admin-audit.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-audit:run must execute scripts/smoke-self-hosted-admin-audit.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-audit:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin audit smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-runtime-status"] !== "npm run api:build && npm run smoke:self-hosted-admin-runtime-status:run") {
  failures.push("package.json: smoke:self-hosted-admin-runtime-status must build and run the admin runtime status smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-runtime-status:run"] !== "node scripts/smoke-self-hosted-admin-runtime-status.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-runtime-status:run must execute scripts/smoke-self-hosted-admin-runtime-status.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-runtime-status:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin runtime status smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-access-review"] !== "npm run api:build && npm run smoke:self-hosted-admin-access-review:run") {
  failures.push("package.json: smoke:self-hosted-admin-access-review must build and run the admin access review smoke");
}
if (pkg.scripts["smoke:self-hosted-admin-access-review:run"] !== "node scripts/smoke-self-hosted-admin-access-review.mjs") {
  failures.push("package.json: smoke:self-hosted-admin-access-review:run must execute scripts/smoke-self-hosted-admin-access-review.mjs");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-access-review:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin access review smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-access-grants:run")) {
  failures.push("package.json: ci:core must run the self-hosted admin access grants smoke");
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
if (pkg.scripts["smoke:e2e:admin-runtime-status"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-runtime-status:run") {
  failures.push("package.json: smoke:e2e:admin-runtime-status must build with the self-hosted admin runtime adapter enabled");
}
if (!pkg.scripts["smoke:e2e:admin-runtime-status:run"]?.includes("e2e/admin-runtime-status.spec.ts")) {
  failures.push("package.json: smoke:e2e:admin-runtime-status:run must cover /admin/runtime browser behavior");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-runtime-status")) {
  failures.push("package.json: ci:full must include the admin runtime browser smoke");
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
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-auth-observability:run")) {
  failures.push("package.json: ci:core must run the self-hosted auth observability smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-session-cache-fail-closed:run")) {
  failures.push("package.json: ci:core must run the session cache fail-closed smoke");
}

for (const marker of [
  "authSignInSchema",
  "authSessionSchema",
  "authSessionResponseSchema",
  "authSignOutResponseSchema",
  "authPasswordResetRequestSchema",
  "authPasswordResetCompleteSchema",
  "authPasswordResetRequestResponseSchema",
  "authPasswordResetCompleteResponseSchema",
  "authSecurityEventTypeSchema",
  "authSecurityEventSchema",
]) {
  requireText("packages/contracts/src/auth.ts", authContract, marker);
}

for (const marker of [
  "create table if not exists yorso_auth_credentials",
  "create table if not exists yorso_auth_sessions",
  "idx_yorso_auth_sessions_user_active",
]) {
  requireText("packages/db/migrations/0011_auth_sessions.sql", authSessions, marker);
}

for (const marker of [
  "create table if not exists yorso_auth_security_events",
  "idx_yorso_auth_security_events_email_type_recent",
  "idx_yorso_auth_security_events_session_recent",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0012_auth_security_events.sql", authSecurityEvents, marker);
}

for (const marker of [
  "createAuthRepository",
  "PostgresAuthRepository",
  "MemoryAuthRepository",
]) {
  requireText("apps/api/src/modules/auth/factory.ts", authFactory, marker);
}

for (const marker of [
  "class PostgresAuthRepository",
  "from yorso_users u",
  "join yorso_auth_credentials",
  "insert into yorso_auth_sessions",
  "insert into yorso_auth_password_recovery_tokens",
  "insert into yorso_auth_password_recovery_outbox",
  "completePasswordRecovery",
  "insert into yorso_auth_security_events",
  "countRecentSecurityEvents",
  "revoked_at",
]) {
  requireText("apps/api/src/modules/auth/postgres-repository.ts", authPostgresRepository, marker);
}

for (const marker of [
  "interface AuthRepository",
  "recordSecurityEvent",
  "countRecentSecurityEvents",
  "createPasswordRecovery",
  "findPasswordRecoveryByTokenHash",
  "deleteSessionsForUser",
  "class MemoryAuthRepository",
  "buyer@example.com",
]) {
  requireText("apps/api/src/modules/auth/repository.ts", authRepository, marker);
}

for (const marker of [
  "/v1/auth/sign-in",
  "/v1/auth/password-reset/request",
  "/v1/auth/password-reset/complete",
  "/v1/auth/session",
  "/v1/auth/sign-out",
  "accountSessionIdHeaderName",
]) {
  requireText("apps/api/src/modules/auth/routes.ts", authRoutes, marker);
}

for (const marker of [
  "AuthService",
  "authSignInSchema.parse",
  "authPasswordResetRequestSchema.parse",
  "authPasswordResetCompleteSchema.parse",
  "completePasswordReset",
  "deleteSessionsForUser",
  "auth_invalid_credentials",
  "auth_rate_limited",
  "sign_in_rate_limited",
  "rateLimiter.checkSignIn",
  "retryAfterSeconds",
  "sha256:",
]) {
  requireText("apps/api/src/modules/auth/service.ts", authService, marker);
}

for (const marker of [
  "RedisAuthRateLimiter",
  "SecurityEventAuthRateLimiter",
  "createClient",
  "pExpire",
  "hashIdentity",
  "failMode",
]) {
  requireText("apps/api/src/modules/auth/rate-limit.ts", authRateLimit, marker);
}

for (const marker of [
  "RedisAuthSessionCache",
  "MemoryAuthSessionCache",
  "DisabledAuthSessionCache",
  "createAuthSessionCache",
  "auth_session_cache_redis_error",
  "cacheKey",
  "failMode",
]) {
  requireText("apps/api/src/modules/auth/session-cache.ts", authSessionCache, marker);
}

for (const marker of [
  "auth_sign_in=ok",
  "auth_session=ok",
  "auth_sign_out=ok",
  "auth_sign_out_blocks_account=ok",
  "auth_sign_out_blocks_access=ok",
  "auth_sign_out_blocks_offer_unlock=ok",
  "auth_sign_out_preserves_public_catalog=ok",
  "auth_rate_limit_guard=ok",
  "auth_rate_limit_retry_after=ok",
  "auth_session_cache_invalidation=ok",
  "retry-after",
  "auth_invalid_credentials_guard=ok",
  "auth_validation_guard=ok",
  "self_hosted_auth_api_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-auth-api.mjs", authApiSmoke, marker);
}

for (const marker of [
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
  "health_readiness_local=ok",
  "health_readiness_redis_unavailable=ok",
  "health_readiness_postgres_unavailable=ok",
  "self_hosted_health_readiness_smoke=ok",
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
  "server_draining",
]) {
  requireText("scripts/smoke-self-hosted-graceful-shutdown.mjs", gracefulShutdownSmoke, marker);
}

for (const marker of [
  "request_guardrails_large_body=ok",
  "request_guardrails_body_idle_timeout=ok",
  "request_guardrails_large_header=ok",
  "self_hosted_request_guardrails_smoke=ok",
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
]) {
  requireText("scripts/smoke-self-hosted-audit-trail.mjs", auditTrailSmoke, marker);
}

for (const marker of [
  "api_audit_event",
  "AuditSink",
  "ConsoleAuditSink",
  "PostgresAuditSink",
  "api_audit_dropped",
  "yorso_api_audit_events",
  "auditMaxInFlight",
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
  requireText("packages/db/migrations/0013_api_audit_events.sql", apiAuditEvents, marker);
}
for (const marker of [
  "create table if not exists yorso_user_roles",
  "idx_yorso_user_roles_role_user",
  "idx_yorso_api_audit_events_status_time",
  "idx_yorso_api_audit_events_route_time",
]) {
  requireText("packages/db/migrations/0014_admin_audit_access.sql", adminAuditAccess, marker);
}
for (const marker of [
  "idx_yorso_api_audit_events_route_status_time",
  "idx_yorso_api_audit_events_outcome_status_time",
  "create or replace function yorso_purge_api_audit_events",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0015_admin_audit_retention_query_hardening.sql", adminAuditRetentionQueryHardening, marker);
}
for (const marker of [
  "idx_yorso_api_audit_events_retention_scan",
  "create or replace function yorso_purge_api_audit_events_batch",
  "p_limit must be between 1 and 5000",
  "10,000 concurrent users",
]) {
  requireText("packages/db/migrations/0016_admin_audit_retention_runtime.sql", adminAuditRetentionRuntime, marker);
}
for (const marker of [
  "audit_persistence_insert=ok",
  "audit_persistence_hash_only=ok",
  "audit_persistence_backpressure=ok",
  "self_hosted_audit_persistence_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-audit-persistence.mjs", auditPersistenceSmoke, marker);
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
]) {
  requireText("scripts/smoke-self-hosted-admin-access-grants.mjs", adminAccessGrantsSmoke, marker);
}
for (const marker of [
  "idx_yorso_supplier_access_requests_review_open",
  "idx_yorso_supplier_access_requests_review_all",
  "idx_yorso_supplier_access_requests_review_buyer",
  "10,000 concurrent-user production baseline",
]) {
  requireText("packages/db/migrations/0017_supplier_access_review_queue.sql", supplierAccessReviewQueue, marker);
}
for (const marker of [
  "idx_yorso_access_grants_admin_active",
  "idx_yorso_access_grants_admin_expired",
  "idx_yorso_access_grants_admin_buyer_active",
  "idx_yorso_access_grants_admin_supplier_active",
  "10,000 concurrent-user production baseline",
]) {
  requireText("packages/db/migrations/0018_admin_access_grants_console.sql", read("packages/db/migrations/0018_admin_access_grants_console.sql"), marker);
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
  "resolveAuthenticatedAccountSession",
]) {
  requireText("apps/api/src/modules/access/routes.ts", accessRoutes, marker);
}
for (const marker of [
  "createAdminAccessReviewApiClient",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "/v1/admin/access-requests",
]) {
  requireText("src/lib/admin-access-review-api.ts", adminAccessReviewApi, marker);
}
for (const marker of [
  "disabled without self-hosted API URL",
  "lists review requests with session headers",
  "posts approve decisions",
]) {
  requireText("src/lib/admin-access-review-api.test.ts", adminAccessReviewApiTest, marker);
}
for (const marker of [
  "useAdminAccessReview",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-access-review.ts", useAdminAccessReview, marker);
}
for (const marker of [
  "loads review queue and refreshes after decision",
  "maps admin role failures to forbidden state",
]) {
  requireText("src/lib/use-admin-access-review.test.tsx", useAdminAccessReviewTest, marker);
}
for (const marker of [
  "admin-access-review-page",
  "admin-access-review-queue",
  "admin-access-review-summary",
  "admin-access-review-pagination",
  "Self-hosted review path",
]) {
  requireText("src/pages/admin/AdminAccessRequests.tsx", adminAccessReviewPage, marker);
}
for (const marker of [
  "Self-hosted API is not connected",
  "loads review queue, sends admin decision",
  "Нужна роль администратора",
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
]) {
  requireText("e2e/admin-access-review.spec.ts", adminAccessReviewE2E, marker);
}
for (const marker of [
  "createAdminAccessGrantsApiClient",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "/v1/admin/access-grants",
]) {
  requireText("src/lib/admin-access-grants-api.ts", adminAccessGrantsApi, marker);
}
for (const marker of [
  "disabled without self-hosted API URL",
  "lists grants with session headers",
  "posts revoke through the admin grants endpoint",
]) {
  requireText("src/lib/admin-access-grants-api.test.ts", adminAccessGrantsApiTest, marker);
}
for (const marker of [
  "useAdminAccessGrants",
  "status: \"disabled\"",
  "status: \"session_required\"",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-access-grants.ts", useAdminAccessGrants, marker);
}
for (const marker of [
  "loads grants and refreshes after revoke",
  "maps admin role failures to forbidden state",
]) {
  requireText("src/lib/use-admin-access-grants.test.tsx", useAdminAccessGrantsTest, marker);
}
for (const marker of [
  "admin-access-grants-page",
  "admin-access-grants-table",
  "admin-access-grants-summary",
  "admin-access-grants-pagination",
  "Self-hosted access control",
]) {
  requireText("src/pages/admin/AdminAccessGrants.tsx", adminAccessGrantsPage, marker);
}
for (const marker of [
  "Self-hosted API is not connected",
  "loads grants, revokes access",
  "Нужна роль администратора",
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
]) {
  requireText("e2e/admin-access-grants.spec.ts", adminAccessGrantsE2E, marker);
}
for (const marker of [
  "adminOperationsOverviewSchema",
  "targetConcurrentUsers",
  "operatorLinks",
  "operatorActions",
  "adminOperationsAuditSummarySchema",
  "adminOperationsReadinessItemSchema",
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
]) {
  requireText("apps/api/src/modules/admin-operations/service.ts", adminOperationsService, marker);
}
for (const marker of [
  "/v1/admin/operations/overview",
  "resolveAuthenticatedAccountSession",
  "admin_role_required",
  "admin.operations.overview.read",
]) {
  requireText("apps/api/src/modules/admin-operations/routes.ts", adminOperationsRoutes, marker);
}
for (const marker of [
  "AdminOperatorNav",
  "/admin/access-requests",
  "/admin/access-grants",
  "/admin/runtime",
  "/admin/audit",
  "/admin/incidents",
  "admin-operator-nav-audit",
  "admin-operator-nav-incidents",
]) {
  requireText("src/components/admin/AdminOperatorNav.tsx", adminOperatorNav, marker);
}
for (const marker of [
  "createAdminOperationsApiClient",
  "/v1/admin/operations/overview",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
  "targetConcurrentUsers !== 10_000",
]) {
  requireText("src/lib/admin-operations-api.ts", adminOperationsApi, marker);
}
for (const marker of [
  "loads overview with self-hosted session headers",
  "maps admin role and invalid response failures",
]) {
  requireText("src/lib/admin-operations-api.test.ts", adminOperationsApiTest, marker);
}
for (const marker of [
  "useAdminOperationsOverview",
  "client.overview",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-operations-overview.ts", useAdminOperationsOverview, marker);
}
for (const marker of [
  "loads overview and supports explicit refresh",
  "maps 403 responses to forbidden state",
]) {
  requireText("src/lib/use-admin-operations-overview.test.tsx", useAdminOperationsOverviewTest, marker);
}
for (const marker of [
  "admin-operations-page",
  "admin-operations-overview",
  "admin-operations-audit-card",
  "admin-operations-incidents-card",
  "admin-operations-readiness",
  "admin-operations-actions",
  "admin-operations-incident-feed",
  "admin-operations-audit-feed",
  "admin-operations-capacity-plan",
  "AdminOperatorNav",
  "10,000 concurrent users",
]) {
  requireText("src/pages/admin/AdminOperations.tsx", adminOperationsPage, marker);
}
for (const marker of [
  "renders sanitized operator overview for admins",
  "Нужна роль администратора",
  "postgres://",
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
]) {
  requireText("scripts/smoke-self-hosted-admin-operations.mjs", adminOperationsSmoke, marker);
}
for (const marker of [
  "adminIncidentSchema",
  "adminIncidentListResponseSchema",
  "adminIncidentAcknowledgeResponseSchema",
  "adminIncidentWorkflowRequestSchema",
  "adminIncidentExecutionResponseSchema",
  "adminIncidentExecutionUpdateRequestSchema",
  "adminIncidentExecutionUpdateResponseSchema",
  "adminIncidentExecutionQueueResponseSchema",
  "adminIncidentExecutionQueueBulkUpdateRequestSchema",
  "adminIncidentWorkloadResponseSchema",
  "adminIncidentCorrelationResponseSchema",
  "adminIncidentTimelineEventSchema",
  "adminIncidentAssignmentFilterSchema",
  "adminIncidentSlaStatusSchema",
]) {
  requireText("packages/contracts/src/admin-incidents.ts", adminIncidentsContract, marker);
}
for (const marker of [
  "AdminIncidentService",
  "runtimeService.getDiagnostics",
  "auditService.listAuditEvents",
  "updateIncidentWorkflow",
  "listEvents",
  "upsertWorkflowState",
  "query.assigned",
  "query.escalationLevel",
  "query.slaStatus",
  "getIncidentExecution",
  "updateIncidentExecutionItem",
  "listIncidentExecutionQueue",
  "bulkUpdateIncidentExecutionQueue",
  "getIncidentExecutionWorkload",
  "getIncidentExecutionWorkloadForecast",
  "getIncidentCorrelation",
  "buildIncidentExecution",
  "10,000 concurrent users",
]) {
  requireText("apps/api/src/modules/admin-incidents/service.ts", adminIncidentsService, marker);
}
for (const marker of [
  "/v1/admin/incidents",
  "/workflow",
  "/execution",
  "/execution-queue",
  "/execution-workload",
  "/execution-workload/forecast",
  "/correlation",
  "resolveAuthenticatedAccountSession",
  "admin_role_required",
  "admin.incidents.acknowledge",
  "admin.incidents.workflow.update",
  "admin.incidents.execution.update",
  "admin.incidents.execution_queue.bulk_update",
]) {
  requireText("apps/api/src/modules/admin-incidents/routes.ts", adminIncidentsRoutes, marker);
}
for (const marker of [
  "createAdminIncidentsApiClient",
  "/v1/admin/incidents",
  "workflow",
  "execution",
  "executionQueue",
  "bulkUpdateExecutionQueue",
  "executionWorkload",
  "executionWorkloadForecast",
  "correlation",
  "trends",
  "trendsExportJson",
  "trendAnomalies",
  "trendBriefing",
  "updateExecutionItem",
  "ACCOUNT_USER_ID_HEADER",
  "ACCOUNT_SESSION_ID_HEADER",
]) {
  requireText("src/lib/admin-incidents-api.ts", adminIncidentsApi, marker);
}
for (const marker of [
  "loads incidents with filters and self-hosted session headers",
  "acknowledges incidents without leaking session data",
  "assigned=assigned",
  "escalationLevel=engineering",
  "slaStatus=breached",
  "/workflow",
  "/execution",
  "/execution-queue",
]) {
  requireText("src/lib/admin-incidents-api.test.ts", adminIncidentsApiTest, marker);
}
for (const marker of [
  "useAdminIncidents",
  "client.list",
  "client.acknowledge",
  "client.workflow",
  "assigned",
  "escalationLevel",
  "slaStatus",
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
  "useAdminIncidentExecutionQueue",
  "client.executionQueue",
  "bulkUpdateExecutionQueue",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-incident-execution-queue.ts", useAdminIncidentExecutionQueue, marker);
}
for (const marker of [
  "loads queue filters and replaces items after bulk update",
  "returns disabled without a configured self-hosted API",
]) {
  requireText("src/lib/use-admin-incident-execution-queue.test.tsx", useAdminIncidentExecutionQueueTest, marker);
}
for (const marker of [
  "useAdminIncidentWorkload",
  "client.executionWorkload",
  "client.executionWorkloadExportJson",
  "client.executionWorkloadForecast",
  "client.correlation",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-incident-workload.ts", useAdminIncidentWorkload, marker);
}
for (const marker of [
  "loads workload filters, exports and correlation drill-down",
  "returns disabled without a configured self-hosted API",
]) {
  requireText("src/lib/use-admin-incident-workload.test.tsx", useAdminIncidentWorkloadTest, marker);
}
for (const marker of [
  "useAdminIncidentTrends",
  "client.trends",
  "client.trendsExportJson",
  "client.trendAnomalies",
  "client.trendBriefing",
  "client.trendActions",
  "client.decideTrendAction",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-incident-trends.ts", useAdminIncidentTrends, marker);
}
for (const marker of [
  "loads trend filters, exports",
  "trend action proposals",
  "returns disabled without a configured self-hosted API",
]) {
  requireText("src/lib/use-admin-incident-trends.test.tsx", useAdminIncidentTrendsTest, marker);
}
for (const marker of [
  "admin-incidents-page",
  "admin-incidents-summary",
  "admin-incidents-workload-summary",
  "admin-incidents-escalation-load",
  "admin-incidents-source-mix",
  "admin-incidents-list",
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
  "renders incidents and acknowledges from the console",
  "admin-incident-assign",
  "admin-incident-escalate",
  "Нужна роль администратора",
]) {
  requireText("src/pages/admin/AdminIncidents.test.tsx", adminIncidentsPageTest, marker);
}
for (const marker of [
  "admin-incident-execution-queue-page",
  "admin-incident-execution-filters",
  "admin-incident-execution-summary",
  "admin-incident-execution-bulk",
  "admin-incident-execution-export-json",
  "admin-incident-execution-export-csv",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminIncidentExecutionQueue.tsx", adminIncidentExecutionQueuePage, marker);
}
for (const marker of [
  "renders execution queue, exports and bulk updates selected items",
  "Self-hosted session required",
]) {
  requireText("src/pages/admin/AdminIncidentExecutionQueue.test.tsx", adminIncidentExecutionQueuePageTest, marker);
}
for (const marker of [
  "admin-incident-workload-page",
  "admin-incident-workload-summary",
  "admin-incident-workload-hot-incidents",
  "admin-incident-workload-owner-load",
  "admin-incident-workload-correlation",
  "admin-incident-workload-export-json",
  "admin-incident-workload-export-csv",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminIncidentWorkload.tsx", adminIncidentWorkloadPage, marker);
}
for (const marker of [
  "renders workload, exports and correlation drill-down",
  "admin-incident-workload-export-status",
]) {
  requireText("src/pages/admin/AdminIncidentWorkload.test.tsx", adminIncidentWorkloadPageTest, marker);
}
for (const marker of [
  "admin-incident-trends-page",
  "admin-incident-trends-summary",
  "admin-incident-trends-buckets",
  "admin-incident-trends-route-risks",
  "admin-incident-trends-sla",
  "admin-incident-trends-anomalies",
  "admin-incident-trends-briefing",
  "admin-incident-trends-actions",
  "admin-incident-trends-actions-load",
  "admin-incident-trends-export-json",
  "admin-incident-trends-export-csv",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminIncidentTrends.tsx", adminIncidentTrendsPage, marker);
}
for (const marker of [
  "renders trends, exports",
  "trend actions",
  "admin-incident-trends-actions-load",
  "admin-incident-trends-export-status",
]) {
  requireText("src/pages/admin/AdminIncidentTrends.test.tsx", adminIncidentTrendsPageTest, marker);
}
for (const marker of [
  "useAdminIncidentTrendActionQueue",
  "client.trendActionQueue",
  "client.trendActionQueueExportJson",
  "client.trendActionQueueExportCsv",
  "client.bulkDecideTrendActions",
  "status: \"disabled\"",
]) {
  requireText("src/lib/use-admin-incident-trend-action-queue.ts", useAdminIncidentTrendActionQueue, marker);
}
for (const marker of [
  "loads queue filters, exports and bulk decisions",
  "/trend-action-queue/bulk",
  "admin@yorso.test",
]) {
  requireText("src/lib/use-admin-incident-trend-action-queue.test.tsx", useAdminIncidentTrendActionQueueTest, marker);
}
for (const marker of [
  "admin-incident-trend-actions-page",
  "admin-incident-trend-actions-summary",
  "admin-incident-trend-actions-filters",
  "admin-incident-trend-actions-list",
  "admin-incident-trend-actions-bulk",
  "admin-incident-trend-actions-export-json",
  "admin-incident-trend-actions-export-csv",
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminIncidentTrendActions.tsx", adminIncidentTrendActionsPage, marker);
}
for (const marker of [
  "renders queue, exports and bulk decisions",
  "admin-incident-trend-actions-export-status",
  "admin-incident-trend-actions-bulk-dismiss",
]) {
  requireText("src/pages/admin/AdminIncidentTrendActions.test.tsx", adminIncidentTrendActionsPageTest, marker);
}
for (const marker of [
  "Batch #101 browser guard",
  "Batch #102 browser guard",
  "/admin/incidents",
  "/v1/admin/incidents",
  "/v1/admin/incidents/export",
  "/workflow",
  "/workflow/bulk",
  "assigned=assigned",
  "escalationLevel=engineering",
  "admin-incidents-bulk-workflow",
  "admin-incidents-workload-summary",
  "admin-incidents-escalation-load",
  "admin-incidents-source-mix",
  "admin-incidents-export-json",
  "slaStatus=breached",
  "admin-incidents-page",
]) {
  requireText("e2e/admin-incidents.spec.ts", adminIncidentsE2E, marker);
}
for (const marker of [
  "Batch #105 browser guard",
  "/admin/incident-execution",
  "/v1/admin/incidents/execution-queue",
  "/v1/admin/incidents/execution-queue/export",
  "/v1/admin/incidents/execution-queue/bulk",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-incident-execution-queue-page",
  "admin-incident-execution-bulk",
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
  "admin-incident-workload-forecast-summary",
  "admin-incident-workload-correlation-signals",
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
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-incident-trends-page",
  "admin-incident-trends-briefing",
  "admin-incident-trends-actions",
  "admin-incident-trend-action-accept-",
]) {
  requireText("e2e/admin-incident-trends.spec.ts", adminIncidentTrendsE2E, marker);
}
for (const marker of [
  "Batch #109 browser guard",
  "/admin/incident-trend-actions",
  "/v1/admin/incidents/trend-action-queue",
  "/trend-action-queue/export",
  "/trend-action-queue/bulk",
  "x-yorso-user-id",
  "x-yorso-session-id",
  "admin-incident-trend-actions-page",
  "admin-incident-trend-actions-bulk-dismiss",
]) {
  requireText("e2e/admin-incident-trend-actions.spec.ts", adminIncidentTrendActionsE2E, marker);
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
  "admin_incidents_workload_export_json=ok",
  "admin_incidents_workload_export_csv=ok",
  "admin_incidents_workload_forecast=ok",
  "admin_incidents_trends=ok",
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
  "admin_incidents_correlation=ok",
  "admin_incidents_workflow_filters=ok",
  "admin_incidents_workflow_validation_guard=ok",
  "admin_incidents_bulk_workflow_validation_guard=ok",
  "admin_incidents_no_secrets=ok",
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
  "idx_yorso_admin_incident_execution_status_updated",
  "idx_yorso_admin_incident_execution_owner_status_due",
  "idx_yorso_admin_incident_events_incident_recent",
  "10,000 concurrent-user",
]) {
  requireText("packages/db/migrations/0022_admin_incident_workload_correlation.sql", adminIncidentWorkloadCorrelationMigration, marker);
}
for (const marker of [
  "idx_yorso_admin_incident_events_occurred_type",
  "idx_yorso_admin_incident_events_incident_type_occurred",
  "idx_yorso_admin_incident_ack_status_updated",
  "idx_yorso_admin_incident_execution_status_updated_source",
  "idx_yorso_admin_incident_execution_priority_updated",
  "10,000 concurrent-user",
  "Batch #107",
]) {
  requireText("packages/db/migrations/0023_admin_incident_trend_analytics.sql", adminIncidentTrendAnalyticsMigration, marker);
}
for (const marker of [
  "create table if not exists yorso_admin_incident_trend_actions",
  "idx_yorso_admin_trend_actions_status_updated",
  "idx_yorso_admin_trend_actions_kind_priority",
  "idx_yorso_admin_trend_actions_related_gin",
  "10,000 concurrent-user",
  "Batch #108",
]) {
  requireText("packages/db/migrations/0024_admin_incident_trend_actions.sql", adminIncidentTrendActionsMigration, marker);
}
for (const marker of [
  "idx_yorso_admin_trend_actions_owner_priority",
  "idx_yorso_admin_trend_actions_status_kind_priority",
  "idx_yorso_admin_trend_actions_decider_updated",
  "Batch #109",
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
  "idx_yorso_registration_drafts_email_code_expiry",
  "idx_yorso_registration_drafts_phone_code_expiry",
]) {
  requireText("packages/db/migrations/0028_registration_verification_code_policy.sql", registrationVerificationCodePolicyMigration, marker);
}
for (const marker of [
  "Backend Phase 2F",
  "create table if not exists yorso_auth_password_recovery_tokens",
  "create table if not exists yorso_auth_password_recovery_outbox",
  "token_lookup_hash text not null unique",
  "recovery_token_sealed text not null",
  "idx_yorso_auth_password_recovery_active_expiry",
  "idx_yorso_auth_password_recovery_outbox_ready",
]) {
  requireText("packages/db/migrations/0029_auth_password_recovery.sql", authPasswordRecoveryMigration, marker);
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
  "sends filters with self-hosted session headers",
  "maps admin role and invalid response failures",
]) {
  requireText("src/lib/admin-audit-api.test.ts", adminAuditFrontendApiTest, marker);
}
for (const marker of [
  "useAdminAuditEvents",
  "client.list",
  "status: \"forbidden\"",
]) {
  requireText("src/lib/use-admin-audit-events.ts", useAdminAuditEvents, marker);
}
for (const marker of [
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
  "AdminOperatorNav",
]) {
  requireText("src/pages/admin/AdminAuditEvents.tsx", adminAuditEventsPage, marker);
}
for (const marker of [
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
]) {
  requireText("e2e/admin-audit-events.spec.ts", adminAuditEventsE2E, marker);
}
if (pkg.scripts["smoke:self-hosted-admin-operations"] !== "npm run api:build && npm run smoke:self-hosted-admin-operations:run") {
  failures.push("package.json: smoke:self-hosted-admin-operations must build with the admin operations self-hosted API smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-operations:run")) {
  failures.push("package.json: ci:core must include the admin operations self-hosted smoke");
}
if (pkg.scripts["test:admin-operations-frontend"] !== "vitest run src/lib/admin-operations-api.test.ts src/lib/use-admin-operations-overview.test.tsx src/pages/admin/AdminOperations.test.tsx") {
  failures.push("package.json: test:admin-operations-frontend must cover adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-operations-frontend")) {
  failures.push("package.json: ci:core must include admin operations frontend tests");
}
if (pkg.scripts["smoke:self-hosted-admin-incidents"] !== "npm run api:build && npm run smoke:self-hosted-admin-incidents:run") {
  failures.push("package.json: smoke:self-hosted-admin-incidents must build with the admin incidents self-hosted API smoke");
}
if (!pkg.scripts["ci:core"]?.includes("npm run smoke:self-hosted-admin-incidents:run")) {
  failures.push("package.json: ci:core must include the admin incidents self-hosted smoke");
}
if (pkg.scripts["test:admin-incidents-frontend"] !== "NODE_OPTIONS=--max-old-space-size=8192 vitest run src/lib/admin-incidents-api.test.ts src/lib/admin-incidents-trends-api.test.ts src/lib/use-admin-incidents.test.tsx src/lib/use-admin-incident-detail.test.tsx src/lib/use-admin-incident-execution-queue.test.tsx src/lib/use-admin-incident-workload.test.tsx src/lib/use-admin-incident-trends.test.tsx src/lib/use-admin-incident-trend-action-queue.test.tsx src/pages/admin/AdminIncidents.test.tsx src/pages/admin/AdminIncidentDetail.test.tsx src/pages/admin/AdminIncidentExecutionQueue.test.tsx src/pages/admin/AdminIncidentWorkload.test.tsx src/pages/admin/AdminIncidentTrends.test.tsx src/pages/admin/AdminIncidentTrendActions.test.tsx") {
  failures.push("package.json: test:admin-incidents-frontend must cover admin incidents adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-incidents-frontend")) {
  failures.push("package.json: ci:core must include admin incidents frontend tests");
}
if (pkg.scripts["test:admin-audit-frontend"] !== "vitest run src/lib/admin-audit-api.test.ts src/lib/use-admin-audit-events.test.tsx src/pages/admin/AdminAuditEvents.test.tsx") {
  failures.push("package.json: test:admin-audit-frontend must cover admin audit adapter, hook and page");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:admin-audit-frontend")) {
  failures.push("package.json: ci:core must include admin audit frontend tests");
}
if (pkg.scripts["smoke:e2e:admin-operations"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-operations:run") {
  failures.push("package.json: smoke:e2e:admin-operations must build with the self-hosted admin operations adapter enabled");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-operations")) {
  failures.push("package.json: ci:full must include admin operations browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin operations browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-operations");
if (pkg.scripts["smoke:e2e:admin-incidents"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incidents:run") {
  failures.push("package.json: smoke:e2e:admin-incidents must build with the self-hosted admin incidents adapter enabled");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incidents")) {
  failures.push("package.json: ci:full must include admin incidents browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incidents browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incidents");
if (pkg.scripts["smoke:e2e:admin-incident-detail"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-detail:run") {
  failures.push("package.json: smoke:e2e:admin-incident-detail must build with the self-hosted admin incident detail adapter enabled");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-detail")) {
  failures.push("package.json: ci:full must include admin incident detail browser smoke");
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
  failures.push("package.json: ci:full must include admin incident execution queue browser smoke");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run admin incident execution queue browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:admin-incident-execution-queue");
if (pkg.scripts["smoke:e2e:admin-incident-trend-actions"] !== "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-incident-trend-actions:run") {
  failures.push("package.json: smoke:e2e:admin-incident-trend-actions must build with the self-hosted admin incident trend actions adapter enabled");
}
if (pkg.scripts["smoke:e2e:admin-incident-trend-actions:run"] !== "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-incident-trend-actions.spec.ts --project=chromium") {
  failures.push("package.json: smoke:e2e:admin-incident-trend-actions:run must execute e2e/admin-incident-trend-actions.spec.ts");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:admin-incident-trend-actions")) {
  failures.push("package.json: ci:full must include admin incident trend actions browser smoke");
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
  "supabaseProductionBackend !== false",
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
  "Supabase production backend",
  "Hosted BaaS production backend",
]) {
  requireText("src/pages/admin/AdminRuntimeStatus.tsx", adminRuntimePage, marker);
}
for (const marker of [
  "Self-hosted API is not connected",
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
  "AdminRuntimeService",
  "adminRuntimeDiagnosticsSchema",
  "buildDiagnosticChecks",
  "targetConcurrentUsers: 10_000",
  "supabaseProductionBackend: false",
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
  "observeAdminRuntime",
]) {
  requireText("apps/api/src/modules/admin-runtime/routes.ts", adminRuntimeRoutes, marker);
}
for (const marker of [
  "YORSO_API_URL",
  "YORSO_ADMIN_EMAIL",
  "YORSO_ADMIN_PASSWORD",
  "/v1/admin/audit-events/retention",
]) {
  requireText("scripts/admin-audit-retention.mjs", adminAuditRetentionCli, marker);
}
for (const marker of [
  "MemoryAdminAuditRepository",
  "encodeAuditCursor",
  "decodeAuditCursorValue",
  "statusClass",
]) {
  requireText("apps/api/src/modules/admin-audit/repository.ts", adminAuditRepository, marker);
}
for (const marker of [
  "PostgresAdminAuditRepository",
  "from yorso_api_audit_events",
  "order by occurred_at desc, audit_id desc",
  "status_code between",
]) {
  requireText("apps/api/src/modules/admin-audit/postgres-repository.ts", adminAuditPostgresRepository, marker);
}
for (const marker of [
  "/v1/admin/audit-events",
  "/v1/admin/audit-events/export",
  "/v1/admin/audit-events/retention",
  "admin_role_required",
  "application/x-ndjson",
  "text/csv",
  "admin.audit_events.read",
  "admin.audit_events.export",
  "admin.audit_events.retention",
  "formatAuditEventsCsv",
  "observeAdminAudit",
]) {
  requireText("apps/api/src/modules/admin-audit/routes.ts", adminAuditRoutes, marker);
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
  "api_request_event",
  "request.completed",
  "request.guardrail_triggered",
  "latencyBucket",
  "normalizeRoute",
  "request_header_too_large",
]) {
  requireText("apps/api/src/request-observability.ts", requestObservability, marker);
}

for (const marker of [
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
  "prometheus",
  "yorso_api_requests_total",
  "yorso_api_request_duration_seconds",
  "yorso_api_errors_total",
  "yorso_api_auth_events_total",
  "yorso_api_admin_audit_requests_total",
  "yorso_api_admin_audit_rows_total",
  "yorso_api_registration_delivery_worker_runs_total",
  "yorso_api_registration_delivery_worker_jobs_total",
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
  "adminAuditExportMaxWindowDays",
  "YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS",
  "adminAuditRetentionDays",
  "YORSO_ADMIN_AUDIT_RETENTION_DAYS",
  "requestObservabilityDriver",
  "YORSO_REQUEST_OBSERVABILITY_DRIVER",
  "registrationDeliveryWorkerEnabled",
  "YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED",
  "registrationDeliverySender",
  "YORSO_REGISTRATION_DELIVERY_SENDER",
  "registrationDeliverySpoolDir",
  "YORSO_REGISTRATION_DELIVERY_SPOOL_DIR",
  "registrationVerificationCodeSecret",
  "YORSO_REGISTRATION_VERIFICATION_CODE_SECRET",
]) {
  requireText("apps/api/src/config.ts", read("apps/api/src/config.ts"), marker);
}
requireText("apps/api/src/config.ts", read("apps/api/src/config.ts"), "Production self-hosted API must use YORSO_METRICS_DRIVER=prometheus.");
requireText("apps/api/src/config.ts", read("apps/api/src/config.ts"), "Production self-hosted API must use YORSO_AUDIT_DRIVER=postgres.");
requireText("apps/api/src/config.ts", read("apps/api/src/config.ts"), "Production self-hosted API must use YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=true.");
requireText("apps/api/src/config.ts", read("apps/api/src/config.ts"), "Production self-hosted API must set a non-default YORSO_REGISTRATION_VERIFICATION_CODE_SECRET.");

for (const marker of [
  "Backend Phase 2E",
  "Plan / Fact",
  "YORSO_REGISTRATION_VERIFICATION_CODE_SECRET",
  "verification_code_sealed",
  "10,000 Concurrent-User Review",
  "registration verification code policy",
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
  "createRequestTelemetrySink",
  "createErrorTelemetrySink",
  "createAuditSink",
  "auditSink",
  "createMetricsRegistry",
  "renderMetricsResponse",
  "metricsRegistry.observeRequest",
  "metricsRegistry.observeError",
  "metricsRegistry.observeAuth",
  "buildRequestTelemetryEvent",
  "buildErrorTelemetryEvent",
  "buildClientParseTelemetryEvent",
  "buildClientParseErrorTelemetryEvent",
  "api_internal_error",
  "maxHeaderSize: config.maxHeaderBytes",
  "server.requestTimeout = config.requestTimeoutMs",
  "server.headersTimeout = config.headersTimeoutMs",
  "server.keepAliveTimeout = config.keepAliveTimeoutMs",
  "server.on(\"clientError\"",
  "x-correlation-id",
  "x-error-id",
  "request_timeout",
]) {
  requireText("apps/api/src/server.ts", read("apps/api/src/server.ts"), marker);
}

for (const marker of [
  "JsonBodyReadOptions",
  "ApiErrorContext",
  "markApiError",
  "errorId",
  "correlationId",
  "request_body_timeout",
  "request_body_too_large",
  "withBodyIdleTimeout",
]) {
  requireText("apps/api/src/http.ts", read("apps/api/src/http.ts"), marker);
}

for (const marker of [
  "SelfHostedReadinessProbe",
  "targetConcurrentUsers: 10_000",
  "shutdownDrain",
  "server_draining",
  "checkPostgres",
  "checkRedis",
  "checkLocalStorage",
  "checkProductionRuntimeConfig",
]) {
  requireText("apps/api/src/routes/health.ts", healthRoutes, marker);
}

for (const marker of [
  "ApiLifecycle",
  "activeRequests",
  "waitForIdle",
  "shutdownApiServer",
  "closeAllConnections",
]) {
  requireText("apps/api/src/lifecycle.ts", apiLifecycle, marker);
}

for (const marker of [
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
  "auth_runtime_event",
  "ConsoleAuthTelemetrySink",
  "sanitizeAuthTelemetryEvent",
]) {
  requireText("apps/api/src/modules/auth/observability.ts", authObservability, marker);
}

for (const marker of [
  "supplier_directory_locked=ok",
  "supplier_directory_requires_grant=ok",
  "supplier_directory_private_search_requires_grant=ok",
  "supplier_directory_unlocked=ok",
  "supplier_directory_granted_private_search=ok",
  "supplier_directory_ungranted_private_search_guard=ok",
  "supplier_directory_sort_pagination=ok",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "offer_catalog_private_search_requires_grant=ok",
  "offer_catalog_list_requires_grant=ok",
  "offer_catalog_sort_pagination=ok",
  "offer_catalog_granted_private_search=ok",
  "offer_catalog_ungranted_private_search_guard=ok",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "supplier_access_notifications=ok",
  "supplier_access_notifications_ack=ok",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}

for (const marker of [
  "offer_detail_locked=ok",
  "offer_detail_requires_grant=ok",
  "offer_detail_unlocked=ok",
  "offer_detail_not_found=ok",
  "offer_detail_method_guard=ok",
  "self_hosted_offer_detail_smoke=ok",
]) {
  requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, marker);
}

for (const marker of [
  "limit",
  "offset",
  "sortBy",
  "sortDirection",
  "supplierCountryCode",
  "getApprovedSupplierAccessIds",
  "fallbackOfferForSupplierAccess",
]) {
  requireText("src/lib/offer-catalog-api.ts", offerApi, marker);
}

for (const marker of [
  "self-hosted-first catalog facade",
  "createOfferCatalogApiClient",
  "fetchLegacyCatalogOffers",
  "fetchLegacyCatalogOfferById",
]) {
  requireText("src/lib/catalog-api.ts", catalogApi, marker);
}
for (const marker of [
  "@/integrations/supabase/client",
  "SUPABASE_NOT_CONFIGURED_ERROR",
  "fetchLegacyCatalogOffers",
  "fetchLegacyCatalogOfferById",
]) {
  requireText("src/lib/legacy-catalog-supabase-adapter.ts", legacyCatalogSupabaseAdapter, marker);
}
for (const marker of [
  "uses self-hosted offer catalog before legacy Supabase fallback",
  "keeps direct Supabase imports out of catalog-api.ts",
]) {
  requireText("src/lib/catalog-api.boundary.test.ts", catalogApiBoundaryTest, marker);
}
if (catalogApi.includes("@/integrations/supabase/client")) {
  failures.push("src/lib/catalog-api.ts: must not import Supabase client directly");
}
if (!pkg.scripts["test:offer-catalog-frontend"]?.includes("src/lib/catalog-api.boundary.test.ts")) {
  failures.push("package.json: test:offer-catalog-frontend must cover src/lib/catalog-api.boundary.test.ts");
}

for (const marker of [
  "useOfferCatalogList",
  "limit",
  "offset",
  "sortBy",
  "sortDirection",
  "serverFiltered",
  "offerCatalogApiQueryFromFilters",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "getApprovedSupplierAccessIds",
  "fallbackOffersForSupplierAccess",
  "client.enabled && level !== \"anonymous_locked\"",
]) {
  requireText("src/lib/use-offer-catalog.ts", useOfferCatalog, marker);
}

for (const marker of [
  "pageSize",
  "offset: (page - 1) * pageSize",
  "offer-catalog-sort",
  "offer-catalog-page-size",
  "offer-catalog-pagination",
  "useSearchParams",
  "forceLevel={offerAccessLevel(offer)}",
]) {
  requireText("src/pages/Offers.tsx", offersPage, marker);
}
requireText("src/components/catalog/SelectedOfferPanel.tsx", selectedOfferPanel, "forceLevel?: AccessLevel");

for (const marker of [
  "Batch #55 browser-level guard",
  "offer-catalog-sort",
  "offer-catalog-direction",
  "offer-catalog-page-size",
  "offer-catalog-page-summary",
  "offer-catalog-pagination",
  "Nordic Seafood AS",
  "qualified_unlocked",
]) {
  requireText("e2e/offers-catalog-paging.spec.ts", offersCatalogPagingE2E, marker);
}

if (!pkg.scripts["smoke:e2e:offers-catalog:run"]?.includes("e2e/offers-catalog-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:offers-catalog:run must cover /offers catalog paging e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offers-catalog-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers catalog paging e2e");
}

for (const marker of [
  "useOfferDetail",
  "getOfferById",
  "createOfferCatalogApiClient",
  "findFallbackOfferByIdForSupplierAccess",
  "client.enabled && level !== \"anonymous_locked\"",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-offer-detail.ts", useOfferDetail, marker);
}

for (const marker of [
  "limit",
  "offset",
  "verificationLevel",
]) {
  requireText("src/lib/supplier-directory-api.ts", supplierApi, marker);
}

for (const marker of [
  "useSupplierDirectoryList",
  "useSupplierDirectoryDetail",
  "serverFiltered",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, marker);
}

for (const marker of [
  "export const SUPPLIER_ACCESS_CHANGE_EVENT",
  "window.dispatchEvent",
]) {
  requireText("src/lib/supplier-access-requests.ts", supplierAccessRequests, marker);
}

for (const marker of [
  "acknowledgeSupplierAccessNotifications",
  "/v1/access/notifications",
  "PATCH",
  "legacy-supplier-access-supabase-adapter",
]) {
  requireText("src/lib/supplier-access-api.ts", supplierAccessApi, marker);
}
for (const marker of [
  "@/integrations/supabase/client",
  "readLegacySupplierAccessRequest",
  "requestLegacySupplierAccess",
  "log_supplier_access_event",
  "supplier_access_requests",
]) {
  requireText("src/lib/legacy-supplier-access-supabase-adapter.ts", legacySupplierAccessSupabaseAdapter, marker);
}
for (const marker of [
  "keeps direct Supabase imports out of supplier-access-api.ts",
  "isolated legacy Supabase adapter",
]) {
  requireText("src/lib/supplier-access-api.boundary.test.ts", supplierAccessApiBoundaryTest, marker);
}
if (supplierAccessApi.includes("@/integrations/supabase/client")) {
  failures.push("src/lib/supplier-access-api.ts: must not import Supabase client directly");
}
if (!pkg.scripts["test:supplier-access-frontend"]?.includes("src/lib/supplier-access-api.boundary.test.ts")) {
  failures.push("package.json: test:supplier-access-frontend must cover src/lib/supplier-access-api.boundary.test.ts");
}

for (const marker of [
  "BACKEND_NOTIFICATION_POLL_MS = 60_000",
  "MOCK_ACCESS_TICK_MS = 2_000",
]) {
  requireText("src/lib/supplier-approval-notifications.ts", supplierApprovalNotifications, marker);
}

for (const marker of [
  "visibilitychange",
  "backendSyncInFlight",
  "acknowledgeSupplierAccessNotifications",
]) {
  requireText("src/components/suppliers/SupplierApprovalNotifier.tsx", supplierApprovalNotifier, marker);
}

for (const marker of [
  "useSupplierAccessNotifications",
  "readSupplierAccessNotifications",
  "acknowledgeSupplierAccessNotifications",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-supplier-access-notifications.ts", useSupplierAccessNotifications, marker);
}

for (const marker of [
  "SupplierAccessNotificationBell",
  "supplier_notifications_title",
  "markAllRead",
  "autoLoad: false",
  "header-supplier-access-notifications-bell",
]) {
  requireText("src/components/suppliers/SupplierAccessNotificationCenter.tsx", supplierAccessNotificationCenter, marker);
}
requireText("src/components/landing/Header.tsx", header, "SupplierAccessNotificationBell");

for (const marker of [
  "SUPPLIER_ACCESS_CHANGE_EVENT",
  "backend_notification",
  "mock_progression",
]) {
  requireText("src/components/suppliers/SupplierAccessRefreshBanner.tsx", supplierAccessRefreshBanner, marker);
}

for (const marker of [
  "setTimeout",
  "pageSize",
  "offset: (page - 1) * pageSize",
  "supplier-directory-search",
  "supplier-directory-page-size",
  "supplier-directory-pagination",
  "supplierAccessLevel",
]) {
  requireText("src/pages/Suppliers.tsx", suppliersPage, marker);
}
for (const marker of [
  "getApprovedSupplierAccessIds",
  "client.enabled && accessLevel !== \"anonymous_locked\"",
  "SUPPLIER_ACCESS_CHANGE_EVENT",
]) {
  requireText("src/lib/use-supplier-directory.ts", useSupplierDirectory, marker);
}

for (const marker of [
  "Batch #56 browser-level guard",
  "supplier-directory-search",
  "supplier-directory-sort",
  "supplier-directory-direction",
  "supplier-directory-page-size",
  "supplier-directory-page-summary",
  "supplier-directory-pagination",
  "Nordfjord Sjømat AS",
  "qualified_unlocked",
]) {
  requireText("e2e/suppliers-directory-paging.spec.ts", suppliersDirectoryPagingE2E, marker);
}

if (!pkg.scripts["smoke:e2e:suppliers-directory:run"]?.includes("e2e/suppliers-directory-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:suppliers-directory:run must cover /suppliers directory paging e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/suppliers-directory-paging.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers directory paging e2e");
}
for (const marker of [
  "Batch #57 browser-level guard",
  "supplier-request-price-access",
  "supplier-access-refresh-banner",
  "supplier-access-refresh-now",
  "unknown supplier renders not found",
  "Nordfjord Sjømat AS",
]) {
  requireText("e2e/supplier-profile-detail.spec.ts", supplierProfileDetailE2E, marker);
}
if (!pkg.scripts["smoke:e2e:supplier-profile-detail:run"]?.includes("e2e/supplier-profile-detail.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-profile-detail:run must cover /suppliers/:id profile detail e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/supplier-profile-detail.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /suppliers/:id profile detail e2e");
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
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-flow:run"]?.includes("e2e/supplier-directory-profile-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-flow:run must cover supplier directory/profile approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/supplier-directory-profile-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include supplier directory/profile approval bridge e2e");
}
for (const marker of [
  "Batch #61 API-backed browser-level guard",
  "self-hosted API adapter",
  "backend approval unlocks the matching supplier after profile refresh and directory return",
  "backend approval for another supplier does not unlock the current directory/profile flow",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
  "Nordfjord Sjømat AS",
  "supplier-access-refresh-banner",
]) {
  requireText("e2e/supplier-directory-profile-api-flow.spec.ts", supplierDirectoryProfileApiFlowE2E, marker);
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-api-flow must build with the API-backed supplier directory/profile flow enabled");
}
if (!pkg.scripts["smoke:e2e:supplier-directory-profile-api-flow:run"]?.includes("e2e/supplier-directory-profile-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-directory-profile-api-flow:run must cover API-backed supplier directory/profile approval bridge e2e");
}
for (const marker of [
  "Batch #58 browser-level guard",
  "supplier-request-price-access",
  "supplier-access-refresh-banner",
  "supplier-access-refresh-now",
  "unknown offer renders not found",
  "EXACT_PRICE_PATTERN",
]) {
  requireText("e2e/offer-detail-runtime.spec.ts", offerDetailRuntimeE2E, marker);
}
if (!pkg.scripts["smoke:e2e:offer-detail-runtime:run"]?.includes("e2e/offer-detail-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-detail-runtime:run must cover /offers/:id runtime approval e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offer-detail-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include /offers/:id runtime approval e2e");
}
for (const marker of [
  "Batch #59 browser-level guard",
  "catalog/detail access bridge",
  "approval on detail unlocks the matching catalog row after return",
  "unrelated approval does not unlock the catalog/detail flow",
  "offer-detail-back-to-catalog",
  "qualified_unlocked",
]) {
  requireText("e2e/offer-catalog-detail-flow.spec.ts", offerCatalogDetailFlowE2E, marker);
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-flow:run"]?.includes("e2e/offer-catalog-detail-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-flow:run must cover catalog/detail approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:run"]?.includes("e2e/offer-catalog-detail-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:run must include catalog/detail approval bridge e2e");
}
for (const marker of [
  "Batch #62 API-backed browser-level guard",
  "self-hosted API adapter",
  "backend approval unlocks the matching offer after detail refresh and catalog return",
  "backend approval for another supplier does not unlock the current catalog/detail flow",
  "__e2e-api/v1",
  "VITE_YORSO_API_URL",
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
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-api-flow must build with the API-backed offer catalog/detail flow enabled");
}
if (!pkg.scripts["smoke:e2e:offer-catalog-detail-api-flow:run"]?.includes("e2e/offer-catalog-detail-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:offer-catalog-detail-api-flow:run must cover API-backed offer catalog/detail approval bridge e2e");
}
if (!pkg.scripts["smoke:e2e:supplier-access-notification-center-api-flow"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:supplier-access-notification-center-api-flow must build with the API-backed notification center enabled");
}
if (!pkg.scripts["smoke:e2e:supplier-access-notification-center-api-flow:run"]?.includes("e2e/supplier-access-notification-center-api-flow.spec.ts")) {
  failures.push("package.json: smoke:e2e:supplier-access-notification-center-api-flow:run must cover API-backed notification center e2e");
}
if (!pkg.scripts["smoke:e2e:api-backed-access-flows"]?.includes("VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api")) {
  failures.push("package.json: smoke:e2e:api-backed-access-flows must build with the API-backed access suite enabled");
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
if (pkg.scripts["smoke:e2e:frontend-no-supabase-env"] !== "node scripts/smoke-frontend-no-supabase-env.mjs") {
  failures.push("package.json: smoke:e2e:frontend-no-supabase-env must run the no-Supabase frontend smoke wrapper");
}
if (pkg.scripts["test:auth-runtime"] !== "vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts src/lib/buyer-session.test.ts") {
  failures.push("package.json: test:auth-runtime must cover the auth runtime adapter boundary and buyer session self-hosted fields");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:auth-runtime")) {
  failures.push("package.json: ci:core must run test:auth-runtime");
}
if (!pkg.scripts["smoke:e2e:frontend-no-supabase-env:run"]?.includes("e2e/frontend-no-supabase-env.spec.ts")) {
  failures.push("package.json: smoke:e2e:frontend-no-supabase-env:run must cover the no-Supabase frontend e2e spec");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:frontend-no-supabase-env")) {
  failures.push("package.json: ci:full must include the no-Supabase frontend smoke");
}
for (const marker of [
  "VITE_SUPABASE_URL: \"\"",
  "VITE_SUPABASE_PUBLISHABLE_KEY: \"\"",
  "VITE_YORSO_API_URL: \"\"",
  "frontend_no_supabase_env_smoke=ok",
]) {
  requireText("scripts/smoke-frontend-no-supabase-env.mjs", frontendNoSupabaseSmoke, marker);
}
for (const marker of [
  "Batch #66 optional Supabase frontend smoke",
  "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are intentionally empty",
  "frontend-no-supabase-env",
]) {
  requireText("e2e/frontend-no-supabase-env.spec.ts", frontendNoSupabaseE2E, marker);
}
for (const marker of [
  "isSupabaseConfigured",
  "SUPABASE_NOT_CONFIGURED_ERROR",
  "createDisabledSupabaseClient",
]) {
  requireText("src/integrations/supabase/client.ts", supabaseClient, marker);
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
  "supabase_prototype",
  "local_contract",
  "legacy-auth-supabase-adapter",
  "buyerSession",
]) {
  requireText("src/lib/auth-runtime.ts", authRuntime, marker);
}
if (authRuntime.includes("@/integrations/supabase/client")) {
  failures.push("src/lib/auth-runtime.ts: must not import Supabase client directly");
}
for (const marker of [
  "auth-runtime adapter boundary",
  "uses self-hosted email sign-in when VITE_YORSO_API_URL is configured",
  "returns self-hosted auth errors without falling back to local prototype auth",
  "reads and signs out the current self-hosted browser session",
  "uses local contract auth when Supabase is not configured",
  "delegates email sign-in and reset to prototype Supabase only when configured",
  "uses self-hosted password reset request and token completion when configured",
]) {
  requireText("src/lib/auth-runtime.test.ts", authRuntimeTest, marker);
}
for (const marker of [
  "keeps direct Supabase imports out of auth-runtime.ts",
  "self_hosted",
  "/v1/auth/sign-in",
  "/v1/auth/session",
  "/v1/auth/sign-out",
  "legacy-auth-supabase-adapter",
  "isLegacyAuthSupabaseConfigured",
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
for (const marker of [
  "@/integrations/supabase/client",
  "isLegacyAuthSupabaseConfigured",
  "signInWithPrototypeSupabase",
  "requestPrototypePasswordReset",
  "observePrototypePasswordRecovery",
  "updatePrototypeRecoveredPassword",
]) {
  requireText("src/lib/legacy-auth-supabase-adapter.ts", legacyAuthSupabaseAdapter, marker);
}
requireText("src/pages/SignIn.tsx", signInPage, "@/lib/auth-runtime");
requireText("src/pages/SignIn.tsx", signInPage, "result.session?.userId");
requireText("src/pages/SignIn.tsx", signInPage, "source: result.source");
requireText("src/pages/ResetPassword.tsx", resetPasswordPage, "@/lib/auth-runtime");
if (signInPage.includes("@/integrations/supabase/client")) {
  failures.push("src/pages/SignIn.tsx: must not import Supabase client directly");
}
if (resetPasswordPage.includes("@/integrations/supabase/client")) {
  failures.push("src/pages/ResetPassword.tsx: must not import Supabase client directly");
}
requireText(".github/workflows/ci.yml", ciWorkflow, "Run frontend without Supabase env smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:frontend-no-supabase-env");
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
  failures.push("package.json: smoke:e2e:self-hosted-access-runtime must run the real self-hosted access runtime browser smoke");
}
if (!pkg.scripts["smoke:e2e:self-hosted-access-runtime:run"]?.includes("e2e/self-hosted-access-runtime.spec.ts")) {
  failures.push("package.json: smoke:e2e:self-hosted-access-runtime:run must cover real self-hosted access runtime e2e");
}
if (!pkg.scripts["ci:full"]?.includes("npm run smoke:e2e:self-hosted-access-runtime")) {
  failures.push("package.json: ci:full must include the real self-hosted API browser smoke");
}
for (const marker of [
  "Batch #65 real self-hosted API browser guard",
  "real memory-mode apps/api process",
  "no Playwright route interception",
  "VITE_YORSO_API_URL",
  "supplier-request-price-access",
  "Nordfjord Sjømat AS",
  "self_hosted_access_runtime_e2e=ok",
]) {
  requireText("e2e/self-hosted-access-runtime.spec.ts", selfHostedAccessRuntimeE2E, marker);
}
for (const marker of [
  "AccountSessionAuthority",
  "resolveAuthenticatedAccountSession",
  "resolveOptionalAuthenticatedAccountSession",
  "Account session does not match the requested user.",
]) {
  requireText("apps/api/src/modules/auth/session.ts", authSession, marker);
}
for (const [file, text, marker] of [
  ["apps/api/src/modules/account/routes.ts", accountRoutes, "resolveAuthenticatedAccountSession"],
  ["apps/api/src/modules/access/routes.ts", accessRoutes, "resolveAuthenticatedAccountSession"],
  ["apps/api/src/modules/storage/routes.ts", storageRoutes, "resolveAuthenticatedAccountSession"],
  ["apps/api/src/modules/offers/routes.ts", offerRoutes, "resolveOptionalAuthenticatedAccountSession"],
  ["apps/api/src/modules/suppliers/routes.ts", supplierRoutes, "resolveOptionalAuthenticatedAccountSession"],
]) {
  requireText(file, text, marker);
}
for (const marker of [
  "account_session_authority=ok",
  "account_session_invalid",
]) {
  requireText("scripts/smoke-self-hosted-account-api.mjs", accountApiSmoke, marker);
}
requireText("scripts/smoke-self-hosted-offer-detail.mjs", offerDetailSmoke, "offer_detail_session_authority=ok");
requireText("scripts/smoke-e2e-self-hosted-access-runtime.mjs", selfHostedAccessRuntimeSmoke, "self_hosted_access_runtime_session_authority=ok");
for (const marker of [
  "VITE_YORSO_API_URL: apiBaseUrl",
  "E2E_YORSO_API_URL: apiBaseUrl",
  "self_hosted_access_runtime_e2e=ok",
]) {
  requireText("scripts/smoke-e2e-self-hosted-access-runtime.mjs", selfHostedAccessRuntimeSmoke, marker);
}
requireText("apps/api/src/modules/offers/repository.ts", offerRepository, "normalizeOfferCatalogId");
requireText("apps/api/src/modules/offers/postgres-repository.ts", offerPostgresRepository, "normalizeOfferCatalogId");
requireText(".github/workflows/ci.yml", ciWorkflow, "Run self-hosted access runtime browser smoke");
requireText(".github/workflows/ci.yml", ciWorkflow, "npm run smoke:e2e:self-hosted-access-runtime");

if (failures.length > 0) {
  console.error("Production scale baseline check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production scale baseline check passed.");
console.log("- 10,000 concurrent-user target is documented.");
console.log("- supplier, offer and access-flow paths have scaling guardrails.");
console.log("- ci:core enforces the baseline check.");
