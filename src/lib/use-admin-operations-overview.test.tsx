import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminIncidentSummary } from "@/lib/admin-incidents-api";
import type { AdminOperationsOverview } from "@/lib/admin-operations-api";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminOperationsOverview } from "@/lib/use-admin-operations-overview";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-operations-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const incidentSummary = (patch: Partial<AdminIncidentSummary> = {}): AdminIncidentSummary => ({
  acknowledged: 0,
  access: 0,
  assigned: 0,
  assignmentCoveragePct: 0,
  atRisk: 0,
  audit: 0,
  breachRatePct: 100,
  breached: 1,
  critical: 0,
  engineeringEscalations: 0,
  escalated: 0,
  executiveEscalations: 0,
  high: 0,
  leadEscalations: 0,
  open: 1,
  openCritical: 0,
  oldestOpenMinutes: 240,
  policy: 0,
  resolved: 0,
  runtime: 1,
  security: 0,
  total: 1,
  unassigned: 1,
  ...patch,
});

const overviewPayload = (): AdminOperationsOverview => ({
  access: {
    grants: { recent: [], summary: { active: 1, expired: 0, total: 1 }, total: 1 },
    review: { recent: [], summary: { approved: 0, open: 1, pending: 0, rejected: 0, revoked: 0, sent: 1 }, total: 1 },
  },
  incidents: {
    recent: [
      {
        acknowledgedAt: null,
        acknowledgedByUserHash: null,
        assignedAt: null,
        assignedToUserHash: null,
        count: 1,
        description: "Readiness check reported a warning.",
        dueAt: "2026-05-20T14:00:00.000Z",
        escalatedAt: null,
        escalationLevel: "none",
        evidence: [{ label: "Runtime check", value: "runtime warning" }],
        firstSeenAt: "2026-05-20T10:00:00.000Z",
        id: "runtime:readiness",
        lastSeenAt: "2026-05-20T10:00:00.000Z",
        note: null,
        recommendedActions: ["Open runtime diagnostics."],
        relatedAuditIds: [],
        route: "/health/ready",
        runbook: [
          {
            description: "Confirm runtime diagnostic scope.",
            label: "Confirm scope",
            ownerRole: "operator",
            targetMinutes: 30,
          },
        ],
        severity: "medium",
        slaStatus: "breached",
        source: "runtime",
        status: "open",
        timelinePreview: [
          {
            actorUserHash: null,
            assignedToUserHash: null,
            escalationLevel: null,
            eventId: "runtime:readiness:created",
            note: null,
            occurredAt: "2026-05-20T10:00:00.000Z",
            status: "open",
            type: "created",
          },
        ],
        title: "Runtime readiness warning",
      },
    ],
    summary: incidentSummary(),
  },
  audit: {
    recent: [],
    summary: { blocked: 0, failure: 0, sampleSize: 0, statusClasses: {}, success: 0 },
  },
  capacityPlan: {
    backpressureStrategy: "Bounded previews.",
    cacheStrategy: "Explicit refresh.",
    databaseStrategy: "Indexed queries.",
    failureMode: "No fallback fabrication.",
    loadTestPlan: "Smoke test path.",
    observabilityPlan: "Audit and metrics.",
    readProfile: "Low-frequency admin read.",
    writeProfile: "No writes.",
  },
  generatedAt: "2026-05-20T10:00:00.000Z",
  ok: true,
  operatorActions: [
    { description: "Review queue", href: "/admin/access-requests", id: "review_requests", label: "Review access queue", priority: "primary" },
    { description: "Inspect grants", href: "/admin/access-grants", id: "inspect_grants", label: "Inspect active grants", priority: "primary" },
    { description: "Inspect runtime", href: "/admin/runtime", id: "inspect_runtime", label: "Inspect runtime", priority: "secondary" },
    { description: "Inspect audit", href: "/admin/audit", id: "inspect_audit", label: "Inspect audit trail", priority: "secondary" },
    { description: "Triage incidents", href: "/admin/incidents", id: "inspect_incidents", label: "Triage incidents", priority: "primary" },
  ],
  operatorLinks: [
    { description: "Overview", href: "/admin", id: "overview", label: "Operations" },
    { description: "Runtime", href: "/admin/runtime", id: "runtime", label: "Runtime" },
    { description: "Requests", href: "/admin/access-requests", id: "access_requests", label: "Requests" },
    { description: "Grants", href: "/admin/access-grants", id: "access_grants", label: "Grants" },
    { description: "Audit", href: "/admin/audit", id: "audit", label: "Audit" },
    { description: "Incidents", href: "/admin/incidents", id: "incidents", label: "Incidents" },
  ],
  productionPolicy: {
    hostedBaasProductionBackend: false,
    prototypeSupabaseConfigured: false,
    secretsIncluded: false,
    supabaseProductionBackend: false,
  },
  productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
  readiness: {
    fail: 0,
    items: [
      { action: "Open runtime diagnostics.", detail: "Runtime diagnostics report pass.", id: "runtime", label: "Runtime diagnostics", route: "/admin/runtime", status: "pass" },
      { action: "Inspect recent audit events.", detail: "Recent audit sample has no failed backend actions.", id: "audit", label: "Audit activity", route: "/admin/audit", status: "pass" },
      { action: "Process open access requests.", detail: "1 open supplier access request.", id: "access_review", label: "Access review queue", route: "/admin/access-requests", status: "pass" },
      { action: "Review active grants.", detail: "1 active grant.", id: "access_grants", label: "Grant hygiene", route: "/admin/access-grants", status: "pass" },
      { action: "Triage open incidents.", detail: "1 open incident.", id: "incidents", label: "Incident queue", route: "/admin/incidents", status: "warn" },
    ],
    pass: 4,
    status: "pass",
    warn: 0,
  },
  requestId: "00000000-0000-4000-8000-000000000199",
  runtime: {
    diagnostics: {
      capacityPlan: {
        backpressureStrategy: "Bounded previews.",
        cacheStrategy: "Explicit refresh.",
        databaseStrategy: "Indexed queries.",
        failureMode: "No fallback fabrication.",
        loadTestPlan: "Smoke test path.",
        observabilityPlan: "Audit and metrics.",
        readProfile: "Low-frequency admin read.",
        writeProfile: "No writes.",
      },
      diagnostics: {
        checks: [{ action: "Check policy", id: "production_policy", label: "Policy", severity: "critical", status: "pass", summary: "Safe." }],
        failCount: 0,
        overallStatus: "pass",
        passCount: 1,
        productionReady: true,
        warnCount: 0,
      },
      generatedAt: "2026-05-20T10:00:00.000Z",
      ok: true,
      productionPolicy: {
        hostedBaasProductionBackend: false,
        prototypeSupabaseConfigured: false,
        secretsIncluded: false,
        supabaseProductionBackend: false,
      },
      productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
      requestId: "00000000-0000-4000-8000-000000000299",
      selfHostedBackend: true,
    },
    status: {
      adminAudit: { auditMaxInFlight: 2_000, exportMaxWindowDays: 31, retentionDays: 365 },
      auth: {
        rateLimitDriver: "redis",
        rateLimitFailMode: "closed",
        sessionCacheDriver: "redis",
        sessionCacheFailMode: "closed",
        sessionCacheTtlMs: 300_000,
        signInFailureWindowMs: 900_000,
        signInMaxFailedAttempts: 5,
      },
      lifecycle: {
        activeRequests: 0,
        drainSignalPresent: false,
        drainStarted: false,
        draining: false,
        shutdownDrainDelayMs: 5_000,
        shutdownGraceTimeoutMs: 30_000,
      },
      ok: true,
      productionPolicy: {
        hostedBaasProductionBackend: false,
        prototypeSupabaseConfigured: false,
        secretsIncluded: false,
        supabaseProductionBackend: false,
      },
      productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
      requestGuardrails: {
        headersTimeoutMs: 10_000,
        jsonBodyMaxBytes: 65_536,
        keepAliveTimeoutMs: 5_000,
        maxHeaderBytes: 16_384,
        maxUploadBytes: 10_485_760,
        requestBodyIdleTimeoutMs: 5_000,
        requestTimeoutMs: 15_000,
      },
      requestId: "00000000-0000-4000-8000-000000000399",
      runtime: {
        accountRepository: "postgres",
        auditDriver: "postgres",
        authObservabilityDriver: "console",
        errorObservabilityDriver: "console",
        metricsDriver: "prometheus",
        nodeEnv: "production",
        requestObservabilityDriver: "console",
        storageDriver: "local",
      },
      selfHostedBackend: true,
    },
  },
  selfHostedBackend: true,
});

describe("useAdminOperationsOverview", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminOperationsOverview(adminSession));

    expect(result.current.status).toBe("disabled");
  });

  it("loads overview and supports explicit refresh", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(overviewPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() => useAdminOperationsOverview(adminSession));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.productionScaleBaseline.targetConcurrentUsers).toBe(10_000);
    expect(result.current.data?.access.review.summary.open).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  });

  it("maps 403 responses to forbidden state", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({
          error: { code: "admin_role_required", message: "Admin role is required." },
        }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ),
    );

    const { result } = renderHook(() => useAdminOperationsOverview(adminSession));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
