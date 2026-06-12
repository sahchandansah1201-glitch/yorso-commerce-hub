import { test, expect } from "@playwright/test";

const sign = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yorso-lang", "en");
    window.sessionStorage.setItem(
      "yorso_buyer_session",
      JSON.stringify({
        id: "b_p1f",
        identifier: "buyer@example.com",
        method: "email",
        signedInAt: new Date().toISOString(),
        displayName: "buyer",
      }),
    );
  });
};

test("P1F screenshots and programmatic checks", async ({ page }) => {
  await sign(page);

  await page.goto("/account/branches", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-branches")).toBeVisible();
  await page.screenshot({
    path: "test-results/p1f-branches-desktop.png",
    fullPage: true,
  });

  const desktopOverflow = await page.evaluate(
    () => document.body.scrollWidth - document.documentElement.clientWidth,
  );
  const desktopNested = await page.evaluate(
    () =>
      document.querySelectorAll("a button, button a, a a, button button").length,
  );
  expect(desktopOverflow).toBeLessThanOrEqual(0);
  expect(desktopNested).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("account-branch-add").click();
  await expect(page.getByTestId("account-branch-form")).toBeVisible();
  await page.screenshot({
    path: "test-results/p1f-branches-mobile-390-edit.png",
    fullPage: true,
  });

  // exercise combobox keyboard a11y
  const country = page.getByTestId("account-branch-country");
  await country.click();
  await country.pressSequentially("Spa", { delay: 30 });
  await expect(page.getByTestId("account-branch-country-option-es")).toBeVisible();
  await country.press("Enter");
  await expect(country).toHaveValue("Spain");
  await page.screenshot({
    path: "test-results/p1f-country-combobox-selected.png",
    fullPage: true,
  });

  const mobileOverflow = await page.evaluate(
    () => document.body.scrollWidth - document.documentElement.clientWidth,
  );
  const mobileNested = await page.evaluate(
    () =>
      document.querySelectorAll("a button, button a, a a, button button").length,
  );
  expect(mobileOverflow).toBeLessThanOrEqual(0);
  expect(mobileNested).toBe(0);
});
