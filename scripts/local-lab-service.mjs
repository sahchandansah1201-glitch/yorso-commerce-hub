#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LABEL = "com.yorso.local-lab";
const HOST = "127.0.0.1";
const PORT = 3300;
const URL = `http://${HOST}:${PORT}/`;
const API_URL = "http://127.0.0.1:3000/health/live";
const TWENTY_URL = "http://127.0.0.1:3020/healthz";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEntry = path.join(repoRoot, "scripts", "local-lab-runtime.mjs");
const apiEntry = path.join(repoRoot, "apps", "api", "dist", "index.js");
const nodeExecutable = ["/opt/homebrew/bin/node", "/usr/local/bin/node", process.execPath].find(
  (candidate) => existsSync(candidate),
) ?? process.execPath;
const launchAgentsDir = path.join(homedir(), "Library", "LaunchAgents");
const logsDir = path.join(homedir(), "Library", "Logs", "Yorso");
const plistPath = path.join(launchAgentsDir, `${LABEL}.plist`);
const serviceTarget = `gui/${process.getuid()}/${LABEL}`;
const domainTarget = `gui/${process.getuid()}`;

const xml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const plist = () => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(nodeExecutable)}</string>
    <string>${xml(runtimeEntry)}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xml(repoRoot)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>3</integer>
  <key>StandardOutPath</key>
  <string>${xml(path.join(logsDir, "local-lab.stdout.log"))}</string>
  <key>StandardErrorPath</key>
  <string>${xml(path.join(logsDir, "local-lab.stderr.log"))}</string>
</dict>
</plist>
`;

const runLaunchctl = (args, { allowFailure = false, quiet = false } = {}) => {
  const result = spawnSync("launchctl", args, { encoding: "utf8" });
  if (!allowFailure && result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new Error(`launchctl ${args.join(" ")} failed: ${detail}`);
  }
  if (!quiet && result.stdout) process.stdout.write(result.stdout);
  return result;
};

const bootstrapService = async () => {
  let lastResult;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    lastResult = runLaunchctl(["bootstrap", domainTarget, plistPath], {
      allowFailure: true,
      quiet: true,
    });
    if (lastResult.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }

  const detail = lastResult?.stderr.trim() || lastResult?.stdout.trim() || "unknown error";
  throw new Error(`launchctl bootstrap failed after 5 attempts: ${detail}`);
};

const assertPrerequisites = () => {
  const packagePath = path.join(repoRoot, "package.json");
  if (!existsSync(packagePath) || !existsSync(runtimeEntry)) {
    throw new Error(`Run npm install in ${repoRoot} before installing the local-lab service.`);
  }
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  if (packageJson.name !== "vite_react_shadcn_ts") {
    throw new Error(`Unexpected repository at ${repoRoot}.`);
  }
};

const runCommand = (command, args, { allowFailure = false, quiet = false } = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: quiet ? "pipe" : "inherit",
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}`);
  }
  return result;
};

const ensureDockerNetwork = () => {
  const inspect = runCommand("docker", ["network", "inspect", "yorso-local"], {
    allowFailure: true,
    quiet: true,
  });
  if (inspect.status !== 0) {
    runCommand("docker", ["network", "create", "yorso-local"]);
  }
};

const prepareRuntime = () => {
  runCommand("npm", ["run", "api:build"]);
  ensureDockerNetwork();
  runCommand("docker", [
    "compose",
    "--env-file",
    "infra/twenty/.env",
    "-f",
    "infra/twenty/docker-compose.yml",
    "-f",
    "infra/twenty/docker-compose.local.yml",
    "up",
    "-d",
  ]);
  if (!existsSync(apiEntry)) throw new Error(`API build did not create ${apiEntry}.`);
};

const healthTargets = [
  ["YORSO UI", URL],
  ["YORSO API", API_URL],
  ["Twenty CRM", TWENTY_URL],
];

const waitForHealth = async (targetUrl, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(targetUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return response.status;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Local lab did not become healthy at ${targetUrl}: ${lastError}`);
};

const waitForAllHealth = async (timeoutMs = 60_000) => {
  const results = [];
  for (const [name, targetUrl] of healthTargets) {
    const status = await waitForHealth(targetUrl, timeoutMs);
    results.push(`${name}=HTTP ${status}`);
  }
  return results;
};

const printStatus = async () => {
  const result = runLaunchctl(["print", serviceTarget], { allowFailure: true, quiet: true });
  if (result.status !== 0) {
    console.error(`Local lab is not registered. Run: npm run local-lab:install`);
    process.exitCode = 1;
    return;
  }

  const state = result.stdout.match(/\bstate = (\w+)/)?.[1] ?? "unknown";
  const pid = result.stdout.match(/\bpid = (\d+)/)?.[1] ?? "unknown";
  try {
    const statuses = await waitForAllHealth(3_000);
    console.log(`Local lab: ${state}; pid=${pid}; ${statuses.join("; ")}; ${URL}`);
  } catch (error) {
    console.error(`Local lab: ${state}; pid=${pid}; unhealthy: ${error.message}`);
    process.exitCode = 1;
  }
};

const registerService = async () => {
  mkdirSync(launchAgentsDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });
  writeFileSync(plistPath, plist(), "utf8");

  runLaunchctl(["bootout", serviceTarget], { allowFailure: true, quiet: true });
  await bootstrapService();
  runLaunchctl(["enable", serviceTarget]);
  runLaunchctl(["kickstart", "-k", serviceTarget]);
};

const install = async () => {
  assertPrerequisites();
  prepareRuntime();
  await registerService();
  const statuses = await waitForAllHealth();
  console.log(`Local lab installed: ${statuses.join("; ")}; ${URL}`);
  console.log(`Logs: ${logsDir}`);
};

const restart = async () => {
  assertPrerequisites();
  prepareRuntime();
  await registerService();
  const statuses = await waitForAllHealth();
  console.log(`Local lab restarted: ${statuses.join("; ")}; ${URL}`);
};

const command = process.argv[2] ?? "status";

try {
  if (command === "install") await install();
  else if (command === "restart") await restart();
  else if (command === "status") await printStatus();
  else throw new Error(`Unknown command "${command}". Use install, restart, or status.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
