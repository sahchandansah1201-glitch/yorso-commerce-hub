import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const requestedChromiumPath = process.env.E2E_CHROMIUM_EXECUTABLE_PATH?.trim();
const systemChromiumPath = [
  requestedChromiumPath,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/bin/chromium",
].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
const chromiumLaunchOptions = systemChromiumPath
  ? { executablePath: systemChromiumPath }
  : undefined;
const useWebServer = process.env.E2E_USE_WEB_SERVER === "1";
const webServerPort = process.env.E2E_WEB_SERVER_PORT ?? "4173";
const webServerUrl = `http://127.0.0.1:${webServerPort}`;
const baseURL = process.env.E2E_BASE_URL ?? (useWebServer ? webServerUrl : "http://localhost:5173");
// Vite preview is less tolerant of concurrent navigations than the dev server.
// Keep webServer smoke runs stable by default, while allowing CI/manual overrides.
const workerCount = Number.parseInt(process.env.E2E_WORKERS ?? (useWebServer ? "1" : "6"), 10);

/**
 * Минимальная конфигурация Playwright для E2E против preview-URL.
 * Браузер один (chromium), запуск без локального dev-сервера.
 *
 * BASE_URL передаётся через env, чтобы не хардкодить preview.
 * Пример запуска:
 *   E2E_BASE_URL=https://id-preview--<id>.lovable.app \
 *     bunx playwright test --project=chromium
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: Number.isFinite(workerCount) && workerCount > 0 ? workerCount : undefined,
  retries: useWebServer ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  ...(useWebServer
    ? {
        webServer: {
          command: `npm run preview -- --host 127.0.0.1 --port ${webServerPort}`,
          url: webServerUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // Prefer an explicitly configured or installed system browser. Fall back
        // to the bundled Playwright browser when no supported executable exists.
        launchOptions: chromiumLaunchOptions,
      },
    },
  ],
});
