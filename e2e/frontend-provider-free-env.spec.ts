/**
 * Phase 3C provider-free frontend smoke.
 *
 * The production direction is the self-hosted YORSO API. The frontend must
 * build and boot without any hosted BaaS client env or SDK dependency.
 * Guarded by smoke:e2e:frontend-provider-free-env.
 */
import { expect, test } from "@playwright/test";

test.describe("Frontend with provider-free env", () => {
  test("boots public, auth and catalog routes without hosted BaaS configuration", async ({ page }) => {
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
      /supabase|firebase|appwrite|clerk|auth0|Invalid URL|createClient/i.test(entry),
    );
    expect(fatalErrors).toEqual([]);
  });
});
