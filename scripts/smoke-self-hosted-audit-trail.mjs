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
const smokeUserId = "00000000-0000-4000-8000-000000000001";

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-audit-smoke-"));
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
    AUTH_OBSERVABILITY_DRIVER: "disabled",
    YORSO_AUDIT_DRIVER: "console",
    YORSO_ERROR_OBSERVABILITY_DRIVER: "disabled",
    YORSO_METRICS_DRIVER: "disabled",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "disabled",
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
  const session = await runSmoke(baseUrl);
  await delay(50);
  const auditEvents = parseAuditEvents(childLogs.stdout);

  assertAuditEvent(auditEvents, "auth.sign_in", "failure");
  console.log("audit_auth_failure=ok");
  assertAuditEvent(auditEvents, "auth.sign_in", "success");
  console.log("audit_auth_success=ok");
  assertAuditEvent(auditEvents, "account.company.update", "success");
  console.log("audit_account_update=ok");
  assertAuditEvent(auditEvents, "access.supplier.request", "success");
  console.log("audit_access_request=ok");
  assertAuditEvent(auditEvents, "access.supplier.decision", "success");
  console.log("audit_access_decision=ok");
  assertAuditEvent(auditEvents, "access.notifications.ack", "success");
  console.log("audit_notification_ack=ok");
  assertAuditEvent(auditEvents, "storage.company_media.upload", "success");
  assertAuditEvent(auditEvents, "storage.document.create", "success");
  console.log("audit_storage_upload=ok");

  const combinedLogs = `${childLogs.stdout}\n${childLogs.stderr}`;
  for (const forbidden of [
    "audit-smoke@example.com",
    "wrong-audit-password",
    "buyer@example.com",
    "Password1",
    smokeUserId,
    session.id,
    "sup-no-001",
    "Audit Smoke Company",
    "audit-logo.txt",
    "audit-document.txt",
  ]) {
    if (combinedLogs.includes(forbidden)) {
      throw new Error(`Audit trail leaked forbidden token ${forbidden}.`);
    }
  }
  console.log("audit_no_pii=ok");
  console.log("self_hosted_audit_trail_smoke=ok");
} catch (error) {
  console.error("self_hosted_audit_trail_smoke=failed");
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
  const invalidCredentials = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "audit-smoke@example.com",
      password: "wrong-audit-password",
    }),
  });
  assertStatus(invalidCredentials, 401, "invalid credentials audit");

  const signIn = await jsonRequest(baseUrl, "/v1/auth/sign-in", {
    method: "POST",
    body: {
      email: "buyer@example.com",
      password: "Password1",
    },
  });
  const session = signIn.session;
  assertEqual(session?.userId, smokeUserId, "audit smoke user");

  const accountHeaders = {
    "content-type": "application/json",
    "x-yorso-user-id": smokeUserId,
    "x-yorso-session-id": session.id,
  };

  const companyUpdate = await jsonRequest(baseUrl, "/v1/account/company", {
    method: "PATCH",
    headers: accountHeaders,
    body: {
      tradeName: "Audit Smoke Company",
      productFocus: ["Atlantic Salmon", "Audit trail"],
    },
  });
  assertEqual(companyUpdate.company?.tradeName, "Audit Smoke Company", "company update audit");

  const accessRequest = await jsonRequest(baseUrl, "/v1/access/suppliers/sup-no-001/request", {
    method: "POST",
    headers: accountHeaders,
    body: { message: "Need price access." },
  });
  assertEqual(accessRequest.request?.status, "sent", "supplier access request audit");

  const accessDecision = await jsonRequest(
    baseUrl,
    `/v1/access/supplier-requests/${accessRequest.request.id}/decision`,
    {
      method: "POST",
      headers: accountHeaders,
      body: { status: "approved" },
    },
  );
  assertEqual(accessDecision.request?.status, "approved", "supplier access decision audit");

  const notifications = await jsonRequest(baseUrl, "/v1/access/notifications", {
    headers: accountHeaders,
  });
  assertEqual(notifications.notifications?.[0]?.type, "price_access_approved", "notification feed audit");
  const ack = await jsonRequest(baseUrl, "/v1/access/notifications", {
    method: "PATCH",
    headers: accountHeaders,
    body: { notificationIds: [notifications.notifications[0].id] },
  });
  assertEqual(ack.markedReadCount, 1, "notification ack audit");

  const logoUpload = await jsonRequest(baseUrl, "/v1/account/company/media/logo", {
    method: "POST",
    headers: accountHeaders,
    body: {
      fileName: "audit-logo.txt",
      contentType: "text/plain",
      sizeBytes: 11,
      contentBase64: Buffer.from("audit-logo!", "utf8").toString("base64"),
      alt: "Audit logo",
    },
  });
  assertString(logoUpload.asset?.id, "media upload audit");

  const document = await jsonRequest(baseUrl, "/v1/account/documents", {
    method: "POST",
    headers: accountHeaders,
    body: {
      title: "Audit document",
      documentType: "haccp",
      visibility: "private",
      file: {
        fileName: "audit-document.txt",
        contentType: "text/plain",
        sizeBytes: 15,
        contentBase64: Buffer.from("audit-document!", "utf8").toString("base64"),
      },
    },
  });
  assertString(document.document?.id, "document upload audit");

  return session;
}

async function jsonRequest(baseUrl, pathName, init = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: init.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${init.method ?? "GET"} ${pathName} failed with ${response.status}: ${text}`);
  }
  return response.json();
}

function parseAuditEvents(stdout) {
  return stdout
    .split(/\r?\n/)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((item) => item?.type === "api_audit_event");
}

function assertAuditEvent(events, action, outcome) {
  const event = events.find((candidate) => candidate.action === action && candidate.outcome === outcome);
  if (!event) {
    throw new Error(`Missing audit event action=${action} outcome=${outcome}. Found: ${JSON.stringify(events)}`);
  }
  if (!event.auditId || !event.requestId || !event.correlationId || !event.occurredAt) {
    throw new Error(`Audit event missing required envelope: ${JSON.stringify(event)}`);
  }
  for (const key of ["actorUserHash", "sessionHash", "resourceHash"]) {
    if (event[key] && !String(event[key]).startsWith("sha256:")) {
      throw new Error(`Audit event ${key} is not hashed: ${JSON.stringify(event)}`);
    }
  }
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
      // Retry while the API process starts.
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
    throw new Error(`${label}: expected ${expected}, received ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || !value) {
    throw new Error(`${label}: expected non-empty string, received ${JSON.stringify(value)}`);
  }
}
