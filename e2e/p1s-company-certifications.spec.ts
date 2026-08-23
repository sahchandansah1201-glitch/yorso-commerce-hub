import { expect, test, type Locator, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const SHOTS = "test-results/p1s-company-certifications";
const TRUST = "account-card-company-trust";

const openCompany = async (page: Page) => {
  await installBuyerSession(page, { id: "b_e2e_p1s_certs" });
  await page.goto("/account/company", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-company")).toBeVisible();
};

const editTrust = async (page: Page): Promise<Locator> => {
  const card = page.getByTestId(TRUST);
  await card.getByTestId(`${TRUST}-edit`).click();
  await expect(card).toHaveAttribute("data-editing", "true");
  return card;
};

const saveTrust = async (card: Locator) => {
  await card.getByTestId(`${TRUST}-save`).click();
  await expect(card).toHaveAttribute("data-editing", "false", { timeout: 15_000 });
};

/** Детерминированная фикстура: остаётся ровно один выбранный сертификат MSC. */
const resetToMscOnly = async (card: Locator) => {
  for (const code of ["ASC", "IFS", "EU", "BRC", "HACCP", "GLOBALGAP"]) {
    const remove = card.getByTestId(`account-company-certificate-remove-${code}`);
    if (await remove.count()) await remove.click();
  }
  await expect(card.getByTestId("account-company-certificate-chip-MSC")).toBeVisible();
  await expect(card.locator('[data-testid^="account-company-certificate-chip-"]')).toHaveCount(1);
};

const noHorizontalOverflow = async (page: Page) =>
  page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });

const nestedInteractiveCount = (scope: Locator) =>
  scope.evaluate((root) => {
    const sel = "button, a[href], input, select, textarea, [role='button']";
    return Array.from(root.querySelectorAll(sel)).filter((el) =>
      Boolean(el.parentElement?.closest(sel)),
    ).length;
  });

test.describe("/account/company · P1S certifications picker", () => {
  test("read mode: no product focus, certification chips with logo or abbreviation fallback", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await openCompany(page);
    const card = page.getByTestId(TRUST);
    await expect(card.getByTestId("account-company-certificates-view")).toBeVisible();
    await expect(card).not.toContainText("Product focus");

    // legacy значения канонизированы
    await expect(card.getByTestId("account-company-certificate-chip-IFS")).toBeVisible();
    await expect(card.getByTestId("account-company-certificate-chip-EU")).toBeVisible();
    await expect(card.getByTestId("account-company-certificate-chip-MSC")).toBeVisible();

    // логотип декоративный (видимая аббревиатура рядом)
    const logos = card.getByTestId("account-company-certificate-chip-MSC").locator("img");
    await expect(logos.first()).toHaveAttribute("alt", "");

    await card.screenshot({ path: `${SHOTS}/desktop-read.png` });
    await card
      .getByTestId("account-company-certificates-view")
      .screenshot({ path: `${SHOTS}/legacy-canonical-chips.png` });
    expect(errors).toEqual([]);
  });

  test("three consecutive selections without reopening edit mode", async ({ page }) => {
    await openCompany(page);
    const card = await editTrust(page);
    await resetToMscOnly(card);

    const search = card.getByTestId("account-company-certificates-search");
    await search.click();
    await expect(card.getByTestId("account-company-certificates-options")).toBeVisible();
    await card.screenshot({ path: `${SHOTS}/desktop-edit-picker-open.png` });

    // 2-й
    await card.getByTestId("account-company-certificates-option-HACCP").click();
    await expect(card.getByTestId("account-company-certificate-chip-HACCP")).toBeVisible();
    await expect(card.getByTestId("account-company-certificates-options")).toBeVisible();
    await expect(search).toBeFocused();

    // 3-й
    await card.getByTestId("account-company-certificates-option-GLOBALGAP").click();
    await expect(card.getByTestId("account-company-certificate-chip-GLOBALGAP")).toBeVisible();
    await expect(card.getByTestId("account-company-certificates-options")).toBeVisible();

    // 4-й — picker остаётся usable
    await card.getByTestId("account-company-certificates-option-BRC").click();
    await expect(card.getByTestId("account-company-certificate-chip-BRC")).toBeVisible();
    await expect(card.locator('[data-testid^="account-company-certificate-chip-"]')).toHaveCount(4);

    // выбранное исключено из списка, после удаления снова доступно
    await expect(card.getByTestId("account-company-certificates-option-HACCP")).toHaveCount(0);
    await card.getByTestId("account-company-certificate-remove-HACCP").click();
    await expect(card.getByTestId("account-company-certificates-option-HACCP")).toBeVisible();
    await expect(search).toBeFocused();
    // повторное добавление в той же сессии
    await card.getByTestId("account-company-certificates-option-HACCP").click();
    await expect(card.getByTestId("account-company-certificate-chip-HACCP")).toBeVisible();

    await saveTrust(card);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const reopened = await editTrust(page);
    for (const code of ["MSC", "GLOBALGAP", "BRC", "HACCP"]) {
      await expect(reopened.getByTestId(`account-company-certificate-chip-${code}`)).toBeVisible();
    }
  });

  test("keyboard and empty state", async ({ page }) => {
    await openCompany(page);
    const card = await editTrust(page);
    await resetToMscOnly(card);

    const search = card.getByTestId("account-company-certificates-search");
    await search.click();
    await search.press("ArrowDown");
    await search.press("ArrowDown");
    await search.press("ArrowUp");
    await search.press("Enter");
    await expect(card.locator('[data-testid^="account-company-certificate-chip-"]')).toHaveCount(2);

    await search.fill("zzzz-no-match");
    await expect(card.getByTestId("account-company-certificates-empty")).toBeVisible();

    await search.fill("");
    await expect(card.getByTestId("account-company-certificates-options")).toBeVisible();
    await search.press("Escape");
    await expect(card.getByTestId("account-company-certificates-options")).toHaveCount(0);
  });

  test("mobile 390: no overflow, 44px targets, no nested interactives", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCompany(page);

    expect(await noHorizontalOverflow(page)).toBe(true);
    const readCard = page.getByTestId(TRUST);
    await readCard.screenshot({ path: `${SHOTS}/mobile-390-read.png` });

    const card = await editTrust(page);
    await card.getByTestId("account-company-certificates-search").click();
    await expect(card.getByTestId("account-company-certificates-options")).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
    await card.screenshot({ path: `${SHOTS}/mobile-390-edit-picker-open.png` });

    const options = card.locator('[data-testid^="account-company-certificates-option-"]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    for (let i = 0; i < optionCount; i += 1) {
      const box = await options.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    const removes = card.locator('[data-testid^="account-company-certificate-remove-"]');
    const removeCount = await removes.count();
    for (let i = 0; i < removeCount; i += 1) {
      const box = await removes.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }

    await card
      .locator('[data-testid^="account-company-certificate-chip-"]')
      .first()
      .screenshot({ path: `${SHOTS}/mobile-selected-chips.png` });

    expect(await nestedInteractiveCount(card.getByTestId("account-company-certificates"))).toBe(0);
  });
});
