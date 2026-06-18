import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const DIR = "test-results/p1k-notifications";

const sign = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yorso-lang", "en");
    window.sessionStorage.setItem(
      "yorso_buyer_session",
      JSON.stringify({
        id: "b_p1k",
        identifier: "buyer@example.com",
        method: "email",
        signedInAt: new Date().toISOString(),
        displayName: "buyer",
      }),
    );
  });
};

const checks = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.body.scrollWidth - document.documentElement.clientWidth,
  );
  const nested = await page.evaluate(
    () =>
      document.querySelectorAll("a button, button a, a a, button button").length,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(nested).toBe(0);
};

test("P1K /account/notifications screenshots + a11y checks", async ({ page }) => {
  mkdirSync(DIR, { recursive: true });
  await sign(page);

  // desktop read
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/account/notifications", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-notifications")).toBeVisible();
  await page.screenshot({ path: `${DIR}/desktop-read.png`, fullPage: true });
  await checks(page);

  // desktop edit
  await page.getByTestId("account-notif-edit-email").click();
  await expect(page.getByTestId("account-notif-form")).toBeVisible();
  await page.screenshot({ path: `${DIR}/desktop-edit.png`, fullPage: true });
  await checks(page);
  await page.getByTestId("account-notif-cancel").click();

  // mobile read
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${DIR}/mobile-390-read.png`, fullPage: true });
  await checks(page);

  // mobile edit
  await page.getByTestId("account-notif-edit-email").click();
  await expect(page.getByTestId("account-notif-form")).toBeVisible();
  await page.screenshot({ path: `${DIR}/mobile-390-edit.png`, fullPage: true });
  await checks(page);
});
