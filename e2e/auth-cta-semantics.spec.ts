/**
 * E2E · auth routes · CTA semantics.
 *
 * Contract:
 * - auth route back CTAs are links, not nested link/button controls;
 * - sign-in and password-reset routes stay usable on mobile without overflow.
 */
import { expect, test } from "@playwright/test";

const expectNoNestedInteractiveControls = async (page: import("@playwright/test").Page) => {
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll("a button, button a").length))
    .toBe(0);
};

const expectNoHorizontalOverflow = async (page: import("@playwright/test").Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

test.describe("auth route CTA semantics", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.clear();
    });
  });

  test("/signin back CTA is a single semantic link", async ({ page }) => {
    await page.goto("/signin", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /sign in to yorso/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^back$/i })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
    await expectNoNestedInteractiveControls(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /back to sign in/i })).toBeVisible();
    await expectNoNestedInteractiveControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("/reset-password back CTA is a single semantic link", async ({ page }) => {
    await page.goto("/reset-password", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /set a new password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to sign in/i })).toHaveAttribute("href", "/signin");
    await expect(page.getByText(/password reset link is invalid/i)).toBeVisible();
    await expectNoNestedInteractiveControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
