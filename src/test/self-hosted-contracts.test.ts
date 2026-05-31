import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  accountBranchesSchema,
  accountCompanyDocumentsSchema,
  accountFileAssetSchema,
  accountFileUploadPayloadSchema,
  accountMetaRegionsSchema,
  accountNotificationsSchema,
  accountProductsSchema,
  accountSessionHeadersSchema,
  accountSessionIdHeaderName,
  accountUserIdHeaderName,
  companyDocumentCreateSchema,
  companyProfileSchema,
  companyProfileUpdateSchema,
  supplierDirectoryItemSchema,
  supplierDirectoryQuerySchema,
  supplierDirectoryRecordSchema,
  supplierAccessNotificationsAckResponseSchema,
  supplierAccessNotificationsAckSchema,
  supplierDocumentDownloadGrantResponseSchema,
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

  it("accepts explicit account session headers for the self-hosted API boundary", () => {
    expect(accountUserIdHeaderName).toBe("x-yorso-user-id");
    expect(accountSessionIdHeaderName).toBe("x-yorso-session-id");
    expect(
      accountSessionHeadersSchema.parse({
        userId: "00000000-0000-4000-8000-000000000001",
        sessionId: "browser-session_1",
      }),
    ).toEqual({
      userId: "00000000-0000-4000-8000-000000000001",
      sessionId: "browser-session_1",
    });
    expect(() => accountSessionHeadersSchema.parse({ userId: "usr_demo_1" })).toThrow();
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

  it("accepts self-hosted file assets and company document payloads", () => {
    const upload = accountFileUploadPayloadSchema.parse({
      fileName: "haccp.pdf",
      contentType: "application/pdf",
      sizeBytes: 8,
      contentBase64: "ZG9jdW1lbnQ=",
    });

    expect(
      accountFileAssetSchema.parse({
        id: "22222222-2222-4222-8222-222222222222",
        companyId: "11111111-1111-4111-8111-111111111111",
        purpose: "company_document",
        objectKey: "companies/111/company_document/haccp.pdf",
        originalFileName: "haccp.pdf",
        contentType: "application/pdf",
        sizeBytes: 8,
        checksumSha256: "a".repeat(64),
        storageDriver: "local",
        createdAt: "2026-05-13T08:00:00.000Z",
      }),
    ).toMatchObject({
      purpose: "company_document",
      storageDriver: "local",
    });

    expect(
      companyDocumentCreateSchema.parse({
        title: "HACCP certificate",
        documentType: "haccp",
        visibility: "buyer_qualified",
        file: upload,
      }),
    ).toMatchObject({
      title: "HACCP certificate",
      visibility: "buyer_qualified",
    });

    expect(
      accountCompanyDocumentsSchema.parse([
        {
          id: "33333333-3333-4333-8333-333333333333",
          companyId: "11111111-1111-4111-8111-111111111111",
          fileAssetId: "22222222-2222-4222-8222-222222222222",
          title: "HACCP certificate",
          documentType: "haccp",
          visibility: "buyer_qualified",
          status: "uploaded",
          fileName: "haccp.pdf",
          contentType: "application/pdf",
          sizeBytes: 8,
          checksumSha256: "b".repeat(64),
          expiresAt: null,
          createdAt: "2026-05-13T08:00:00.000Z",
          updatedAt: "2026-05-13T08:00:00.000Z",
        },
      ]),
    ).toHaveLength(1);
  });

  it("accepts supplier directory records and access-shaped responses", () => {
    const record = supplierDirectoryRecordSchema.parse({
      id: "sup-contract-1",
      companyName: "Contract Salmon AS",
      maskedName: "Norwegian salmon supplier · CT-001",
      country: "Norway",
      countryCode: "NO",
      city: "Alesund",
      supplierType: "producer",
      inBusinessSinceYear: 2010,
      productFocus: [{ species: "Atlantic Salmon", forms: "HOG, fillet" }],
      certifications: ["ASC", "HACCP"],
      certificationBadges: [{ code: "ASC", label: "ASC", logo: null }],
      activeOffersCount: 12,
      shortDescription: "Supplier directory contract sample.",
      about: "Private supplier about text for qualified buyers.",
      responseSignal: "fast",
      documentReadiness: "ready",
      verificationLevel: "documents_reviewed",
      heroImage: "/offers/salmon.webp",
      logoImage: null,
      deliveryCountries: [{ code: "DE", name: "Germany" }],
      deliveryCountriesTotal: 8,
      totalProductsCount: 20,
      productCatalogPreview: [{ name: "Salmon HOG", species: "Atlantic Salmon", form: "HOG", image: "/offers/salmon.webp" }],
      website: "https://supplier.example",
      whatsapp: "+47 555 000",
      productionFacts: {
        dailyTons: 64,
        lines: 5,
        coldStorageT: 1200,
        blastFreezerT: 80,
        staff: 180,
      },
      logisticsFacts: {
        incoterms: ["FCA", "CIF"],
        transitDaysMin: 7,
        transitDaysMax: 14,
        minBatchTons: 2,
        containers: ["20' Reefer", "40' Reefer HC"],
        tempRange: "-18 C ... -22 C",
      },
      shipmentCases: [
        {
          id: "case-contract-1",
          titleKey: "supplier_cases_caseTitle_de",
          dateISO: "2026-04-11",
          destinationKey: "supplier_cases_destination_de",
          product: "Atlantic Salmon",
          volumeTons: 24,
          incoterm: "CFR Hamburg",
          buyerTypeKey: "supplier_cases_buyerType_retail",
          notesKey: "supplier_cases_notes_de",
          photoCaptionKeys: ["supplier_cases_photoCaption_loading"],
        },
      ],
      faqItems: [
        {
          qKey: "supplier_faq_q1",
          aKey: "supplier_faq_a1",
          params: { n: 2 },
        },
      ],
      legalDetails: {
        registrationLabel: "Org. nr",
        registrationNumber: "999888777",
        vatNumber: "NO999888777",
        eoriNumber: "NO999888777000",
        legalForm: "AS",
        foundedDate: "2010-04-17",
      },
      supplierDocuments: [
        {
          id: "contract-doc-health-1",
          title: "Contract health certificate",
          documentType: "health_certificate",
          status: "approved",
          issuedAt: "2026-02-10",
          expiresAt: "2027-02-10",
          fileName: "contract-health-certificate.pdf",
          fileAssetId: "file_contract_doc_health_1",
        },
      ],
      updatedAt: "2026-05-14T00:00:00.000Z",
    });

    expect(record.companyName).toBe("Contract Salmon AS");
    expect(record.productionFacts.dailyTons).toBe(64);
    expect(record.logisticsFacts.incoterms).toEqual(["FCA", "CIF"]);
    expect(record.shipmentCases[0]).toMatchObject({
      product: "Atlantic Salmon",
      volumeTons: 24,
    });
    expect(record.faqItems[0].params).toEqual({ n: 2 });
    expect(record.legalDetails).toMatchObject({
      registrationNumber: "999888777",
      legalForm: "AS",
    });
    expect(record.supplierDocuments[0]).toMatchObject({
      title: "Contract health certificate",
      fileName: "contract-health-certificate.pdf",
    });
    expect(
      supplierDirectoryItemSchema.parse({
        ...record,
        companyName: null,
        about: null,
        activeOffersCount: null,
        deliveryCountriesTotal: null,
        totalProductsCount: null,
        legalDetails: null,
        supplierDocuments: null,
        website: null,
        whatsapp: null,
        accessLevel: "anonymous_locked",
      }),
    ).toMatchObject({
      maskedName: "Norwegian salmon supplier · CT-001",
      companyName: null,
      productionFacts: {
        dailyTons: 64,
        lines: 5,
      },
      logisticsFacts: {
        incoterms: ["FCA", "CIF"],
        minBatchTons: 2,
      },
      shipmentCases: [
        {
          product: "Atlantic Salmon",
          incoterm: "CFR Hamburg",
        },
      ],
      faqItems: [
        {
          qKey: "supplier_faq_q1",
          params: { n: 2 },
        },
      ],
      legalDetails: null,
      supplierDocuments: null,
      accessLevel: "anonymous_locked",
    });
  });

  it("validates supplier directory query bounds", () => {
    expect(
      supplierDirectoryQuerySchema.parse({
        q: "salmon",
        countryCode: "NO",
        supplierType: "producer",
        accessLevel: "registered_locked",
        limit: "10",
        offset: "0",
      }),
    ).toMatchObject({
      q: "salmon",
      limit: 10,
      accessLevel: "registered_locked",
    });

    expect(() => supplierDirectoryQuerySchema.parse({ limit: 999 })).toThrow();
    expect(() => supplierDirectoryQuerySchema.parse({ countryCode: "NOR" })).toThrow();
  });

  it("accepts bounded supplier document download grant responses without asset leakage", () => {
    const parsed = supplierDocumentDownloadGrantResponseSchema.parse({
      ok: true,
      grant: {
        id: "sdg_11111111-1111-4111-8111-111111111111",
        supplierId: "sup-contract-1",
        documentId: "contract-doc-health-1",
        fileName: "contract-health-certificate.pdf",
        downloadPath: "/v1/suppliers/sup-contract-1/documents/contract-doc-health-1/download?grantId=sdg_11111111-1111-4111-8111-111111111111",
        grantedAt: "2026-05-31T08:00:00.000Z",
        expiresAt: "2026-05-31T08:15:00.000Z",
      },
      requestId: "req_1",
    });

    expect(parsed.grant.downloadPath).toContain("/v1/suppliers/sup-contract-1/documents/contract-doc-health-1/download");
    expect(JSON.stringify(parsed)).not.toContain("fileAssetId");
    expect(JSON.stringify(parsed)).not.toContain("objectKey");
  });

  it("accepts bounded supplier access notification acknowledgement payloads", () => {
    const notificationId = "44444444-4444-4444-8444-444444444444";
    const parsed = supplierAccessNotificationsAckSchema.parse({
      notificationIds: [notificationId],
    });

    expect(parsed.notificationIds).toEqual([notificationId]);
    expect(
      supplierAccessNotificationsAckResponseSchema.parse({
        ok: true,
        markedReadCount: 1,
        requestId: "api-ack",
        notifications: [
          {
            id: notificationId,
            buyerUserId: "22222222-2222-4222-8222-222222222222",
            supplierId: "sup-contract-1",
            type: "price_access_approved",
            title: "Price access approved",
            body: "Supplier approved access to exact prices.",
            status: "read",
            createdAt: "2026-05-14T00:10:00.000Z",
            readAt: "2026-05-14T00:11:00.000Z",
          },
        ],
      }),
    ).toMatchObject({
      ok: true,
      markedReadCount: 1,
    });

    expect(() => supplierAccessNotificationsAckSchema.parse({ notificationIds: [] })).toThrow();
    expect(() =>
      supplierAccessNotificationsAckSchema.parse({
        notificationIds: Array.from({ length: 101 }, () => notificationId),
      }),
    ).toThrow();
    expect(() =>
      supplierAccessNotificationsAckSchema.parse({ notificationIds: ["not-a-uuid"] }),
    ).toThrow();
  });

  it("rejects invalid file upload envelopes before they reach storage", () => {
    expect(() =>
      accountFileUploadPayloadSchema.parse({
        fileName: "bad.pdf",
        contentType: "application/pdf",
        sizeBytes: 8,
        contentBase64: "data:application/pdf;base64,AAAA",
      }),
    ).toThrow(/raw base64/);
  });

  it("documents local self-hosted runtime services", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const env = readFileSync(".env.example", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("pgbouncer:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("minio:");
    expect(compose).toContain("STORAGE_DRIVER: local");
    expect(env).toContain("DATABASE_URL=");
    expect(env).toContain("STORAGE_DRIVER=local");
    expect(env).toContain("STORAGE_LOCAL_ROOT=");
    expect(env).toContain("VITE_YORSO_ACCOUNT_USER_ID=");
    expect(env).toMatch(/^VITE_YORSO_API_URL=$/m);
    expect(env).toContain("PGBOUNCER_DATABASE_URL=");
    expect(env).not.toMatch(/SUPABASE/i);
  });

  it("keeps contract package exports compatible with Node ESM runtime", () => {
    const indexSource = readFileSync("packages/contracts/src/index.ts", "utf8");

    expect(indexSource).toContain('export * from "./account-company.js";');
    expect(indexSource).toContain('export * from "./account-session.js";');
  });
});
