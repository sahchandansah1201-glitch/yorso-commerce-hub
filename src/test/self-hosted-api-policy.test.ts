import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

describe("self-hosted API policy", () => {
  it("passes the API skeleton guard", () => {
    const output = runNode(["scripts/check-self-hosted-api.mjs"]);

    expect(output).toContain("Self-hosted API skeleton check passed");
    expect(output).toContain("apps/api exposes health and account-contract endpoints");
  });

  it("keeps the API service wired into compose as a deployable backend process", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const dockerfile = readFileSync("apps/api/Dockerfile", "utf8");

    expect(compose).toContain("api:");
    expect(compose).toContain("pgbouncer:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("minio:");
    expect(compose).not.toMatch(/SUPABASE/i);
    expect(dockerfile).toContain("RUN npm run api:build");
    expect(dockerfile).toContain("CMD [\"node\", \"apps/api/dist/index.js\"]");
  });

  it("keeps the runtime account API smoke wired into CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-account-api-smoke.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-account-api"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-account-api:run",
    );
    expect(pkg.scripts["smoke:self-hosted-account-api:run"]).toBe(
      "node scripts/smoke-self-hosted-account-api.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-account-api:run");
    expect(smoke).toContain("apps/api/dist/index.js");
    expect(smoke).toContain("x-yorso-user-id");
    expect(smoke).toContain("file_owner_guard=ok");
    expect(docs).toContain("self_hosted_account_api_smoke=ok");
  });

  it("keeps self-hosted auth smoke fail-closed after sign-out", () => {
    const smoke = readFileSync("scripts/smoke-self-hosted-auth-api.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-auth-api-smoke.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    for (const marker of [
      "auth_sign_out_revokes_session=ok",
      "auth_sign_out_blocks_account=ok",
      "auth_sign_out_blocks_access=ok",
      "auth_sign_out_blocks_offer_unlock=ok",
      "auth_sign_out_preserves_public_catalog=ok",
    ]) {
      expect(smoke).toContain(marker);
      expect(docs).toContain(marker);
    }

    expect(baseline).toContain("Batch #76");
    expect(baseline).toContain("revoked-session behavior");
    expect(baseline).toContain("10,000 concurrent-user baseline");
  });

  it("keeps self-hosted auth security events and rate-limit guard wired", () => {
    const contracts = readFileSync("packages/contracts/src/auth.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/auth/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/auth/postgres-repository.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/auth/service.ts", "utf8");
    const rateLimit = readFileSync("apps/api/src/modules/auth/rate-limit.ts", "utf8");
    const migration = readFileSync("packages/db/migrations/0012_auth_security_events.sql", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-auth-api.mjs", "utf8");
    const docs = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(contracts).toContain("authSecurityEventTypeSchema");
    expect(repository).toContain("recordSecurityEvent");
    expect(repository).toContain("countRecentSecurityEvents");
    expect(postgresRepository).toContain("insert into yorso_auth_security_events");
    expect(migration).toContain("idx_yorso_auth_security_events_email_type_recent");
    expect(service).toContain("rateLimiter.checkSignIn");
    expect(service).toContain("retryAfterSeconds");
    expect(service).toContain("sign_in_rate_limited");
    expect(service).toContain("auth_rate_limited");
    expect(rateLimit).toContain("RedisAuthRateLimiter");
    expect(rateLimit).toContain("hashIdentity");
    expect(smoke).toContain("auth_rate_limit_guard=ok");
    expect(smoke).toContain("auth_rate_limit_retry_after=ok");
    expect(smoke).toContain("retry-after");
    expect(docs).toContain("Batch #77");
    expect(docs).toContain("Batch #78");
    expect(docs).toContain("sign-in backpressure");
  });

  it("keeps self-hosted session cache fail-closed and sign-out invalidation wired", () => {
    const service = readFileSync("apps/api/src/modules/auth/service.ts", "utf8");
    const sessionCache = readFileSync("apps/api/src/modules/auth/session-cache.ts", "utf8");
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const config = readFileSync("apps/api/src/config.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-auth-api.mjs", "utf8");
    const docs = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(sessionCache).toContain("RedisAuthSessionCache");
    expect(sessionCache).toContain("MemoryAuthSessionCache");
    expect(sessionCache).toContain("DisabledAuthSessionCache");
    expect(sessionCache).toContain("createAuthSessionCache");
    expect(server).toContain("createAuthSessionCache(config)");
    expect(service).toContain("sessionCache.getSession");
    expect(service).toContain("sessionCache.setSession");
    expect(service).toContain("sessionCache.deleteSession");
    expect(service).toContain("auth_session_cache_unavailable");
    expect(config).toContain("Production self-hosted API must use AUTH_SESSION_CACHE_DRIVER=redis.");
    expect(config).toContain("Production self-hosted API must use AUTH_SESSION_CACHE_FAIL_MODE=closed.");
    expect(smoke).toContain("auth_session_cache_invalidation=ok");
    expect(docs).toContain("Batch #79");
    expect(docs).toContain("Redis session cache");
  });

  it("keeps session-cache Redis outage fail-closed smoke wired into CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-session-cache-fail-closed.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-auth-api-smoke.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-session-cache-fail-closed"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-session-cache-fail-closed:run",
    );
    expect(pkg.scripts["smoke:self-hosted-session-cache-fail-closed:run"]).toBe(
      "node scripts/smoke-self-hosted-session-cache-fail-closed.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-session-cache-fail-closed:run");
    expect(smoke).toContain("AUTH_SESSION_CACHE_DRIVER: \"redis\"");
    expect(smoke).toContain("AUTH_SESSION_CACHE_FAIL_MODE: \"closed\"");
    expect(smoke).toContain("auth_session_cache_fail_closed_sign_in=ok");
    expect(smoke).toContain("auth_session_cache_fail_closed_session=ok");
    expect(smoke).toContain("auth_session_cache_fail_closed_account=ok");
    expect(smoke).toContain("auth_session_cache_fail_closed_catalog=ok");
    expect(smoke).toContain("auth_session_cache_fail_closed_public_catalog=ok");
    expect(docs).toContain("Batch #80");
    expect(baseline).toContain("Batch #80");
    expect(baseline).toContain("session-cache fail-closed smoke");
  });

  it("keeps auth observability JSONL wired into production runtime and CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const observability = readFileSync("apps/api/src/modules/auth/observability.ts", "utf8");
    const observabilityTest = readFileSync("apps/api/src/modules/auth/observability.test.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-auth-observability.mjs", "utf8");
    const config = readFileSync("apps/api/src/config.ts", "utf8");
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-auth-api-smoke.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-auth-observability"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-auth-observability:run",
    );
    expect(pkg.scripts["smoke:self-hosted-auth-observability:run"]).toBe(
      "node scripts/smoke-self-hosted-auth-observability.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-auth-observability:run");
    expect(observability).toContain("ConsoleAuthTelemetrySink");
    expect(observability).toContain("auth_runtime_event");
    expect(observability).toContain("sanitizeAuthTelemetryEvent");
    expect(observabilityTest).toContain("not.toContain(\"buyer@example.com\")");
    expect(smoke).toContain("AUTH_OBSERVABILITY_DRIVER: \"console\"");
    expect(smoke).toContain("auth_observability_no_pii=ok");
    expect(smoke).toContain("self_hosted_auth_observability_smoke=ok");
    expect(config).toContain("Production self-hosted API must use AUTH_OBSERVABILITY_DRIVER=console.");
    expect(productionEnv).toContain("AUTH_OBSERVABILITY_DRIVER=console");
    expect(docs).toContain("Batch #81");
    expect(baseline).toContain("Batch #81");
    expect(baseline).toContain("auth observability JSONL");
  });

  it("keeps request observability JSONL wired into production runtime and CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const observability = readFileSync("apps/api/src/request-observability.ts", "utf8");
    const observabilityTest = readFileSync("apps/api/src/request-observability.test.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-request-observability.mjs", "utf8");
    const config = readFileSync("apps/api/src/config.ts", "utf8");
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-auth-api-smoke.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-request-observability"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-request-observability:run",
    );
    expect(pkg.scripts["smoke:self-hosted-request-observability:run"]).toBe(
      "node scripts/smoke-self-hosted-request-observability.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-request-observability:run");
    expect(observability).toContain("api_request_event");
    expect(observability).toContain("request.guardrail_triggered");
    expect(observability).toContain("normalizeRoute");
    expect(observabilityTest).toContain("not.toContain(\"buyer@example.com\")");
    expect(smoke).toContain("YORSO_REQUEST_OBSERVABILITY_DRIVER: \"console\"");
    expect(smoke).toContain("request_observability_no_pii=ok");
    expect(smoke).toContain("self_hosted_request_observability_smoke=ok");
    expect(config).toContain("Production self-hosted API must use YORSO_REQUEST_OBSERVABILITY_DRIVER=console.");
    expect(productionEnv).toContain("YORSO_REQUEST_OBSERVABILITY_DRIVER=console");
    expect(compose).toContain("YORSO_REQUEST_OBSERVABILITY_DRIVER: console");
    expect(docs).toContain("Batch #85");
    expect(baseline).toContain("Batch #85");
    expect(baseline).toContain("api_request_event");
  });

  it("keeps error observability JSONL wired into production runtime and CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const observability = readFileSync("apps/api/src/error-observability.ts", "utf8");
    const observabilityTest = readFileSync("apps/api/src/error-observability.test.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-error-observability.mjs", "utf8");
    const config = readFileSync("apps/api/src/config.ts", "utf8");
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const http = readFileSync("apps/api/src/http.ts", "utf8");
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-auth-api-smoke.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-error-observability"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-error-observability:run",
    );
    expect(pkg.scripts["smoke:self-hosted-error-observability:run"]).toBe(
      "node scripts/smoke-self-hosted-error-observability.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-error-observability:run");
    expect(observability).toContain("api_error_event");
    expect(observability).toContain("error.response");
    expect(observability).toContain("error.client_parse");
    expect(observability).toContain("sanitizeErrorTelemetryEvent");
    expect(observabilityTest).toContain("not.toContain(\"buyer@example.com\")");
    expect(smoke).toContain("YORSO_ERROR_OBSERVABILITY_DRIVER: \"console\"");
    expect(smoke).toContain("error_observability_no_pii=ok");
    expect(smoke).toContain("self_hosted_error_observability_smoke=ok");
    expect(config).toContain("Production self-hosted API must use YORSO_ERROR_OBSERVABILITY_DRIVER=console.");
    expect(server).toContain("createErrorTelemetrySink");
    expect(server).toContain("buildErrorTelemetryEvent");
    expect(server).toContain("buildClientParseErrorTelemetryEvent");
    expect(http).toContain("markApiError");
    expect(http).toContain("x-error-id");
    expect(http).toContain("correlationId");
    expect(productionEnv).toContain("YORSO_ERROR_OBSERVABILITY_DRIVER=console");
    expect(compose).toContain("YORSO_ERROR_OBSERVABILITY_DRIVER: console");
    expect(docs).toContain("Batch #86");
    expect(baseline).toContain("Batch #86");
    expect(baseline).toContain("api_error_event");
  });

  it("keeps Prometheus metrics wired into production runtime and CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const metrics = readFileSync("apps/api/src/metrics.ts", "utf8");
    const metricsTest = readFileSync("apps/api/src/metrics.test.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-metrics.mjs", "utf8");
    const config = readFileSync("apps/api/src/config.ts", "utf8");
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-metrics"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-metrics:run",
    );
    expect(pkg.scripts["smoke:self-hosted-metrics:run"]).toBe("node scripts/smoke-self-hosted-metrics.mjs");
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-metrics:run");
    expect(metrics).toContain("InMemoryPrometheusMetricsRegistry");
    expect(metrics).toContain("yorso_api_requests_total");
    expect(metrics).toContain("yorso_api_request_duration_seconds");
    expect(metrics).toContain("yorso_api_errors_total");
    expect(metrics).toContain("yorso_api_auth_events_total");
    expect(metrics).toContain("yorso_api_production_baseline_concurrent_users");
    expect(metricsTest).toContain("not.toContain(\"buyer@example.com\")");
    expect(smoke).toContain("YORSO_METRICS_DRIVER: \"prometheus\"");
    expect(smoke).toContain("metrics_no_pii=ok");
    expect(smoke).toContain("self_hosted_metrics_smoke=ok");
    expect(config).toContain("Production self-hosted API must use YORSO_METRICS_DRIVER=prometheus.");
    expect(server).toContain("createMetricsRegistry(config)");
    expect(server).toContain("renderMetricsResponse(metricsRegistry");
    expect(server).toContain("metricsRegistry.observeRequest");
    expect(server).toContain("metricsRegistry.observeError");
    expect(server).toContain("metricsRegistry.observeAuth");
    expect(productionEnv).toContain("YORSO_METRICS_DRIVER=prometheus");
    expect(compose).toContain("YORSO_METRICS_DRIVER: prometheus");
    expect(baseline).toContain("Batch #87");
    expect(baseline).toContain("Prometheus metrics endpoint");
  });

  it("keeps production audit trail wired into protected actions without PII", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const audit = readFileSync("apps/api/src/audit.ts", "utf8");
    const auditTest = readFileSync("apps/api/src/audit.test.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-audit-trail.mjs", "utf8");
    const persistenceSmoke = readFileSync("scripts/smoke-self-hosted-audit-persistence.mjs", "utf8");
    const migration = readFileSync("packages/db/migrations/0013_api_audit_events.sql", "utf8");
    const config = readFileSync("apps/api/src/config.ts", "utf8");
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const authRoutes = readFileSync("apps/api/src/modules/auth/routes.ts", "utf8");
    const accountRoutes = readFileSync("apps/api/src/modules/account/routes.ts", "utf8");
    const accessRoutes = readFileSync("apps/api/src/modules/access/routes.ts", "utf8");
    const storageRoutes = readFileSync("apps/api/src/modules/storage/routes.ts", "utf8");
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-audit-trail"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-audit-trail:run",
    );
    expect(pkg.scripts["smoke:self-hosted-audit-trail:run"]).toBe(
      "node scripts/smoke-self-hosted-audit-trail.mjs",
    );
    expect(pkg.scripts["smoke:self-hosted-audit-persistence"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-audit-persistence:run",
    );
    expect(pkg.scripts["smoke:self-hosted-audit-persistence:run"]).toBe(
      "node scripts/smoke-self-hosted-audit-persistence.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-audit-trail:run");
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-audit-persistence:run");
    expect(audit).toContain("api_audit_event");
    expect(audit).toContain("actorUserHash");
    expect(audit).toContain("sessionHash");
    expect(audit).toContain("resourceHash");
    expect(audit).toContain("ConsoleAuditSink");
    expect(audit).toContain("PostgresAuditSink");
    expect(audit).toContain("api_audit_dropped");
    expect(audit).toContain("yorso_api_audit_events");
    expect(audit).toContain("auditMaxInFlight");
    expect(auditTest).toContain("not.toContain(\"sess_secret_123\")");
    expect(smoke).toContain("YORSO_AUDIT_DRIVER: \"console\"");
    expect(smoke).toContain("audit_no_pii=ok");
    expect(smoke).toContain("self_hosted_audit_trail_smoke=ok");
    expect(persistenceSmoke).toContain("audit_persistence_insert=ok");
    expect(persistenceSmoke).toContain("audit_persistence_hash_only=ok");
    expect(persistenceSmoke).toContain("audit_persistence_backpressure=ok");
    expect(persistenceSmoke).toContain("self_hosted_audit_persistence_smoke=ok");
    expect(migration).toContain("create table if not exists yorso_api_audit_events");
    expect(migration).toContain("idx_yorso_api_audit_events_action_outcome_time");
    expect(config).toContain("Production self-hosted API must use YORSO_AUDIT_DRIVER=postgres.");
    expect(server).toContain("createAuditSink(config)");
    expect(authRoutes).toContain("auth.sign_in");
    expect(accountRoutes).toContain("account.company.update");
    expect(accessRoutes).toContain("access.supplier.request");
    expect(accessRoutes).toContain("access.supplier.decision");
    expect(storageRoutes).toContain("storage.company_media.upload");
    expect(storageRoutes).toContain("storage.document.create");
    expect(productionEnv).toContain("YORSO_AUDIT_DRIVER=postgres");
    expect(productionEnv).toContain("YORSO_AUDIT_MAX_IN_FLIGHT=2000");
    expect(compose).toContain("YORSO_AUDIT_DRIVER: postgres");
    expect(compose).toContain("YORSO_AUDIT_MAX_IN_FLIGHT:");
    expect(baseline).toContain("Batch #88");
    expect(baseline).toContain("Batch #89");
    expect(baseline).toContain("api_audit_event");
  });

  it("keeps admin audit read/export protected by self-hosted roles", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const contract = readFileSync("packages/contracts/src/admin-audit.ts", "utf8");
    const authRepository = readFileSync("apps/api/src/modules/auth/repository.ts", "utf8");
    const authPostgresRepository = readFileSync("apps/api/src/modules/auth/postgres-repository.ts", "utf8");
    const authService = readFileSync("apps/api/src/modules/auth/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/admin-audit/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/admin-audit/postgres-repository.ts", "utf8");
    const routes = readFileSync("apps/api/src/modules/admin-audit/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/admin-audit/service.ts", "utf8");
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const migration = readFileSync("packages/db/migrations/0014_admin_audit_access.sql", "utf8");
    const retentionMigration = readFileSync(
      "packages/db/migrations/0015_admin_audit_retention_query_hardening.sql",
      "utf8",
    );
    const metrics = readFileSync("apps/api/src/metrics.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-admin-audit.mjs", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-admin-audit"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-admin-audit:run",
    );
    expect(pkg.scripts["smoke:self-hosted-admin-audit:run"]).toBe(
      "node scripts/smoke-self-hosted-admin-audit.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-admin-audit:run");
    expect(contract).toContain("adminUserRoleSchema");
    expect(contract).toContain("adminAuditQuerySchema");
    expect(contract).toContain("adminAuditStatusClassSchema");
    expect(authRepository).toContain("hasRole");
    expect(authPostgresRepository).toContain("from yorso_user_roles");
    expect(authService).toContain("hasRole(userId");
    expect(repository).toContain("encodeAuditCursor");
    expect(repository).toContain("statusClass");
    expect(postgresRepository).toContain("from yorso_api_audit_events");
    expect(postgresRepository).toContain("status_code between");
    expect(postgresRepository).toContain("order by occurred_at desc, audit_id desc");
    expect(routes).toContain("/v1/admin/audit-events");
    expect(routes).toContain("/v1/admin/audit-events/export");
    expect(routes).toContain("admin_role_required");
    expect(routes).toContain("application/x-ndjson");
    expect(routes).toContain("admin.audit_events.read");
    expect(routes).toContain("admin.audit_events.export");
    expect(routes).toContain("observeAdminAudit");
    expect(service).toContain("AdminAuditService");
    expect(service).toContain("AdminAuditQueryError");
    expect(service).toContain("admin_audit_export_window_too_large");
    expect(server).toContain("handleAdminAuditRoute");
    expect(migration).toContain("create table if not exists yorso_user_roles");
    expect(migration).toContain("idx_yorso_api_audit_events_status_time");
    expect(retentionMigration).toContain("idx_yorso_api_audit_events_route_status_time");
    expect(retentionMigration).toContain("idx_yorso_api_audit_events_outcome_status_time");
    expect(retentionMigration).toContain("yorso_purge_api_audit_events");
    expect(metrics).toContain("yorso_api_admin_audit_requests_total");
    expect(metrics).toContain("yorso_api_admin_audit_rows_total");
    expect(smoke).toContain("admin_audit_auth_guard=ok");
    expect(smoke).toContain("admin_audit_role_guard=ok");
    expect(smoke).toContain("admin_audit_route_status_filter=ok");
    expect(smoke).toContain("admin_audit_export=ok");
    expect(smoke).toContain("admin_audit_export_window_guard=ok");
    expect(smoke).toContain("admin_audit_metrics=ok");
    expect(baseline).toContain("Batch #90");
    expect(baseline).toContain("Batch #91");
    expect(baseline).toContain("self-hosted admin audit smoke");
  });

  it("keeps production health readiness wired through API, smoke and deployment guards", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const health = readFileSync("apps/api/src/routes/health.ts", "utf8");
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-health-readiness.mjs", "utf8");
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-health-readiness"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-health-readiness:run",
    );
    expect(pkg.scripts["smoke:self-hosted-health-readiness:run"]).toBe(
      "node scripts/smoke-self-hosted-health-readiness.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-health-readiness:run");
    expect(health).toContain("SelfHostedReadinessProbe");
    expect(health).toContain("targetConcurrentUsers: 10_000");
    expect(health).toContain("checkPostgres");
    expect(health).toContain("checkRedis");
    expect(health).toContain("checkLocalStorage");
    expect(health).toContain("checkProductionRuntimeConfig");
    expect(server).toContain("/v1/health/ready");
    expect(server).toContain("createReadinessProbe(config");
    expect(smoke).toContain("health_readiness_local=ok");
    expect(smoke).toContain("health_readiness_redis_unavailable=ok");
    expect(smoke).toContain("health_readiness_postgres_unavailable=ok");
    expect(smoke).toContain("self_hosted_health_readiness_smoke=ok");
    expect(compose).toContain("/health/ready");
    expect(productionEnv).toContain("HEALTH_READINESS_TIMEOUT_MS=750");
    expect(baseline).toContain("Batch #82");
    expect(baseline).toContain("self-hosted health readiness smoke");
  });

  it("keeps row-level account workspace CRUD guarded across API, contracts and adapter", () => {
    const routes = readFileSync("apps/api/src/modules/account/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/account/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/account/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/account/postgres-repository.ts", "utf8");
    const accountApi = readFileSync("src/lib/account-api.ts", "utf8");
    const contracts = readFileSync("packages/contracts/src/account-company.ts", "utf8");
    const accountSmoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");
    const workspaceSmoke = readFileSync("scripts/smoke-self-hosted-workspace-postgres.mjs", "utf8");
    const skeletonDocs = readFileSync("docs/backend/self-hosted-api-skeleton.md", "utf8");

    expect(routes).toContain("/v1/account/branches/");
    expect(routes).toContain("/v1/account/products/");
    expect(routes).toContain("/v1/account/meta-regions/");
    expect(routes).toContain("/v1/account/notifications/");
    expect(routes).toContain("GET, POST, PATCH, DELETE");
    expect(routes).toContain("workspace_item_conflict");
    expect(routes).toContain("workspace_item_not_found");

    expect(service).toContain("companyBranchCreateSchema.parse");
    expect(service).toContain("companyProductUpdateSchema.parse");
    expect(service).toContain("notificationPreferenceUpdateSchema.parse");

    for (const method of [
      "createBranch",
      "updateBranch",
      "deleteBranch",
      "createProduct",
      "updateProduct",
      "deleteProduct",
      "createMetaRegion",
      "updateMetaRegion",
      "deleteMetaRegion",
      "createNotification",
      "updateNotification",
      "deleteNotification",
    ]) {
      expect(repository).toContain(method);
      expect(postgresRepository).toContain(method);
      expect(accountApi).toContain(method);
    }

    expect(contracts).toContain("companyBranchCreateSchema");
    expect(contracts).toContain("companyProductUpdateSchema");
    expect(contracts).toContain("metaRegionCreateSchema");
    expect(contracts).toContain("notificationPreferenceUpdateSchema");
    expect(accountSmoke).toContain("branch_row_create=ok");
    expect(accountSmoke).toContain("notification_row_validation_guard=ok");
    expect(workspaceSmoke).toContain("product_row_patch=ok");
    expect(skeletonDocs).toContain("Batch #33 adds owner-scoped row-level CRUD");
  });

  it("keeps supplier directory API behind self-hosted contracts and access shaping", () => {
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const routes = readFileSync("apps/api/src/modules/suppliers/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/suppliers/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/suppliers/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/suppliers/postgres-repository.ts", "utf8");
    const contracts = readFileSync("packages/contracts/src/supplier-directory.ts", "utf8");
    const adapter = readFileSync("src/lib/supplier-directory-api.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");

    expect(server).toContain("handleSupplierDirectoryRoute");
    expect(server).toContain("createSupplierRepository(config)");
    expect(routes).toContain("/v1/suppliers");
    expect(routes).toContain("/v1/suppliers/");
    expect(routes).toContain("resolveOptionalAuthenticatedAccountSession");
    expect(routes).toContain("supplier_not_found");
    expect(service).toContain("shapeSupplierForAccess");
    expect(service).toContain("hasSupplierAccess");
    expect(service).toContain("listAccessibleSupplierIds");
    expect(service).toContain("resolveDetailAccessLevel");
    expect(repository).toContain("privateSearchSupplierIds");
    expect(service).toContain("qualified_unlocked");
    expect(repository).toContain("MemorySupplierRepository");
    expect(postgresRepository).toContain("from yorso_suppliers_directory");
    expect(postgresRepository).toContain("publication_status = 'published'");
    expect(postgresRepository).toContain("private_search_text");
    expect(contracts).toContain("supplierDirectoryRecordSchema");
    expect(contracts).toContain("supplierDirectoryItemSchema");
    expect(contracts).toContain("verificationLevel: supplierVerificationLevelSchema.optional()");
    expect(adapter).toContain("createSupplierDirectoryApiClient");
    expect(adapter).toContain("ACCOUNT_USER_ID_HEADER");
    expect(adapter).toContain("verificationLevel");
    expect(adapter).toContain("mockSuppliers");
    expect(smoke).toContain("supplier_directory_locked=ok");
    expect(smoke).toContain("supplier_directory_verified_filter=ok");
    expect(smoke).toContain("supplier_directory_requires_grant=ok");
    expect(smoke).toContain("supplier_directory_private_search_requires_grant=ok");
    expect(smoke).toContain("supplier_directory_unlocked=ok");
    expect(smoke).toContain("supplier_directory_granted_private_search=ok");
    expect(smoke).toContain("supplier_directory_ungranted_private_search_guard=ok");
  });

  it("keeps offer catalog API behind self-hosted contracts and access shaping", () => {
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const routes = readFileSync("apps/api/src/modules/offers/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/offers/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/offers/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/offers/postgres-repository.ts", "utf8");
    const contracts = readFileSync("packages/contracts/src/offer-catalog.ts", "utf8");
    const adapter = readFileSync("src/lib/offer-catalog-api.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");

    expect(server).toContain("handleOfferCatalogRoute");
    expect(server).toContain("createOfferCatalogRepository(config)");
    expect(routes).toContain("/v1/offers");
    expect(routes).toContain("/v1/offers/");
    expect(routes).toContain("resolveOptionalAuthenticatedAccountSession");
    expect(routes).toContain("offer_not_found");
    expect(service).toContain("shapeOfferForAccess");
    expect(service).toContain("listAccessibleSupplierIds");
    expect(service).toContain("resolveListAccessLevel");
    expect(service).toContain("qualified_unlocked");
    expect(repository).toContain("privateSearchSupplierIds");
    expect(repository).toContain("MemoryOfferCatalogRepository");
    expect(postgresRepository).toContain("from yorso_offers_catalog");
    expect(postgresRepository).toContain("publication_status = 'published'");
    expect(postgresRepository).toContain("supplier_directory_id = any");
    expect(contracts).toContain("offerCatalogRecordSchema");
    expect(contracts).toContain("offerCatalogItemSchema");
    expect(contracts).toContain("supplierCountryCode: z.string().length(2).optional()");
    expect(adapter).toContain("createOfferCatalogApiClient");
    expect(adapter).toContain("supplierCountryCode");
    expect(adapter).toContain("mockOffers");
    expect(smoke).toContain("offer_catalog_locked=ok");
    expect(smoke).toContain("offer_catalog_private_search_guard=ok");
    expect(smoke).toContain("offer_catalog_private_search_requires_grant=ok");
    expect(smoke).toContain("offer_catalog_list_requires_grant=ok");
    expect(smoke).toContain("offer_catalog_unlocked=ok");
    expect(smoke).toContain("offer_catalog_granted_private_search=ok");
    expect(smoke).toContain("offer_catalog_ungranted_private_search_guard=ok");
  });

  it("keeps the optional live PostgreSQL account smoke available without requiring it in CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-account-postgres.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-account-postgres-smoke.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-account-postgres"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-account-postgres:run",
    );
    expect(pkg.scripts["smoke:self-hosted-account-postgres:run"]).toBe(
      "node scripts/smoke-self-hosted-account-postgres.mjs",
    );
    expect(pkg.scripts["ci:core"]).not.toContain("npm run smoke:self-hosted-account-postgres:run");
    expect(smoke).toContain("MIGRATION_DATABASE_URL");
    expect(smoke).toContain("self_hosted_account_postgres_smoke=skipped");
    expect(smoke).toContain("ACCOUNT_REPOSITORY: \"postgres\"");
    expect(smoke).toContain("file_owner_guard=ok");
    expect(docs).toContain("optional live runtime smoke");
    expect(docs).toContain("self_hosted_account_postgres_smoke=ok");
  });

  it("keeps the optional live PostgreSQL workspace smoke available without requiring it in CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-workspace-postgres.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-workspace-postgres-smoke.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-workspace-postgres"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-workspace-postgres:run",
    );
    expect(pkg.scripts["smoke:self-hosted-workspace-postgres:run"]).toBe(
      "node scripts/smoke-self-hosted-workspace-postgres.mjs",
    );
    expect(pkg.scripts["ci:core"]).not.toContain("npm run smoke:self-hosted-workspace-postgres:run");
    expect(smoke).toContain("MIGRATION_DATABASE_URL");
    expect(smoke).toContain("self_hosted_workspace_postgres_smoke=skipped");
    expect(smoke).toContain("ACCOUNT_REPOSITORY: \"postgres\"");
    expect(smoke).toContain("branches_replace=ok");
    expect(smoke).toContain("products_replace=ok");
    expect(smoke).toContain("meta_regions_replace=ok");
    expect(smoke).toContain("notifications_validation_guard=ok");
    expect(smoke).toContain("workspace_owner_isolation=ok");
    expect(docs).toContain("optional live runtime smoke");
    expect(docs).toContain("self_hosted_workspace_postgres_smoke=ok");
  });
});
