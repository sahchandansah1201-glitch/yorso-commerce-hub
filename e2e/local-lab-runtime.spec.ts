import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { installAccountApiRoutes } from "./helpers/account-api";
import { installBuyerSession } from "./helpers/buyer-session";

const outputDir = "test-results/local-lab-runtime";
const nestedInteractiveSelector = "a button, button a, a a, button button";

const collectBrowserErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    errors.push(
      `requestfailed: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? "unknown"})`,
    );
  });
  return errors;
};

const collectOverflowDiagnostics = (page: Page) =>
  page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          testId: element.dataset.testid ?? "",
          className: typeof element.className === "string" ? element.className : "",
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(({ left, right, width }) => width > 0 && (left < -1 || right > viewportWidth + 1))
      .slice(0, 12);

    return {
      overflow: document.body.scrollWidth - viewportWidth,
      viewportWidth,
      offenders,
    };
  });

const openCompanyWorkspace = async (page: Page, sessionId: string) => {
  await installAccountApiRoutes(page, { sessionId, lang: "ru" });
  await installBuyerSession(page, { id: sessionId, lang: "ru" });
  const response = await page.goto("/account/company", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("account-section-company")).toBeVisible();
};

test.beforeAll(async () => {
  await mkdir(outputDir, { recursive: true });
});

test("persistent local lab serves the current workspace", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("page-title")).toBeVisible();
  await page.screenshot({ path: `${outputDir}/desktop-home.png`, fullPage: true });
  expect(browserErrors).toEqual([]);
});

test("desktop account route is usable on the persistent address", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await openCompanyWorkspace(page, "local-lab-desktop");

  const trustCard = page.getByTestId("account-card-company-trust");
  await expect(trustCard).toBeVisible();
  await trustCard.getByTestId("account-card-company-trust-edit").click();
  await expect(trustCard.getByTestId("account-company-certificates-search")).toBeVisible();
  await page.screenshot({ path: `${outputDir}/desktop-company-edit.png`, fullPage: true });

  expect(await page.locator(nestedInteractiveSelector).count()).toBe(0);
  expect(browserErrors).toEqual([]);
});

test("mobile account flow supports a real repeated interaction", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const browserErrors = collectBrowserErrors(page);
  await openCompanyWorkspace(page, "local-lab-mobile");

  const trustCard = page.getByTestId("account-card-company-trust");
  await trustCard.getByTestId("account-card-company-trust-edit").click();
  const search = trustCard.getByTestId("account-company-certificates-search");
  await search.fill("HACCP");
  await trustCard.getByTestId("account-company-certificates-option-HACCP").click();
  await expect(trustCard.getByTestId("account-company-certificate-chip-HACCP")).toBeVisible();

  await page.screenshot({ path: `${outputDir}/mobile-390-company-edit.png`, fullPage: true });
  const overflow = await collectOverflowDiagnostics(page);
  expect(overflow, JSON.stringify(overflow, null, 2)).toMatchObject({ overflow: 0 });
  expect(await page.locator(nestedInteractiveSelector).count()).toBe(0);
  expect(browserErrors).toEqual([]);
});
