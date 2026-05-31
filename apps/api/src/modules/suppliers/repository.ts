import type {
  SupplierCatalogPreviewItem,
  SupplierCertificationBadge,
  SupplierDeliveryCountry,
  SupplierDirectoryQuery,
  SupplierDirectoryRecord,
  SupplierDirectorySortBy,
  SupplierDirectorySortDirection,
  SupplierDocumentPayload,
  SupplierFaqItem,
  SupplierLegalDetails,
  SupplierLogisticsFacts,
  SupplierProductFocus,
  SupplierProductionFacts,
  SupplierShipmentCase,
  SupplierType,
} from "../../../../../packages/contracts/dist/index.js";

export interface SupplierRepository {
  listSuppliers(
    query: SupplierDirectoryQuery,
    options?: SupplierRepositoryListOptions,
  ): Promise<{ suppliers: SupplierDirectoryRecord[]; total: number }>;
  getSupplierById(id: string): Promise<SupplierDirectoryRecord | null>;
  recordDocumentDownloadGrant(input: SupplierDocumentDownloadGrantAuditInput): Promise<SupplierDocumentDownloadGrantAuditRecord>;
}

export interface SupplierRepositoryListOptions {
  privateSearchSupplierIds?: readonly string[];
}

export type SupplierDocumentDownloadGrantStatus =
  | "granted"
  | "access_denied"
  | "document_not_found"
  | "document_unavailable";

export interface SupplierDocumentDownloadGrantAuditInput {
  id: string;
  buyerUserId: string;
  supplierId: string;
  documentId: string;
  fileAssetId: string | null;
  status: SupplierDocumentDownloadGrantStatus;
  reason: string;
  requestId: string;
  downloadPath: string | null;
  grantedAt: string | null;
  expiresAt: string | null;
}

export interface SupplierDocumentDownloadGrantAuditRecord extends SupplierDocumentDownloadGrantAuditInput {
  createdAt: string;
}

const cert = (code: string, label = code): SupplierCertificationBadge => ({ code, label, logo: null });
const dc = (code: string, name: string): SupplierDeliveryCountry => ({ code, name });
const product = (species: string, forms: string): SupplierProductFocus => ({ species, forms });
const preview = (name: string, species: string, form: string, image: string): SupplierCatalogPreviewItem => ({
  name,
  species,
  form,
  image,
});
const productionFacts = (
  dailyTons: number,
  lines: number,
  coldStorageT: number,
  blastFreezerT: number,
  staff: number,
): SupplierProductionFacts => ({ dailyTons, lines, coldStorageT, blastFreezerT, staff });
const logisticsFacts = (
  incoterms: string[],
  transitDaysMin: number,
  transitDaysMax: number,
  minBatchTons: number,
  containers: string[],
  tempRange: string,
): SupplierLogisticsFacts => ({
  incoterms,
  transitDaysMin,
  transitDaysMax,
  minBatchTons,
  containers,
  tempRange,
});
const shipmentCase = (
  id: string,
  titleKey: string,
  dateISO: string,
  destinationKey: string,
  product: string,
  volumeTons: number,
  incoterm: string,
  buyerTypeKey: string,
  notesKey: string,
  photoCaptionKeys: string[],
): SupplierShipmentCase => ({
  id,
  titleKey,
  dateISO,
  destinationKey,
  product,
  volumeTons,
  incoterm,
  buyerTypeKey,
  notesKey,
  photoCaptionKeys,
});
const profileFaqItems = (minBatchTons: number): SupplierFaqItem[] => [
  { qKey: "supplier_faq_q1", aKey: "supplier_faq_a1", params: { n: minBatchTons } },
  { qKey: "supplier_faq_q2", aKey: "supplier_faq_a2" },
  { qKey: "supplier_faq_q3", aKey: "supplier_faq_a3" },
  { qKey: "supplier_faq_q4", aKey: "supplier_faq_a4" },
  { qKey: "supplier_faq_q5", aKey: "supplier_faq_a5" },
  { qKey: "supplier_faq_q6", aKey: "supplier_faq_a6" },
];
const legalDetails = (
  registrationLabel: string,
  registrationNumber: string,
  legalForm: string,
  foundedDate: string,
  vatNumber: string | null = null,
  eoriNumber: string | null = null,
): SupplierLegalDetails => ({
  registrationLabel,
  registrationNumber,
  vatNumber,
  eoriNumber,
  legalForm,
  foundedDate,
});
const supplierDocument = (
  id: string,
  title: string,
  documentType: SupplierDocumentPayload["documentType"],
  status: SupplierDocumentPayload["status"],
  issuedAt: string | null,
  expiresAt: string | null,
  fileName: string | null,
): SupplierDocumentPayload => ({
  id,
  title,
  documentType,
  status,
  issuedAt,
  expiresAt,
  fileName,
  fileAssetId: fileName ? `file_${id}` : null,
});
const supplierDocuments = (prefix: string): SupplierDocumentPayload[] => [
  supplierDocument(
    `${prefix}-health-certificate`,
    "Health certificate",
    "health_certificate",
    "approved",
    "2026-02-10",
    "2027-02-10",
    `${prefix}-health-certificate.pdf`,
  ),
  supplierDocument(
    `${prefix}-origin-certificate`,
    "Certificate of origin",
    "origin_certificate",
    "approved",
    "2026-02-12",
    null,
    `${prefix}-certificate-of-origin.pdf`,
  ),
  supplierDocument(
    `${prefix}-analysis-certificate`,
    "Certificate of analysis",
    "analysis_certificate",
    "review",
    "2026-02-08",
    null,
    `${prefix}-certificate-of-analysis.pdf`,
  ),
];
const shipmentEvidence = (
  productLabel: string,
  volumes: readonly [number, number, number],
): SupplierShipmentCase[] => [
  shipmentCase(
    "case-de-2024",
    "supplier_cases_caseTitle_de",
    "2024-10-15",
    "supplier_cases_destination_de",
    productLabel,
    volumes[0],
    "CFR Hamburg",
    "supplier_cases_buyerType_retail",
    "supplier_cases_notes_de",
    [
      "supplier_cases_photoCaption_loading",
      "supplier_cases_photoCaption_logger",
      "supplier_cases_photoCaption_seal",
      "supplier_cases_photoCaption_docs",
    ],
  ),
  shipmentCase(
    "case-fr-2024",
    "supplier_cases_caseTitle_fr",
    "2024-07-20",
    "supplier_cases_destination_fr",
    productLabel,
    volumes[1],
    "DAP Marseille",
    "supplier_cases_buyerType_horeca",
    "supplier_cases_notes_fr",
    [
      "supplier_cases_photoCaption_pallets",
      "supplier_cases_photoCaption_label",
      "supplier_cases_photoCaption_tempLog",
    ],
  ),
  shipmentCase(
    "case-ae-2023",
    "supplier_cases_caseTitle_ae",
    "2023-12-10",
    "supplier_cases_destination_ae",
    productLabel,
    volumes[2],
    "CIF Jebel Ali",
    "supplier_cases_buyerType_wholesale",
    "supplier_cases_notes_ae",
    [
      "supplier_cases_photoCaption_survey",
      "supplier_cases_photoCaption_loadingHC",
    ],
  ),
];

export const demoSupplierRecords: SupplierDirectoryRecord[] = [
  {
    id: "sup-no-001",
    companyName: "Nordfjord Sjømat AS",
    maskedName: "Norwegian salmon producer · NO-114",
    country: "Norway",
    countryCode: "NO",
    city: "Ålesund",
    supplierType: "producer",
    inBusinessSinceYear: 2002,
    productFocus: [product("Atlantic Salmon", "HOG, fillet, portions"), product("Trout", "HOG, fillet")],
    certifications: ["ASC", "MSC", "BRC", "IFS"],
    certificationBadges: [cert("ASC"), cert("MSC"), cert("BRC"), cert("IFS")],
    activeOffersCount: 14,
    shortDescription: "Vertically integrated salmon farm and processing plant with weekly EU and Asia shipments.",
    about:
      "Family-owned Norwegian salmon producer operating own farms and a HACCP-audited processing plant around Ålesund.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/salmon.webp",
    logoImage: null,
    deliveryCountries: [dc("DE", "Germany"), dc("FR", "France"), dc("PL", "Poland"), dc("JP", "Japan")],
    deliveryCountriesTotal: 18,
    totalProductsCount: 32,
    productCatalogPreview: [
      preview("Salmon HOG 4-5 kg", "Atlantic Salmon", "HOG", "/offers/salmon.webp"),
      preview("Salmon fillet trim D", "Atlantic Salmon", "Fillet", "/images/salmon-fillet.jpg"),
    ],
    productionFacts: productionFacts(36, 5, 700, 45, 130),
    logisticsFacts: logisticsFacts(["FCA", "CIF", "DAP"], 11, 18, 2, ["20' Reefer", "40' Reefer HC"], "-18 C ... -22 C"),
    shipmentCases: shipmentEvidence("Atlantic Salmon", [24, 14, 28]),
    faqItems: profileFaqItems(2),
    legalDetails: legalDetails(
      "Org. nr (Brønnøysund)",
      "992 314 778",
      "AS (Aksjeselskap)",
      "2002-04-17",
      "NO992314778",
      "NO992314778000",
    ),
    supplierDocuments: supplierDocuments("sup-no-001"),
    website: "https://example-nordfjord.no",
    whatsapp: "+47 555 0114",
    updatedAt: "2026-05-14T00:00:00.000Z",
  },
  {
    id: "sup-cn-002",
    companyName: "Qingdao Ocean Harvest Foods Co., Ltd.",
    maskedName: "Chinese whitefish processor · CN-207",
    country: "China",
    countryCode: "CN",
    city: "Qingdao",
    supplierType: "processor",
    inBusinessSinceYear: 2007,
    productFocus: [product("Cod", "Twice-frozen fillet, portions"), product("Pollock", "Fillet, blocks")],
    certifications: ["BRC", "IFS", "HACCP", "BAP"],
    certificationBadges: [cert("BRC"), cert("IFS"), cert("HACCP"), cert("BAP")],
    activeOffersCount: 28,
    shortDescription: "Whitefish reprocessing plant with MAP/IQF lines and EU/US export programs.",
    about:
      "Qingdao reprocessor specialising in twice-frozen whitefish from Russian and Alaskan raw material.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/cod.webp",
    logoImage: null,
    deliveryCountries: [dc("US", "United States"), dc("DE", "Germany"), dc("NL", "Netherlands")],
    deliveryCountriesTotal: 24,
    totalProductsCount: 58,
    productCatalogPreview: [
      preview("Cod fillet 4-6 oz", "Cod", "Fillet", "/offers/cod.webp"),
      preview("Pollock blocks 16.5 lb", "Pollock", "Blocks", "/offers/cod.webp"),
    ],
    productionFacts: productionFacts(42, 6, 1000, 55, 170),
    logisticsFacts: logisticsFacts(["FOB", "CFR", "CIF"], 16, 23, 3, ["40' Reefer HC"], "-18 C ... -22 C"),
    shipmentCases: shipmentEvidence("Cod", [22, 12, 25]),
    faqItems: profileFaqItems(3),
    legalDetails: legalDetails(
      "USCC",
      "913702008765432100",
      "Co., Ltd.",
      "2007-08-09",
    ),
    supplierDocuments: supplierDocuments("sup-cn-002"),
    website: "https://example-qingdaooh.com",
    whatsapp: "+86 532 0207",
    updatedAt: "2026-05-14T00:00:00.000Z",
  },
  {
    id: "sup-ec-003",
    companyName: "Pacific Blue Shrimp S.A.",
    maskedName: "Ecuadorian shrimp exporter · EC-051",
    country: "Ecuador",
    countryCode: "EC",
    city: "Guayaquil",
    supplierType: "exporter",
    inBusinessSinceYear: 2013,
    productFocus: [product("Vannamei Shrimp", "HOSO, HLSO, PD, cooked")],
    certifications: ["ASC", "BAP 4★", "HACCP"],
    certificationBadges: [cert("ASC"), cert("BAP4", "BAP 4★"), cert("HACCP")],
    activeOffersCount: 19,
    shortDescription: "Farm-to-container shrimp exporter with weekly reefer programs to EU, China and the US.",
    about:
      "Vertically integrated vannamei shrimp exporter from coastal Ecuador with farms, processing and packing.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/shrimp.webp",
    logoImage: null,
    deliveryCountries: [dc("ES", "Spain"), dc("FR", "France"), dc("IT", "Italy"), dc("CN", "China")],
    deliveryCountriesTotal: 21,
    totalProductsCount: 26,
    productCatalogPreview: [
      preview("Vannamei HOSO 30/40", "Vannamei Shrimp", "HOSO", "/offers/shrimp.webp"),
      preview("Vannamei HLSO 21/25", "Vannamei Shrimp", "HLSO", "/offers/shrimp.webp"),
    ],
    productionFacts: productionFacts(29, 4, 600, 40, 110),
    logisticsFacts: logisticsFacts(["FOB", "CFR", "CIF"], 14, 21, 2, ["40' Reefer HC"], "-18 C ... -22 C"),
    shipmentCases: shipmentEvidence("Vannamei Shrimp", [23, 15, 26]),
    faqItems: profileFaqItems(2),
    legalDetails: legalDetails(
      "RUC",
      "0992876543001",
      "S.A.",
      "2013-03-21",
    ),
    supplierDocuments: supplierDocuments("sup-ec-003"),
    website: "https://example-pacificblue.ec",
    whatsapp: "+593 4 0051",
    updatedAt: "2026-05-14T00:00:00.000Z",
  },
  {
    id: "sup-id-004",
    companyName: "Bali Tuna Pratama",
    maskedName: "Indonesian tuna processor · ID-044",
    country: "Indonesia",
    countryCode: "ID",
    city: "Denpasar",
    supplierType: "processor",
    inBusinessSinceYear: 2011,
    productFocus: [product("Yellowfin Tuna", "Loins, saku, steaks"), product("Skipjack", "Loins")],
    certifications: ["HACCP", "BRC", "MSC"],
    certificationBadges: [cert("HACCP"), cert("BRC"), cert("MSC")],
    activeOffersCount: 17,
    shortDescription: "Tuna processor focused on retail loins and foodservice saku programs.",
    about:
      "Indonesian tuna processor buying from approved vessels and shipping frozen loins and saku programs.",
    responseSignal: "normal",
    documentReadiness: "partial",
    verificationLevel: "basic",
    heroImage: "/offers/tuna.webp",
    logoImage: null,
    deliveryCountries: [dc("JP", "Japan"), dc("KR", "South Korea"), dc("US", "United States")],
    deliveryCountriesTotal: 13,
    totalProductsCount: 22,
    productCatalogPreview: [
      preview("Yellowfin tuna loins", "Yellowfin Tuna", "Loins", "/offers/tuna.webp"),
      preview("Tuna saku blocks", "Yellowfin Tuna", "Saku", "/offers/tuna.webp"),
    ],
    productionFacts: productionFacts(24, 4, 500, 35, 95),
    logisticsFacts: logisticsFacts(["FCA", "FOB", "CIF"], 9, 16, 1, ["20' Reefer", "40' Reefer HC"], "-18 C ... -22 C"),
    shipmentCases: shipmentEvidence("Yellowfin Tuna", [21, 11, 24]),
    faqItems: profileFaqItems(1),
    legalDetails: legalDetails(
      "NIB",
      "9120304455667",
      "PT",
      "2011-06-12",
    ),
    supplierDocuments: supplierDocuments("sup-id-004"),
    website: "https://example-balituna.id",
    whatsapp: "+62 361 0044",
    updatedAt: "2026-05-14T00:00:00.000Z",
  },
];

const includesText = (value: string, needle: string) => value.toLowerCase().includes(needle);

function matchesQuery(
  supplier: SupplierDirectoryRecord,
  query: SupplierDirectoryQuery,
  privateSearchSupplierIds: ReadonlySet<string>,
) {
  if (query.countryCode && supplier.countryCode !== query.countryCode.toUpperCase()) return false;
  if (query.supplierType && supplier.supplierType !== query.supplierType) return false;
  if (query.verificationLevel && supplier.verificationLevel !== query.verificationLevel) return false;
  if (query.certification && !supplier.certifications.some((certification) => includesText(certification, query.certification!))) {
    return false;
  }
  if (query.species && !supplier.productFocus.some((item) => includesText(item.species, query.species!))) return false;

  if (query.q) {
    const q = query.q.toLowerCase();
    const searchable = [
      supplier.maskedName,
      supplier.country,
      supplier.city,
      supplier.supplierType,
      supplier.shortDescription,
      ...supplier.certifications,
      ...supplier.productFocus.flatMap((item) => [item.species, item.forms]),
    ];
    if (privateSearchSupplierIds.has(supplier.id)) {
      searchable.push(supplier.companyName, supplier.about);
    }
    if (!searchable.some((item) => item.toLowerCase().includes(q))) return false;
  }

  return true;
}

const verificationRank: Record<SupplierDirectoryRecord["verificationLevel"], number> = {
  documents_reviewed: 0,
  basic: 1,
  unverified: 2,
};

const responseRank: Record<SupplierDirectoryRecord["responseSignal"], number> = {
  fast: 0,
  normal: 1,
  slow: 2,
};

function compareText(a: string, b: string) {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

function compareSuppliers(
  a: SupplierDirectoryRecord,
  b: SupplierDirectoryRecord,
  sortBy: SupplierDirectorySortBy,
  direction: SupplierDirectorySortDirection,
) {
  const sign = direction === "asc" ? 1 : -1;
  let value = 0;

  if (sortBy === "country") {
    value = compareText(`${a.countryCode}-${a.city}-${a.id}`, `${b.countryCode}-${b.city}-${b.id}`);
  } else if (sortBy === "verification") {
    value = verificationRank[a.verificationLevel] - verificationRank[b.verificationLevel] || compareText(a.id, b.id);
  } else if (sortBy === "response") {
    value = responseRank[a.responseSignal] - responseRank[b.responseSignal] || compareText(a.id, b.id);
  } else {
    const updated = compareText(a.updatedAt, b.updatedAt);
    return updated === 0 ? compareText(a.id, b.id) : updated * sign;
  }

  return value * sign;
}

export class MemorySupplierRepository implements SupplierRepository {
  private readonly documentGrantAudit: SupplierDocumentDownloadGrantAuditRecord[] = [];

  constructor(private readonly suppliers = demoSupplierRecords) {}

  async listSuppliers(query: SupplierDirectoryQuery, options: SupplierRepositoryListOptions = {}) {
    const privateSearchSupplierIds = new Set(options.privateSearchSupplierIds ?? []);
    const filtered = this.suppliers
      .filter((supplier) => matchesQuery(supplier, query, privateSearchSupplierIds))
      .sort((a, b) => compareSuppliers(a, b, query.sortBy, query.sortDirection));
    return {
      suppliers: filtered.slice(query.offset, query.offset + query.limit).map((supplier) => ({ ...supplier })),
      total: filtered.length,
    };
  }

  async getSupplierById(id: string) {
    const supplier = this.suppliers.find((item) => item.id === id);
    return supplier ? { ...supplier } : null;
  }

  async recordDocumentDownloadGrant(input: SupplierDocumentDownloadGrantAuditInput) {
    const record: SupplierDocumentDownloadGrantAuditRecord = {
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.documentGrantAudit.push(record);
    return structuredClone(record);
  }

  async listDocumentDownloadGrantAudit(input: { limit: number; offset: number }) {
    return structuredClone(
      this.documentGrantAudit
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
        .slice(input.offset, input.offset + input.limit),
    );
  }
}
