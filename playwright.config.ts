import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChromiumPath = "/bin/chromium";
const chromiumLaunchOptions = existsSync(systemChromiumPath)
  ? { executablePath: systemChromiumPath }
  : undefined;
const useWebServer = process.env.E2E_USE_WEB_SERVER === "1";
const webServerUrl = "http://127.0.0.1:4173";
const baseURL = process.env.E2E_BASE_URL ?? (useWebServer ? webServerUrl : "http://localhost:5173");
const workerCount = Number.parseInt(process.env.E2E_WORKERS ?? (useWebServer ? "4" : "6"), 10);

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
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  ...(useWebServer
    ? {
        webServer: {
          command: "npm run preview -- --host 127.0.0.1 --port 4173",
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
        // В sandbox окружении может быть системный chromium.
        // Локально и в CI используем bundled Playwright browser, если /bin/chromium отсутствует.
        launchOptions: chromiumLaunchOptions,
      },
    },
  ],
});
