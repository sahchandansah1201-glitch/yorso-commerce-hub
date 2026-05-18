import type {
  OfferCatalogQuery,
  OfferCatalogRecord,
  OfferCatalogSupplierInfo,
  OfferCommercialTerms,
  OfferDeliveryBasisOption,
  OfferGalleryImage,
  OfferProductSpecs,
  OfferRelatedArticle,
  OfferVolumeBreak,
} from "../../../../../packages/contracts/dist/index.js";

export interface OfferCatalogRepository {
  listOffers(
    query: OfferCatalogQuery,
    options?: OfferCatalogRepositoryListOptions,
  ): Promise<{ offers: OfferCatalogRecord[]; total: number }>;
  getOfferById(id: string): Promise<OfferCatalogRecord | null>;
}

export interface OfferCatalogRepositoryListOptions {
  privateSearchSupplierIds?: readonly string[];
}

const LEGACY_UUID_OFFER_ID_PATTERN = /^00000000-0000-0000-0000-(\d{12})$/;

export const normalizeOfferCatalogId = (id: string): string => {
  const match = LEGACY_UUID_OFFER_ID_PATTERN.exec(id);
  if (!match) return id;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? String(parsed) : id;
};

const defaultSpecs: OfferProductSpecs = {
  catchingMethod: "Aquaculture",
  freezingProcess: "IQF",
  glazing: "5-10%",
  storageTemperature: "-18°C or below",
  fishingArea: "FAO 27",
  ingredients: "100% seafood product",
  nutritionPer100g: { calories: "180 kcal", protein: "20 g", fat: "8 g", carbs: "0 g" },
  packingWeight: "10 kg net",
  shelfLife: "24 months from production",
};

const commercial = (
  incoterm: string,
  shipmentPort: string,
  paymentTerms = "30% advance, 70% against B/L",
): OfferCommercialTerms => ({
  incoterm,
  paymentTerms,
  availableVolume: "Commercial weekly volume",
  leadTime: "14-21 days",
  stockStatus: "In Stock",
  shipmentPort,
});

const supplier = (
  id: string,
  name: string,
  country: string,
  countryCode: string,
  countryFlag: string,
  profileSlug: string,
): OfferCatalogSupplierInfo => ({
  id,
  name,
  country,
  countryCode,
  countryFlag,
  isVerified: true,
  inBusinessSince: 2008,
  responseTime: "< 1 day",
  certifications: ["HACCP", "BRC"],
  documentsReviewed: ["Business registration", "Export permit", "HACCP certificate"],
  profileSlug,
});

const basis = (
  code: string,
  label: string,
  shipmentPort: string,
  priceRange: string,
): OfferDeliveryBasisOption => ({
  code,
  label,
  isDefault: true,
  priceRange,
  priceUnit: "per kg",
  shipmentPort,
  leadTime: "14-21 days",
});

const gallery = (src: string, alt: string): OfferGalleryImage[] => [
  { src, alt, caption: "Supplier-provided product photo", sourceLabel: "Supplier-provided" },
];

const article = (id: string, title: string, category: string): OfferRelatedArticle => ({
  id,
  title,
  slug: id,
  category,
  readTime: "6 min",
  relevanceReason: "Same product and origin context",
});

const volumeBreak = (minQty: string, priceRange: string): OfferVolumeBreak => ({ minQty, priceRange });

const offer = (record: Omit<OfferCatalogRecord, "updatedAt">): OfferCatalogRecord => ({
  ...record,
  updatedAt: "2026-05-14T00:00:00.000Z",
});

export const demoOfferRecords: OfferCatalogRecord[] = [
  offer({
    id: "1",
    productName: "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade",
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
    gallery: gallery("/offers/salmon.webp", "Atlantic salmon fillet"),
    photoSourceLabel: "Supplier-provided product photos",
    sampleAvailable: true,
    inspectionAvailable: true,
    traceability: "Farm-to-port traceability with catch, health and origin documents available after access.",
    freshness: "Updated 2h ago",
    moqLabel: "MOQ: 1,000 kg",
    moqValue: 1000,
    moqUnit: "kg",
    priceRangeLabel: "$8.50 – $9.20",
    priceUnit: "per kg",
    priceMin: 8.5,
    priceMax: 9.2,
    currency: "USD",
    supplier: supplier("sup-no-001", "Nordfjord Sjømat AS", "Norway", "NO", "🇳🇴", "nordfjord-sjomat"),
    specs: { ...defaultSpecs, catchingMethod: "Aquaculture", fishingArea: "FAO 27" },
    commercial: commercial("FOB", "Ålesund, Norway"),
    deliveryBasisOptions: [
      basis("FOB", "FOB Ålesund", "Ålesund, Norway", "$8.50 – $9.20"),
      { ...basis("CIF", "CIF Rotterdam", "Rotterdam, Netherlands", "$9.10 – $9.80"), isDefault: false },
    ],
    relatedArticles: [article("norway-salmon-market", "Norway salmon market: price signals for importers", "Market")],
    volumeBreaks: [volumeBreak("1,000 – 4,999 kg", "$9.00 – $9.20"), volumeBreak("20,000+ kg", "$8.50 – $8.70")],
  }),
  offer({
    id: "2",
    productName: "Vannamei Shrimp HOSO",
    species: "Vannamei Shrimp",
    latinName: "Litopenaeus vannamei",
    category: "Shrimp",
    origin: "Ecuador",
    originCode: "EC",
    originFlag: "🇪🇨",
    format: "Frozen",
    cutType: "HOSO (Head-On Shell-On)",
    packaging: "20 kg master carton",
    certifications: ["HACCP", "BAP"],
    image: "/offers/shrimp.webp",
    images: ["/offers/shrimp.webp", "/offers/crab.webp"],
    gallery: gallery("/offers/shrimp.webp", "Vannamei shrimp HOSO"),
    photoSourceLabel: "Supplier-provided product photos",
    sampleAvailable: true,
    inspectionAvailable: false,
    traceability: "Farm-to-port traceability with harvest and packing records.",
    freshness: "Listed today",
    moqLabel: "MOQ: 5,000 kg",
    moqValue: 5000,
    moqUnit: "kg",
    priceRangeLabel: "$5.80 – $6.40",
    priceUnit: "per kg",
    priceMin: 5.8,
    priceMax: 6.4,
    currency: "USD",
    supplier: supplier("sup-ec-003", "Pacific Blue Shrimp S.A.", "Ecuador", "EC", "🇪🇨", "pacific-blue-shrimp"),
    specs: { ...defaultSpecs, catchingMethod: "Aquaculture ponds", fishingArea: "Ecuador coastal farms" },
    commercial: commercial("CIF", "Guayaquil, Ecuador"),
    deliveryBasisOptions: [basis("CIF", "CIF Guayaquil", "Guayaquil, Ecuador", "$5.80 – $6.40")],
    relatedArticles: [article("ecuador-shrimp-energy", "Ecuador shrimp supply and energy cost signals", "Market")],
    volumeBreaks: [volumeBreak("5,000 – 19,999 kg", "$6.20 – $6.40"), volumeBreak("20,000+ kg", "$5.80 – $6.00")],
  }),
  offer({
    id: "3",
    productName: "Cod Loin Skinless Boneless Center Cut Premium Selection",
    species: "Atlantic Cod",
    latinName: "Gadus morhua",
    category: "Whitefish",
    origin: "Iceland",
    originCode: "IS",
    originFlag: "🇮🇸",
    format: "Fresh",
    cutType: "Loin, skinless boneless",
    packaging: "5 kg carton",
    certifications: ["MSC", "HACCP"],
    image: "/offers/cod.webp",
    images: ["/offers/cod.webp", "/offers/salmon.webp"],
    gallery: gallery("/offers/cod.webp", "Atlantic cod loin"),
    photoSourceLabel: "Supplier-provided product photos",
    sampleAvailable: false,
    inspectionAvailable: true,
    traceability: "Vessel-to-processor traceability with FAO area and landing documents.",
    freshness: "Updated 1d ago",
    moqLabel: "MOQ: 2,000 kg",
    moqValue: 2000,
    moqUnit: "kg",
    priceRangeLabel: "$11.00 – $12.50",
    priceUnit: "per kg",
    priceMin: 11,
    priceMax: 12.5,
    currency: "USD",
    supplier: supplier("sup-is-005", "Iceland North Atlantic Foods", "Iceland", "IS", "🇮🇸", "iceland-north-atlantic"),
    specs: { ...defaultSpecs, catchingMethod: "Wild caught", freezingProcess: "Fresh chilled", fishingArea: "FAO 27" },
    commercial: commercial("FCA", "Reykjavik, Iceland", "Net 14 days"),
    deliveryBasisOptions: [basis("FCA", "FCA Reykjavik", "Reykjavik, Iceland", "$11.00 – $12.50")],
    relatedArticles: [article("iceland-cod-quota", "Iceland cod quota and premium loin pricing", "Market")],
    volumeBreaks: [volumeBreak("2,000 – 7,999 kg", "$12.10 – $12.50"), volumeBreak("8,000+ kg", "$11.00 – $11.60")],
  }),
  offer({
    id: "4",
    productName: "Yellowfin Tuna Loin Grade A",
    species: "Yellowfin Tuna",
    latinName: "Thunnus albacares",
    category: "Tuna",
    origin: "Philippines",
    originCode: "PH",
    originFlag: "🇵🇭",
    format: "Chilled",
    cutType: "Loin, Grade A",
    packaging: "Vacuum packed loins",
    certifications: ["HACCP", "MSC"],
    image: "/offers/tuna.webp",
    images: ["/offers/tuna.webp", "/offers/mackerel.webp"],
    gallery: gallery("/offers/tuna.webp", "Yellowfin tuna loin"),
    photoSourceLabel: "Supplier-provided product photos",
    sampleAvailable: true,
    inspectionAvailable: true,
    traceability: "Approved vessel and landing documentation available after access.",
    freshness: "Updated 5h ago",
    moqLabel: "MOQ: 800 kg",
    moqValue: 800,
    moqUnit: "kg",
    priceRangeLabel: "$9.50 – $11.00",
    priceUnit: "per kg",
    priceMin: 9.5,
    priceMax: 11,
    currency: "USD",
    supplier: supplier("sup-ph-006", "General Santos Tuna Exporters", "Philippines", "PH", "🇵🇭", "gensan-tuna"),
    specs: { ...defaultSpecs, catchingMethod: "Wild caught", freezingProcess: "Chilled", fishingArea: "FAO 71" },
    commercial: commercial("FOB", "General Santos, Philippines"),
    deliveryBasisOptions: [basis("FOB", "FOB General Santos", "General Santos, Philippines", "$9.50 – $11.00")],
    relatedArticles: [article("philippines-tuna-supply", "Philippines tuna supply and reefer availability", "Market")],
    volumeBreaks: [volumeBreak("800 – 3,999 kg", "$10.50 – $11.00"), volumeBreak("4,000+ kg", "$9.50 – $10.20")],
  }),
];

const includesText = (value: string, needle: string) => value.toLowerCase().includes(needle.toLowerCase());
const compareText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });
const compareNumber = (a: number | null, b: number | null) => (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER);

function matchesQuery(
  offer: OfferCatalogRecord,
  query: OfferCatalogQuery,
  privateSearchSupplierIds: ReadonlySet<string>,
) {
  if (query.category && !includesText(offer.category, query.category)) return false;
  if (query.species && !includesText(offer.species, query.species)) return false;
  if (query.originCode && offer.originCode !== query.originCode.toUpperCase()) return false;
  if (query.supplierCountryCode && offer.supplier.countryCode !== query.supplierCountryCode.toUpperCase()) return false;
  if (query.format && offer.format !== query.format) return false;
  if (query.certification && !offer.certifications.some((cert) => includesText(cert, query.certification!))) return false;

  if (query.q) {
    const q = query.q.toLowerCase();
    const searchable = [
      offer.productName,
      offer.species,
      offer.latinName,
      offer.category,
      offer.origin,
      offer.cutType,
      offer.packaging,
      offer.commercial.incoterm,
      offer.commercial.shipmentPort ?? "",
      ...offer.certifications,
    ];
    if (offer.supplier.id && privateSearchSupplierIds.has(offer.supplier.id)) {
      searchable.push(offer.supplier.name ?? "", offer.supplier.country ?? "");
    }
    if (!searchable.some((item) => item.toLowerCase().includes(q))) return false;
  }

  return true;
}

function compareOffers(a: OfferCatalogRecord, b: OfferCatalogRecord, query: OfferCatalogQuery) {
  const direction = query.sortDirection === "asc" ? 1 : -1;
  let value = 0;

  if (query.sortBy === "category") {
    value = compareText(`${a.category}-${a.productName}-${a.id}`, `${b.category}-${b.productName}-${b.id}`);
  } else if (query.sortBy === "origin") {
    value = compareText(`${a.originCode}-${a.origin}-${a.productName}-${a.id}`, `${b.originCode}-${b.origin}-${b.productName}-${b.id}`);
  } else if (query.sortBy === "moq") {
    value = compareNumber(a.moqValue, b.moqValue) || compareText(a.id, b.id);
  } else {
    value = compareText(a.updatedAt, b.updatedAt) || compareText(a.id, b.id);
  }

  return value * direction;
}

export class MemoryOfferCatalogRepository implements OfferCatalogRepository {
  constructor(private readonly offers = demoOfferRecords) {}

  async listOffers(query: OfferCatalogQuery, options: OfferCatalogRepositoryListOptions = {}) {
    const privateSearchSupplierIds = new Set(options.privateSearchSupplierIds ?? []);
    const filtered = this.offers
      .filter((offer) => matchesQuery(offer, query, privateSearchSupplierIds))
      .sort((a, b) => compareOffers(a, b, query));
    return {
      offers: filtered.slice(query.offset, query.offset + query.limit).map((offer) => structuredClone(offer)),
      total: filtered.length,
    };
  }

  async getOfferById(id: string) {
    const normalizedId = normalizeOfferCatalogId(id);
    const offer = this.offers.find((item) => item.id === id || item.id === normalizedId);
    return offer ? structuredClone(offer) : null;
  }
}
