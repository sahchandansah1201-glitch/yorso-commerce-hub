/**
 * Batch #66 optional Supabase frontend smoke.
 *
 * The production direction is the self-hosted YORSO API. Supabase may remain
 * as a prototype/legacy integration, but the frontend must build and boot when
 * VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are intentionally empty.
 * Guarded by smoke:e2e:frontend-no-supabase-env.
 */
import { expect, test } from "@playwright/test";

test.describe("Frontend without Supabase env", () => {
  test("boots public, auth and catalog routes without Supabase configuration", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("YORSO").first()).toBeVisible();

    await page.goto("/signin", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /sign in|войти/i })).toBeVisible();
    await page.locator('input[type="email"]').fill("buyer@yorso.test");
    await page.locator('input[type="password"]').fill("Password1");
    await page.getByRole("button", { name: /sign in|войти/i }).click();
    await expect(page).toHaveURL(/\/offers/);

    await page.goto("/reset-password", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/invalid|недействительна/i)).toBeVisible();

    await page.goto("/offers", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Seafood Catalog|Seafood Procurement Catalog|каталог/i })).toBeVisible();
    await expect(page.getByTestId("catalog-result-count")).toBeVisible();
    await expect(page.getByTestId("catalog-offer-row")).not.toHaveCount(0);

    const fatalErrors = consoleErrors.filter((entry) =>
      /supabaseUrl is required|supabaseKey is required|Invalid URL|createClient/i.test(entry),
    );
    expect(fatalErrors).toEqual([]);
  });
});
