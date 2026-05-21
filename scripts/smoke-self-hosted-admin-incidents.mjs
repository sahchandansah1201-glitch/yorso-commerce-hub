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
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-incidents-smoke-"));
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
  console.log("self_hosted_admin_incidents_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_incidents_smoke=failed");
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
  const missingSession = await fetch(`${baseUrl}/v1/admin/incidents`);
  assertStatus(missingSession, 401, "admin incidents missing session");
  console.log("admin_incidents_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/incidents`, { headers: buyerHeaders });
  assertStatus(buyerRead, 403, "admin incidents buyer role guard");
  const buyerReadBody = await buyerRead.json();
  assertEqual(buyerReadBody.error?.code, "admin_role_required", "admin incidents buyer role code");
  console.log("admin_incidents_role_guard=ok");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  await fetch(`${baseUrl}/v1/admin/audit-events`, { headers: buyerHeaders });
  await fetch(`${baseUrl}/v1/admin/audit-events?limit=100000`, { headers: adminHeaders });

  const list = await jsonRequest(baseUrl, "/v1/admin/incidents?limit=25&status=open", adminHeaders);
  assertEqual(list.ok, true, "admin incidents list ok");
  assertArray(list.incidents, "admin incidents list rows");
  assertNumberAtLeast(list.summary.total, 1, "admin incidents total");
  assertNumberAtLeast(list.summary.open, 1, "admin incidents open");
  const incident = list.incidents[0];
  assertTruthy(incident.id, "admin incidents first id");
  assertTruthy(incident.title, "admin incidents first title");
  assertArray(incident.recommendedActions, "admin incidents recommended actions");
  console.log("admin_incidents_list=ok");
  console.log("admin_incidents_summary=ok");

  const detail = await jsonRequest(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}`, adminHeaders);
  assertEqual(detail.ok, true, "admin incident detail ok");
  assertEqual(detail.incident.id, incident.id, "admin incident detail id");
  console.log("admin_incidents_detail=ok");

  const acknowledged = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/acknowledge`, adminHeaders, {
    note: "Operator triage started without secrets.",
    status: "acknowledged",
  });
  assertEqual(acknowledged.ok, true, "admin incident acknowledge ok");
  assertEqual(acknowledged.incident.status, "acknowledged", "admin incident acknowledge status");
  assertContains(acknowledged.incident.acknowledgedByUserHash, "sha256:", "admin incident actor hash");
  assertNotContains(JSON.stringify(acknowledged), "admin@example.com", "admin incident no admin email");
  assertNotContains(JSON.stringify(acknowledged), "Password1", "admin incident no password");
  console.log("admin_incidents_acknowledge=ok");
  console.log("admin_incidents_no_secrets=ok");

  const acknowledgedList = await jsonRequest(baseUrl, "/v1/admin/incidents?status=acknowledged&limit=25", adminHeaders);
  assertEqual(acknowledgedList.ok, true, "admin incidents acknowledged list ok");
  assertContains(JSON.stringify(acknowledgedList), incident.id, "admin incidents acknowledged filter includes incident");
  console.log("admin_incidents_status_filter=ok");

  const resolved = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/acknowledge`, adminHeaders, {
    note: "Resolved after smoke verification.",
    status: "resolved",
  });
  assertEqual(resolved.incident.status, "resolved", "admin incident resolve status");
  console.log("admin_incidents_resolve=ok");

  const invalid = await fetch(`${baseUrl}/v1/admin/incidents?limit=100000`, { headers: adminHeaders });
  assertStatus(invalid, 400, "admin incidents validation guard");
  console.log("admin_incidents_validation_guard=ok");
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

function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected truthy value, got ${JSON.stringify(value)}`);
}

function assertArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label}: expected array, got ${JSON.stringify(value)}`);
}

function assertNumberAtLeast(actual, expected, label) {
  if (typeof actual !== "number" || actual < expected) {
    throw new Error(`${label}: expected at least ${expected}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(value, needle, label) {
  if (!String(value).includes(needle)) {
    throw new Error(`${label}: expected ${JSON.stringify(value)} to contain ${JSON.stringify(needle)}`);
  }
}

function assertNotContains(value, needle, label) {
  if (String(value).includes(needle)) {
    throw new Error(`${label}: expected ${JSON.stringify(value)} not to contain ${JSON.stringify(needle)}`);
  }
}
