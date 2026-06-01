import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const outputDir = "test-results/account-workspace-ui-audit";

const accountSections = [
  ["personal", "account-section-personal"],
  ["company", "account-section-company"],
  ["branches", "account-section-branches"],
  ["products", "account-section-products"],
  ["meta-regions", "account-section-meta-regions"],
  ["notifications", "account-section-notifications"],
] as const;

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const visibleCount = async (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) =>
    els.filter((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }).length,
  );

const openAccountSection = async (
  page: Page,
  section: (typeof accountSections)[number][0],
  viewport: (typeof viewports)[number],
) => {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await installBuyerSession(page, {
    id: `b_e2e_account_ui_${section}_${viewport.name}`,
    lang: "ru",
    displayName: "Anna Petrova",
  });
  await page.goto(`/account/${section}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-content")).toBeVisible();
};

const expectNoDocumentOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
};

const expectFindableActions = async (page: Page, viewportName: string) => {
  const minHeight = viewportName === "mobile" ? 44 : 36;
  const actions = page
    .getByTestId("account-content")
    .locator("button:not([disabled]), a[href], summary, [role='button']");
  const boxes = await actions.evaluateAll((els) =>
    els
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          label:
            el.getAttribute("aria-label") ??
            el.textContent?.replace(/\s+/g, " ").trim() ??
            el.getAttribute("data-testid") ??
            el.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }),
  );

  for (const box of boxes) {
    expect.soft(box.width, `${box.label} width`).toBeGreaterThanOrEqual(32);
    expect.soft(box.height, `${box.label} height`).toBeGreaterThanOrEqual(minHeight);
  }
};

test.describe("/account workspace UI audit", () => {
  test.beforeAll(() => {
    mkdirSync(outputDir, { recursive: true });
  });

  for (const viewport of viewports) {
    for (const [section, sectionTestId] of accountSections) {
      test(`${viewport.name} ${section} keeps one visible shell, scanable fields and screenshot`, async ({
        page,
      }) => {
        await openAccountSection(page, section, viewport);

        await expect(page.getByTestId(sectionTestId)).toBeVisible();
        await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
        await expectNoDocumentOverflow(page);
        await expectFindableActions(page, viewport.name);

        if (viewport.name === "desktop") {
          expect(await visibleCount(page, '[data-testid="account-sidebar"]')).toBe(1);
          expect(await visibleCount(page, '[data-testid="account-mobile-nav"]')).toBe(0);
        } else {
          expect(await visibleCount(page, '[data-testid="account-sidebar"]')).toBe(0);
          expect(await visibleCount(page, '[data-testid="account-mobile-nav"]')).toBe(1);
        }
        expect(await visibleCount(page, '[data-testid="account-overview"]')).toBe(1);

        const fieldLabels = await page
          .getByTestId("account-content")
          .locator("dt")
          .evaluateAll(
            (els) =>
              els.filter((el) => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return (
                  style.display !== "none" &&
                  style.visibility !== "hidden" &&
                  rect.width > 0 &&
                  rect.height > 0
                );
              }).length,
          );
        expect(fieldLabels, `${section} visible field labels`).toBeGreaterThan(0);

        if (section === "products") {
          const productListOverflow = await page
            .getByTestId("account-products-table")
            .evaluate((el) => el.scrollWidth - el.clientWidth);
          expect(productListOverflow).toBeLessThanOrEqual(1);
        }

        await page.screenshot({
          path: `${outputDir}/${viewport.name}-${section}.png`,
          fullPage: false,
        });
      });
    }
  }
});
