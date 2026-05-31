import { describe, expect, it } from "vitest";
import { PostgresSupplierRepository, type SupplierQueryClient } from "../postgres-repository.js";
import { MemorySupplierRepository } from "../repository.js";

describe("supplier directory repositories", () => {
  it("memory repository filters suppliers by species and country", async () => {
    const repository = new MemorySupplierRepository();
    const result = await repository.listSuppliers({
      species: "salmon",
      countryCode: "NO",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.suppliers[0]).toMatchObject({
      id: "sup-no-001",
      companyName: "Nordfjord Sjømat AS",
    });
  });

  it("memory repository filters suppliers by verification level", async () => {
    const repository = new MemorySupplierRepository();

    await expect(repository.listSuppliers({
      verificationLevel: "documents_reviewed",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 3 });

    await expect(repository.listSuppliers({
      verificationLevel: "unverified",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 0 });
  });

  it("memory repository does not search private supplier identity before access unlock", async () => {
    const repository = new MemorySupplierRepository();

    await expect(repository.listSuppliers({
      q: "Nordfjord",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 0 });

    await expect(repository.listSuppliers({
      q: "Nordfjord",
      accessLevel: "qualified_unlocked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 0 });

    await expect(repository.listSuppliers(
      {
        q: "Nordfjord",
        accessLevel: "qualified_unlocked",
        limit: 20,
        offset: 0,
      },
      { privateSearchSupplierIds: ["sup-no-001"] },
    )).resolves.toMatchObject({ total: 1 });
  });

  it("PostgreSQL repository maps supplier rows and applies query filters", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              id: "sup-row",
              company_name: "Supplier Legal Ltd.",
              masked_name: "Norwegian salmon producer · NO-999",
              country: "Norway",
              country_code: "NO",
              city: "Bergen",
              supplier_type: "producer",
              in_business_since_year: 2010,
              product_focus: [{ species: "Atlantic Salmon", forms: "HOG" }],
              certifications: ["ASC"],
              certification_badges: [{ code: "ASC", label: "ASC", logo: null }],
              active_offers_count: 7,
              short_description: "Short supplier summary.",
              about: "Private supplier about text.",
              response_signal: "fast",
              document_readiness: "ready",
              verification_level: "documents_reviewed",
              hero_image: "/offers/salmon.webp",
              logo_image: null,
              delivery_countries: [{ code: "DE", name: "Germany" }],
              delivery_countries_total: 8,
              total_products_count: 12,
              product_catalog_preview: [{ name: "Salmon HOG", species: "Atlantic Salmon", form: "HOG", image: "/offers/salmon.webp" }],
              website: "https://supplier.example",
              whatsapp: "+47 000 999",
              production_facts: {
                dailyTons: 64,
                lines: 5,
                coldStorageT: 1200,
                blastFreezerT: 80,
                staff: 180,
              },
              logistics_facts: {
                incoterms: ["FCA", "CIF"],
                transitDaysMin: 7,
                transitDaysMax: 14,
                minBatchTons: 2,
                containers: ["20' Reefer", "40' Reefer HC"],
                tempRange: "-18 C ... -22 C",
              },
              shipment_cases: [
                {
                  id: "row-case-1",
                  titleKey: "supplier_cases_caseTitle_de",
                  dateISO: "2026-04-11",
                  destinationKey: "supplier_cases_destination_de",
                  product: "Row salmon evidence",
                  volumeTons: 33,
                  incoterm: "CFR Hamburg",
                  buyerTypeKey: "supplier_cases_buyerType_retail",
                  notesKey: "supplier_cases_notes_de",
                  photoCaptionKeys: ["supplier_cases_photoCaption_loading"],
                },
              ],
              profile_faq_items: [
                {
                  qKey: "supplier_faq_q1",
                  aKey: "supplier_faq_a1",
                  params: { n: 2 },
                },
              ],
              legal_details: {
                registrationLabel: "Backend Registry",
                registrationNumber: "BACKEND-REG-999",
                vatNumber: "BACKEND-VAT-999",
                eoriNumber: "BACKEND-EORI-999",
                legalForm: "Backend AS",
                foundedDate: "2010-04-17",
              },
              supplier_documents: [
                {
                  id: "row-doc-health-1",
                  title: "Row health certificate",
                  documentType: "health_certificate",
                  status: "approved",
                  issuedAt: "2026-02-10",
                  expiresAt: "2027-02-10",
                  fileName: "row-health-certificate.pdf",
                  fileAssetId: "file_row_doc_health_1",
                },
              ],
              updated_at: new Date("2026-05-14T00:00:00.000Z"),
              total_count: 1,
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });
    const result = await repository.listSuppliers({
      q: "salmon",
      species: "Atlantic",
      countryCode: "NO",
      supplierType: "producer",
      verificationLevel: "documents_reviewed",
      certification: "ASC",
      sortBy: "country",
      sortDirection: "asc",
      accessLevel: "qualified_unlocked",
      limit: 10,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.suppliers[0]).toMatchObject({
      id: "sup-row",
      companyName: "Supplier Legal Ltd.",
      deliveryCountriesTotal: 8,
      productionFacts: {
        dailyTons: 64,
        staff: 180,
      },
      logisticsFacts: {
        incoterms: ["FCA", "CIF"],
        minBatchTons: 2,
      },
      shipmentCases: [
        {
          product: "Row salmon evidence",
          volumeTons: 33,
        },
      ],
      faqItems: [
        {
          qKey: "supplier_faq_q1",
          params: { n: 2 },
        },
      ],
      legalDetails: {
        registrationNumber: "BACKEND-REG-999",
        legalForm: "Backend AS",
      },
      supplierDocuments: [
        {
          title: "Row health certificate",
          fileName: "row-health-certificate.pdf",
        },
      ],
    });
    expect(calls[0].sql).toContain("from yorso_suppliers_directory");
    expect(calls[0].sql).toContain("publication_status = 'published'");
    expect(calls[0].sql).toContain("country_code = $1");
    expect(calls[0].sql).toContain("supplier_type = $2");
    expect(calls[0].sql).toContain("verification_level = $3");
    expect(calls[0].sql).toContain("certifications_search ilike $4");
    expect(calls[0].sql).toContain("product_focus_search ilike $5");
    expect(calls[0].sql).toContain("public_search_text ilike $6");
    expect(calls[0].sql).toContain("order by country_code asc, city asc, id asc");
    expect(calls[0].sql).not.toContain("private_search_text");
    expect(calls[0].params).toEqual(["NO", "producer", "documents_reviewed", "%ASC%", "%Atlantic%", "%salmon%", 10, 0]);

    await repository.listSuppliers(
      {
        q: "Supplier Legal",
        accessLevel: "qualified_unlocked",
        limit: 10,
        offset: 0,
      },
      { privateSearchSupplierIds: ["sup-row"] },
    );

    expect(calls[1].sql).toContain("public_search_text ilike $1");
    expect(calls[1].sql).toContain("id = any($2::text[])");
    expect(calls[1].sql).toContain("private_search_text ilike $1");
    expect(calls[1].params).toEqual(["%Supplier Legal%", ["sup-row"], 10, 0]);
  });
});
