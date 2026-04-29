/**
 * Mock supplier directory for /suppliers (Phase 1, frontend-only).
 *
 * No backend, no real verification. The shape mirrors what a future API
 * is expected to return so the page can stay structurally stable when
 * real data lands.
 *
 * Access model is enforced in the UI layer, not here:
 *   anonymous_locked  → masked identity, no contact, no website/whatsapp
 *   registered_locked → masked identity, shortlist + request access
 *   qualified_unlocked → full company name + controlled contact actions
 *
 * IMPORTANT: contact channels (website, whatsapp) live in the data model
 * but the UI layer is responsible for not rendering them in locked states.
 */

export type SupplierType =
  | "producer"
  | "processor"
  | "exporter"
  | "distributor"
  | "trader";

export type ResponseSignal = "fast" | "normal" | "slow";
export type DocumentReadiness = "ready" | "partial" | "on_request";
export type VerificationLevel = "documents_reviewed" | "basic" | "unverified";

export interface SupplierProductFocus {
  /** Common species or product family, e.g. "Atlantic Salmon". */
  species: string;
  /** Product forms the supplier ships, e.g. "HOG, fillet, portions". */
  forms: string;
}

export interface SupplierDeliveryCountry {
  code: string; // ISO-2
  name: string;
}

export interface SupplierCatalogPreviewItem {
  name: string;
  species: string;
  form: string;
  image: string;
}

export interface SupplierCertificationBadge {
  code: string;
  label: string;
  logo?: string;
}

export interface MockSupplier {
  id: string;
  /** Real legal/trade name. Only revealed at qualified_unlocked. */
  companyName: string;
  /** Masked identity for locked states, e.g. "Norwegian salmon producer · NO-114". */
  maskedName: string;
  country: string;
  countryCode: string; // ISO-2, used for flag emoji
  city: string;
  supplierType: SupplierType;
  /** Legacy: kept for backwards compatibility, derived from inBusinessSinceYear. */
  yearsInBusiness: number;
  /** Year the supplier started operations. */
  inBusinessSinceYear: number;
  productFocus: SupplierProductFocus[];
  certifications: string[];
  /** Visual badges for the row's trust strip. */
  certificationBadges: SupplierCertificationBadge[];
  activeOffersCount: number;
  /** Small inline previews for the row (legacy). */
  productPreviewImages: string[];
  shortDescription: string;
  /** Longer about copy. Only revealed at qualified_unlocked. */
  about: string;
  responseSignal: ResponseSignal;
  documentReadiness: DocumentReadiness;
  verificationLevel: VerificationLevel;

  // ----- v2 supplier card fields -----
  heroImage: string;
  logoImage?: string;
  /** Subset of delivery markets to preview in the row. */
  deliveryCountries: SupplierDeliveryCountry[];
  /** Total markets the supplier ships to. */
  deliveryCountriesTotal: number;
  /** Total products in the supplier's catalog. */
  totalProductsCount: number;
  /** Up to ~6 named products for the catalog preview strip. */
  productCatalogPreview: SupplierCatalogPreviewItem[];

  // ----- contact channels (gated by UI) -----
  website?: string;
  whatsapp?: string;
}

/** ISO-2 → flag emoji. Tiny utility so rows can stay stateless. */
export const countryCodeToFlag = (code: string): string => {
  if (!code || code.length !== 2) return "";
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => A + (c.charCodeAt(0) - a)),
  );
};

// Convenience builders so per-supplier blocks read clean.
const cert = (code: string, label: string): SupplierCertificationBadge => ({
  code,
  label,
});
const dc = (code: string, name: string): SupplierDeliveryCountry => ({
  code,
  name,
});

export const mockSuppliers: MockSupplier[] = [
  {
    id: "sup-no-001",
    companyName: "Nordfjord Sjømat AS",
    maskedName: "Norwegian salmon producer · NO-114",
    country: "Norway",
    countryCode: "NO",
    city: "Ålesund",
    supplierType: "producer",
    yearsInBusiness: 22,
    inBusinessSinceYear: 2002,
    productFocus: [
      { species: "Atlantic Salmon", forms: "HOG, fillet, portions" },
      { species: "Trout", forms: "HOG, fillet" },
    ],
    certifications: ["ASC", "MSC", "BRC", "IFS"],
    certificationBadges: [
      cert("ASC", "ASC"),
      cert("MSC", "MSC"),
      cert("BRC", "BRC"),
      cert("IFS", "IFS"),
    ],
    activeOffersCount: 14,
    productPreviewImages: ["/offers/salmon.webp", "/images/salmon-fillet.jpg"],
    shortDescription:
      "Vertically integrated salmon farm and processing plant, weekly air shipments to EU and Asia.",
    about:
      "Family-owned Norwegian salmon producer operating own farms in the fjords around Ålesund and a HACCP-audited processing plant. Vertically integrated from smolt to packed product, with weekly air freight programs to EU and Asian retail and HoReCa.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/salmon.webp",
    deliveryCountries: [
      dc("DE", "Germany"),
      dc("FR", "France"),
      dc("PL", "Poland"),
      dc("JP", "Japan"),
      dc("KR", "South Korea"),
    ],
    deliveryCountriesTotal: 18,
    totalProductsCount: 32,
    productCatalogPreview: [
      { name: "Salmon HOG 4-5 kg", species: "Atlantic Salmon", form: "HOG", image: "/offers/salmon.webp" },
      { name: "Salmon fillet trim D", species: "Atlantic Salmon", form: "Fillet", image: "/images/salmon-fillet.jpg" },
      { name: "Salmon portions IQF", species: "Atlantic Salmon", form: "Portions", image: "/offers/salmon.webp" },
      { name: "Trout HOG 2-3 kg", species: "Trout", form: "HOG", image: "/images/salmon-fillet.jpg" },
    ],
    website: "https://example-nordfjord.no",
    whatsapp: "+47 555 0114",
  },
  {
    id: "sup-cn-002",
    companyName: "Qingdao Ocean Harvest Foods Co., Ltd.",
    maskedName: "Chinese whitefish processor · CN-207",
    country: "China",
    countryCode: "CN",
    city: "Qingdao",
    supplierType: "processor",
    yearsInBusiness: 17,
    inBusinessSinceYear: 2007,
    productFocus: [
      { species: "Cod", forms: "Twice-frozen fillet, portions" },
      { species: "Pollock", forms: "Fillet, blocks" },
      { species: "Tilapia", forms: "Fillet IQF" },
    ],
    certifications: ["BRC", "IFS", "HACCP", "BAP"],
    certificationBadges: [
      cert("BRC", "BRC"),
      cert("IFS", "IFS"),
      cert("HACCP", "HACCP"),
      cert("BAP", "BAP"),
    ],
    activeOffersCount: 28,
    productPreviewImages: ["/offers/cod.webp", "/images/cod-loin.jpg", "/offers/pangasius.webp"],
    shortDescription:
      "Reprocessing plant for Russian and Alaskan whitefish, MAP/IQF lines, EU and US export programs.",
    about:
      "Mid-size Qingdao reprocessor specialising in twice-frozen whitefish from Russian and Alaskan raw material. Two MAP/IQF lines, BRC- and IFS-audited cold storage, and ongoing EU and US private label programs.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/cod.webp",
    deliveryCountries: [
      dc("US", "United States"),
      dc("DE", "Germany"),
      dc("NL", "Netherlands"),
      dc("GB", "United Kingdom"),
      dc("ES", "Spain"),
    ],
    deliveryCountriesTotal: 24,
    totalProductsCount: 58,
    productCatalogPreview: [
      { name: "Cod fillet 4-6 oz", species: "Cod", form: "Fillet", image: "/offers/cod.webp" },
      { name: "Cod loins skinless", species: "Cod", form: "Loins", image: "/images/cod-loin.jpg" },
      { name: "Pollock blocks 16.5 lb", species: "Pollock", form: "Blocks", image: "/offers/cod.webp" },
      { name: "Tilapia fillet IQF", species: "Tilapia", form: "Fillet", image: "/offers/pangasius.webp" },
    ],
    website: "https://example-qingdaooh.com",
    whatsapp: "+86 532 0207",
  },
  {
    id: "sup-ec-003",
    companyName: "Pacific Blue Shrimp S.A.",
    maskedName: "Ecuadorian shrimp exporter · EC-051",
    country: "Ecuador",
    countryCode: "EC",
    city: "Guayaquil",
    supplierType: "exporter",
    yearsInBusiness: 11,
    inBusinessSinceYear: 2013,
    productFocus: [
      { species: "Vannamei Shrimp", forms: "HOSO, HLSO, PD, cooked" },
    ],
    certifications: ["ASC", "BAP 4★", "HACCP"],
    certificationBadges: [
      cert("ASC", "ASC"),
      cert("BAP4", "BAP 4★"),
      cert("HACCP", "HACCP"),
    ],
    activeOffersCount: 19,
    productPreviewImages: ["/offers/shrimp.webp", "/images/shrimp-vannamei.jpg"],
    shortDescription:
      "Farm-to-container shrimp exporter, container loading directly at the plant, weekly EU departures.",
    about:
      "Vertically integrated vannamei shrimp exporter from coastal Ecuador. Farms, processing plant and packing under one roof, weekly reefer container programs to EU, China and the US.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/shrimp.webp",
    deliveryCountries: [
      dc("ES", "Spain"),
      dc("FR", "France"),
      dc("IT", "Italy"),
      dc("CN", "China"),
      dc("US", "United States"),
    ],
    deliveryCountriesTotal: 21,
    totalProductsCount: 26,
    productCatalogPreview: [
      { name: "Vannamei HOSO 30/40", species: "Vannamei Shrimp", form: "HOSO", image: "/offers/shrimp.webp" },
      { name: "Vannamei HLSO 21/25", species: "Vannamei Shrimp", form: "HLSO", image: "/images/shrimp-vannamei.jpg" },
      { name: "Vannamei PD cooked", species: "Vannamei Shrimp", form: "PD cooked", image: "/offers/shrimp.webp" },
    ],
    website: "https://example-pacblueshrimp.ec",
    whatsapp: "+593 4 555 0051",
  },
  {
    id: "sup-id-004",
    companyName: "Bali Tuna Pratama",
    maskedName: "Indonesian tuna exporter · ID-077",
    country: "Indonesia",
    countryCode: "ID",
    city: "Denpasar",
    supplierType: "exporter",
    yearsInBusiness: 9,
    inBusinessSinceYear: 2015,
    productFocus: [
      { species: "Yellowfin Tuna", forms: "Loins, steaks, saku, CO-treated" },
      { species: "Skipjack", forms: "Whole round, loins" },
    ],
    certifications: ["MSC CoC", "HACCP", "EU Approved"],
    certificationBadges: [
      cert("MSC", "MSC CoC"),
      cert("HACCP", "HACCP"),
      cert("EU", "EU Approved"),
    ],
    activeOffersCount: 8,
    productPreviewImages: ["/offers/tuna.webp", "/images/tuna-loin.jpg"],
    shortDescription:
      "Handline tuna sourced from Eastern Indonesia, fresh airfreight and ultra-low-temp frozen lines.",
    about:
      "Specialist handline yellowfin and skipjack exporter sourcing from artisanal fleets in Eastern Indonesia. Fresh airfreight programs and ULT (-60°C) frozen sashimi lines for EU, US and Japanese sashimi markets.",
    responseSignal: "normal",
    documentReadiness: "partial",
    verificationLevel: "basic",
    heroImage: "/offers/tuna.webp",
    deliveryCountries: [
      dc("JP", "Japan"),
      dc("US", "United States"),
      dc("DE", "Germany"),
      dc("AE", "UAE"),
    ],
    deliveryCountriesTotal: 12,
    totalProductsCount: 14,
    productCatalogPreview: [
      { name: "Yellowfin loins CO", species: "Yellowfin Tuna", form: "Loins", image: "/offers/tuna.webp" },
      { name: "Yellowfin saku ULT", species: "Yellowfin Tuna", form: "Saku", image: "/images/tuna-loin.jpg" },
      { name: "Skipjack whole round", species: "Skipjack", form: "Whole round", image: "/offers/tuna.webp" },
    ],
    website: "https://example-balitunap.id",
    whatsapp: "+62 361 555 077",
  },
  {
    id: "sup-vn-005",
    companyName: "Mekong Aquatic Products JSC",
    maskedName: "Vietnamese pangasius processor · VN-132",
    country: "Vietnam",
    countryCode: "VN",
    city: "Cần Thơ",
    supplierType: "processor",
    yearsInBusiness: 14,
    inBusinessSinceYear: 2010,
    productFocus: [
      { species: "Pangasius", forms: "Fillet, untreated and treated" },
      { species: "Vannamei Shrimp", forms: "PD, PDTO, cooked" },
    ],
    certifications: ["ASC", "BRC", "IFS", "HALAL"],
    certificationBadges: [
      cert("ASC", "ASC"),
      cert("BRC", "BRC"),
      cert("IFS", "IFS"),
      cert("HALAL", "HALAL"),
    ],
    activeOffersCount: 22,
    productPreviewImages: ["/offers/pangasius.webp", "/images/pangasius.jpg", "/offers/shrimp.webp"],
    shortDescription:
      "Integrated farming and processing for pangasius and shrimp, EU and Middle East programs.",
    about:
      "Mekong Delta processor with own pangasius farms and a contracted shrimp farming network. EU- and Middle East–oriented programs, ASC- and BRC-audited facility with HALAL line.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/pangasius.webp",
    deliveryCountries: [
      dc("DE", "Germany"),
      dc("PL", "Poland"),
      dc("AE", "UAE"),
      dc("SA", "Saudi Arabia"),
      dc("BR", "Brazil"),
    ],
    deliveryCountriesTotal: 22,
    totalProductsCount: 41,
    productCatalogPreview: [
      { name: "Pangasius fillet untreated", species: "Pangasius", form: "Fillet", image: "/offers/pangasius.webp" },
      { name: "Pangasius portions IQF", species: "Pangasius", form: "Portions", image: "/images/pangasius.jpg" },
      { name: "Vannamei PDTO", species: "Vannamei Shrimp", form: "PDTO", image: "/offers/shrimp.webp" },
    ],
    website: "https://example-mekongaq.vn",
    whatsapp: "+84 292 555 132",
  },
  {
    id: "sup-is-006",
    companyName: "Reykjanes Seafood ehf.",
    maskedName: "Icelandic whitefish producer · IS-019",
    country: "Iceland",
    countryCode: "IS",
    city: "Reykjavík",
    supplierType: "producer",
    yearsInBusiness: 28,
    inBusinessSinceYear: 1996,
    productFocus: [
      { species: "Cod", forms: "Fresh fillet, IQF portions" },
      { species: "Haddock", forms: "Fresh fillet, frozen loins" },
      { species: "Saithe", forms: "Frozen blocks" },
    ],
    certifications: ["MSC", "Iceland Responsible Fisheries", "IFS"],
    certificationBadges: [
      cert("MSC", "MSC"),
      cert("IRF", "Iceland RF"),
      cert("IFS", "IFS"),
    ],
    activeOffersCount: 11,
    productPreviewImages: ["/offers/cod.webp", "/images/cod-loin.jpg"],
    shortDescription:
      "Day-boat catch with same-day processing, fresh airfreight to EU, frozen reefer to Asia.",
    about:
      "Icelandic day-boat operator with own filleting plant near Reykjavík. Same-day processing for fresh airfreight to EU, frozen IQF and blocks for Asian and US programs.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/images/cod-loin.jpg",
    deliveryCountries: [
      dc("FR", "France"),
      dc("GB", "United Kingdom"),
      dc("ES", "Spain"),
      dc("US", "United States"),
      dc("CN", "China"),
    ],
    deliveryCountriesTotal: 16,
    totalProductsCount: 24,
    productCatalogPreview: [
      { name: "Cod fresh fillet", species: "Cod", form: "Fresh fillet", image: "/offers/cod.webp" },
      { name: "Cod IQF portions", species: "Cod", form: "IQF portions", image: "/images/cod-loin.jpg" },
      { name: "Haddock loins frozen", species: "Haddock", form: "Loins", image: "/offers/cod.webp" },
    ],
    website: "https://example-reykjanes.is",
    whatsapp: "+354 555 0019",
  },
  {
    id: "sup-ru-007",
    companyName: "Kamchatka Pacific Fisheries LLC",
    maskedName: "Russian crab and pollock supplier · RU-064",
    country: "Russia",
    countryCode: "RU",
    city: "Petropavlovsk-Kamchatsky",
    supplierType: "producer",
    yearsInBusiness: 19,
    inBusinessSinceYear: 2005,
    productFocus: [
      { species: "King Crab", forms: "Live, frozen sections, cooked legs" },
      { species: "Snow Crab", forms: "Frozen sections, clusters" },
      { species: "Pollock", forms: "H&G, fillet, surimi" },
    ],
    certifications: ["MSC (pollock)", "HACCP"],
    certificationBadges: [
      cert("MSC", "MSC"),
      cert("HACCP", "HACCP"),
    ],
    activeOffersCount: 7,
    productPreviewImages: ["/offers/crab.webp", "/images/king-crab.jpg", "/offers/cod.webp"],
    shortDescription:
      "Sea-frozen and shore-processed Pacific catch, reefer container shipments via Vladivostok and Busan.",
    about:
      "Kamchatka-based fishing and processing company with sea-frozen and shore-processed Pacific catch. Reefer container shipments routed via Vladivostok and Busan to Asian and EU markets.",
    responseSignal: "slow",
    documentReadiness: "on_request",
    verificationLevel: "basic",
    heroImage: "/offers/crab.webp",
    deliveryCountries: [
      dc("KR", "South Korea"),
      dc("CN", "China"),
      dc("JP", "Japan"),
    ],
    deliveryCountriesTotal: 8,
    totalProductsCount: 19,
    productCatalogPreview: [
      { name: "King crab frozen sections", species: "King Crab", form: "Sections", image: "/offers/crab.webp" },
      { name: "King crab cooked legs", species: "King Crab", form: "Cooked legs", image: "/images/king-crab.jpg" },
      { name: "Pollock H&G", species: "Pollock", form: "H&G", image: "/offers/cod.webp" },
    ],
    whatsapp: "+7 415 555 0064",
  },
  {
    id: "sup-cl-008",
    companyName: "AustralChile Seafoods SpA",
    maskedName: "Chilean salmon and mussels exporter · CL-038",
    country: "Chile",
    countryCode: "CL",
    city: "Puerto Montt",
    supplierType: "exporter",
    yearsInBusiness: 16,
    inBusinessSinceYear: 2008,
    productFocus: [
      { species: "Atlantic Salmon", forms: "Fillet trim D, portions, IQF" },
      { species: "Coho Salmon", forms: "HOG, fillet" },
      { species: "Blue Mussels", forms: "Half-shell, meat IQF" },
    ],
    certifications: ["ASC", "BAP", "BRC"],
    certificationBadges: [
      cert("ASC", "ASC"),
      cert("BAP", "BAP"),
      cert("BRC", "BRC"),
    ],
    activeOffersCount: 17,
    productPreviewImages: ["/offers/salmon.webp", "/images/salmon-fillet.jpg"],
    shortDescription:
      "Export consolidator for southern Chile producers, regular reefer programs to US, EU and Brazil.",
    about:
      "Puerto Montt–based export consolidator working with multiple southern Chile salmon and mussel producers. Regular reefer programs to the US, EU and Brazil, with consolidated documentation.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/images/salmon-fillet.jpg",
    deliveryCountries: [
      dc("US", "United States"),
      dc("BR", "Brazil"),
      dc("DE", "Germany"),
      dc("FR", "France"),
      dc("RU", "Russia"),
    ],
    deliveryCountriesTotal: 19,
    totalProductsCount: 36,
    productCatalogPreview: [
      { name: "Salmon fillet trim D", species: "Atlantic Salmon", form: "Fillet", image: "/images/salmon-fillet.jpg" },
      { name: "Salmon portions IQF", species: "Atlantic Salmon", form: "Portions", image: "/offers/salmon.webp" },
      { name: "Blue mussel meat IQF", species: "Blue Mussels", form: "Meat IQF", image: "/offers/salmon.webp" },
    ],
    website: "https://example-australchile.cl",
    whatsapp: "+56 65 555 0038",
  },
  {
    id: "sup-mr-009",
    companyName: "Atlantique Mauritanie SARL",
    maskedName: "Mauritanian octopus and small pelagics · MR-022",
    country: "Mauritania",
    countryCode: "MR",
    city: "Nouadhibou",
    supplierType: "exporter",
    yearsInBusiness: 12,
    inBusinessSinceYear: 2012,
    productFocus: [
      { species: "Octopus", forms: "Whole cleaned, T1–T8 grading" },
      { species: "Sardine", forms: "Whole round, frozen blocks" },
      { species: "Mackerel", forms: "Whole round" },
    ],
    certifications: ["HACCP", "EU Approved"],
    certificationBadges: [
      cert("HACCP", "HACCP"),
      cert("EU", "EU Approved"),
    ],
    activeOffersCount: 6,
    productPreviewImages: ["/offers/squid.webp", "/images/squid-tube.jpg"],
    shortDescription:
      "Atlantic small pelagics and cephalopods, container shipments to Mediterranean and Asian markets.",
    about:
      "Nouadhibou-based exporter of Atlantic small pelagics and cephalopods. EU-approved processing facility, regular container shipments to Mediterranean retail and Asian wholesale markets.",
    responseSignal: "normal",
    documentReadiness: "partial",
    verificationLevel: "basic",
    heroImage: "/offers/squid.webp",
    deliveryCountries: [
      dc("ES", "Spain"),
      dc("IT", "Italy"),
      dc("PT", "Portugal"),
      dc("CN", "China"),
    ],
    deliveryCountriesTotal: 11,
    totalProductsCount: 17,
    productCatalogPreview: [
      { name: "Octopus T3 cleaned", species: "Octopus", form: "Whole cleaned", image: "/offers/squid.webp" },
      { name: "Sardine frozen blocks", species: "Sardine", form: "Blocks", image: "/images/squid-tube.jpg" },
      { name: "Mackerel whole round", species: "Mackerel", form: "Whole round", image: "/offers/squid.webp" },
    ],
    whatsapp: "+222 555 0022",
  },
  {
    id: "sup-es-010",
    companyName: "Galicia Mar Distribución S.L.",
    maskedName: "Spanish seafood distributor · ES-091",
    country: "Spain",
    countryCode: "ES",
    city: "Vigo",
    supplierType: "distributor",
    yearsInBusiness: 24,
    inBusinessSinceYear: 2000,
    productFocus: [
      { species: "Squid (Loligo, Illex)", forms: "Tubes, rings, whole cleaned" },
      { species: "Hake", forms: "HGT, fillet" },
      { species: "Octopus", forms: "Whole, cooked legs" },
    ],
    certifications: ["IFS", "BRC", "MSC CoC"],
    certificationBadges: [
      cert("IFS", "IFS"),
      cert("BRC", "BRC"),
      cert("MSC", "MSC CoC"),
    ],
    activeOffersCount: 20,
    productPreviewImages: ["/offers/squid.webp", "/images/squid-tube.jpg"],
    shortDescription:
      "Vigo-based importer/distributor with cold storage and re-packing, supplies HoReCa and retail in Iberia.",
    about:
      "Long-established Vigo distributor with own cold storage and a re-packing line. Supplies HoReCa and retail across Spain and Portugal, with consolidated import programs from Argentina, Peru and Morocco.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/images/squid-tube.jpg",
    deliveryCountries: [
      dc("ES", "Spain"),
      dc("PT", "Portugal"),
      dc("FR", "France"),
      dc("IT", "Italy"),
    ],
    deliveryCountriesTotal: 9,
    totalProductsCount: 47,
    productCatalogPreview: [
      { name: "Loligo tubes & tentacles", species: "Squid", form: "Tubes", image: "/offers/squid.webp" },
      { name: "Illex rings", species: "Squid", form: "Rings", image: "/images/squid-tube.jpg" },
      { name: "Hake HGT", species: "Hake", form: "HGT", image: "/offers/cod.webp" },
    ],
    website: "https://example-galiciamar.es",
    whatsapp: "+34 986 555 091",
  },
  {
    id: "sup-cn-011",
    companyName: "Dalian Coldchain Trading Co., Ltd.",
    maskedName: "Chinese seafood trader · CN-318",
    country: "China",
    countryCode: "CN",
    city: "Dalian",
    supplierType: "trader",
    yearsInBusiness: 8,
    inBusinessSinceYear: 2016,
    productFocus: [
      { species: "Mixed whitefish", forms: "Cod, pollock, hake — blocks and fillets" },
      { species: "Squid", forms: "Tubes, rings" },
    ],
    certifications: ["HACCP"],
    certificationBadges: [cert("HACCP", "HACCP")],
    activeOffersCount: 31,
    productPreviewImages: ["/offers/cod.webp", "/offers/squid.webp", "/images/cod-loin.jpg"],
    shortDescription:
      "Trading desk consolidating multiple Dalian-area reprocessors, flexible MOQ and mixed-container loads.",
    about:
      "Trading desk consolidating volume from multiple Dalian-area reprocessors. Flexible MOQ, mixed-container loads, and short-notice supply for opportunistic whitefish and squid programs.",
    responseSignal: "normal",
    documentReadiness: "on_request",
    verificationLevel: "unverified",
    heroImage: "/images/cod-loin.jpg",
    deliveryCountries: [
      dc("DE", "Germany"),
      dc("PL", "Poland"),
      dc("ES", "Spain"),
      dc("BR", "Brazil"),
    ],
    deliveryCountriesTotal: 14,
    totalProductsCount: 22,
    productCatalogPreview: [
      { name: "Cod blocks 16.5 lb", species: "Cod", form: "Blocks", image: "/offers/cod.webp" },
      { name: "Pollock fillet", species: "Pollock", form: "Fillet", image: "/images/cod-loin.jpg" },
      { name: "Squid tubes", species: "Squid", form: "Tubes", image: "/offers/squid.webp" },
    ],
    whatsapp: "+86 411 555 0318",
  },
  {
    id: "sup-no-012",
    companyName: "Lofoten Klippfisk AS",
    maskedName: "Norwegian saltfish producer · NO-203",
    country: "Norway",
    countryCode: "NO",
    city: "Svolvær",
    supplierType: "producer",
    yearsInBusiness: 33,
    inBusinessSinceYear: 1991,
    productFocus: [
      { species: "Cod (saltfish/klippfisk)", forms: "Salted, dried, portions" },
      { species: "Saithe", forms: "Salted, dried" },
    ],
    certifications: ["MSC", "IFS"],
    certificationBadges: [cert("MSC", "MSC"), cert("IFS", "IFS")],
    activeOffersCount: 5,
    productPreviewImages: ["/offers/cod.webp", "/images/cod-loin.jpg"],
    shortDescription:
      "Traditional Lofoten klippfisk producer, programs for Portugal, Brazil and West Africa.",
    about:
      "Traditional Lofoten klippfisk producer with three generations in saltfish. Programs tailored for Portugal, Brazil and West Africa, with seasonal saithe and traditional drying yards.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
    heroImage: "/offers/cod.webp",
    deliveryCountries: [
      dc("PT", "Portugal"),
      dc("BR", "Brazil"),
      dc("AO", "Angola"),
      dc("NG", "Nigeria"),
    ],
    deliveryCountriesTotal: 10,
    totalProductsCount: 12,
    productCatalogPreview: [
      { name: "Klippfisk cod portions", species: "Cod", form: "Salted dried", image: "/offers/cod.webp" },
      { name: "Klippfisk cod whole", species: "Cod", form: "Salted dried", image: "/images/cod-loin.jpg" },
      { name: "Saithe salted dried", species: "Saithe", form: "Salted dried", image: "/offers/cod.webp" },
    ],
    website: "https://example-lofotenklipp.no",
  },
];
