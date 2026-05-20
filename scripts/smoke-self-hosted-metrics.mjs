#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const repoRoot = process.cwd();
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");
const port = await getFreePort();
const storageRoot = path.join(repoRoot, ".data", "metrics-smoke");

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
    YORSO_ERROR_OBSERVABILITY_DRIVER: "disabled",
    YORSO_METRICS_DRIVER: "prometheus",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "disabled",
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

  const live = await fetch(`${baseUrl}/health/live`);
  assertStatus(live, 200, "live");

  const ready = await fetch(`${baseUrl}/health/ready`);
  assertStatus(ready, 200, "ready");

  const invalidAuth = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "metrics-smoke@example.com",
      password: "NeverLogMetricsPassword1",
    }),
  });
  assertStatus(invalidAuth, 401, "invalid auth");

  const largeBody = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "metrics-large@example.com",
      password: "NeverLogLargeMetricsPassword1",
      padding: "x".repeat(2_048),
    }),
  });
  assertStatus(largeBody, 413, "large body");

  const metricsResponse = await fetch(`${baseUrl}/metrics`);
  assertStatus(metricsResponse, 200, "metrics");
  const metrics = await metricsResponse.text();

  assertMetric(metrics, "yorso_api_metrics_enabled 1");
  assertMetric(metrics, "yorso_api_production_baseline_concurrent_users 10000");
  assertMetric(metrics, "yorso_api_lifecycle_active_requests");
  assertMetric(metrics, "yorso_api_request_duration_seconds_bucket");
  assertMetric(metrics, 'yorso_api_requests_total{method="GET",outcome="success",route="/health/live",status_class="2xx"}');
  assertMetric(metrics, 'yorso_api_readiness_checks_total{route="/health/ready",status="ready"}');
  assertMetric(metrics, 'yorso_api_errors_total{category="auth",error_code="auth_invalid_credentials",retryable="false",status_class="4xx"}');
  assertMetric(metrics, 'yorso_api_auth_events_total{event="auth.sign_in.failed",outcome="failure",reason="invalid_credentials"}');
  assertMetric(metrics, 'yorso_api_guardrails_total{code="request_body_too_large",kind="body_size",route="/v1/auth/sign-in"}');
  console.log("metrics_prometheus_endpoint=ok");
  console.log("metrics_request_histogram=ok");
  console.log("metrics_error_counter=ok");
  console.log("metrics_auth_counter=ok");
  console.log("metrics_guardrail_counter=ok");
  console.log("metrics_readiness_counter=ok");

  for (const forbidden of [
    "metrics-smoke@example.com",
    "NeverLogMetricsPassword1",
    "metrics-large@example.com",
    "NeverLogLargeMetricsPassword1",
  ]) {
    if (metrics.includes(forbidden) || stdout.includes(forbidden) || stderr.includes(forbidden)) {
      throw new Error(`Metrics smoke leaked forbidden token ${forbidden}.`);
    }
  }
  console.log("metrics_no_pii=ok");
  console.log("self_hosted_metrics_smoke=ok");
} catch (error) {
  child.kill("SIGKILL");
  throw new Error([
    `Metrics smoke failed: ${error instanceof Error ? error.message : String(error)}`,
    stdout ? `stdout:\n${stdout}` : "",
    stderr ? `stderr:\n${stderr}` : "",
  ].filter(Boolean).join("\n"));
} finally {
  child.kill("SIGTERM");
  await waitForExit(child, 1_500).catch(() => undefined);
  await rm(storageRoot, { recursive: true, force: true });
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

function assertMetric(metrics, marker) {
  if (!metrics.includes(marker)) {
    throw new Error(`Missing metrics marker: ${marker}\n${metrics}`);
  }
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${response.status}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
