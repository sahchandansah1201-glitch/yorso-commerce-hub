import { expect, test, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.setItem(
        "yorso_buyer_session",
        JSON.stringify({
          id: "b_p1e_branches",
          identifier: "buyer@example.com",
          method: "email",
          signedInAt: new Date().toISOString(),
          displayName: "buyer",
        }),
      );
    } catch {
      /* ignore */
    }
  });
};

const open = async (page: Page) => {
  await setSignedInStorage(page);
  await page.goto("/account/branches", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-branches")).toBeVisible({ timeout: 15_000 });
};

test.describe("P1E branches screenshots & layout checks", () => {
  test("desktop screenshot + programmatic checks", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await open(page);
    await page.screenshot({ path: "test-results/p1e-branches-desktop.png", fullPage: true });

    const overflow = await page.evaluate(
      () => document.body.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(overflow).toBe(true);

    const nested = await page.evaluate(
      () => document.querySelectorAll("a button, button a, a a, button button").length,
    );
    expect(nested).toBe(0);
  });

  test("mobile 390 screenshot + card + edit form", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await open(page);
    await page.screenshot({ path: "test-results/p1e-branches-mobile-390.png", fullPage: true });

    await page.getByTestId("account-branch-br_1").scrollIntoViewIfNeeded();
    await page.getByTestId("account-branch-br_1").screenshot({
      path: "test-results/p1e-branches-mobile-card.png",
    });

    const overflow = await page.evaluate(
      () => document.body.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(overflow).toBe(true);

    const nested = await page.evaluate(
      () => document.querySelectorAll("a button, button a, a a, button button").length,
    );
    expect(nested).toBe(0);

    await page.getByTestId("account-branch-edit-br_1").click();
    await page.getByTestId("account-branch-form").scrollIntoViewIfNeeded();
    await page.getByTestId("account-branch-form").screenshot({
      path: "test-results/p1e-branches-edit-form.png",
    });
  });
});
