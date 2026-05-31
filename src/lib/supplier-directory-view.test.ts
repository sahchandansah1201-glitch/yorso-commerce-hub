import { describe, expect, it } from "vitest";
import { mockSuppliers } from "@/data/mockSuppliers";
import {
  localizedMockSuppliers,
  localizeSupplierDirectoryItem,
  supplierDirectoryItemToMockSupplier,
} from "./supplier-directory-view";
import type { SupplierDirectoryItem } from "./supplier-directory-api";

const lockedApiItem = (supplier = mockSuppliers[0]): SupplierDirectoryItem => ({
  id: supplier.id,
  maskedName: supplier.maskedName,
  companyName: null,
  country: supplier.country,
  countryCode: supplier.countryCode,
  city: supplier.city,
  supplierType: supplier.supplierType,
  inBusinessSinceYear: supplier.inBusinessSinceYear,
  productFocus: supplier.productFocus,
  certifications: supplier.certifications,
  certificationBadges: supplier.certificationBadges.map((badge) => ({
    code: badge.code,
    label: badge.label,
    logo: badge.logo ?? null,
  })),
  activeOffersCount: null,
  shortDescription: supplier.shortDescription,
  about: null,
  responseSignal: supplier.responseSignal,
  documentReadiness: supplier.documentReadiness,
  verificationLevel: supplier.verificationLevel,
  heroImage: supplier.heroImage,
  logoImage: supplier.logoImage ?? null,
  deliveryCountries: supplier.deliveryCountries,
  deliveryCountriesTotal: null,
  totalProductsCount: null,
  productCatalogPreview: supplier.productCatalogPreview.slice(0, 3),
  website: null,
  whatsapp: null,
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
      id: "api-case-1",
      titleKey: "supplier_cases_caseTitle_de",
      dateISO: "2026-04-11",
      destinationKey: "supplier_cases_destination_de",
      product: "API salmon evidence",
      volumeTons: 44,
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
  legalDetails: null,
  updatedAt: "2026-05-14T00:00:00.000Z",
  accessLevel: "anonymous_locked",
});

describe("supplier directory API view shaping", () => {
  it("maps locked API items to existing supplier row shape without reconstructing hidden values", () => {
    const supplier = supplierDirectoryItemToMockSupplier(lockedApiItem());

    expect(supplier.id).toBe(mockSuppliers[0].id);
    expect(supplier.companyName).toBe(mockSuppliers[0].maskedName);
    expect(supplier.about).toBe(mockSuppliers[0].shortDescription);
    expect(supplier.activeOffersCount).toBe(0);
    expect(supplier.totalProductsCount).toBe(3);
    expect(supplier.website).toBeUndefined();
    expect(supplier.whatsapp).toBeUndefined();
    expect(supplier.productionFacts).toMatchObject({ dailyTons: 64, staff: 180 });
    expect(supplier.logisticsFacts).toMatchObject({
      incoterms: ["FCA", "CIF"],
      tempRange: "-18 C ... -22 C",
    });
    expect(supplier.shipmentCases?.[0]).toMatchObject({
      product: "API salmon evidence",
      volumeTons: 44,
    });
    expect(supplier.faqItems?.[0].params).toEqual({ n: 2 });
    expect(supplier.legalDetails).toBeNull();
  });

  it("maps unlocked API legal details without reconstructing them locally", () => {
    const supplier = supplierDirectoryItemToMockSupplier({
      ...lockedApiItem(),
      accessLevel: "qualified_unlocked",
      companyName: "Nordfjord Sjømat AS",
      activeOffersCount: 14,
      about: "Unlocked about text.",
      deliveryCountriesTotal: 18,
      totalProductsCount: 32,
      legalDetails: {
        registrationLabel: "Backend Registry",
        registrationNumber: "BACKEND-REG-123",
        vatNumber: "BACKEND-VAT-123",
        eoriNumber: "BACKEND-EORI-123",
        legalForm: "Backend AS",
        foundedDate: "2002-04-17",
      },
    });

    expect(supplier.legalDetails).toMatchObject({
      registrationNumber: "BACKEND-REG-123",
      legalForm: "Backend AS",
    });
  });

  it("localizes API-shaped suppliers with the same i18n layer as local mocks", () => {
    const ruSupplier = localizeSupplierDirectoryItem(lockedApiItem(), "ru");

    expect(ruSupplier.maskedName).not.toBe(mockSuppliers[0].maskedName);
    expect(ruSupplier.country).not.toBe(mockSuppliers[0].country);
    expect(ruSupplier.productFocus[0].species).toMatch(/лосось|семга/i);
  });

  it("keeps local mock fallback localized for Lovable/offline preview", () => {
    const ruFallback = localizedMockSuppliers("ru");

    expect(ruFallback[0].maskedName).not.toBe(mockSuppliers[0].maskedName);
    expect(ruFallback).toHaveLength(mockSuppliers.length);
  });
});
