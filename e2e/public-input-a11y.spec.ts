/**
 * E2E · public input accessibility.
 *
 * Contract:
 * - homepage search and sign-in fields have programmatic names;
 * - public routes do not expose visible unnamed controls in the checked states;
 * - mobile checked states keep the overflow guard.
 */
import { expect, test, type Page } from "@playwright/test";

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

const expectNoVisibleUnnamedControls = async (page: Page) => {
  const unnamed = await page.evaluate(() => {
    const visible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const nameFor = (element: Element) => {
      const aria = element.getAttribute("aria-label") ?? element.getAttribute("aria-labelledby");
      const title = element.getAttribute("title");
      const htmlElement = element as HTMLElement;
      const label = htmlElement.id
        ? document.querySelector(`label[for="${CSS.escape(htmlElement.id)}"]`)?.textContent
        : "";
      const text = element.textContent;
      return [aria, title, label, text]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    };

    return Array.from(
      document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"]'),
    )
      .filter(visible)
      .filter((element) => !nameFor(element))
      .map((element) => element.outerHTML.slice(0, 160));
  });

  expect(unnamed).toEqual([]);
};

test.describe("public input accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.clear();
    });
  });

  test("homepage search input has an accessible name", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByLabel("Search seafood offers")).toBeVisible();
    await expect(page.getByRole("button", { name: /^search$/i })).toBeVisible();
    await expectNoVisibleUnnamedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("/signin email and phone modes expose named fields", async ({ page }) => {
    await page.goto("/signin", { waitUntil: "domcontentloaded" });

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expectNoVisibleUnnamedControls(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: /^phone$/i }).click();
    await expect(page.getByLabel("Phone number")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expectNoVisibleUnnamedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("/signin forgot-password email field remains named", async ({ page }) => {
    await page.goto("/signin", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expectNoVisibleUnnamedControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
