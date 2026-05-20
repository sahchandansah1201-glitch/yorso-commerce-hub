#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  ".env.production.example",
  ".github/workflows/ci.yml",
  "infra/docker-compose.yml",
  "docs/backend/self-hosted-production-deploy.md",
  "docs/backend/self-hosted-production-policy.md",
  "docs/backend/production-scale-baseline.md",
  "package.json",
  "scripts/smoke-frontend-no-supabase-env.mjs",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const ciWorkflow = read(".github/workflows/ci.yml");
const productionEnv = read(".env.production.example");
const compose = read("infra/docker-compose.yml");
const deployDoc = read("docs/backend/self-hosted-production-deploy.md");
const policyDoc = read("docs/backend/self-hosted-production-policy.md");
const baselineDoc = read("docs/backend/production-scale-baseline.md");
const noSupabaseSmoke = read("scripts/smoke-frontend-no-supabase-env.mjs");

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

const requirePattern = (name, text, pattern, label = pattern.toString()) => {
  if (!pattern.test(text)) failures.push(`${name}: missing ${label}`);
};

const forbidPattern = (name, text, pattern, label = pattern.toString()) => {
  if (pattern.test(text)) failures.push(`${name}: forbidden ${label}`);
};

if (pkg.scripts["check:self-hosted-production-runtime"] !== "node scripts/check-self-hosted-production-runtime.mjs") {
  failures.push("package.json: check:self-hosted-production-runtime must run this guard");
}

if (!pkg.scripts["ci:core"]?.includes("npm run check:self-hosted-production-runtime")) {
  failures.push("package.json: ci:core must run check:self-hosted-production-runtime");
}

if (!pkg.scripts["smoke:e2e:frontend-no-supabase-env"]?.includes("scripts/smoke-frontend-no-supabase-env.mjs")) {
  failures.push("package.json: no-Supabase frontend smoke wrapper must remain available");
}

requireText(".github/workflows/ci.yml", ciWorkflow, "Run core CI");
requireText("scripts/smoke-frontend-no-supabase-env.mjs", noSupabaseSmoke, "frontend_no_supabase_env_smoke=ok");

for (const key of [
  "NODE_ENV",
  "YORSO_PUBLIC_APP_URL",
  "YORSO_API_URL",
  "VITE_YORSO_API_URL",
  "YORSO_API_PORT",
  "ACCOUNT_REPOSITORY",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_DB",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "DATABASE_URL",
  "MIGRATION_DATABASE_URL",
  "MIGRATION_APPLIED_BY",
  "PGBOUNCER_DATABASE_URL",
  "REDIS_URL",
  "AUTH_RATE_LIMIT_DRIVER",
  "AUTH_RATE_LIMIT_FAIL_MODE",
  "AUTH_SIGN_IN_FAILURE_WINDOW_MS",
  "AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS",
  "AUTH_RATE_LIMIT_KEY_PREFIX",
  "AUTH_SESSION_CACHE_DRIVER",
  "AUTH_SESSION_CACHE_FAIL_MODE",
  "AUTH_SESSION_CACHE_TTL_MS",
  "AUTH_SESSION_CACHE_KEY_PREFIX",
  "YORSO_AUDIT_DRIVER",
  "YORSO_AUDIT_MAX_IN_FLIGHT",
  "YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS",
  "YORSO_ADMIN_AUDIT_RETENTION_DAYS",
  "AUTH_OBSERVABILITY_DRIVER",
  "YORSO_ERROR_OBSERVABILITY_DRIVER",
  "YORSO_METRICS_DRIVER",
  "YORSO_REQUEST_OBSERVABILITY_DRIVER",
  "HEALTH_READINESS_TIMEOUT_MS",
  "YORSO_REQUEST_TIMEOUT_MS",
  "YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS",
  "YORSO_HEADERS_TIMEOUT_MS",
  "YORSO_KEEP_ALIVE_TIMEOUT_MS",
  "YORSO_MAX_HEADER_BYTES",
  "YORSO_JSON_BODY_MAX_BYTES",
  "YORSO_SHUTDOWN_DRAIN_DELAY_MS",
  "YORSO_SHUTDOWN_GRACE_TIMEOUT_MS",
  "STORAGE_DRIVER",
  "STORAGE_LOCAL_ROOT",
  "YORSO_MAX_UPLOAD_BYTES",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "YORSO_SESSION_SECRET",
  "YORSO_JWT_SECRET",
]) {
  requirePattern(".env.production.example", productionEnv, new RegExp(`^${key}=`, "m"), `env key ${key}`);
}

for (const marker of [
  "NODE_ENV=production",
  "ACCOUNT_REPOSITORY=postgres",
  "VITE_YORSO_API_URL=https://api.yorso.example",
  "DATABASE_URL=postgres://",
  "MIGRATION_DATABASE_URL=postgres://",
  "PGBOUNCER_DATABASE_URL=postgres://",
  "REDIS_URL=redis://redis:6379",
  "AUTH_RATE_LIMIT_DRIVER=redis",
  "AUTH_RATE_LIMIT_FAIL_MODE=closed",
  "AUTH_SIGN_IN_FAILURE_WINDOW_MS=900000",
  "AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS=5",
  "AUTH_RATE_LIMIT_KEY_PREFIX=yorso:auth",
  "AUTH_SESSION_CACHE_DRIVER=redis",
  "AUTH_SESSION_CACHE_FAIL_MODE=closed",
  "AUTH_SESSION_CACHE_TTL_MS=300000",
  "AUTH_SESSION_CACHE_KEY_PREFIX=yorso:auth",
  "YORSO_AUDIT_DRIVER=postgres",
  "YORSO_AUDIT_MAX_IN_FLIGHT=2000",
  "YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS=31",
  "YORSO_ADMIN_AUDIT_RETENTION_DAYS=365",
  "AUTH_OBSERVABILITY_DRIVER=console",
  "YORSO_ERROR_OBSERVABILITY_DRIVER=console",
  "YORSO_METRICS_DRIVER=prometheus",
  "YORSO_REQUEST_OBSERVABILITY_DRIVER=console",
  "HEALTH_READINESS_TIMEOUT_MS=750",
  "YORSO_REQUEST_TIMEOUT_MS=15000",
  "YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS=5000",
  "YORSO_HEADERS_TIMEOUT_MS=16000",
  "YORSO_KEEP_ALIVE_TIMEOUT_MS=5000",
  "YORSO_MAX_HEADER_BYTES=16384",
  "YORSO_JSON_BODY_MAX_BYTES=65536",
  "YORSO_SHUTDOWN_DRAIN_DELAY_MS=5000",
  "YORSO_SHUTDOWN_GRACE_TIMEOUT_MS=30000",
  "STORAGE_DRIVER=local",
  "STORAGE_LOCAL_ROOT=/var/lib/yorso/uploads",
]) {
  requireText(".env.production.example", productionEnv, marker);
}

for (const [name, text] of [
  [".env.production.example", productionEnv],
  ["infra/docker-compose.yml", compose],
]) {
  forbidPattern(name, text, /SUPABASE/i, "Supabase production runtime env");
  forbidPattern(name, text, /FIREBASE/i, "Firebase production runtime env");
  forbidPattern(name, text, /APPWRITE/i, "Appwrite production runtime env");
  forbidPattern(name, text, /CLERK/i, "Clerk production runtime env");
  forbidPattern(name, text, /AUTH0/i, "Auth0 production runtime env");
  forbidPattern(name, text, /service_role/i, "service role key text");
  forbidPattern(name, text, /eyJ[A-Za-z0-9_-]{20,}/, "JWT-looking token");
}

for (const marker of [
  "api:",
  "postgres:",
  "pgbouncer:",
  "redis:",
  "minio:",
  "DATABASE_URL: postgres://${POSTGRES_USER",
  "REDIS_URL: redis://redis:6379",
  "AUTH_RATE_LIMIT_DRIVER: redis",
  "AUTH_RATE_LIMIT_FAIL_MODE: closed",
  "AUTH_SESSION_CACHE_DRIVER: redis",
  "AUTH_SESSION_CACHE_FAIL_MODE: closed",
  "YORSO_AUDIT_DRIVER: postgres",
  "YORSO_AUDIT_MAX_IN_FLIGHT:",
  "YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS:",
  "YORSO_ADMIN_AUDIT_RETENTION_DAYS:",
  "AUTH_OBSERVABILITY_DRIVER: console",
  "YORSO_ERROR_OBSERVABILITY_DRIVER: console",
  "YORSO_METRICS_DRIVER: prometheus",
  "YORSO_REQUEST_OBSERVABILITY_DRIVER: console",
  "HEALTH_READINESS_TIMEOUT_MS:",
  "YORSO_REQUEST_TIMEOUT_MS:",
  "YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS:",
  "YORSO_HEADERS_TIMEOUT_MS:",
  "YORSO_KEEP_ALIVE_TIMEOUT_MS:",
  "YORSO_MAX_HEADER_BYTES:",
  "YORSO_JSON_BODY_MAX_BYTES:",
  "YORSO_SHUTDOWN_DRAIN_DELAY_MS:",
  "YORSO_SHUTDOWN_GRACE_TIMEOUT_MS:",
  "stop_grace_period:",
  "/health/ready",
  "S3_ENDPOINT: http://minio:9000",
  "STORAGE_DRIVER: local",
  "STORAGE_LOCAL_ROOT: /var/lib/yorso/uploads",
]) {
  requireText("infra/docker-compose.yml", compose, marker);
}

for (const marker of [
  "Batch: #72",
  "Self-Hosted Production Deploy",
  "Minimum production topology",
  "Production env must not contain",
  "VITE_SUPABASE_URL",
  "Firebase, Appwrite, Clerk or Auth0",
  "check:self-hosted-production-runtime",
]) {
  requireText("docs/backend/self-hosted-production-deploy.md", deployDoc, marker);
}

for (const marker of [
  "Batch #72",
  "check:self-hosted-production-runtime",
  ".env.production.example",
]) {
  requireText("docs/backend/self-hosted-production-policy.md", policyDoc, marker);
}

for (const marker of [
  "Batch #72",
  "self-hosted production runtime guard",
  ".env.production.example",
]) {
  requireText("docs/backend/production-scale-baseline.md", baselineDoc, marker);
}

if (failures.length > 0) {
  console.error("Self-hosted production runtime check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Self-hosted production runtime check passed.");
console.log("- .env.production.example contains only self-hosted production runtime keys.");
console.log("- infra/docker-compose.yml does not require Supabase or similar hosted BaaS env.");
console.log("- docs/backend/self-hosted-production-deploy.md documents owned-server deployment.");
console.log("- ci:core enforces check:self-hosted-production-runtime.");
