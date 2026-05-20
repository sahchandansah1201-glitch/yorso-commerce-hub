import { z } from "zod";

export const adminRuntimeStatusDriverSchema = z.enum([
  "audit_log",
  "console",
  "disabled",
  "local",
  "memory",
  "postgres",
  "prometheus",
  "redis",
]);

export const adminRuntimeStatusSchema = z.object({
  ok: z.literal(true),
  requestId: z.string().uuid(),
  selfHostedBackend: z.literal(true),
  productionScaleBaseline: z.object({
    targetConcurrentUsers: z.literal(10_000),
    status: z.literal("policy_required"),
  }),
  runtime: z.object({
    nodeEnv: z.enum(["development", "test", "production"]),
    accountRepository: z.enum(["memory", "postgres"]),
    storageDriver: z.enum(["local"]),
    metricsDriver: z.enum(["disabled", "prometheus"]),
    requestObservabilityDriver: z.enum(["disabled", "console"]),
    errorObservabilityDriver: z.enum(["disabled", "console"]),
    authObservabilityDriver: z.enum(["disabled", "console"]),
    auditDriver: z.enum(["disabled", "console", "postgres"]),
  }),
  auth: z.object({
    rateLimitDriver: z.enum(["audit_log", "memory", "redis"]),
    rateLimitFailMode: z.enum(["open", "closed"]),
    signInFailureWindowMs: z.number().int().min(60_000),
    signInMaxFailedAttempts: z.number().int().min(2),
    sessionCacheDriver: z.enum(["disabled", "memory", "redis"]),
    sessionCacheFailMode: z.enum(["open", "closed"]),
    sessionCacheTtlMs: z.number().int().min(60_000),
  }),
  requestGuardrails: z.object({
    requestTimeoutMs: z.number().int().min(500),
    requestBodyIdleTimeoutMs: z.number().int().min(500),
    headersTimeoutMs: z.number().int().min(500),
    keepAliveTimeoutMs: z.number().int().min(500),
    maxHeaderBytes: z.number().int().min(1024),
    jsonBodyMaxBytes: z.number().int().min(1024),
    maxUploadBytes: z.number().int().min(1),
  }),
  adminAudit: z.object({
    exportMaxWindowDays: z.number().int().min(1),
    retentionDays: z.number().int().min(30),
    auditMaxInFlight: z.number().int().min(1),
  }),
  lifecycle: z.object({
    draining: z.boolean(),
    activeRequests: z.number().int().min(0),
    drainSignalPresent: z.boolean(),
    drainStarted: z.boolean(),
    shutdownDrainDelayMs: z.number().int().min(0),
    shutdownGraceTimeoutMs: z.number().int().min(1_000),
  }),
  productionPolicy: z.object({
    supabaseProductionBackend: z.literal(false),
    hostedBaasProductionBackend: z.literal(false),
    prototypeSupabaseConfigured: z.boolean(),
    secretsIncluded: z.literal(false),
  }),
});

export type AdminRuntimeStatus = z.infer<typeof adminRuntimeStatusSchema>;

export const adminRuntimeDiagnosticStatusSchema = z.enum(["pass", "warn", "fail"]);

export const adminRuntimeDiagnosticSeveritySchema = z.enum(["info", "warning", "critical"]);

export const adminRuntimeDiagnosticCheckSchema = z.object({
  action: z.string().min(1),
  id: z.enum([
    "production_policy",
    "capacity_baseline",
    "auth_rate_limit",
    "session_cache",
    "observability",
    "audit_durability",
    "request_guardrails",
    "lifecycle_drain",
  ]),
  label: z.string().min(1),
  severity: adminRuntimeDiagnosticSeveritySchema,
  status: adminRuntimeDiagnosticStatusSchema,
  summary: z.string().min(1),
});

export const adminRuntimeDiagnosticsSchema = z.object({
  ok: z.literal(true),
  requestId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  selfHostedBackend: z.literal(true),
  productionScaleBaseline: z.object({
    targetConcurrentUsers: z.literal(10_000),
    status: z.literal("policy_required"),
  }),
  diagnostics: z.object({
    overallStatus: adminRuntimeDiagnosticStatusSchema,
    productionReady: z.boolean(),
    passCount: z.number().int().min(0),
    warnCount: z.number().int().min(0),
    failCount: z.number().int().min(0),
    checks: z.array(adminRuntimeDiagnosticCheckSchema).min(1),
  }),
  capacityPlan: z.object({
    readProfile: z.string().min(1),
    writeProfile: z.string().min(1),
    cacheStrategy: z.string().min(1),
    backpressureStrategy: z.string().min(1),
    databaseStrategy: z.string().min(1),
    failureMode: z.string().min(1),
    observabilityPlan: z.string().min(1),
    loadTestPlan: z.string().min(1),
  }),
  productionPolicy: z.object({
    supabaseProductionBackend: z.literal(false),
    hostedBaasProductionBackend: z.literal(false),
    prototypeSupabaseConfigured: z.boolean(),
    secretsIncluded: z.literal(false),
  }),
});

export type AdminRuntimeDiagnosticStatus = z.infer<typeof adminRuntimeDiagnosticStatusSchema>;
export type AdminRuntimeDiagnosticCheck = z.infer<typeof adminRuntimeDiagnosticCheckSchema>;
export type AdminRuntimeDiagnostics = z.infer<typeof adminRuntimeDiagnosticsSchema>;
