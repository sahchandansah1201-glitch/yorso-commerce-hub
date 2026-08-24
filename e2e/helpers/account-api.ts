import { expect, type Page, type Route } from "@playwright/test";
import {
  mockBranches,
  mockCompany,
  mockMetaRegions,
  mockNotifications,
  mockProducts,
  mockUser,
  type CompanyProfile,
} from "../../src/data/mockAccount";
import type { E2ELang } from "./buyer-session";

interface AccountApiOptions {
  lang?: E2ELang;
  sessionId: string;
  userId?: string;
}

interface BackendCompany {
  id: string;
  legalName: string;
  tradeName: string;
  accountRole: CompanyProfile["accountRole"];
  countryCode: string;
  website: string | null;
  yearFounded: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  messengerHandle: string | null;
  description: string | null;
  productFocus: string[];
  certificates: string[];
  paymentTerms: string[];
  publicationStatus: "draft" | "review" | "published" | "blocked";
  buyerQualificationStatus: "not_started" | "pending" | "qualified" | "rejected";
  media: {
    logoObjectKey: string | null;
    coverObjectKey: string | null;
    logoAlt: string | null;
    coverAlt: string | null;
    logoFit: "contain" | "cover";
    coverFocalX: number;
    coverFocalY: number;
  };
  updatedAt: string;
}

const COUNTRY_TO_CODE: Record<string, string> = {
  Argentina: "AR",
  Germany: "DE",
  Lithuania: "LT",
  Norway: "NO",
  Spain: "ES",
};

const INITIAL_TIMESTAMP = "2026-08-23T12:00:00.000Z";

const companyFixture = (): BackendCompany => ({
  id: mockCompany.id,
  legalName: mockCompany.legalName,
  tradeName: mockCompany.tradeName,
  accountRole: mockCompany.accountRole,
  countryCode: COUNTRY_TO_CODE[mockCompany.country] ?? mockCompany.country,
  website: mockCompany.website || null,
  yearFounded: mockCompany.yearFounded || null,
  contactEmail: mockCompany.contactEmail || null,
  contactPhone: mockCompany.contactPhone || null,
  messengerHandle: mockCompany.whatsapp || null,
  description: mockCompany.description || null,
  productFocus: [...mockCompany.productFocus],
  certificates: [...mockCompany.certificates],
  paymentTerms: [...mockCompany.paymentTerms],
  publicationStatus:
    mockCompany.supplierPublicationStatus === "ready_for_review"
      ? "review"
      : mockCompany.supplierPublicationStatus === "published"
        ? "published"
        : "draft",
  buyerQualificationStatus:
    mockCompany.buyerQualificationStatus === "ready"
      ? "pending"
      : mockCompany.buyerQualificationStatus === "qualified"
        ? "qualified"
        : "not_started",
  media: {
    logoObjectKey: mockCompany.logoImageUrl || null,
    coverObjectKey: mockCompany.coverImageUrl || null,
    logoAlt: mockCompany.logoAlt || null,
    coverAlt: mockCompany.coverAlt || null,
    logoFit: mockCompany.logoFit,
    coverFocalX: 0.5,
    coverFocalY: 0.5,
  },
  updatedAt: INITIAL_TIMESTAMP,
});

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
};

/**
 * Installs a deterministic self-hosted account API for browser-level account tests.
 * The broad host match intentionally supports both the local API URL and /__e2e-api.
 */
export const installAccountApiRoutes = async (
  page: Page,
  { lang = "en", sessionId, userId = "usr_e2e_account" }: AccountApiOptions,
) => {
  let accountVersion = 1;
  let company = companyFixture();
  const user = {
    id: userId,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    email: mockUser.email,
    phone: mockUser.phone || null,
    preferredLanguage: lang,
    timezone: mockUser.timezone,
    updatedAt: INITIAL_TIMESTAMP,
  };

  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();
    const requestId = `req-e2e-account-${accountVersion}`;

    if (path === "/v1/auth/session" && method === "GET") {
      expect(request.headers()["x-yorso-session-id"]).toBe(sessionId);
      await json(route, {
        ok: true,
        requestId,
        session: {
          displayName: `${mockUser.firstName} ${mockUser.lastName}`,
          email: mockUser.email,
          expiresAt: "2026-08-24T23:59:59.000Z",
          id: sessionId,
          issuedAt: INITIAL_TIMESTAMP,
          userId,
        },
      });
      return;
    }

    if (path === "/v1/account/workspace" && method === "GET") {
      await json(route, {
        ok: true,
        accountVersion: `account-v${accountVersion}`,
        requestId,
        user,
        company,
        branches: mockBranches,
        products: mockProducts,
        metaRegions: mockMetaRegions,
        notifications: mockNotifications,
      });
      return;
    }

    if (path === "/v1/account/company" && method === "PATCH") {
      const update = (await request.postDataJSON()) as Partial<BackendCompany>;
      company = {
        ...company,
        ...update,
        media: { ...company.media, ...(update.media ?? {}) },
        updatedAt: new Date(Date.parse(INITIAL_TIMESTAMP) + accountVersion * 1_000).toISOString(),
      };
      accountVersion += 1;
      await json(route, {
        ok: true,
        accountVersion: `account-v${accountVersion}`,
        requestId,
        company,
      });
      return;
    }

    if (path === "/v1/account/documents" && method === "GET") {
      await json(route, {
        ok: true,
        accountVersion: `account-v${accountVersion}`,
        requestId,
        documents: [],
      });
      return;
    }

    if (path === "/v1/access/notifications" && method === "GET") {
      await json(route, {
        ok: true,
        notifications: [],
        requestId: `${requestId}-access-notifications`,
      });
      return;
    }

    if (path === "/v1/access/notifications" && method === "PATCH") {
      const payload = (await request.postDataJSON()) as { notificationIds?: unknown[] };
      await json(route, {
        ok: true,
        notifications: [],
        markedReadCount: Array.isArray(payload.notificationIds) ? payload.notificationIds.length : 0,
        requestId: `${requestId}-access-notifications-ack`,
      });
      return;
    }

    await json(route, { ok: false, error: { code: "e2e_unhandled", message: `${method} ${path}` } }, 404);
  });

  return {
    getCompany: () => company,
  };
};
