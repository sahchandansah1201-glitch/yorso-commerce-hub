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
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-access-review-smoke-"));
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
  console.log("self_hosted_admin_access_review_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_access_review_smoke=failed");
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
  const missingSession = await fetch(`${baseUrl}/v1/admin/access-requests`);
  assertStatus(missingSession, 401, "admin access review missing session");
  console.log("admin_access_review_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/access-requests`, { headers: buyerHeaders });
  assertStatus(buyerRead, 403, "admin access review buyer role guard");
  const buyerReadBody = await buyerRead.json();
  assertEqual(buyerReadBody.error?.code, "admin_role_required", "admin access review buyer role code");
  console.log("admin_access_review_role_guard=ok");

  const created = await fetch(`${baseUrl}/v1/access/suppliers/sup-no-001/request`, {
    method: "POST",
    headers: buyerHeaders,
    body: JSON.stringify({ message: "Need exact price for weekly salmon purchasing" }),
  });
  assertStatus(created, 201, "buyer creates supplier access request");
  const createdBody = await created.json();
  const requestId = createdBody.request?.id;
  assertTruthy(requestId, "supplier access request id");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  const openQueue = await jsonRequest(baseUrl, "/v1/admin/access-requests?status=open&q=sup-no-001&limit=10", adminHeaders);
  assertEqual(openQueue.ok, true, "admin access review list ok");
  assertEqual(openQueue.total, 1, "admin access review list total");
  assertEqual(openQueue.summary.open, 1, "admin access review open summary");
  assertEqual(openQueue.items[0].request.id, requestId, "admin access review request id");
  assertEqual(openQueue.items[0].request.status, "sent", "admin access review request status");
  assertNotContains(JSON.stringify(openQueue), "buyer@example.com", "admin access review must not return buyer email");
  assertNotContains(JSON.stringify(openQueue), buyerHeaders["x-yorso-session-id"], "admin access review must not return session id");
  console.log("admin_access_review_list=ok");

  const pending = await postJson(
    baseUrl,
    `/v1/admin/access-requests/${requestId}/decision`,
    adminHeaders,
    { status: "pending", message: "Documents review in progress" },
  );
  assertEqual(pending.request.status, "pending", "admin access review pending decision");
  assertEqual(pending.grants.length, 0, "pending decision must not create grants");
  assertEqual(pending.notification, null, "pending decision must not notify buyer");
  console.log("admin_access_review_pending=ok");

  const approved = await postJson(
    baseUrl,
    `/v1/admin/access-requests/${requestId}/decision`,
    adminHeaders,
    { status: "approved" },
  );
  assertEqual(approved.request.status, "approved", "admin access review approval status");
  assertEqual(approved.notification?.type, "price_access_approved", "admin access review notification");
  assertDeepEqual(
    approved.grants.map((grant) => grant.scope).sort(),
    ["offer_price", "supplier_identity"],
    "admin access review approval grants",
  );
  console.log("admin_access_review_approve=ok");

  const approvedQueue = await jsonRequest(baseUrl, "/v1/admin/access-requests?status=approved&q=sup-no-001", adminHeaders);
  assertEqual(approvedQueue.total, 1, "admin access review approved filter total");
  assertEqual(approvedQueue.items[0].request.status, "approved", "admin access review approved filter status");
  console.log("admin_access_review_filters=ok");

  const buyerNotifications = await jsonRequest(baseUrl, "/v1/access/notifications", buyerHeaders);
  assertEqual(buyerNotifications.notifications.length, 1, "buyer notification count");
  assertEqual(buyerNotifications.notifications[0].type, "price_access_approved", "buyer notification type");
  console.log("admin_access_review_decision_notification=ok");

  const invalid = await fetch(`${baseUrl}/v1/admin/access-requests/${requestId}/decision`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ status: "sent" }),
  });
  assertStatus(invalid, 400, "admin access review invalid decision guard");
  console.log("admin_access_review_validation_guard=ok");
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

async function postJson(baseUrl, pathName, headers, payload) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${pathName} failed with ${response.status}: ${text}`);
  }
  return response.json();
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

function assertDeepEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected truthy value`);
}

function assertNotContains(value, expected, label) {
  if (value.includes(expected)) {
    throw new Error(`${label}: expected value not to contain ${JSON.stringify(expected)}`);
  }
}
