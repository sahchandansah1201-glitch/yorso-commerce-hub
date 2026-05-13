#!/usr/bin/env node
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");

const compose = read("infra/docker-compose.yml");
const envExample = read(".env.example");
const infraReadme = read("infra/README.md");
const architecture = read("docs/backend/self-hosted-backend-architecture.md");

const failures = [];

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

const requirePattern = (name, text, pattern, label = pattern.toString()) => {
  if (!pattern.test(text)) failures.push(`${name}: missing ${label}`);
};

const forbidPattern = (name, text, pattern, label = pattern.toString()) => {
  if (pattern.test(text)) failures.push(`${name}: forbidden ${label}`);
};

const requiredServices = [
  ["api", /(^|\n)  api:\n/],
  ["postgres", /(^|\n)  postgres:\n/],
  ["pgbouncer", /(^|\n)  pgbouncer:\n/],
  ["redis", /(^|\n)  redis:\n/],
  ["minio", /(^|\n)  minio:\n/],
];

for (const [service, pattern] of requiredServices) {
  requirePattern("infra/docker-compose.yml", compose, pattern, `service ${service}`);
}

const requiredComposeMarkers = [
  "dockerfile: apps/api/Dockerfile",
  "YORSO_API_HOST: 0.0.0.0",
  "ACCOUNT_REPOSITORY: postgres",
  "DATABASE_URL: postgres://${POSTGRES_USER",
  "REDIS_URL: redis://redis:6379",
  "S3_ENDPOINT: http://minio:9000",
  "VITE_SUPABASE_URL: \"\"",
  "VITE_SUPABASE_PUBLISHABLE_KEY: \"\"",
  "image: postgres:17-alpine",
  "image: edoburu/pgbouncer:",
  "image: redis:7-alpine",
  "image: minio/minio:",
  "condition: service_healthy",
  "POOL_MODE: transaction",
  "MAX_CLIENT_CONN:",
  "DEFAULT_POOL_SIZE:",
  "pg_isready",
  "--appendonly",
  "--console-address",
  "9000:9000",
  "9001:9001",
  "yorso-postgres-data:",
  "yorso-redis-data:",
  "yorso-minio-data:",
];

for (const marker of requiredComposeMarkers) {
  requireText("infra/docker-compose.yml", compose, marker);
}

const requiredEnvKeys = [
  "YORSO_PUBLIC_APP_URL",
  "YORSO_API_URL",
  "YORSO_API_PORT",
  "ACCOUNT_REPOSITORY",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_DB",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "DATABASE_URL",
  "PGBOUNCER_PORT",
  "PGBOUNCER_DATABASE_URL",
  "REDIS_URL",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "YORSO_SESSION_SECRET",
  "YORSO_JWT_SECRET",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

for (const key of requiredEnvKeys) {
  requirePattern(".env.example", envExample, new RegExp(`^${key}=`, "m"), `env key ${key}`);
}

requireText(".env.example", envExample, "Supabase prototype only. Do not use as production backend target.");
requireText("infra/README.md", infraReadme, "running YORSO without Supabase as a production dependency");
requireText("docs/backend/self-hosted-backend-architecture.md", architecture, "YORSO production backend must be self-hosted");

forbidPattern(".env.example", envExample, /VITE_SUPABASE_URL=https?:\/\//, "non-empty Supabase URL");
forbidPattern(".env.example", envExample, /VITE_SUPABASE_PUBLISHABLE_KEY=.+/m, "non-empty Supabase public key");
forbidPattern(".env.example", envExample, /service_role/i, "service role key text");
forbidPattern(".env.example", envExample, /eyJ[A-Za-z0-9_-]{20,}/, "JWT-looking token");
forbidPattern(".env.example", envExample, /postgres:\/\/[^@\n]+@[^/\n]*supabase/i, "Supabase database URL");

if (failures.length > 0) {
  console.error("Self-hosted infra check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Self-hosted infra check passed.");
console.log("- infra/docker-compose.yml: API, postgres, PgBouncer, Redis and MinIO are declared.");
console.log("- .env.example: self-hosted runtime keys are present and Supabase values are empty.");
console.log("- docs: self-hosted production direction is documented.");
