import type {
  SupplierCatalogPreviewItem,
  SupplierCertificationBadge,
  SupplierDeliveryCountry,
  SupplierDirectoryQuery,
  SupplierDirectoryRecord,
  SupplierProductFocus,
  SupplierType,
} from "../../../../../packages/contracts/dist/index.js";

export interface SupplierRepository {
  listSuppliers(query: SupplierDirectoryQuery): Promise<{ suppliers: SupplierDirectoryRecord[]; total: number }>;
  getSupplierById(id: string): Promise<SupplierDirectoryRecord | null>;
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
    website: "https://example-balituna.id",
    whatsapp: "+62 361 0044",
    updatedAt: "2026-05-14T00:00:00.000Z",
  },
];

const includesText = (value: string, needle: string) => value.toLowerCase().includes(needle);

function matchesQuery(supplier: SupplierDirectoryRecord, query: SupplierDirectoryQuery) {
  if (query.countryCode && supplier.countryCode !== query.countryCode.toUpperCase()) return false;
  if (query.supplierType && supplier.supplierType !== query.supplierType) return false;
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
    if (query.accessLevel === "qualified_unlocked") {
      searchable.push(supplier.companyName, supplier.about);
    }
    if (!searchable.some((item) => item.toLowerCase().includes(q))) return false;
  }

  return true;
}

export class MemorySupplierRepository implements SupplierRepository {
  constructor(private readonly suppliers = demoSupplierRecords) {}

  async listSuppliers(query: SupplierDirectoryQuery) {
    const filtered = this.suppliers.filter((supplier) => matchesQuery(supplier, query));
    return {
      suppliers: filtered.slice(query.offset, query.offset + query.limit).map((supplier) => ({ ...supplier })),
      total: filtered.length,
    };
  }

  async getSupplierById(id: string) {
    const supplier = this.suppliers.find((item) => item.id === id);
    return supplier ? { ...supplier } : null;
  }
}
