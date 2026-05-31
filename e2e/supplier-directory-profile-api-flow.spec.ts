/**
 * E2E · API-backed /suppliers -> /suppliers/:id -> /suppliers approval bridge.
 *
 * Batch #61 API-backed browser-level guard:
 * - supplier directory/profile uses the self-hosted API adapter when configured;
 * - backend-style grant state unlocks only the matching supplier;
 * - returning to directory preserves q/filter/sort/rows URL state;
 * - unrelated backend approvals do not unlock the current supplier row/profile.
 *
 * Run through `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`
 * so Playwright can intercept `__e2e-api/v1/*` without a real backend.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const DIRECTORY_PATH = "/suppliers?q=salmon&filter=salmon&sort=country&dir=asc&rows=20";
const SUPPLIER_ID = "sup-no-001";
const OTHER_SUPPLIER_ID = "sup-cn-002";
const COMPANY_NAME = "Nordfjord Sjømat AS";
const MASKED_NAME = "Norwegian salmon producer · NO-114";
const WEBSITE_HOST = "example-nordfjord.no";
const WHATSAPP_DIGITS = "475550114";
const ACTIVE_OFFERS_PATTERN = /14\s*active\s*offers/i;

type SupplierAccessStatus = "none" | "sent" | "approved";

interface ApiState {
  ackedNotifications: Set<string>;
  documentDownloadRequests?: number;
  documentGrantRequests?: number;
  requests: Record<string, SupplierAccessStatus>;
}

const nowIso = () => new Date().toISOString();

const installRegisteredStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.localStorage.removeItem("yorso_supplier_access_requests");
      window.localStorage.removeItem("yorso_supplier_access_notifications");
      window.localStorage.removeItem("yorso_backend_access_notifications_seen");
      window.sessionStorage.removeItem("yorso_supplier_access_requests");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
      window.sessionStorage.setItem(
        "yorso_buyer_session",
        JSON.stringify({
          id: "b_e2e_supplier_directory_profile_api_flow",
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

const baseSupplier = {
  id: SUPPLIER_ID,
  maskedName: MASKED_NAME,
  country: "Norway",
  countryCode: "NO",
  city: "Ålesund",
  supplierType: "producer",
  inBusinessSinceYear: 2002,
  productFocus: [
    { species: "Atlantic Salmon", forms: "HOG, fillet, portions" },
    { species: "Trout", forms: "HOG, fillet" },
  ],
  certifications: ["ASC", "MSC", "BRC", "IFS"],
  certificationBadges: [
    { code: "ASC", label: "ASC", logo: null },
    { code: "MSC", label: "MSC", logo: null },
    { code: "BRC", label: "BRC", logo: null },
    { code: "IFS", label: "IFS", logo: null },
  ],
  shortDescription: "Vertically integrated salmon farm and processing plant, weekly air shipments to EU and Asia.",
  responseSignal: "fast",
  documentReadiness: "ready",
  verificationLevel: "documents_reviewed",
  heroImage: "/assets/salmon-vertical.jpg",
  logoImage: null,
  deliveryCountries: [
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "PL", name: "Poland" },
  ],
  productCatalogPreview: [
    {
      name: "Atlantic salmon fillet",
      species: "Atlantic Salmon",
      form: "Fillet",
      image: "/offers/salmon.webp",
    },
    {
      name: "Atlantic salmon HOG",
      species: "Atlantic Salmon",
      form: "HOG",
      image: "/offers/salmon.webp",
    },
    {
      name: "Trout portions",
      species: "Trout",
      form: "Portions",
      image: "/offers/salmon.webp",
    },
  ],
} as const;

const supplierItem = (status: SupplierAccessStatus) => {
  const unlocked = status === "approved";
  return {
    ...baseSupplier,
    companyName: unlocked ? COMPANY_NAME : null,
    activeOffersCount: unlocked ? 14 : null,
    about: unlocked
      ? "Nordfjord Sjømat AS runs a salmon farming and processing operation with export packing for qualified buyers."
      : null,
    deliveryCountriesTotal: unlocked ? 5 : null,
    totalProductsCount: unlocked ? 32 : null,
    supplierDocuments: unlocked
      ? [
        {
          id: "sup-no-001-health-certificate",
          title: "Backend health certificate",
          documentType: "health_certificate",
          status: "approved",
          issuedAt: "2026-02-10",
          expiresAt: "2027-02-10",
          fileName: "sup-no-001-health-certificate.pdf",
          fileAssetId: "file_should_not_reach_browser_dom",
        },
      ]
      : null,
    website: unlocked ? `https://${WEBSITE_HOST}` : null,
    whatsapp: unlocked ? `+${WHATSAPP_DIGITS}` : null,
    updatedAt: "2026-05-14T00:00:00.000Z",
    accessLevel: unlocked ? "qualified_unlocked" : "registered_locked",
  };
};

const accessRequest = (supplierId: string, status: Exclude<SupplierAccessStatus, "none">) => {
  const at = nowIso();
  return {
    id: `request-${supplierId}`,
    supplierId,
    status,
    intent: "exact_price",
    message: "",
    createdAt: at,
    updatedAt: at,
    decidedAt: status === "approved" ? at : null,
  };
};

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
};

const installSupplierApiMock = async (page: Page, state: ApiState) => {
  await page.route("**/__e2e-api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();

    if (path === "/v1/suppliers" && method === "GET") {
      const query = url.searchParams.get("q")?.toLowerCase() ?? "";
      const accessLevel = url.searchParams.get("accessLevel");
      const approved = state.requests[SUPPLIER_ID] === "approved";
      const canReturnPrivateSearch = accessLevel === "qualified_unlocked" && approved;
      const matchesPublic = !query || query.includes("salmon") || query.includes("norwegian");
      const matchesPrivate = query.includes("nordfjord");
      const suppliers = matchesPublic || (matchesPrivate && canReturnPrivateSearch)
        ? [supplierItem(approved ? "approved" : "sent")]
        : [];

      await json(route, {
        ok: true,
        suppliers,
        total: suppliers.length,
        accessLevel: accessLevel ?? "registered_locked",
        limit: Number(url.searchParams.get("limit") ?? "20"),
        offset: Number(url.searchParams.get("offset") ?? "0"),
        requestId: "e2e-supplier-directory-list",
      });
      return;
    }

    if (path === `/v1/suppliers/${SUPPLIER_ID}` && method === "GET") {
      const approved = state.requests[SUPPLIER_ID] === "approved";
      await json(route, {
        ok: true,
        supplier: supplierItem(approved ? "approved" : "sent"),
        accessLevel: approved ? "qualified_unlocked" : "registered_locked",
        requestId: "e2e-supplier-directory-detail",
      });
      return;
    }

    if (path === `/v1/suppliers/${SUPPLIER_ID}/documents/sup-no-001-health-certificate/grant` && method === "POST") {
      state.documentGrantRequests = (state.documentGrantRequests ?? 0) + 1;
      await json(route, {
        ok: true,
        grant: {
          id: "sdg_e2e_supplier_document",
          supplierId: SUPPLIER_ID,
          documentId: "sup-no-001-health-certificate",
          fileName: "sup-no-001-health-certificate.pdf",
          downloadPath: `/v1/suppliers/${SUPPLIER_ID}/documents/sup-no-001-health-certificate/download?grantId=sdg_e2e_supplier_document`,
          grantedAt: nowIso(),
          expiresAt: nowIso(),
        },
        requestId: "e2e-supplier-document-grant",
      });
      return;
    }

    if (path === `/v1/suppliers/${SUPPLIER_ID}/documents/sup-no-001-health-certificate/download` && method === "GET") {
      expect(url.searchParams.get("grantId")).toBe("sdg_e2e_supplier_document");
      expect(request.headers()["x-yorso-session-id"]).toBe("b_e2e_supplier_directory_profile_api_flow");
      state.documentDownloadRequests = (state.documentDownloadRequests ?? 0) + 1;
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        headers: {
          "content-disposition": 'attachment; filename="sup-no-001-health-certificate.pdf"',
        },
        body: "YORSO e2e supplier document bytes",
      });
      return;
    }

    if (path === `/v1/access/suppliers/${SUPPLIER_ID}/request` && method === "GET") {
      const status = state.requests[SUPPLIER_ID] ?? "none";
      await json(route, {
        ok: true,
        request: status === "none" ? null : accessRequest(SUPPLIER_ID, status),
        accessGranted: status === "approved",
        requestId: "e2e-access-read-current",
      });
      return;
    }

    if (path === `/v1/access/suppliers/${SUPPLIER_ID}/request` && method === "POST") {
      state.requests[SUPPLIER_ID] = "sent";
      await json(route, {
        ok: true,
        request: accessRequest(SUPPLIER_ID, "sent"),
        accessGranted: false,
        requestId: "e2e-access-create-current",
      });
      return;
    }

    if (path === "/v1/access/notifications" && method === "GET") {
      const notifications = Object.entries(state.requests)
        .filter(([, status]) => status === "approved")
        .map(([supplierId]) => ({
          id: `notification-${supplierId}`,
          supplierId,
          type: "price_access_approved",
          title: "Price access approved",
          body: "Supplier approved exact price access.",
          status: state.ackedNotifications.has(`notification-${supplierId}`) ? "read" : "unread",
          createdAt: nowIso(),
          readAt: state.ackedNotifications.has(`notification-${supplierId}`) ? nowIso() : null,
        }));
      await json(route, {
        ok: true,
        notifications,
        requestId: "e2e-access-notifications",
      });
      return;
    }

    if (path === "/v1/access/notifications" && method === "PATCH") {
      let payload: { notificationIds?: unknown[] } = {};
      try {
        payload = request.postDataJSON() as { notificationIds?: unknown[] };
      } catch {
        payload = {};
      }
      const ids = Array.isArray(payload.notificationIds) ? payload.notificationIds : [];
      ids.forEach((id: unknown) => {
        if (typeof id === "string") state.ackedNotifications.add(id);
      });
      await json(route, {
        ok: true,
        notifications: [],
        markedReadCount: ids.length,
        requestId: "e2e-access-notifications-ack",
      });
      return;
    }

    await json(route, { ok: false, error: { code: "e2e_unhandled_route", path, method } }, 404);
  });
};

const gotoRegisteredDirectory = async (page: Page, state: ApiState, path = DIRECTORY_PATH) => {
  await installSupplierApiMock(page, state);
  await installRegisteredStorage(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("supplier-directory-search")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("supplier-directory-sort")).toHaveValue("country");
  await expect(page.getByTestId("supplier-directory-page-size")).toHaveValue("20");
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const nordfjordRow = (page: Page) =>
  page
    .getByTestId("supplier-row")
    .filter({ has: page.locator(`a[href="/suppliers/${SUPPLIER_ID}"]`) })
    .first();

const assertNoRestrictedSupplierValues = async (page: Page) => {
  const text = await bodyText(page);
  expect(text).not.toContain(COMPANY_NAME);
  expect(text).not.toContain(WEBSITE_HOST);
  expect(text).not.toContain(WHATSAPP_DIGITS);
  expect(text).not.toMatch(ACTIVE_OFFERS_PATTERN);
};

const triggerBackendNotificationSync = async (page: Page) => {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("visibilitychange"));
  });
};

test.describe("/suppliers API-backed directory/profile approval bridge", () => {
  test("backend approval unlocks the matching supplier after profile refresh and directory return", async ({ page }) => {
    const state: ApiState = { ackedNotifications: new Set(), requests: {} };
    await gotoRegisteredDirectory(page, state);

    await expect(nordfjordRow(page)).toBeVisible();
    await expect(nordfjordRow(page)).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);

    await nordfjordRow(page).getByTestId("supplier-row-title-link").click();
    await expect(page).toHaveURL(new RegExp(`/suppliers/${SUPPLIER_ID}`));
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedSupplierValues(page);

    await page.getByTestId("supplier-request-price-access").click();
    await expect(page.getByTestId("supplier-access-request-status")).toBeVisible();
    expect(state.requests[SUPPLIER_ID]).toBe("sent");

    state.requests[SUPPLIER_ID] = "approved";
    await triggerBackendNotificationSync(page);
    await expect(page.getByTestId("supplier-access-refresh-banner")).toBeVisible();
    await page.getByTestId("supplier-access-refresh-now").click();

    await expect(page.getByTestId("supplier-display-name").first()).toContainText(COMPANY_NAME);
    await expect(page.getByTestId("supplier-cta-block")).toContainText("SEND MESSAGE");
    expect(await bodyText(page)).toMatch(ACTIVE_OFFERS_PATTERN);

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/suppliers/);
    await expect(page).toHaveURL(/q=salmon/);
    await expect(page).toHaveURL(/filter=salmon/);
    await expect(page).toHaveURL(/sort=country/);
    await expect(page).toHaveURL(/rows=20/);

    await expect(nordfjordRow(page)).toBeVisible();
    await expect(nordfjordRow(page)).toContainText(COMPANY_NAME);
    await expect(nordfjordRow(page)).toContainText(ACTIVE_OFFERS_PATTERN);
  });

  test("backend approval for another supplier does not unlock the current directory/profile flow", async ({ page }) => {
    const state: ApiState = {
      ackedNotifications: new Set(),
      requests: { [OTHER_SUPPLIER_ID]: "approved" },
    };
    await gotoRegisteredDirectory(page, state);
    await triggerBackendNotificationSync(page);

    await expect(nordfjordRow(page)).toBeVisible();
    await expect(nordfjordRow(page)).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);

    await nordfjordRow(page).getByTestId("supplier-row-title-link").click();
    await expect(page.getByTestId("supplier-access-refresh-banner")).toHaveCount(0);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await expect(page.getByTestId("supplier-display-name").first()).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);
  });

  test("qualified buyer downloads supplier document through grant-bound API flow", async ({ page }) => {
    const state: ApiState = {
      ackedNotifications: new Set(),
      requests: { [SUPPLIER_ID]: "approved" },
    };
    await gotoRegisteredDirectory(page, state);

    await nordfjordRow(page).getByTestId("supplier-row-title-link").click();
    await expect(page.getByTestId("supplier-display-name").first()).toContainText(COMPANY_NAME);
    await page.getByRole("tab", { name: "Production passport" }).click();
    await expect(page.getByText("Backend health certificate")).toBeVisible();

    await page.getByTestId("supplier-document-download").click();

    await expect.poll(() => state.documentGrantRequests ?? 0).toBe(1);
    await expect.poll(() => state.documentDownloadRequests ?? 0).toBe(1);
    await expect(page.getByText("Download started")).toBeVisible();
    expect(await bodyText(page)).not.toContain("file_should_not_reach_browser_dom");
    expect(await bodyText(page)).not.toContain("objectKey");
  });
});
