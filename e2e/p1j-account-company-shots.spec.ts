import { test } from "@playwright/test";
import { mkdirSync } from "fs";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "/mnt/documents/p1j-account-company";
mkdirSync(OUT, { recursive: true });

const checks = (page: any) =>
  page.evaluate(() => ({
    overflowOk:
      document.body.scrollWidth <= document.documentElement.clientWidth,
    scrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    nestedInteractive: document.querySelectorAll(
      "a button, button a, a a, button button",
    ).length,
  }));

async function shoot(page: any, name: string, action?: (p: any) => Promise<void>) {
  await installBuyerSession(page, { id: "b_e2e_p1j_company" });
  await page.goto("/account/company", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-testid="account-section-company"]');
  if (action) await action(page);
  await page.waitForTimeout(300);
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  const r = await checks(page);
  console.log(`SHOT ${name} ${JSON.stringify(r)} path=${path}`);
}

test.describe.configure({ mode: "serial" });

test("p1j desktop read", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await shoot(page, "01-desktop-read-1280");
  await ctx.close();
});

test("p1j mobile read", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await shoot(page, "02-mobile-read-390");
  await ctx.close();
});

test("p1j mobile identity edit", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await shoot(page, "03-mobile-identity-edit-390", async (p) => {
    await p.getByTestId("account-card-company-identity-edit").click();
    await p.waitForSelector('[data-testid="account-company-legal-name"]');
  });
  await ctx.close();
});

test("p1j mobile media edit", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await shoot(page, "04-mobile-media-edit-390", async (p) => {
    await p.getByTestId("account-card-company-media-edit").click();
    await p.waitForSelector('[data-testid="account-media-logo-url"]');
  });
  await ctx.close();
});

test("p1j mobile supplier preview", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await shoot(page, "05-mobile-supplier-preview-390", async (p) => {
    await p.getByTestId("account-supplier-preview").scrollIntoViewIfNeeded();
  });
  await ctx.close();
});
