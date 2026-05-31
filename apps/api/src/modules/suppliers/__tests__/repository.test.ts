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

  it("PostgreSQL repository persists supplier document download grant audit with backend-only asset ids", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              id: "sdg_grant_1",
              buyerUserId: "00000000-0000-4000-8000-000000000001",
              supplierId: "sup-no-001",
              documentId: "sup-no-001-health-certificate",
              fileAssetId: "file_sup-no-001-health-certificate",
              status: "granted",
              reason: "granted",
              requestId: "req-1",
              downloadPath: "/v1/suppliers/sup-no-001/documents/sup-no-001-health-certificate/download?grantId=sdg_grant_1",
              grantedAt: "2026-05-31T08:00:00.000Z",
              expiresAt: "2026-05-31T08:15:00.000Z",
              createdAt: "2026-05-31T08:00:00.000Z",
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });
    const record = await repository.recordDocumentDownloadGrant({
      id: "sdg_grant_1",
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      supplierId: "sup-no-001",
      documentId: "sup-no-001-health-certificate",
      fileAssetId: "file_sup-no-001-health-certificate",
      status: "granted",
      reason: "granted",
      requestId: "req-1",
      downloadPath: "/v1/suppliers/sup-no-001/documents/sup-no-001-health-certificate/download?grantId=sdg_grant_1",
      grantedAt: "2026-05-31T08:00:00.000Z",
      expiresAt: "2026-05-31T08:15:00.000Z",
    });

    expect(record).toMatchObject({
      id: "sdg_grant_1",
      status: "granted",
      supplierId: "sup-no-001",
      documentId: "sup-no-001-health-certificate",
    });
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_download_grants");
    expect(calls[0].sql).toContain("file_asset_id");
    expect(calls[0].sql).toContain("returning");
    expect(calls[0].params).toEqual([
      "sdg_grant_1",
      "00000000-0000-4000-8000-000000000001",
      "sup-no-001",
      "sup-no-001-health-certificate",
      "file_sup-no-001-health-certificate",
      "granted",
      "granted",
      "req-1",
      "/v1/suppliers/sup-no-001/documents/sup-no-001-health-certificate/download?grantId=sdg_grant_1",
      "2026-05-31T08:00:00.000Z",
      "2026-05-31T08:15:00.000Z",
    ]);
  });

  it("PostgreSQL repository creates supplier owner review documents with one audited CTE", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const document = {
      id: "sdoc_review_1",
      title: "Factory audit report",
      documentType: "audit_report" as const,
      status: "review" as const,
      issuedAt: "2026-05-31",
      expiresAt: "2027-05-31",
      fileName: "factory-audit.pdf",
      fileAssetId: "11111111-1111-4111-8111-111111111111",
    };
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              document,
              action: "supplier_document.create",
              actorRole: "supplier_owner",
              supplierId: "sup-no-001",
              documentId: "sdoc_review_1",
              previousStatus: null,
              nextStatus: "review",
              reason: "supplier_owner_created_review_document",
              requestId: "req-owner-create",
              createdAt: new Date("2026-05-31T09:00:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const created = await repository.createSupplierDocumentForOwner({
      supplierId: "sup-no-001",
      ownerCompanyId: "11111111-1111-4111-8111-111111111111",
      actorUserId: "00000000-0000-4000-8000-000000000001",
      document,
      auditEvent: {
        action: "supplier_document.create",
        actorRole: "supplier_owner",
        supplierId: "sup-no-001",
        documentId: "sdoc_review_1",
        previousStatus: null,
        nextStatus: "review",
        reason: "supplier_owner_created_review_document",
        requestId: "req-owner-create",
        createdAt: "2026-05-31T09:00:00.000Z",
      },
    });

    expect(created).toMatchObject({
      document: {
        id: "sdoc_review_1",
        title: "Factory audit report",
      },
      auditEvent: {
        action: "supplier_document.create",
        actorRole: "supplier_owner",
        nextStatus: "review",
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("with updated_supplier as");
    expect(calls[0].sql).toContain("update yorso_suppliers_directory");
    expect(calls[0].sql).toContain("company_id = $2::uuid");
    expect(calls[0].sql).toContain("supplier_documents = supplier_documents || $4::jsonb");
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_management_events");
    expect(calls[0].params).toEqual([
      "sup-no-001",
      "11111111-1111-4111-8111-111111111111",
      "sdoc_review_1",
      JSON.stringify([document]),
      JSON.stringify(document),
      "supplier_document.create",
      "supplier_owner",
      "00000000-0000-4000-8000-000000000001",
      null,
      "review",
      "supplier_owner_created_review_document",
      "req-owner-create",
      "2026-05-31T09:00:00.000Z",
    ]);
  });

  it("PostgreSQL repository decides review supplier documents with one audited CTE", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const document = {
      id: "sdoc_review_1",
      title: "Factory audit report",
      documentType: "audit_report" as const,
      status: "approved" as const,
      issuedAt: "2026-05-31",
      expiresAt: "2027-05-31",
      fileName: "factory-audit.pdf",
      fileAssetId: "11111111-1111-4111-8111-111111111111",
    };
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              document,
              action: "supplier_document.approve",
              actorRole: "admin",
              supplierId: "sup-no-001",
              documentId: "sdoc_review_1",
              previousStatus: "review",
              nextStatus: "approved",
              reason: "verified_against_registry",
              requestId: "req-admin-decision",
              createdAt: new Date("2026-05-31T10:00:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const decided = await repository.decideSupplierDocumentAsAdmin({
      supplierId: "sup-no-001",
      documentId: "sdoc_review_1",
      currentStatus: "review",
      nextStatus: "approved",
      actorUserId: "00000000-0000-4000-8000-000000000090",
      auditEvent: {
        action: "supplier_document.approve",
        actorRole: "admin",
        supplierId: "sup-no-001",
        documentId: "sdoc_review_1",
        previousStatus: "review",
        nextStatus: "approved",
        reason: "verified_against_registry",
        requestId: "req-admin-decision",
        createdAt: "2026-05-31T10:00:00.000Z",
      },
    });

    expect(decided).toMatchObject({
      document: {
        id: "sdoc_review_1",
        status: "approved",
      },
      auditEvent: {
        action: "supplier_document.approve",
        actorRole: "admin",
        previousStatus: "review",
        nextStatus: "approved",
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("with target_document as");
    expect(calls[0].sql).toContain("update yorso_suppliers_directory");
    expect(calls[0].sql).toContain("jsonb_set(");
    expect(calls[0].sql).toContain("document.value->>'status' = $3");
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_management_events");
    expect(calls[0].params).toEqual([
      "sup-no-001",
      "sdoc_review_1",
      "review",
      "approved",
      "supplier_document.approve",
      "admin",
      "00000000-0000-4000-8000-000000000090",
      "review",
      "approved",
      "verified_against_registry",
      "req-admin-decision",
      "2026-05-31T10:00:00.000Z",
    ]);
  });

  it("PostgreSQL repository expires approved supplier documents as admin with one audited CTE", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const document = {
      id: "sdoc_approved_1",
      title: "Approved factory audit",
      documentType: "audit_report" as const,
      status: "expired" as const,
      issuedAt: "2026-05-31",
      expiresAt: "2027-05-31",
      fileName: "factory-audit.pdf",
      fileAssetId: "11111111-1111-4111-8111-111111111111",
    };
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              document,
              action: "supplier_document.expire",
              actorRole: "admin",
              supplierId: "sup-no-001",
              documentId: "sdoc_approved_1",
              previousStatus: "approved",
              nextStatus: "expired",
              reason: "certificate_expired",
              requestId: "req-admin-expire",
              createdAt: new Date("2026-05-31T11:10:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const expired = await repository.expireSupplierDocumentAsAdmin({
      supplierId: "sup-no-001",
      documentId: "sdoc_approved_1",
      currentStatus: "approved",
      nextStatus: "expired",
      actorUserId: "00000000-0000-4000-8000-000000000090",
      auditEvent: {
        action: "supplier_document.expire",
        actorRole: "admin",
        supplierId: "sup-no-001",
        documentId: "sdoc_approved_1",
        previousStatus: "approved",
        nextStatus: "expired",
        reason: "certificate_expired",
        requestId: "req-admin-expire",
        createdAt: "2026-05-31T11:10:00.000Z",
      },
    });

    expect(expired).toMatchObject({
      document: {
        id: "sdoc_approved_1",
        status: "expired",
      },
      auditEvent: {
        action: "supplier_document.expire",
        actorRole: "admin",
        previousStatus: "approved",
        nextStatus: "expired",
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("with target_document as");
    expect(calls[0].sql).toContain("update yorso_suppliers_directory");
    expect(calls[0].sql).toContain("jsonb_set(");
    expect(calls[0].sql).toContain("document.value->>'status' = $3");
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_management_events");
    expect(calls[0].params).toEqual([
      "sup-no-001",
      "sdoc_approved_1",
      "approved",
      "expired",
      "supplier_document.expire",
      "admin",
      "00000000-0000-4000-8000-000000000090",
      "approved",
      "expired",
      "certificate_expired",
      "req-admin-expire",
      "2026-05-31T11:10:00.000Z",
    ]);
  });

  it("PostgreSQL repository deletes supplier documents as admin with one audited CTE", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const document = {
      id: "sdoc_expired_1",
      title: "Expired factory audit",
      documentType: "audit_report" as const,
      status: "expired" as const,
      issuedAt: "2026-05-31",
      expiresAt: "2027-05-31",
      fileName: "factory-audit.pdf",
      fileAssetId: "11111111-1111-4111-8111-111111111111",
    };
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              document,
              action: "supplier_document.delete",
              actorRole: "admin",
              supplierId: "sup-no-001",
              documentId: "sdoc_expired_1",
              previousStatus: "expired",
              nextStatus: null,
              reason: "expired_document_cleanup",
              requestId: "req-admin-delete",
              createdAt: new Date("2026-05-31T11:15:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const deleted = await repository.deleteSupplierDocumentAsAdmin({
      supplierId: "sup-no-001",
      documentId: "sdoc_expired_1",
      currentStatus: "expired",
      actorUserId: "00000000-0000-4000-8000-000000000090",
      auditEvent: {
        action: "supplier_document.delete",
        actorRole: "admin",
        supplierId: "sup-no-001",
        documentId: "sdoc_expired_1",
        previousStatus: "expired",
        nextStatus: null,
        reason: "expired_document_cleanup",
        requestId: "req-admin-delete",
        createdAt: "2026-05-31T11:15:00.000Z",
      },
    });

    expect(deleted).toMatchObject({
      document: {
        id: "sdoc_expired_1",
        status: "expired",
      },
      auditEvent: {
        action: "supplier_document.delete",
        actorRole: "admin",
        previousStatus: "expired",
        nextStatus: null,
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("with target_document as");
    expect(calls[0].sql).not.toContain("company_id = $2::uuid");
    expect(calls[0].sql).toContain("jsonb_array_elements(supplier.supplier_documents)");
    expect(calls[0].sql).toContain("jsonb_agg(remaining.value order by remaining.ordinality)");
    expect(calls[0].sql).toContain("document.value->>'status' = $3");
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_management_events");
    expect(calls[0].params).toEqual([
      "sup-no-001",
      "sdoc_expired_1",
      "expired",
      "supplier_document.delete",
      "admin",
      "00000000-0000-4000-8000-000000000090",
      "expired",
      null,
      "expired_document_cleanup",
      "req-admin-delete",
      "2026-05-31T11:15:00.000Z",
    ]);
  });

  it("PostgreSQL repository updates supplier owner document metadata with one audited CTE", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const document = {
      id: "sdoc_review_1",
      title: "Updated factory audit",
      documentType: "analysis_certificate" as const,
      status: "review" as const,
      issuedAt: null,
      expiresAt: "2027-06-30",
      fileName: "factory-audit.pdf",
      fileAssetId: "11111111-1111-4111-8111-111111111111",
    };
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              document,
              action: "supplier_document.update_metadata",
              actorRole: "supplier_owner",
              supplierId: "sup-no-001",
              documentId: "sdoc_review_1",
              previousStatus: "review",
              nextStatus: "review",
              reason: "supplier_owner_updated_document_metadata",
              requestId: "req-owner-update",
              createdAt: new Date("2026-05-31T11:00:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const updated = await repository.updateSupplierDocumentForOwner({
      supplierId: "sup-no-001",
      ownerCompanyId: "11111111-1111-4111-8111-111111111111",
      documentId: "sdoc_review_1",
      currentStatus: "review",
      actorUserId: "00000000-0000-4000-8000-000000000001",
      document,
      auditEvent: {
        action: "supplier_document.update_metadata",
        actorRole: "supplier_owner",
        supplierId: "sup-no-001",
        documentId: "sdoc_review_1",
        previousStatus: "review",
        nextStatus: "review",
        reason: "supplier_owner_updated_document_metadata",
        requestId: "req-owner-update",
        createdAt: "2026-05-31T11:00:00.000Z",
      },
    });

    expect(updated).toMatchObject({
      document: {
        id: "sdoc_review_1",
        title: "Updated factory audit",
      },
      auditEvent: {
        action: "supplier_document.update_metadata",
        actorRole: "supplier_owner",
        nextStatus: "review",
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("with target_document as");
    expect(calls[0].sql).toContain("company_id = $2::uuid");
    expect(calls[0].sql).toContain("jsonb_set(");
    expect(calls[0].sql).toContain("document.value->>'status' = $4");
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_management_events");
    expect(calls[0].params).toEqual([
      "sup-no-001",
      "11111111-1111-4111-8111-111111111111",
      "sdoc_review_1",
      "review",
      JSON.stringify(document),
      "supplier_document.update_metadata",
      "supplier_owner",
      "00000000-0000-4000-8000-000000000001",
      "review",
      "review",
      "supplier_owner_updated_document_metadata",
      "req-owner-update",
      "2026-05-31T11:00:00.000Z",
    ]);
  });

  it("PostgreSQL repository deletes supplier owner non-approved documents with one audited CTE", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const document = {
      id: "sdoc_on_request_1",
      title: "Rejected factory audit",
      documentType: "audit_report" as const,
      status: "on_request" as const,
      issuedAt: "2026-05-31",
      expiresAt: "2027-05-31",
      fileName: "factory-audit.pdf",
      fileAssetId: "11111111-1111-4111-8111-111111111111",
    };
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              document,
              action: "supplier_document.delete",
              actorRole: "supplier_owner",
              supplierId: "sup-no-001",
              documentId: "sdoc_on_request_1",
              previousStatus: "on_request",
              nextStatus: null,
              reason: "supplier_owner_deleted_document",
              requestId: "req-owner-delete",
              createdAt: new Date("2026-05-31T11:05:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const deleted = await repository.deleteSupplierDocumentForOwner({
      supplierId: "sup-no-001",
      ownerCompanyId: "11111111-1111-4111-8111-111111111111",
      documentId: "sdoc_on_request_1",
      currentStatus: "on_request",
      actorUserId: "00000000-0000-4000-8000-000000000001",
      auditEvent: {
        action: "supplier_document.delete",
        actorRole: "supplier_owner",
        supplierId: "sup-no-001",
        documentId: "sdoc_on_request_1",
        previousStatus: "on_request",
        nextStatus: null,
        reason: "supplier_owner_deleted_document",
        requestId: "req-owner-delete",
        createdAt: "2026-05-31T11:05:00.000Z",
      },
    });

    expect(deleted).toMatchObject({
      document: {
        id: "sdoc_on_request_1",
        status: "on_request",
      },
      auditEvent: {
        action: "supplier_document.delete",
        actorRole: "supplier_owner",
        previousStatus: "on_request",
        nextStatus: null,
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("with target_document as");
    expect(calls[0].sql).toContain("company_id = $2::uuid");
    expect(calls[0].sql).toContain("jsonb_array_elements(supplier.supplier_documents)");
    expect(calls[0].sql).toContain("jsonb_agg(remaining.value order by remaining.ordinality)");
    expect(calls[0].sql).toContain("document.value->>'status' = $4");
    expect(calls[0].sql).toContain("insert into yorso_supplier_document_management_events");
    expect(calls[0].params).toEqual([
      "sup-no-001",
      "11111111-1111-4111-8111-111111111111",
      "sdoc_on_request_1",
      "on_request",
      "supplier_document.delete",
      "supplier_owner",
      "00000000-0000-4000-8000-000000000001",
      "on_request",
      null,
      "supplier_owner_deleted_document",
      "req-owner-delete",
      "2026-05-31T11:05:00.000Z",
    ]);
  });

  it("PostgreSQL repository reads grants and persists supplier document download events", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        if (sql.includes("from yorso_supplier_document_download_grants")) {
          return {
            rows: [
              {
                id: "sdg_grant_1",
                buyerUserId: "00000000-0000-4000-8000-000000000001",
                supplierId: "sup-no-001",
                documentId: "sup-no-001-health-certificate",
                fileAssetId: "00000000-0000-4000-8000-00000000f001",
                status: "granted",
                reason: "granted",
                requestId: "req-1",
                downloadPath: "/v1/suppliers/sup-no-001/documents/sup-no-001-health-certificate/download?grantId=sdg_grant_1",
                grantedAt: "2026-05-31T08:00:00.000Z",
                expiresAt: "2026-05-31T08:15:00.000Z",
                createdAt: "2026-05-31T08:00:00.000Z",
              },
            ],
          };
        }
        return {
          rows: [
            {
              id: "sdde_event_1",
              buyerUserId: "00000000-0000-4000-8000-000000000001",
              supplierId: "sup-no-001",
              documentId: "sup-no-001-health-certificate",
              grantId: "sdg_grant_1",
              fileAssetId: "00000000-0000-4000-8000-00000000f001",
              status: "downloaded",
              reason: "downloaded",
              requestId: "req-download",
              createdAt: "2026-05-31T08:01:00.000Z",
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const grant = await repository.getDocumentDownloadGrantById("sdg_grant_1");
    const event = await repository.recordDocumentDownloadEvent({
      id: "sdde_event_1",
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      supplierId: "sup-no-001",
      documentId: "sup-no-001-health-certificate",
      grantId: "sdg_grant_1",
      fileAssetId: "00000000-0000-4000-8000-00000000f001",
      status: "downloaded",
      reason: "downloaded",
      requestId: "req-download",
    });

    expect(grant).toMatchObject({
      id: "sdg_grant_1",
      fileAssetId: "00000000-0000-4000-8000-00000000f001",
    });
    expect(event).toMatchObject({
      id: "sdde_event_1",
      status: "downloaded",
      grantId: "sdg_grant_1",
    });
    expect(calls[0].sql).toContain("from yorso_supplier_document_download_grants");
    expect(calls[0].params).toEqual(["sdg_grant_1"]);
    expect(calls[1].sql).toContain("insert into yorso_supplier_document_download_events");
    expect(calls[1].sql).toContain("file_asset_id");
    expect(calls[1].params).toEqual([
      "sdde_event_1",
      "00000000-0000-4000-8000-000000000001",
      "sup-no-001",
      "sup-no-001-health-certificate",
      "sdg_grant_1",
      "00000000-0000-4000-8000-00000000f001",
      "downloaded",
      "downloaded",
      "req-download",
    ]);
  });

  it("PostgreSQL repository lists supplier document grants with bounded indexed filters", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              id: "sdg_grant_1",
              buyerUserId: "00000000-0000-4000-8000-000000000001",
              supplierId: "sup-no-001",
              documentId: "sup-no-001-health-certificate",
              fileAssetId: "00000000-0000-4000-8000-00000000f001",
              status: "granted",
              reason: "granted",
              requestId: "req-1",
              downloadPath: "/v1/suppliers/sup-no-001/documents/sup-no-001-health-certificate/download?grantId=sdg_grant_1",
              grantedAt: new Date("2026-05-31T08:00:00.000Z"),
              expiresAt: new Date("2026-05-31T08:15:00.000Z"),
              createdAt: new Date("2026-05-31T08:00:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const grants = await repository.listDocumentDownloadGrants({
      status: "granted",
      supplierId: "sup-no-001",
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      limit: 25,
      offset: 50,
    });

    expect(grants).toEqual([
      expect.objectContaining({
        id: "sdg_grant_1",
        fileAssetId: "00000000-0000-4000-8000-00000000f001",
        downloadPath: "/v1/suppliers/sup-no-001/documents/sup-no-001-health-certificate/download?grantId=sdg_grant_1",
        grantedAt: "2026-05-31T08:00:00.000Z",
        expiresAt: "2026-05-31T08:15:00.000Z",
        createdAt: "2026-05-31T08:00:00.000Z",
      }),
    ]);
    expect(calls[0].sql).toContain("from yorso_supplier_document_download_grants");
    expect(calls[0].sql).toContain("status = $1");
    expect(calls[0].sql).toContain("supplier_id = $2");
    expect(calls[0].sql).toContain("buyer_user_id = $3");
    expect(calls[0].sql).toContain("order by created_at desc, id asc");
    expect(calls[0].sql).toContain("limit $4");
    expect(calls[0].sql).toContain("offset $5");
    expect(calls[0].params).toEqual([
      "granted",
      "sup-no-001",
      "00000000-0000-4000-8000-000000000001",
      25,
      50,
    ]);
  });

  it("PostgreSQL repository lists supplier document download events with bounded indexed filters", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              id: "sdde_event_1",
              buyerUserId: "00000000-0000-4000-8000-000000000001",
              supplierId: "sup-no-001",
              documentId: "sup-no-001-health-certificate",
              grantId: "sdg_grant_1",
              fileAssetId: "00000000-0000-4000-8000-00000000f001",
              status: "downloaded",
              reason: "downloaded",
              requestId: "req-download",
              createdAt: new Date("2026-05-31T08:01:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const events = await repository.listDocumentDownloadEvents({
      status: "downloaded",
      supplierId: "sup-no-001",
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      limit: 25,
      offset: 50,
    });

    expect(events).toEqual([
      expect.objectContaining({
        id: "sdde_event_1",
        createdAt: "2026-05-31T08:01:00.000Z",
        fileAssetId: "00000000-0000-4000-8000-00000000f001",
      }),
    ]);
    expect(calls[0].sql).toContain("from yorso_supplier_document_download_events");
    expect(calls[0].sql).toContain("status = $1");
    expect(calls[0].sql).toContain("supplier_id = $2");
    expect(calls[0].sql).toContain("buyer_user_id = $3");
    expect(calls[0].sql).toContain("order by created_at desc, id asc");
    expect(calls[0].sql).toContain("limit $4");
    expect(calls[0].sql).toContain("offset $5");
    expect(calls[0].params).toEqual([
      "downloaded",
      "sup-no-001",
      "00000000-0000-4000-8000-000000000001",
      25,
      50,
    ]);
  });

  it("PostgreSQL repository lists supplier document management events with bounded indexed filters", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: SupplierQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              id: "42",
              action: "supplier_document.expire",
              actorRole: "admin",
              actorUserId: "00000000-0000-4000-8000-000000000002",
              supplierId: "sup-no-001",
              documentId: "sdoc_123",
              previousStatus: "approved",
              nextStatus: "expired",
              reason: "certificate_expired",
              requestId: "req-management-events",
              createdAt: new Date("2026-05-31T12:00:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresSupplierRepository({ databaseUrl: "postgres://example" }, { client });

    const events = await repository.listSupplierDocumentManagementEvents({
      action: "supplier_document.expire",
      supplierId: "sup-no-001",
      documentId: "sdoc_123",
      actorUserId: "00000000-0000-4000-8000-000000000002",
      limit: 25,
      offset: 50,
    });

    expect(events).toEqual([
      expect.objectContaining({
        id: "42",
        action: "supplier_document.expire",
        actorRole: "admin",
        actorUserId: "00000000-0000-4000-8000-000000000002",
        supplierId: "sup-no-001",
        documentId: "sdoc_123",
        previousStatus: "approved",
        nextStatus: "expired",
        createdAt: "2026-05-31T12:00:00.000Z",
      }),
    ]);
    expect(calls[0].sql).toContain("from yorso_supplier_document_management_events");
    expect(calls[0].sql).toContain("action = $1");
    expect(calls[0].sql).toContain("supplier_id = $2");
    expect(calls[0].sql).toContain("document_id = $3");
    expect(calls[0].sql).toContain("actor_user_id = $4::uuid");
    expect(calls[0].sql).toContain("order by created_at desc, id desc");
    expect(calls[0].sql).toContain("limit $5");
    expect(calls[0].sql).toContain("offset $6");
    expect(calls[0].params).toEqual([
      "supplier_document.expire",
      "sup-no-001",
      "sdoc_123",
      "00000000-0000-4000-8000-000000000002",
      25,
      50,
    ]);
  });
});
