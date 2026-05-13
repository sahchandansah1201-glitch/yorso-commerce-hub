import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  accountBranchesSchema,
  accountMetaRegionsSchema,
  accountNotificationsSchema,
  accountProductsSchema,
  companyProfileSchema,
  companyProfileUpdateSchema,
  userProfileSchema,
} from "../../packages/contracts/src";

describe("self-hosted account/company contracts", () => {
  const validCompany = {
    id: "11111111-1111-4111-8111-111111111111",
    legalName: "Nordfjord Sjomat AS",
    tradeName: "Nordfjord Seafood",
    accountRole: "supplier",
    countryCode: "NO",
    website: "https://example.com",
    yearFounded: 2002,
    contactEmail: "sales@example.com",
    contactPhone: "+47 11 22 33 44",
    messengerHandle: "+47 11 22 33 44",
    description: "Producer and exporter of salmon products.",
    productFocus: ["Atlantic Salmon", "Trout"],
    certificates: ["ASC", "MSC"],
    paymentTerms: ["30/70", "LC"],
    publicationStatus: "draft",
    buyerQualificationStatus: "not_started",
    media: {
      logoObjectKey: "companies/111/logo.png",
      coverObjectKey: "companies/111/cover.jpg",
      logoAlt: "Nordfjord Seafood logo",
      coverAlt: "Salmon processing facility",
      logoFit: "contain",
      coverFocalX: 0.5,
      coverFocalY: 0.4,
    },
    updatedAt: "2026-05-13T08:00:00.000Z",
  };

  it("accepts the company profile shape needed by /account/company", () => {
    expect(companyProfileSchema.parse(validCompany)).toMatchObject({
      tradeName: "Nordfjord Seafood",
      media: { logoFit: "contain" },
    });
  });

  it("accepts buyer, supplier and both-role company profiles for the future API", () => {
    for (const accountRole of ["buyer", "supplier", "both"] as const) {
      const parsed = companyProfileSchema.parse({
        ...validCompany,
        accountRole,
        publicationStatus: accountRole === "buyer" ? "draft" : "review",
        buyerQualificationStatus: accountRole === "supplier" ? "not_started" : "pending",
      });

      expect(parsed.accountRole).toBe(accountRole);
    }
  });

  it("accepts partial company media updates for self-hosted object storage", () => {
    const parsed = companyProfileUpdateSchema.parse({
      media: {
        logoObjectKey: "companies/111/new-logo.webp",
        coverObjectKey: "companies/111/new-cover.webp",
        logoAlt: "Updated trade name logo",
        coverAlt: "Updated plant cover",
        logoFit: "cover",
        coverFocalX: 0.25,
        coverFocalY: 0.8,
      },
    });

    expect(parsed.media?.logoObjectKey).toBe("companies/111/new-logo.webp");
    expect(parsed.media?.coverFocalY).toBe(0.8);
  });

  it("rejects invalid object-storage focal points and empty updates", () => {
    expect(() =>
      companyProfileSchema.parse({
        ...validCompany,
        media: { ...validCompany.media, coverFocalX: 1.5 },
      }),
    ).toThrow();
    expect(() => companyProfileUpdateSchema.parse({})).toThrow(/At least one company profile field/);
  });

  it("rejects invalid company DTO values before they reach the self-hosted API", () => {
    expect(() => companyProfileSchema.parse({ ...validCompany, countryCode: "NOR" })).toThrow();
    expect(() => companyProfileSchema.parse({ ...validCompany, website: "not-a-url" })).toThrow();
    expect(() => companyProfileSchema.parse({ ...validCompany, contactEmail: "sales-at-example.com" })).toThrow();
    expect(() => companyProfileSchema.parse({ ...validCompany, yearFounded: 1799 })).toThrow();
    expect(() => companyProfileSchema.parse({ ...validCompany, publicationStatus: "live" })).toThrow();
    expect(() =>
      companyProfileSchema.parse({
        ...validCompany,
        productFocus: Array.from({ length: 21 }, (_, index) => `Product ${index}`),
      }),
    ).toThrow();
    expect(() =>
      companyProfileSchema.parse({
        ...validCompany,
        certificates: Array.from({ length: 31 }, (_, index) => `CERT-${index}`),
      }),
    ).toThrow();
    expect(() =>
      companyProfileSchema.parse({
        ...validCompany,
        paymentTerms: Array.from({ length: 21 }, (_, index) => `Term ${index}`),
      }),
    ).toThrow();
  });

  it("accepts the user profile shape needed by /account/personal", () => {
    const parsed = userProfileSchema.parse({
      id: "22222222-2222-4222-8222-222222222222",
      firstName: "Demid",
      lastName: "Maximenko",
      email: "dm@yorso.com",
      phone: "+1 555 0100",
      preferredLanguage: "ru",
      timezone: "Europe/Moscow",
      updatedAt: "2026-05-13T08:00:00.000Z",
    });

    expect(parsed.preferredLanguage).toBe("ru");
  });

  it("accepts account workspace collections needed by /account sections", () => {
    expect(
      accountBranchesSchema.parse([
        {
          id: "br_1",
          name: "Main warehouse",
          type: "warehouse",
          country: "Spain",
          region: "Galicia",
          city: "Vigo",
          addressLine: "Terminal 1",
          defaultIncoterms: "FCA",
          portOrPickupPoint: "Vigo",
          notes: "Default loading point.",
        },
      ]),
    ).toHaveLength(1);

    expect(
      accountProductsSchema.parse([
        {
          id: "p_1",
          commercialName: "Atlantic Cod H&G",
          latinName: "Gadus morhua",
          category: "Whitefish",
          state: "frozen",
          format: "H&G",
          role: "selling",
          monthlyVolume: "120 t",
          certificates: ["MSC"],
          targetCountries: ["Spain"],
        },
      ]),
    ).toHaveLength(1);

    expect(
      accountMetaRegionsSchema.parse([
        {
          id: "mr_1",
          name: "Iberia",
          countries: ["Spain", "Portugal"],
          logisticsReason: "same_sales_market",
          defaultCurrency: "EUR",
          notes: "Shared buyers.",
          usedFor: ["notifications"],
        },
      ]),
    ).toHaveLength(1);
  });

  it("rejects enabled notification channels without events", () => {
    expect(() =>
      accountNotificationsSchema.parse([
        {
          id: "n_1",
          channel: "email",
          enabled: true,
          events: [],
          frequency: "instant",
        },
      ]),
    ).toThrow(/Enabled notification channels/);
  });

  it("documents local self-hosted runtime services", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const env = readFileSync(".env.example", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("pgbouncer:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("minio:");
    expect(env).toContain("DATABASE_URL=");
    expect(env).toMatch(/^VITE_YORSO_API_URL=$/m);
    expect(env).toContain("PGBOUNCER_DATABASE_URL=");
    expect(env).toMatch(/^VITE_SUPABASE_URL=$/m);
    expect(env).toMatch(/^VITE_SUPABASE_PUBLISHABLE_KEY=$/m);
    expect(env).toContain("Supabase prototype only");
  });

  it("keeps contract package exports compatible with Node ESM runtime", () => {
    const indexSource = readFileSync("packages/contracts/src/index.ts", "utf8");

    expect(indexSource).toContain('export * from "./account-company.js";');
  });
});
