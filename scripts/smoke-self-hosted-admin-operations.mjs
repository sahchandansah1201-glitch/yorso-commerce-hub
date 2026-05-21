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
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-operations-smoke-"));
const baseUrl = `http://127.0.0.1:${freePort}`;
const childLogs = { stdout: "", stderr: "" };
const api = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    ACCOUNT_REPOSITORY: "memory",
    AUTH_OBSERVABILITY_DRIVER: "console",
    AUTH_RATE_LIMIT_DRIVER: "memory",
    AUTH_RATE_LIMIT_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    NODE_ENV: "test",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: path.join(storageRoot, "uploads"),
    VITE_SUPABASE_PUBLISHABLE_KEY: "",
    VITE_SUPABASE_URL: "",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(freePort),
    YORSO_AUDIT_DRIVER: "console",
    YORSO_ERROR_OBSERVABILITY_DRIVER: "console",
    YORSO_METRICS_DRIVER: "prometheus",
    YORSO_PUBLIC_APP_URL: "http://localhost:8080",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
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
  console.log("self_hosted_admin_operations_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_operations_smoke=failed");
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
  const missingSession = await fetch(`${baseUrl}/v1/admin/operations/overview`);
  assertStatus(missingSession, 401, "admin operations missing session");
  console.log("admin_operations_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/operations/overview`, { headers: buyerHeaders });
  assertStatus(buyerRead, 403, "admin operations buyer role guard");
  const buyerReadBody = await buyerRead.json();
  assertEqual(buyerReadBody.error?.code, "admin_role_required", "admin operations buyer role code");
  console.log("admin_operations_role_guard=ok");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  const emptyOverview = await jsonRequest(baseUrl, "/v1/admin/operations/overview", adminHeaders);
  assertOverviewShape(emptyOverview, "empty overview");
  assertEqual(emptyOverview.access.review.summary.open, 0, "empty overview open requests");
  assertEqual(emptyOverview.access.grants.summary.active, 0, "empty overview active grants");
  console.log("admin_operations_overview=ok");
  console.log("admin_operations_audit_summary=ok");
  console.log("admin_operations_readiness=ok");
  console.log("admin_operations_operator_actions=ok");
  console.log("admin_operations_incidents_summary=ok");

  await postJson(baseUrl, "/v1/access/suppliers/sup-no-001/request", buyerHeaders, {
    message: "Need exact weekly salmon price.",
  });
  const reviewOverview = await jsonRequest(baseUrl, "/v1/admin/operations/overview", adminHeaders);
  assertOverviewShape(reviewOverview, "review overview");
  assertNumberAtLeast(reviewOverview.access.review.summary.open, 1, "review overview open summary");
  assertNumberAtLeast(reviewOverview.access.review.total, 1, "review overview total");
  assertEqual(reviewOverview.access.review.recent.length, 1, "review overview recent row limit");
  const requestId = reviewOverview.access.review.recent[0]?.request?.id;
  if (!requestId) throw new Error("admin operations did not return a recent request id.");
  console.log("admin_operations_review_summary=ok");

  await postJson(baseUrl, `/v1/admin/access-requests/${requestId}/decision`, adminHeaders, {
    status: "approved",
  });
  const grantOverview = await jsonRequest(baseUrl, "/v1/admin/operations/overview", adminHeaders);
  assertOverviewShape(grantOverview, "grant overview");
  assertNumberAtLeast(grantOverview.access.grants.summary.active, 1, "grant overview active summary");
  assertNumberAtLeast(grantOverview.access.grants.total, 1, "grant overview total");
  assertEqual(grantOverview.access.grants.recent.length, 1, "grant overview recent row limit");
  console.log("admin_operations_grants_summary=ok");

  const serialized = JSON.stringify(grantOverview);
  for (const forbidden of [
    "admin@example.com",
    "buyer@example.com",
    "Password1",
    "postgres://",
    "redis://",
    "localhost:9000",
    "x-yorso-session-id",
    "x-yorso-user-id",
  ]) {
    assertNotContains(serialized, forbidden, `admin operations secret guard ${forbidden}`);
  }
  console.log("admin_operations_no_secrets=ok");
}

function assertOverviewShape(value, label) {
  assertEqual(value.ok, true, `${label} ok`);
  assertEqual(value.selfHostedBackend, true, `${label} self-hosted backend`);
  assertEqual(value.productionScaleBaseline?.targetConcurrentUsers, 10_000, `${label} baseline`);
  assertEqual(value.productionPolicy?.supabaseProductionBackend, false, `${label} no Supabase production`);
  assertEqual(value.productionPolicy?.hostedBaasProductionBackend, false, `${label} no hosted BaaS production`);
  assertEqual(value.productionPolicy?.secretsIncluded, false, `${label} no secrets`);
  assertEqual(value.runtime?.status?.ok, true, `${label} runtime status`);
  assertEqual(value.runtime?.diagnostics?.ok, true, `${label} runtime diagnostics`);
  assertContains(JSON.stringify(value.capacityPlan ?? {}), "10,000", `${label} capacity baseline`);
  assertContains(JSON.stringify(value.operatorLinks ?? []), "/admin/access-requests", `${label} review link`);
  assertContains(JSON.stringify(value.operatorLinks ?? []), "/admin/access-grants", `${label} grants link`);
  assertContains(JSON.stringify(value.operatorLinks ?? []), "/admin/audit", `${label} audit link`);
  assertContains(JSON.stringify(value.operatorLinks ?? []), "/admin/incidents", `${label} incidents link`);
  assertContains(JSON.stringify(value.operatorActions ?? []), "/admin/audit", `${label} audit action`);
  assertContains(JSON.stringify(value.operatorActions ?? []), "/admin/incidents", `${label} incidents action`);
  assertContains(JSON.stringify(value.operatorActions ?? []), "/v1/admin/audit-events/export", `${label} audit export action`);
  assertContains(JSON.stringify(value.readiness?.items ?? []), "\"id\":\"audit\"", `${label} audit readiness`);
  assertContains(JSON.stringify(value.readiness?.items ?? []), "\"id\":\"incidents\"", `${label} incident readiness`);
  assertContains(JSON.stringify(value.readiness?.items ?? []), "\"id\":\"scale_baseline\"", `${label} scale readiness`);
  if (!Array.isArray(value.incidents?.recent)) {
    throw new Error(`${label}: expected incidents.recent array`);
  }
  if (value.incidents.recent.length > 5) {
    throw new Error(`${label}: expected incidents.recent to be capped at 5 rows, got ${value.incidents.recent.length}`);
  }
  if (typeof value.incidents?.summary?.open !== "number") {
    throw new Error(`${label}: expected incidents.summary.open number`);
  }
  if (typeof value.incidents?.summary?.high !== "number") {
    throw new Error(`${label}: expected incidents.summary.high number`);
  }
  if (!Array.isArray(value.audit?.recent)) {
    throw new Error(`${label}: expected audit.recent array`);
  }
  if (value.audit.recent.length > 5) {
    throw new Error(`${label}: expected audit.recent to be capped at 5 rows, got ${value.audit.recent.length}`);
  }
  if (typeof value.audit?.summary?.sampleSize !== "number") {
    throw new Error(`${label}: expected audit.summary.sampleSize number`);
  }
  if (typeof value.audit?.summary?.blocked !== "number") {
    throw new Error(`${label}: expected audit.summary.blocked number`);
  }
}

async function signIn(baseUrl, email) {
  const response = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    body: JSON.stringify({ email, password: "Password1" }),
    headers: { "content-type": "application/json" },
    method: "POST",
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
    throw new Error(`GET ${pathName} failed with ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function postJson(baseUrl, pathName, headers, body) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`POST ${pathName} failed with ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function waitForApi(baseUrl, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API process exited before healthcheck. code=${child.exitCode}`);
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
    const timer = setTimeout(() => reject(new Error("Timed out waiting for API process exit.")), timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
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

function assertNumberAtLeast(actual, expected, label) {
  if (typeof actual !== "number" || actual < expected) {
    throw new Error(`${label}: expected at least ${expected}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(actual, expected, label) {
  if (!String(actual).includes(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(actual)} to include ${JSON.stringify(expected)}`);
  }
}

function assertNotContains(actual, expected, label) {
  if (String(actual).includes(expected)) {
    throw new Error(`${label}: expected payload not to include ${JSON.stringify(expected)}`);
  }
}
