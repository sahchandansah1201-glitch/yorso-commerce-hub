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
const smokeSessionId = "self-hosted-access-runtime-e2e";

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const apiPort = await getFreePort();
const previewPort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-access-runtime-e2e-"));
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const previewBaseUrl = `http://127.0.0.1:${previewPort}`;
const childLogs = { stdout: "", stderr: "" };

const api = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    NODE_ENV: "test",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(apiPort),
    YORSO_PUBLIC_APP_URL: previewBaseUrl,
    ACCOUNT_REPOSITORY: "memory",
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
  await waitForApi(apiBaseUrl, api);

  await runCommand("npm", ["run", "build"], {
    ...process.env,
    VITE_YORSO_API_URL: apiBaseUrl,
    VITE_YORSO_ACCOUNT_USER_ID: smokeUserId,
  });

  await runCommand("npx", [
    "playwright",
    "test",
    "e2e/self-hosted-access-runtime.spec.ts",
    "--project=chromium",
  ], {
    ...process.env,
    CI: "1",
    E2E_USE_WEB_SERVER: "1",
    E2E_WEB_SERVER_PORT: String(previewPort),
    E2E_BASE_URL: previewBaseUrl,
    E2E_YORSO_API_URL: apiBaseUrl,
    E2E_YORSO_ACCOUNT_USER_ID: smokeUserId,
    E2E_YORSO_SESSION_ID: smokeSessionId,
    E2E_WORKERS: "1",
  });

  console.log("self_hosted_access_runtime_e2e=ok");
} catch (error) {
  console.error("self_hosted_access_runtime_e2e=failed");
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

async function runCommand(command, args, env) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: repoRoot,
      env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("Unable to allocate a local port"));
      });
    });
  });
}

async function waitForApi(baseUrl, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API process exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health/live`);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await delay(250);
  }
  throw new Error(`API did not become ready at ${baseUrl}`);
}

async function onceExit(child, timeoutMs) {
  if (child.exitCode !== null) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("process exit timeout")), timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
