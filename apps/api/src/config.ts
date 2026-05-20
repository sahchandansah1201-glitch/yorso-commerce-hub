import { z } from "zod";

const optionalUrlSchema = z.string().url().or(z.literal(""));

export const apiConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]).default("development"),
  host: z.string().min(1).default("0.0.0.0"),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  accountRepository: z.enum(["memory", "postgres"]).default("memory"),
  publicAppUrl: z.string().url().default("http://localhost:8080"),
  databaseUrl: z.string().regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a PostgreSQL connection string"),
  redisUrl: z.string().regex(/^redis:\/\//, "REDIS_URL must be a Redis connection string"),
  authRateLimitDriver: z.enum(["audit_log", "memory", "redis"]).default("audit_log"),
  authRateLimitFailMode: z.enum(["open", "closed"]).default("open"),
  authSignInFailureWindowMs: z.coerce.number().int().min(60_000).max(24 * 60 * 60 * 1000).default(900_000),
  authSignInMaxFailedAttempts: z.coerce.number().int().min(2).max(100).default(5),
  authRateLimitKeyPrefix: z.string().min(1).default("yorso:auth"),
  authSessionCacheDriver: z.enum(["disabled", "memory", "redis"]).default("disabled"),
  authSessionCacheFailMode: z.enum(["open", "closed"]).default("open"),
  authSessionCacheTtlMs: z.coerce.number().int().min(60_000).max(7 * 24 * 60 * 60 * 1000).default(300_000),
  authSessionCacheKeyPrefix: z.string().min(1).default("yorso:auth"),
  auditDriver: z.enum(["disabled", "console", "postgres"]).default("disabled"),
  auditMaxInFlight: z.coerce.number().int().min(1).max(50_000).default(2_000),
  adminAuditExportMaxWindowDays: z.coerce.number().int().min(1).max(366).default(31),
  adminAuditRetentionDays: z.coerce.number().int().min(30).max(3_650).default(365),
  authObservabilityDriver: z.enum(["disabled", "console"]).default("disabled"),
  errorObservabilityDriver: z.enum(["disabled", "console"]).default("disabled"),
  metricsDriver: z.enum(["disabled", "prometheus"]).default("disabled"),
  requestObservabilityDriver: z.enum(["disabled", "console"]).default("disabled"),
  healthReadinessTimeoutMs: z.coerce.number().int().min(100).max(5_000).default(750),
  requestTimeoutMs: z.coerce.number().int().min(500).max(120_000).default(15_000),
  requestBodyIdleTimeoutMs: z.coerce.number().int().min(500).max(60_000).default(5_000),
  headersTimeoutMs: z.coerce.number().int().min(500).max(120_000).default(16_000),
  keepAliveTimeoutMs: z.coerce.number().int().min(500).max(120_000).default(5_000),
  maxHeaderBytes: z.coerce.number().int().min(1024).max(64 * 1024).default(16 * 1024),
  jsonBodyMaxBytes: z.coerce.number().int().min(1024).max(1024 * 1024).default(64 * 1024),
  shutdownDrainDelayMs: z.coerce.number().int().min(0).max(60_000).default(5_000),
  shutdownGraceTimeoutMs: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
  s3Endpoint: z.string().url(),
  s3Bucket: z.string().min(1),
  storageDriver: z.enum(["local"]).default("local"),
  storageLocalRoot: z.string().min(1).default(".data/api-uploads"),
  maxUploadBytes: z.coerce.number().int().min(1).max(25 * 1024 * 1024).default(8 * 1024 * 1024),
  sessionSecret: z.string().min(24),
  jwtSecret: z.string().min(24),
  supabaseUrl: optionalUrlSchema.default(""),
  supabasePublishableKey: z.string().default(""),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

export type ApiConfigEnv = Partial<Record<string, string | undefined>>;

const localDefaults = {
  NODE_ENV: "development",
  YORSO_API_HOST: "0.0.0.0",
  YORSO_API_PORT: "3000",
  ACCOUNT_REPOSITORY: "memory",
  YORSO_PUBLIC_APP_URL: "http://localhost:8080",
  DATABASE_URL: "postgres://yorso_app:change-me-local-only@localhost:6432/yorso",
  REDIS_URL: "redis://localhost:6379",
  AUTH_RATE_LIMIT_DRIVER: "audit_log",
  AUTH_RATE_LIMIT_FAIL_MODE: "open",
  AUTH_SIGN_IN_FAILURE_WINDOW_MS: "900000",
  AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS: "5",
  AUTH_RATE_LIMIT_KEY_PREFIX: "yorso:auth",
  AUTH_SESSION_CACHE_DRIVER: "disabled",
  AUTH_SESSION_CACHE_FAIL_MODE: "open",
  AUTH_SESSION_CACHE_TTL_MS: "300000",
  AUTH_SESSION_CACHE_KEY_PREFIX: "yorso:auth",
  YORSO_AUDIT_DRIVER: "disabled",
  YORSO_AUDIT_MAX_IN_FLIGHT: "2000",
  YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS: "31",
  YORSO_ADMIN_AUDIT_RETENTION_DAYS: "365",
  AUTH_OBSERVABILITY_DRIVER: "disabled",
  YORSO_ERROR_OBSERVABILITY_DRIVER: "disabled",
  YORSO_METRICS_DRIVER: "disabled",
  YORSO_REQUEST_OBSERVABILITY_DRIVER: "disabled",
  HEALTH_READINESS_TIMEOUT_MS: "750",
  YORSO_REQUEST_TIMEOUT_MS: "15000",
  YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS: "5000",
  YORSO_HEADERS_TIMEOUT_MS: "16000",
  YORSO_KEEP_ALIVE_TIMEOUT_MS: "5000",
  YORSO_MAX_HEADER_BYTES: "16384",
  YORSO_JSON_BODY_MAX_BYTES: "65536",
  YORSO_SHUTDOWN_DRAIN_DELAY_MS: "5000",
  YORSO_SHUTDOWN_GRACE_TIMEOUT_MS: "30000",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "yorso-local",
  STORAGE_DRIVER: "local",
  STORAGE_LOCAL_ROOT: ".data/api-uploads",
  YORSO_MAX_UPLOAD_BYTES: "8388608",
  YORSO_SESSION_SECRET: "change-me-32-bytes-minimum",
  YORSO_JWT_SECRET: "change-me-32-bytes-minimum",
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_PUBLISHABLE_KEY: "",
} satisfies Record<string, string>;

export function loadApiConfig(env: ApiConfigEnv = process.env, options: { allowLocalDefaults?: boolean } = {}) {
  const source = options.allowLocalDefaults === false ? env : { ...localDefaults, ...env };

  return apiConfigSchema.parse({
    nodeEnv: source.NODE_ENV,
    host: source.YORSO_API_HOST,
    port: source.YORSO_API_PORT,
    accountRepository: source.ACCOUNT_REPOSITORY,
    publicAppUrl: source.YORSO_PUBLIC_APP_URL,
    databaseUrl: source.DATABASE_URL,
    redisUrl: source.REDIS_URL,
    authRateLimitDriver: source.AUTH_RATE_LIMIT_DRIVER,
    authRateLimitFailMode: source.AUTH_RATE_LIMIT_FAIL_MODE,
    authSignInFailureWindowMs: source.AUTH_SIGN_IN_FAILURE_WINDOW_MS,
    authSignInMaxFailedAttempts: source.AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS,
    authRateLimitKeyPrefix: source.AUTH_RATE_LIMIT_KEY_PREFIX,
    authSessionCacheDriver: source.AUTH_SESSION_CACHE_DRIVER,
    authSessionCacheFailMode: source.AUTH_SESSION_CACHE_FAIL_MODE,
    authSessionCacheTtlMs: source.AUTH_SESSION_CACHE_TTL_MS,
    authSessionCacheKeyPrefix: source.AUTH_SESSION_CACHE_KEY_PREFIX,
    auditDriver: source.YORSO_AUDIT_DRIVER,
    auditMaxInFlight: source.YORSO_AUDIT_MAX_IN_FLIGHT,
    adminAuditExportMaxWindowDays: source.YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS,
    adminAuditRetentionDays: source.YORSO_ADMIN_AUDIT_RETENTION_DAYS,
    authObservabilityDriver: source.AUTH_OBSERVABILITY_DRIVER,
    errorObservabilityDriver: source.YORSO_ERROR_OBSERVABILITY_DRIVER,
    metricsDriver: source.YORSO_METRICS_DRIVER,
    requestObservabilityDriver: source.YORSO_REQUEST_OBSERVABILITY_DRIVER,
    healthReadinessTimeoutMs: source.HEALTH_READINESS_TIMEOUT_MS,
    requestTimeoutMs: source.YORSO_REQUEST_TIMEOUT_MS,
    requestBodyIdleTimeoutMs: source.YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS,
    headersTimeoutMs: source.YORSO_HEADERS_TIMEOUT_MS,
    keepAliveTimeoutMs: source.YORSO_KEEP_ALIVE_TIMEOUT_MS,
    maxHeaderBytes: source.YORSO_MAX_HEADER_BYTES,
    jsonBodyMaxBytes: source.YORSO_JSON_BODY_MAX_BYTES,
    shutdownDrainDelayMs: source.YORSO_SHUTDOWN_DRAIN_DELAY_MS,
    shutdownGraceTimeoutMs: source.YORSO_SHUTDOWN_GRACE_TIMEOUT_MS,
    s3Endpoint: source.S3_ENDPOINT,
    s3Bucket: source.S3_BUCKET,
    storageDriver: source.STORAGE_DRIVER,
    storageLocalRoot: source.STORAGE_LOCAL_ROOT,
    maxUploadBytes: source.YORSO_MAX_UPLOAD_BYTES,
    sessionSecret: source.YORSO_SESSION_SECRET,
    jwtSecret: source.YORSO_JWT_SECRET,
    supabaseUrl: source.VITE_SUPABASE_URL,
    supabasePublishableKey: source.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function assertSelfHostedProductionRuntime(config: ApiConfig) {
  if (config.nodeEnv === "production" && (config.supabaseUrl || config.supabasePublishableKey)) {
    throw new Error("Supabase env values must stay empty in production self-hosted API config.");
  }
  if (config.nodeEnv === "production" && config.authRateLimitDriver !== "redis") {
    throw new Error("Production self-hosted API must use AUTH_RATE_LIMIT_DRIVER=redis.");
  }
  if (config.nodeEnv === "production" && config.authRateLimitFailMode !== "closed") {
    throw new Error("Production self-hosted API must use AUTH_RATE_LIMIT_FAIL_MODE=closed.");
  }
  if (config.nodeEnv === "production" && config.authSessionCacheDriver !== "redis") {
    throw new Error("Production self-hosted API must use AUTH_SESSION_CACHE_DRIVER=redis.");
  }
  if (config.nodeEnv === "production" && config.authSessionCacheFailMode !== "closed") {
    throw new Error("Production self-hosted API must use AUTH_SESSION_CACHE_FAIL_MODE=closed.");
  }
  if (config.nodeEnv === "production" && config.authObservabilityDriver !== "console") {
    throw new Error("Production self-hosted API must use AUTH_OBSERVABILITY_DRIVER=console.");
  }
  if (config.nodeEnv === "production" && config.auditDriver !== "postgres") {
    throw new Error("Production self-hosted API must use YORSO_AUDIT_DRIVER=postgres.");
  }
  if (config.nodeEnv === "production" && config.adminAuditRetentionDays < 365) {
    throw new Error("Production self-hosted API must keep YORSO_ADMIN_AUDIT_RETENTION_DAYS at 365 or higher.");
  }
  if (config.nodeEnv === "production" && config.adminAuditExportMaxWindowDays > 31) {
    throw new Error("Production self-hosted API must keep YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS at 31 or lower.");
  }
  if (config.nodeEnv === "production" && config.errorObservabilityDriver !== "console") {
    throw new Error("Production self-hosted API must use YORSO_ERROR_OBSERVABILITY_DRIVER=console.");
  }
  if (config.nodeEnv === "production" && config.metricsDriver !== "prometheus") {
    throw new Error("Production self-hosted API must use YORSO_METRICS_DRIVER=prometheus.");
  }
  if (config.nodeEnv === "production" && config.requestObservabilityDriver !== "console") {
    throw new Error("Production self-hosted API must use YORSO_REQUEST_OBSERVABILITY_DRIVER=console.");
  }
}

export const assertSupabaseIsPrototypeOnly = assertSelfHostedProductionRuntime;
