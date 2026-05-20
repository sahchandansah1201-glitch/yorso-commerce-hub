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
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-audit-smoke-"));
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
    YORSO_METRICS_DRIVER: "prometheus",
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
  console.log("self_hosted_admin_audit_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_audit_smoke=failed");
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
  const missingSession = await fetch(`${baseUrl}/v1/admin/audit-events`);
  assertStatus(missingSession, 401, "admin audit missing session");
  console.log("admin_audit_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/audit-events`, {
    headers: buyerHeaders,
  });
  assertStatus(buyerRead, 403, "admin audit buyer role guard");
  const buyerReadBody = await buyerRead.json();
  assertEqual(buyerReadBody.error?.code, "admin_role_required", "buyer role guard code");
  console.log("admin_audit_role_guard=ok");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  const list = await jsonRequest(baseUrl, "/v1/admin/audit-events?limit=25", adminHeaders);
  assertEqual(list.ok, true, "admin audit list ok");
  assertArray(list.events, "admin audit list events");
  assertEqual(list.limit, 25, "admin audit list limit");
  console.log("admin_audit_list=ok");

  const routeFiltered = await jsonRequest(
    baseUrl,
    "/v1/admin/audit-events?route=/v1/admin/audit-events&statusClass=4xx&limit=25",
    adminHeaders,
  );
  assertEqual(routeFiltered.ok, true, "admin audit route/status filter ok");
  assertArray(routeFiltered.events, "admin audit route/status filter events");
  console.log("admin_audit_route_status_filter=ok");

  const exportResponse = await fetch(`${baseUrl}/v1/admin/audit-events/export?limit=1000`, {
    headers: adminHeaders,
  });
  assertStatus(exportResponse, 200, "admin audit export");
  assertContains(exportResponse.headers.get("content-type") ?? "", "application/x-ndjson", "admin audit export content type");
  assertEqual(exportResponse.headers.get("x-next-cursor"), "", "admin audit export next cursor");
  console.log("admin_audit_export=ok");

  const csvExportResponse = await fetch(`${baseUrl}/v1/admin/audit-events/export?format=csv&limit=1000`, {
    headers: adminHeaders,
  });
  const csvExportText = await csvExportResponse.text();
  assertStatus(csvExportResponse, 200, "admin audit csv export");
  assertContains(csvExportResponse.headers.get("content-type") ?? "", "text/csv", "admin audit csv content type");
  assertContains(csvExportText, "auditId,occurredAt,requestId", "admin audit csv header");
  console.log("admin_audit_csv_export=ok");

  const invalid = await fetch(`${baseUrl}/v1/admin/audit-events?limit=100000`, {
    headers: adminHeaders,
  });
  assertStatus(invalid, 400, "admin audit validation guard");
  console.log("admin_audit_validation_guard=ok");

  const invalidRange = await fetch(
    `${baseUrl}/v1/admin/audit-events/export?from=2026-01-01T00:00:00.000Z&to=2026-03-15T00:00:00.000Z`,
    { headers: adminHeaders },
  );
  assertStatus(invalidRange, 400, "admin audit export window guard");
  const invalidRangeBody = await invalidRange.json();
  assertEqual(
    invalidRangeBody.error?.code,
    "admin_audit_export_window_too_large",
    "admin audit export window guard code",
  );
  console.log("admin_audit_export_window_guard=ok");

  const metrics = await textRequest(baseUrl, "/metrics");
  assertContains(
    metrics,
    'yorso_api_admin_audit_requests_total{limit_bucket="lte_50",operation="list",outcome="success",reason="none"}',
    "admin audit list metrics",
  );
  assertContains(
    metrics,
    'yorso_api_admin_audit_requests_total{limit_bucket="lte_1000",operation="export",outcome="success",reason="none"}',
    "admin audit export metrics",
  );
  assertContains(
    metrics,
    'yorso_api_admin_audit_requests_total{limit_bucket="unknown",operation="export",outcome="failure",reason="admin_audit_export_window_too_large"}',
    "admin audit export guard metrics",
  );
  console.log("admin_audit_metrics=ok");

  const retentionDryRun = await fetch(`${baseUrl}/v1/admin/audit-events/retention`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      before: "2999-01-01T00:00:00.000Z",
      mode: "dry_run",
      batchSize: 10,
      maxBatches: 2,
    }),
  });
  const retentionDryRunBody = await retentionDryRun.json();
  assertStatus(retentionDryRun, 200, "admin audit retention dry run");
  assertEqual(retentionDryRunBody.mode, "dry_run", "admin audit retention dry-run mode");
  assertEqual(retentionDryRunBody.deletedCount, 0, "admin audit retention dry-run delete count");
  console.log("admin_audit_retention_dry_run=ok");

  const retentionApply = await fetch(`${baseUrl}/v1/admin/audit-events/retention`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      before: "2999-01-01T00:00:00.000Z",
      mode: "apply",
      batchSize: 2,
      maxBatches: 1,
    }),
  });
  const retentionApplyBody = await retentionApply.json();
  assertStatus(retentionApply, 200, "admin audit retention apply");
  if (retentionApplyBody.deletedCount > 2) {
    throw new Error(`admin audit retention apply: expected at most 2 deleted rows, got ${retentionApplyBody.deletedCount}`);
  }
  console.log("admin_audit_retention_apply=ok");

  const retentionMetrics = await textRequest(baseUrl, "/metrics");
  assertContains(
    retentionMetrics,
    'yorso_api_admin_audit_requests_total{limit_bucket="lte_50",operation="retention",outcome="success",reason="none"}',
    "admin audit retention metrics",
  );
  console.log("admin_audit_retention_metrics=ok");
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

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label}: expected array, got ${typeof value}`);
  }
}

function assertContains(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(value)} to contain ${JSON.stringify(expected)}`);
  }
}
