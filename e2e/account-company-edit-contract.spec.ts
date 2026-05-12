import { expect, test, type Locator, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.setItem(
        "yorso_buyer_session",
        JSON.stringify({
          id: "b_e2e_account_company_edit",
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

const openCompany = async (page: Page) => {
  await setSignedInStorage(page);
  await page.goto("/account/company", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-company")).toBeVisible();
};

const editCard = async (page: Page, cardId: string): Promise<Locator> => {
  const card = page.getByTestId(cardId);
  await card.getByTestId(`${cardId}-edit`).click();
  await expect(card.getByTestId(`${cardId}-save`)).toBeVisible();
  await expect(card).toHaveAttribute("data-editing", "true");
  return card;
};

const saveCard = async (card: Locator, cardId: string) => {
  await card.getByTestId(`${cardId}-save`).click();
  await expect(card).toHaveAttribute("data-editing", "false", { timeout: 15_000 });
  await expect(card.getByTestId(`${cardId}-edit`)).toBeVisible({ timeout: 15_000 });
};

const expectStorageContains = async (page: Page, expected: string) => {
  await expect
    .poll(async () =>
      page.evaluate((needle) => localStorage.getItem("yorso_account_profile_v1")?.includes(needle), expected),
    )
    .toBe(true);
};

const mainText = async (page: Page) => (await page.locator("main").textContent()) ?? "";

test.describe("/account/company · editable company profile contract", () => {
  test("identity edit persists legal/trade/country/website/year/role and survives reload", async ({
    page,
  }) => {
    await openCompany(page);

    const cardId = "account-card-company-identity";
    const card = await editCard(page, cardId);

    await card.getByTestId("account-company-legal-name").fill("Blue Harbor Foods LLC");
    await card.getByTestId("account-company-trade-name").fill("Blue Harbor");
    await card.getByTestId("account-input-accountRole").selectOption("supplier");
    await card.getByTestId("account-company-website").fill("https://blueharbor.example");
    await card.getByTestId("account-company-country").fill("Norway");
    await card.getByTestId("account-company-year-founded").fill("2008");
    await saveCard(card, cardId);

    await expect(card).toContainText("Blue Harbor Foods LLC");
    await expect(card).toContainText("Blue Harbor");
    await expect(card).toContainText("Supplier");
    await expect(card).toContainText("https://blueharbor.example");
    await expect(card).toContainText("Norway");
    await expect(card).toContainText("2008");
    await expectStorageContains(page, "Blue Harbor Foods LLC");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId(cardId)).toContainText("Blue Harbor Foods LLC");
    await expect(page.getByTestId("account-supplier-preview")).toContainText("Blue Harbor");
    await expect(page.getByTestId("account-supplier-preview")).toContainText("Norway");
  });

  test("identity validation blocks invalid required fields, URL and future year", async ({
    page,
  }) => {
    await openCompany(page);

    const cardId = "account-card-company-identity";
    const card = await editCard(page, cardId);

    await card.getByTestId("account-company-legal-name").fill("");
    await card.getByTestId("account-company-trade-name").fill("");
    await card.getByTestId("account-company-website").fill("not-a-url");
    await card.getByTestId("account-company-country").fill("");
    await card.getByTestId("account-company-year-founded").fill("2999");
    await card.getByTestId(`${cardId}-save`).click();

    await expect(card).toHaveAttribute("data-editing", "true");
    await expect(card).toHaveAttribute("data-save-state", "error");
    await expect(card.getByTestId(`${cardId}-error`)).toBeVisible();
    await expect(card.locator('[aria-invalid="true"]')).toHaveCount(5);
    expect(await mainText(page)).not.toContain("not-a-url");
  });

  test("identity cancel discards unsaved draft values", async ({ page }) => {
    await openCompany(page);

    const cardId = "account-card-company-identity";
    const card = await editCard(page, cardId);

    await card.getByTestId("account-company-trade-name").fill("Discarded Trade Name");
    await card.getByTestId("account-company-country").fill("Discarded Country");
    await card.getByTestId(`${cardId}-cancel`).click();

    await expect(card).toHaveAttribute("data-editing", "false");
    await expect(card).not.toContainText("Discarded Trade Name");
    await expect(card).not.toContainText("Discarded Country");
  });

  test("commercial contacts edit persists email, phone and WhatsApp with validation", async ({
    page,
  }) => {
    await openCompany(page);

    const cardId = "account-card-company-contacts";
    const card = await editCard(page, cardId);

    await card.getByTestId("account-company-contact-email").fill("broken");
    await card.getByTestId("account-company-contact-phone").fill("123");
    await card.getByTestId("account-company-whatsapp").fill("abc");
    await card.getByTestId(`${cardId}-save`).click();

    await expect(card).toHaveAttribute("data-editing", "true");
    await expect(card.getByTestId(`${cardId}-error`)).toBeVisible();
    await expect(card.locator('[aria-invalid="true"]')).toHaveCount(3);

    await card.getByTestId("account-company-contact-email").fill("sales@blueharbor.example");
    await card.getByTestId("account-company-contact-phone").fill("+47900111222");
    await card.getByTestId("account-company-whatsapp").fill("+47900333444");
    await saveCard(card, cardId);

    await expect(card).toContainText("sales@blueharbor.example");
    await expect(card).toContainText("+47900111222");
    await expect(card).toContainText("+47900333444");
    await expectStorageContains(page, "sales@blueharbor.example");
  });

  test("description edit updates supplier profile preview and persists after reload", async ({
    page,
  }) => {
    await openCompany(page);

    const cardId = "account-card-company-description";
    const card = await editCard(page, cardId);
    const description =
      "Norwegian frozen seafood exporter focused on salmon, cod, mackerel and buyer-ready EU documentation.";

    await card.getByTestId("account-company-description").fill(description);
    await saveCard(card, cardId);

    await expect(card).toContainText(description);
    await expect(page.getByTestId("account-supplier-preview")).toContainText(description);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-supplier-preview")).toContainText(description);
  });

  test("trust, certificates and payment terms split lists and update supplier preview", async ({
    page,
  }) => {
    await openCompany(page);

    const trustCardId = "account-card-company-trust";
    const trust = await editCard(page, trustCardId);
    await trust.getByTestId("account-company-product-focus").fill("Salmon, Cod, Herring");
    await trust.getByTestId("account-company-certificates").fill("MSC, ASC, HACCP");
    await saveCard(trust, trustCardId);

    const paymentCardId = "account-card-company-payment";
    const payment = await editCard(page, paymentCardId);
    await payment.getByTestId("account-company-payment-terms").fill("T/T 30%, LC at sight, CAD");
    await saveCard(payment, paymentCardId);

    const supplierPreview = page.getByTestId("account-supplier-preview");
    await expect(supplierPreview.getByTestId("account-supplier-preview-productFocus")).toContainText("Salmon");
    await expect(supplierPreview.getByTestId("account-supplier-preview-productFocus")).toContainText("Herring");
    await expect(supplierPreview.getByTestId("account-supplier-preview-certificates")).toContainText("HACCP");
    await expect(supplierPreview.getByTestId("account-supplier-preview-paymentTerms")).toContainText("LC at sight");
    expect(await mainText(page)).not.toMatch(/Salmon,\s*Cod,\s*Herring/);
  });

  test("publication and buyer qualification statuses persist as user-facing labels", async ({
    page,
  }) => {
    await openCompany(page);

    const cardId = "account-card-company-publication";
    const card = await editCard(page, cardId);

    await card.getByTestId("account-company-publication-status").selectOption("published");
    await card.getByTestId("account-company-qualification-status").selectOption("qualified");
    await saveCard(card, cardId);

    await expect(card).toContainText("Published");
    await expect(card).toContainText("Qualified");
    expect(await mainText(page)).not.toMatch(/ready_for_review|published|qualified/);
    await expectStorageContains(page, '"supplierPublicationStatus":"published"');
    await expectStorageContains(page, '"buyerQualificationStatus":"qualified"');
  });
});
