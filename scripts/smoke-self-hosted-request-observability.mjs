#!/usr/bin/env node
import { spawn } from "node:child_process";
import net from "node:net";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");
const port = await getFreePort();
const storageRoot = path.join(repoRoot, ".data", "request-observability-smoke");

await rm(storageRoot, { recursive: true, force: true });
await mkdir(storageRoot, { recursive: true });

const child = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    NODE_ENV: "test",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(port),
    YORSO_PUBLIC_APP_URL: "http://localhost:8080",
    ACCOUNT_REPOSITORY: "memory",
    AUTH_RATE_LIMIT_DRIVER: "memory",
    AUTH_RATE_LIMIT_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    AUTH_OBSERVABILITY_DRIVER: "disabled",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
    HEALTH_READINESS_TIMEOUT_MS: "250",
    YORSO_REQUEST_TIMEOUT_MS: "2000",
    YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS: "500",
    YORSO_HEADERS_TIMEOUT_MS: "2000",
    YORSO_KEEP_ALIVE_TIMEOUT_MS: "500",
    YORSO_MAX_HEADER_BYTES: "2048",
    YORSO_JSON_BODY_MAX_BYTES: "1024",
    YORSO_SHUTDOWN_DRAIN_DELAY_MS: "50",
    YORSO_SHUTDOWN_GRACE_TIMEOUT_MS: "1000",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: storageRoot,
    S3_ENDPOINT: "http://localhost:9000",
    S3_BUCKET: "yorso-local",
    YORSO_SESSION_SECRET: "change-me-32-bytes-minimum",
    YORSO_JWT_SECRET: "change-me-32-bytes-minimum",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
child.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForLive(baseUrl, child);
  await waitForEvent((event) =>
    event.type === "api_request_event" &&
    event.event === "request.completed" &&
    event.route === "/health/live" &&
    event.statusCode === 200 &&
    typeof event.latencyBucket === "string");
  console.log("request_observability_completed=ok");

  const largeBody = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "observability-smoke@example.com",
      password: "NeverLogThisPassword1",
      padding: "x".repeat(2_048),
    }),
  });
  assertStatus(largeBody, 413, "large JSON body");
  await waitForEvent((event) =>
    event.type === "api_request_event" &&
    event.event === "request.guardrail_triggered" &&
    event.guardrailCode === "request_body_too_large" &&
    event.guardrailKind === "body_size" &&
    event.statusCode === 413 &&
    event.jsonBodyMaxBytes === 1024);
  console.log("request_observability_large_body=ok");

  const slowBody = await sendSlowBodyRequest(port);
  if (!slowBody.includes("408") || !slowBody.includes("request_body_timeout")) {
    throw new Error(`slow body response missing timeout marker: ${slowBody}`);
  }
  await waitForEvent((event) =>
    event.type === "api_request_event" &&
    event.event === "request.guardrail_triggered" &&
    event.guardrailCode === "request_body_timeout" &&
    event.guardrailKind === "body_idle_timeout" &&
    event.statusCode === 408 &&
    event.requestBodyIdleTimeoutMs === 500);
  console.log("request_observability_body_idle_timeout=ok");

  const largeHeader = await sendLargeHeaderRequest(port);
  if (!largeHeader.includes("431")) {
    throw new Error(`large header response missing 431 marker: ${largeHeader}`);
  }
  await waitForEvent((event) =>
    event.type === "api_request_event" &&
    event.event === "request.guardrail_triggered" &&
    event.guardrailCode === "request_header_too_large" &&
    event.guardrailKind === "header_size" &&
    event.statusCode === 431 &&
    event.maxHeaderBytes === 2048);
  console.log("request_observability_large_header=ok");

  if (stdout.includes("observability-smoke@example.com") || stdout.includes("NeverLogThisPassword1")) {
    throw new Error("Request observability stdout leaked request payload PII.");
  }
  console.log("request_observability_no_pii=ok");
  console.log("self_hosted_request_observability_smoke=ok");
} catch (error) {
  child.kill("SIGKILL");
  throw new Error([
    `Request observability smoke failed: ${error instanceof Error ? error.message : String(error)}`,
    stdout ? `stdout:\n${stdout}` : "",
    stderr ? `stderr:\n${stderr}` : "",
  ].filter(Boolean).join("\n"));
} finally {
  child.kill("SIGTERM");
  await waitForExit(child, 1_500).catch(() => undefined);
  await rm(storageRoot, { recursive: true, force: true });
}

async function sendSlowBodyRequest(targetPort) {
  return await sendRawRequest(targetPort, [
    "POST /v1/auth/sign-in HTTP/1.1",
    "Host: 127.0.0.1",
    "Content-Type: application/json",
    "Content-Length: 128",
    "",
    "{\"email\"",
  ].join("\r\n"), "request_body_timeout");
}

async function sendLargeHeaderRequest(targetPort) {
  return await sendRawRequest(targetPort, [
    "GET /health/live HTTP/1.1",
    "Host: 127.0.0.1",
    `X-Large: ${"x".repeat(4096)}`,
    "",
    "",
  ].join("\r\n"), "\r\n\r\n");
}

async function sendRawRequest(targetPort, payload, expectedMarker) {
  return await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: targetPort });
    let response = "";
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out waiting for raw response marker ${expectedMarker}. Last=${response}`));
    }, 3_000);

    socket.on("connect", () => {
      socket.write(payload);
    });
    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
      if (response.includes(expectedMarker)) {
        clearTimeout(timeout);
        socket.end();
        resolve(response);
      }
    });
    socket.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    socket.on("end", () => {
      if (response) {
        clearTimeout(timeout);
        resolve(response);
      }
    });
  });
}

async function waitForEvent(predicate) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const event = readEvents().find(predicate);
    if (event) return event;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for request telemetry event. stdout=${stdout}`);
}

function readEvents() {
  return stdout
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("{"))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return undefined;
      }
    })
    .filter(Boolean);
}

async function waitForLive(baseUrl, processHandle) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`API process exited before live check. code=${processHandle.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health/live`);
      if (response.status === 200) return;
    } catch {
      // Retry until the process starts accepting connections.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/health/live`);
}

async function waitForExit(processHandle, timeoutMs) {
  if (processHandle.exitCode !== null) return processHandle.exitCode;
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for process exit.")), timeoutMs);
    processHandle.once("exit", (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Expected TCP address object.")));
        return;
      }
      const { port: freePort } = address;
      server.close(() => resolve(freePort));
    });
    server.on("error", reject);
  });
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${response.status}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
