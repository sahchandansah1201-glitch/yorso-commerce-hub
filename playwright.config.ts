import { defineConfig } from "@playwright/test";

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
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
