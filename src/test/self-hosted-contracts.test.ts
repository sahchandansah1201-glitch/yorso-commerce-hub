import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
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

  it("rejects invalid object-storage focal points and empty updates", () => {
    expect(() =>
      companyProfileSchema.parse({
        ...validCompany,
        media: { ...validCompany.media, coverFocalX: 1.5 },
      }),
    ).toThrow();
    expect(() => companyProfileUpdateSchema.parse({})).toThrow(/At least one company profile field/);
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

  it("documents local self-hosted runtime services", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const env = readFileSync(".env.example", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("pgbouncer:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("minio:");
    expect(env).toContain("DATABASE_URL=");
    expect(env).toContain("PGBOUNCER_DATABASE_URL=");
    expect(env).toContain("Supabase prototype only");
  });
});
