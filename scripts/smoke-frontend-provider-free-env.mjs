#!/usr/bin/env node
import { spawn } from "node:child_process";
import net from "node:net";

const previewPort = await getFreePort();
const previewBaseUrl = `http://127.0.0.1:${previewPort}`;

try {
  await runCommand("npm", ["run", "build"], {
    ...process.env,
    VITE_YORSO_API_URL: "",
  });

  await runCommand("npx", [
    "playwright",
    "test",
    "e2e/frontend-provider-free-env.spec.ts",
    "--project=chromium",
  ], {
    ...process.env,
    CI: "1",
    E2E_USE_WEB_SERVER: "1",
    E2E_WEB_SERVER_PORT: String(previewPort),
    E2E_BASE_URL: previewBaseUrl,
    E2E_WORKERS: "1",
    VITE_YORSO_API_URL: "",
  });

  console.log("frontend_provider_free_env_smoke=ok");
} catch (error) {
  console.error("frontend_provider_free_env_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function runCommand(command, args, env) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
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
