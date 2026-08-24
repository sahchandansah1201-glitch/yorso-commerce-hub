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
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteEntry = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
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
    <string>${xml(viteEntry)}</string>
    <string>--host</string>
    <string>${HOST}</string>
    <string>--port</string>
    <string>${PORT}</string>
    <string>--strictPort</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xml(repoRoot)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>VITE_YORSO_API_URL</key>
    <string></string>
  </dict>
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
  if (!existsSync(packagePath) || !existsSync(viteEntry)) {
    throw new Error(`Run npm install in ${repoRoot} before installing the local-lab service.`);
  }
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  if (packageJson.name !== "vite_react_shadcn_ts") {
    throw new Error(`Unexpected repository at ${repoRoot}.`);
  }
};

const waitForHealth = async (timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(URL, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return response.status;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Local lab did not become healthy at ${URL}: ${lastError}`);
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
    const status = await waitForHealth(3_000);
    console.log(`Local lab: ${state}; pid=${pid}; HTTP ${status}; ${URL}`);
  } catch (error) {
    console.error(`Local lab: ${state}; pid=${pid}; unhealthy: ${error.message}`);
    process.exitCode = 1;
  }
};

const install = async () => {
  assertPrerequisites();
  mkdirSync(launchAgentsDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });
  writeFileSync(plistPath, plist(), "utf8");

  runLaunchctl(["bootout", serviceTarget], { allowFailure: true, quiet: true });
  await bootstrapService();
  runLaunchctl(["enable", serviceTarget]);
  runLaunchctl(["kickstart", "-k", serviceTarget]);
  const status = await waitForHealth();
  console.log(`Local lab installed: HTTP ${status}; ${URL}`);
  console.log(`Logs: ${logsDir}`);
};

const restart = async () => {
  assertPrerequisites();
  const registered = runLaunchctl(["print", serviceTarget], { allowFailure: true, quiet: true });
  if (registered.status !== 0) {
    await install();
    return;
  }
  runLaunchctl(["kickstart", "-k", serviceTarget]);
  const status = await waitForHealth();
  console.log(`Local lab restarted: HTTP ${status}; ${URL}`);
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
