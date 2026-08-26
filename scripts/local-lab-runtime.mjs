#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const FRONTEND_PORT = 3300;
const API_PORT = 3000;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteEntry = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
const apiEntry = path.join(repoRoot, "apps", "api", "dist", "index.js");
const localLabAuthEnv = path.join(repoRoot, "local-lab-auth.local");

if (existsSync(localLabAuthEnv)) loadEnvFile(localLabAuthEnv);

for (const entry of [viteEntry, apiEntry]) {
  if (!existsSync(entry)) {
    throw new Error(`Missing local-lab runtime entry: ${entry}`);
  }
}

const sharedEnv = {
  ...process.env,
  NODE_ENV: "development",
  VITE_YORSO_API_URL: `http://${HOST}:${API_PORT}`,
  YORSO_API_HOST: HOST,
  YORSO_API_PORT: String(API_PORT),
  YORSO_PUBLIC_APP_URL: `http://${HOST}:${FRONTEND_PORT}`,
  YORSO_CRM_ENABLED: "true",
  YORSO_CRM_TENANT_ISOLATION_ENABLED: "true",
  TWENTY_PUBLIC_CRM_URL: "http://127.0.0.1:3020",
  YORSO_CRM_HEALTH_TIMEOUT_MS: "1000",
  YORSO_CRM_HEALTH_CACHE_TTL_MS: "5000",
};

const children = [
  spawn(process.execPath, [apiEntry], {
    cwd: repoRoot,
    env: sharedEnv,
    stdio: "inherit",
  }),
  spawn(
    process.execPath,
    [viteEntry, "--host", HOST, "--port", String(FRONTEND_PORT), "--strictPort"],
    {
      cwd: repoRoot,
      env: sharedEnv,
      stdio: "inherit",
    },
  ),
];

let stopping = false;

const stop = (signal = "SIGTERM", exitCode = 0) => {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  }

  const timeout = setTimeout(() => process.exit(exitCode), 5_000);
  timeout.unref();

  Promise.allSettled(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) resolve(undefined);
          else child.once("exit", resolve);
        }),
    ),
  ).then(() => process.exit(exitCode));
};

for (const child of children) {
  child.once("error", (error) => {
    console.error(error);
    stop("SIGTERM", 1);
  });
  child.once("exit", (code, signal) => {
    if (stopping) return;
    console.error(`Local-lab child exited unexpectedly: code=${code ?? "null"}; signal=${signal ?? "none"}`);
    stop("SIGTERM", code === 0 ? 1 : (code ?? 1));
  });
}

process.on("SIGTERM", () => stop("SIGTERM", 0));
process.on("SIGINT", () => stop("SIGINT", 0));
