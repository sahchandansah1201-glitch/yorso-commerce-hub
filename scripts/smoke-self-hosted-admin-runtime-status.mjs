#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-runtime-smoke-"));
const baseUrl = `http://127.0.0.1:${freePort}`;
const childLogs = { stdout: "", stderr: "" };
const api = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    NODE_ENV: "test",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(freePort),
    YORSO_PUBLIC_APP_URL: "http://localhost:8080",
    ACCOUNT_REPOSITORY: "memory",
    AUTH_RATE_LIMIT_DRIVER: "memory",
    AUTH_RATE_LIMIT_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    YORSO_AUDIT_DRIVER: "console",
    YORSO_METRICS_DRIVER: "prometheus",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
    YORSO_ERROR_OBSERVABILITY_DRIVER: "console",
    AUTH_OBSERVABILITY_DRIVER: "console",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: path.join(storageRoot, "uploads"),
    VITE_SUPABASE_URL: "",
    VITE_SUPABASE_PUBLISHABLE_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

api.stdout?.on("data", (chunk) => {
  childLogs.stdout += chunk.toString();
});
api.stderr?.on("data", (chunk) => {
  childLogs.stderr += chunk.toString();
});

try {
  await waitForApi(baseUrl, api);
  await runSmoke(baseUrl);
  console.log("self_hosted_admin_runtime_status_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_runtime_status_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  if (childLogs.stdout.trim()) console.error(`api stdout:\n${childLogs.stdout.trim()}`);
  if (childLogs.stderr.trim()) console.error(`api stderr:\n${childLogs.stderr.trim()}`);
  process.exitCode = 1;
} finally {
  if (api.exitCode === null) {
    api.kill("SIGTERM");
    await onceExit(api, 3000).catch(() => api.kill("SIGKILL"));
  }
  await rm(storageRoot, { recursive: true, force: true });
}

async function runSmoke(baseUrl) {
  const missingSession = await fetch(`${baseUrl}/v1/admin/runtime/status`);
  assertStatus(missingSession, 401, "admin runtime missing session");
  console.log("admin_runtime_status_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/runtime/status`, { headers: buyerHeaders });
  assertStatus(buyerRead, 403, "admin runtime buyer role guard");
  const buyerReadBody = await buyerRead.json();
  assertEqual(buyerReadBody.error?.code, "admin_role_required", "admin runtime buyer role code");
  console.log("admin_runtime_status_role_guard=ok");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  const status = await jsonRequest(baseUrl, "/v1/admin/runtime/status", adminHeaders);
  assertEqual(status.ok, true, "admin runtime status ok");
  assertEqual(status.selfHostedBackend, true, "admin runtime self-hosted backend");
  assertEqual(status.productionScaleBaseline?.targetConcurrentUsers, 10_000, "admin runtime baseline");
  assertEqual(status.productionPolicy?.supabaseProductionBackend, false, "admin runtime no Supabase production");
  assertEqual(status.productionPolicy?.hostedBaasProductionBackend, false, "admin runtime no hosted BaaS production");
  assertEqual(status.productionPolicy?.secretsIncluded, false, "admin runtime no secrets flag");
  assertEqual(status.auth?.rateLimitDriver, "memory", "admin runtime rate limit driver");
  assertEqual(status.auth?.rateLimitFailMode, "closed", "admin runtime rate limit fail mode");
  assertEqual(status.auth?.sessionCacheDriver, "memory", "admin runtime session cache driver");
  assertEqual(status.auth?.sessionCacheFailMode, "closed", "admin runtime session cache fail mode");
  assertEqual(status.runtime?.metricsDriver, "prometheus", "admin runtime metrics driver");
  assertEqual(status.requestGuardrails?.requestTimeoutMs, 15000, "admin runtime request timeout");
  assertEqual(status.requestGuardrails?.jsonBodyMaxBytes, 65536, "admin runtime JSON body limit");
  assertEqual(status.adminAudit?.exportMaxWindowDays, 31, "admin runtime audit export window");
  assertEqual(status.adminAudit?.retentionDays, 365, "admin runtime audit retention");
  assertEqual(status.lifecycle?.draining, false, "admin runtime lifecycle draining");
  assertEqual(status.lifecycle?.drainSignalPresent, false, "admin runtime lifecycle signal");
  console.log("admin_runtime_status_read=ok");

  const serializedStatus = JSON.stringify(status);
  for (const forbidden of [
    "postgres://",
    "redis://",
    "change-me",
    "Password1",
    "admin@example.com",
    "buyer@example.com",
    "yorso-local",
    "localhost:9000",
    "00000000-0000-4000-8000-000000000090",
    "00000000-0000-4000-8000-000000000001",
  ]) {
    assertNotContains(serializedStatus, forbidden, `admin runtime secret/PII guard ${forbidden}`);
  }
  console.log("admin_runtime_status_no_secrets=ok");

  const metrics = await textRequest(baseUrl, "/metrics");
  assertContains(
    metrics,
    'yorso_api_admin_runtime_status_requests_total{operation="status",outcome="success",reason="none"}',
    "admin runtime status success metrics",
  );
  assertContains(
    metrics,
    'yorso_api_admin_runtime_status_requests_total{operation="status",outcome="blocked",reason="admin_role_required"}',
    "admin runtime status role guard metrics",
  );
  console.log("admin_runtime_status_metrics=ok");
}

async function signIn(baseUrl, email) {
  const response = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Password1",
    }),
  });
  const body = await response.json();
  assertStatus(response, 200, `${email} sign-in`);
  return {
    "content-type": "application/json",
    "x-yorso-session-id": body.session.id,
    "x-yorso-user-id": body.session.userId,
  };
}

async function jsonRequest(baseUrl, pathName, headers) {
  const response = await fetch(`${baseUrl}${pathName}`, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${pathName} failed with ${response.status}: ${text}`);
  }
  return response.json();
}

async function textRequest(baseUrl, pathName) {
  const response = await fetch(`${baseUrl}${pathName}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${pathName} failed with ${response.status}: ${text}`);
  }
  return response.text();
}

async function waitForApi(baseUrl, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`API process exited before healthcheck. code=${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health/live`);
      if (response.ok) return;
    } catch {
      // Keep polling while the API process starts.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/health/live`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not reserve a local TCP port."));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function onceExit(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for API process exit.")), timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label}: expected value to contain ${JSON.stringify(expected)}`);
  }
}

function assertNotContains(value, expected, label) {
  if (value.includes(expected)) {
    throw new Error(`${label}: expected value not to contain ${JSON.stringify(expected)}`);
  }
}
