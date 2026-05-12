import { expect, test, type Page } from "@playwright/test";

const NOTIFICATION_EVENTS = [
  "price_access_approved",
  "new_matching_product",
  "rfq_response",
  "price_movement",
  "document_readiness",
  "country_news",
  "supplier_profile_review",
] as const;

const setSignedInStorage = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await page.addInitScript(
    ({ language }) => {
      try {
        window.localStorage.setItem("yorso-lang", language);
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: "b_e2e_account_notifications",
            identifier: "buyer@example.com",
            method: "email",
            signedInAt: new Date().toISOString(),
            displayName: "buyer",
          }),
        );
      } catch {
        /* ignore */
      }
    },
    { language: lang },
  );
};

const openNotifications = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await setSignedInStorage(page, lang);
  await page.goto("/account/notifications", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-notifications")).toBeVisible();
};

const mainText = async (page: Page) => (await page.locator("main").textContent()) ?? "";

const expectStorageContains = async (page: Page, expected: string) => {
  await expect
    .poll(async () =>
      page.evaluate((needle) => localStorage.getItem("yorso_account_profile_v1")?.includes(needle), expected),
    )
    .toBe(true);
};

const setEventState = async (
  page: Page,
  event: (typeof NOTIFICATION_EVENTS)[number],
  checked: boolean,
) => {
  const checkbox = page.getByTestId(`account-notif-event-${event}`);
  if ((await checkbox.isChecked()) !== checked) {
    await checkbox.click();
  }
};

const clearAllEvents = async (page: Page) => {
  for (const event of NOTIFICATION_EVENTS) {
    await setEventState(page, event, false);
  }
};

test.describe("/account/notifications · editable notification preferences", () => {
  test("edits email frequency and event set, then persists after reload", async ({ page }) => {
    await openNotifications(page);

    await page.getByTestId("account-notif-edit-email").click();
    await expect(page.getByTestId("account-notif-form")).toBeVisible();
    await page.getByTestId("account-notif-frequency").selectOption("weekly");
    await clearAllEvents(page);
    await setEventState(page, "price_access_approved", true);
    await setEventState(page, "country_news", true);
    await page.getByTestId("account-notif-save").click();

    const emailCard = page.getByTestId("account-notif-email");
    await expect(emailCard).toContainText("Weekly");
    await expect(emailCard).toContainText("Price access approved");
    await expect(emailCard).toContainText("Country news");
    await expect(emailCard).not.toContainText("RFQ response");
    await expectStorageContains(page, '"frequency":"weekly"');

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-notif-email")).toContainText("Weekly");
    await expect(page.getByTestId("account-notif-email")).toContainText("Country news");
  });

  test("disables the agent channel and stores the disabled state", async ({ page }) => {
    await openNotifications(page);

    await page.getByTestId("account-notif-edit-agent").click();
    const enabled = page.getByTestId("account-notif-enabled");
    if (await enabled.isChecked()) {
      await enabled.click();
    }
    await clearAllEvents(page);
    await page.getByTestId("account-notif-save").click();

    await expect(page.getByTestId("account-notif-agent")).toContainText("Disabled");
    await expectStorageContains(page, '"channel":"agent","enabled":false');

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-notif-agent")).toContainText("Disabled");
  });

  test("enabled channel requires at least one notification event", async ({ page }) => {
    await openNotifications(page);

    await page.getByTestId("account-notif-edit-email").click();
    await clearAllEvents(page);
    await page.getByTestId("account-notif-save").click();

    await expect(page.getByTestId("account-notif-form")).toBeVisible();
    await expect(page.getByTestId("account-notif-events-error")).toContainText(
      "Select at least one event",
    );
    await expect(page.getByTestId("account-notif-email")).toContainText("RFQ response");
  });

  test("cancel discards notification draft changes", async ({ page }) => {
    await openNotifications(page);

    await page.getByTestId("account-notif-edit-messenger").click();
    await page.getByTestId("account-notif-frequency").selectOption("weekly");
    await clearAllEvents(page);
    await setEventState(page, "supplier_profile_review", true);
    await page.getByTestId("account-notif-cancel").click();

    const messengerCard = page.getByTestId("account-notif-messenger");
    await expect(messengerCard).toContainText("Daily");
    await expect(messengerCard).toContainText("New matching product");
    await expect(messengerCard).not.toContainText("Supplier profile review");
  });

  test("Russian notification editing stays localized and hides raw enum values", async ({
    page,
  }) => {
    await openNotifications(page, "ru");

    await page.getByTestId("account-notif-edit-in_app").click();
    await page.getByTestId("account-notif-frequency").selectOption("weekly");
    await clearAllEvents(page);
    await setEventState(page, "price_movement", true);
    await page.getByTestId("account-notif-save").click();

    const text = await mainText(page);
    expect(text).toContain("Уведомления");
    expect(text).toContain("Раз в неделю");
    expect(text).toContain("Движение цены");
    expect(text).not.toMatch(
      /price_access_approved|new_matching_product|rfq_response|price_movement|document_readiness|country_news|supplier_profile_review|weekly|daily|instant/,
    );
  });
});
