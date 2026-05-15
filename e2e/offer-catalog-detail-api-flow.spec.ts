/**
 * E2E · API-backed /offers -> /offers/:id -> /offers approval bridge.
 *
 * Batch #62 API-backed browser-level guard:
 * - offer catalog/detail uses the self-hosted API adapter when configured;
 * - backend-style supplier approval unlocks only the matching offer;
 * - returning to catalog preserves q/category/sort/rows URL state;
 * - unrelated backend approvals do not unlock the current offer row/detail.
 *
 * Run through `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`
 * so Playwright can intercept `__e2e-api/v1/*` without a real backend.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const CATALOG_PATH = "/offers?q=salmon&category=Salmon&sort=origin&dir=asc&rows=20";
const OFFER_ID = "1";
const OFFER_UUID = "00000000-0000-0000-0000-000000000001";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";
const SUPPLIER_NAME = "Nordic Seafood AS";
const SUPPLIER_ID = "nordic-seafood";
const OTHER_SUPPLIER_ID = "pacifico-export";
const EXACT_PRICE_PATTERN = /\$(8\.50|8\.70|8\.90|9\.00|9\.10|9\.20|9\.30|9\.80|10\.00)/;

type SupplierAccessStatus = "none" | "sent" | "approved";

interface ApiState {
  ackedNotifications: Set<string>;
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
          id: "b_e2e_offer_catalog_detail_api_flow",
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

const supplierInfo = (status: SupplierAccessStatus) => {
  const unlocked = status === "approved";
  return {
    id: SUPPLIER_ID,
    name: unlocked ? SUPPLIER_NAME : null,
    country: "Norway",
    countryCode: "NO",
    countryFlag: "🇳🇴",
    isVerified: true,
    inBusinessSince: unlocked ? 2008 : null,
    responseTime: unlocked ? "< 4 hours" : null,
    certifications: ["HACCP", "ASC", "BRC Grade AA", "ISO 22000"],
    documentsReviewed: unlocked
      ? ["Business license", "Export permit", "HACCP certificate", "ASC Chain of Custody"]
      : [],
    profileSlug: unlocked ? "nordic-seafood" : null,
  };
};

const offerItem = (status: SupplierAccessStatus) => {
  const unlocked = status === "approved";
  return {
    id: OFFER_ID,
    productName: PRODUCT_NAME,
    species: "Atlantic Salmon",
    latinName: "Salmo salar",
    category: "Salmon",
    origin: "Norway",
    originCode: "NO",
    originFlag: "🇳🇴",
    format: "Frozen",
    cutType: "Fillet, Skin-On, Pin Bone Out",
    packaging: "10 kg carton",
    certifications: ["HACCP", "ASC"],
    image: "/offers/salmon.webp",
    images: ["/offers/salmon.webp", "/offers/cod.webp", "/offers/crab.webp"],
    gallery: [
      {
        src: "/offers/salmon.webp",
        alt: "Atlantic Salmon Fillet top view",
        caption: "Fillet skin-on, pin bone out, vacuum packed",
        sourceLabel: "Supplier-provided",
      },
      {
        src: "/assets/salmon-vertical.jpg",
        alt: "Whole salmon inspection",
        caption: "Fresh whole fish before processing",
        sourceLabel: "Supplier-provided",
      },
    ],
    photoSourceLabel: "Supplier-provided product photos",
    sampleAvailable: true,
    inspectionAvailable: true,
    traceability: unlocked
      ? "Full chain traceability from aquaculture farm in Norwegian Sea through EU-approved processing facility."
      : null,
    freshness: "Updated 2h ago",
    moqLabel: "MOQ: 1,000 kg",
    moqValue: 1000,
    moqUnit: "kg",
    priceRangeLabel: unlocked ? "$8.50 – $9.20" : "Price on request",
    priceUnit: "per kg",
    priceMin: unlocked ? 8.5 : null,
    priceMax: unlocked ? 9.2 : null,
    currency: unlocked ? "USD" : null,
    supplier: supplierInfo(status),
    specs: {
      catchingMethod: "Aquaculture",
      freezingProcess: "IQF (Individually Quick Frozen)",
      glazing: "5%",
      storageTemperature: "-18°C or below",
      fishingArea: "FAO 27",
      ingredients: "100% Atlantic Salmon (Salmo salar)",
      nutritionPer100g: {
        calories: "208 kcal",
        protein: "20g",
        fat: "13g",
        carbs: "0g",
      },
      packingWeight: "10 kg net",
      shelfLife: "24 months from production",
    },
    commercial: {
      incoterm: "FOB",
      paymentTerms: "30% advance, 70% against B/L",
      availableVolume: "Medium-high capacity",
      leadTime: "14-21 days",
      stockStatus: "In Stock",
      shipmentPort: "Ålesund, Norway",
    },
    deliveryBasisOptions: [
      {
        code: "FOB",
        label: "FOB Ålesund",
        isDefault: true,
        priceRange: unlocked ? "$8.50 – $9.20" : "Available after supplier approval",
        priceUnit: "per kg",
        shipmentPort: "Ålesund, Norway",
        leadTime: "14-21 days",
        note: "Ex-works from processing facility",
      },
      {
        code: "CIF",
        label: "CIF Rotterdam",
        isDefault: false,
        priceRange: unlocked ? "$9.10 – $9.80" : "Available after supplier approval",
        priceUnit: "per kg",
        shipmentPort: "Rotterdam, Netherlands",
        leadTime: "18-25 days",
        note: "Insurance and freight included",
      },
    ],
    relatedArticles: [
      {
        id: "a1",
        title: "Atlantic Salmon Sourcing Guide",
        slug: "salmon-sourcing-guide",
        category: "Buying Guide",
        readTime: "8 min",
        relevanceReason: "Same species",
      },
    ],
    volumeBreaks: unlocked
      ? [
          { minQty: "1,000 – 4,999 kg", priceRange: "$9.00 – $9.20" },
          { minQty: "5,000+ kg", priceRange: "$8.50 – $8.90" },
        ]
      : [],
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

const installOfferApiMock = async (page: Page, state: ApiState) => {
  await page.route("**/__e2e-api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();

    if (path === "/v1/offers" && method === "GET") {
      const query = url.searchParams.get("q")?.toLowerCase() ?? "";
      const category = url.searchParams.get("category") ?? "";
      const accessLevel = url.searchParams.get("accessLevel");
      const approved = state.requests[SUPPLIER_ID] === "approved";
      const canReturnPrivateSearch = accessLevel === "qualified_unlocked" && approved;
      const matchesPublic = (!query || query.includes("salmon")) && (!category || category === "Salmon");
      const matchesPrivate = query.includes("nordic");
      const offers = matchesPublic || (matchesPrivate && canReturnPrivateSearch)
        ? [offerItem(approved ? "approved" : "sent")]
        : [];

      await json(route, {
        ok: true,
        offers,
        total: offers.length,
        accessLevel: accessLevel ?? "registered_locked",
        limit: Number(url.searchParams.get("limit") ?? "20"),
        offset: Number(url.searchParams.get("offset") ?? "0"),
        requestId: "e2e-offer-catalog-list",
      });
      return;
    }

    if ((path === `/v1/offers/${OFFER_ID}` || path === `/v1/offers/${OFFER_UUID}`) && method === "GET") {
      const approved = state.requests[SUPPLIER_ID] === "approved";
      await json(route, {
        ok: true,
        offer: offerItem(approved ? "approved" : "sent"),
        accessLevel: approved ? "qualified_unlocked" : "registered_locked",
        requestId: "e2e-offer-catalog-detail",
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

const gotoRegisteredCatalog = async (page: Page, state: ApiState, path = CATALOG_PATH) => {
  await installOfferApiMock(page, state);
  await installRegisteredStorage(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("catalog-result-count")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("offer-catalog-sort")).toHaveValue("origin");
  await expect(page.getByTestId("offer-catalog-page-size")).toHaveValue("20");
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const salmonRow = (page: Page) =>
  page.locator(`[data-testid="catalog-offer-row"][data-offer-id="${OFFER_ID}"]:visible`);

const assertNoRestrictedOfferValues = async (page: Page) => {
  const text = await bodyText(page);
  expect(text).not.toContain(SUPPLIER_NAME);
  expect(text).not.toContain(SUPPLIER_ID);
  expect(text).not.toMatch(EXACT_PRICE_PATTERN);
};

const triggerBackendNotificationSync = async (page: Page) => {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("visibilitychange"));
  });
};

test.describe("/offers API-backed catalog/detail approval bridge", () => {
  test("backend approval unlocks the matching offer after detail refresh and catalog return", async ({ page }) => {
    const state: ApiState = { ackedNotifications: new Set(), requests: {} };
    await gotoRegisteredCatalog(page, state);

    await expect(salmonRow(page)).toBeVisible();
    await expect(salmonRow(page).getByTestId("catalog-row-price-block")).toHaveAttribute(
      "data-access-level",
      "registered_locked",
    );
    await assertNoRestrictedOfferValues(page);

    await salmonRow(page).getByTestId("catalog-row-view-details").click();
    await expect(page).toHaveURL(new RegExp(`/offers/${OFFER_UUID}`));
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedOfferValues(page);

    await page.getByTestId("supplier-request-price-access").click();
    await expect(page.getByTestId("supplier-access-request-status")).toBeVisible();
    expect(state.requests[SUPPLIER_ID]).toBe("sent");

    state.requests[SUPPLIER_ID] = "approved";
    await triggerBackendNotificationSync(page);
    await expect(page.getByTestId("supplier-access-refresh-banner")).toBeVisible();
    await page.getByTestId("supplier-access-refresh-now").click();

    await expect(page.locator("body")).toContainText(SUPPLIER_NAME);
    expect(await bodyText(page)).toMatch(EXACT_PRICE_PATTERN);

    await page.getByTestId("offer-detail-back-to-catalog").click();
    await expect(page).toHaveURL(/\/offers/);
    await expect(page).toHaveURL(/q=salmon/);
    await expect(page).toHaveURL(/category=Salmon/);
    await expect(page).toHaveURL(/sort=origin/);
    await expect(page).toHaveURL(/rows=20/);

    await expect(salmonRow(page)).toBeVisible();
    await expect(salmonRow(page).getByTestId("catalog-row-price-block")).toHaveAttribute(
      "data-access-level",
      "qualified_unlocked",
    );
    await expect(salmonRow(page).getByTestId("catalog-row-supplier-name")).toContainText(SUPPLIER_NAME);
    await expect(salmonRow(page).getByTestId("catalog-row-price")).toContainText("USD");
  });

  test("backend approval for another supplier does not unlock the current catalog/detail flow", async ({ page }) => {
    const state: ApiState = {
      ackedNotifications: new Set(),
      requests: { [OTHER_SUPPLIER_ID]: "approved" },
    };
    await gotoRegisteredCatalog(page, state);
    await triggerBackendNotificationSync(page);

    await expect(salmonRow(page)).toBeVisible();
    await expect(salmonRow(page).getByTestId("catalog-row-price-block")).toHaveAttribute(
      "data-access-level",
      "registered_locked",
    );
    await assertNoRestrictedOfferValues(page);

    await salmonRow(page).getByTestId("catalog-row-view-details").click();
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();
    await expect(page.getByTestId("supplier-access-refresh-banner")).toHaveCount(0);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedOfferValues(page);
  });
});
