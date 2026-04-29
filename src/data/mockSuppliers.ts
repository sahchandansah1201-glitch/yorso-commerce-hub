/**
 * Mock supplier directory for /suppliers (Phase 1, frontend-only).
 *
 * No backend, no real verification. The shape mirrors what a future API
 * is expected to return so the page can stay structurally stable when
 * real data lands.
 *
 * Access model is enforced in the UI layer, not here:
 *   anonymous_locked  → masked identity, no contact
 *   registered_locked → masked identity, shortlist + request access
 *   qualified_unlocked → full company name + contact
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
  yearsInBusiness: number;
  productFocus: SupplierProductFocus[];
  certifications: string[];
  activeOffersCount: number;
  /** Small inline previews for the row; remote URLs OK for prototype. */
  productPreviewImages: string[];
  shortDescription: string;
  responseSignal: ResponseSignal;
  documentReadiness: DocumentReadiness;
  verificationLevel: VerificationLevel;
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
    productFocus: [
      { species: "Atlantic Salmon", forms: "HOG, fillet, portions" },
      { species: "Trout", forms: "HOG, fillet" },
    ],
    certifications: ["ASC", "MSC", "BRC", "IFS"],
    activeOffersCount: 14,
    productPreviewImages: ["/offers/salmon.webp", "/images/salmon-fillet.jpg"],
    shortDescription:
      "Vertically integrated salmon farm and processing plant, weekly air shipments to EU and Asia.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "Cod", forms: "Twice-frozen fillet, portions" },
      { species: "Pollock", forms: "Fillet, blocks" },
      { species: "Tilapia", forms: "Fillet IQF" },
    ],
    certifications: ["BRC", "IFS", "HACCP", "BAP"],
    activeOffersCount: 28,
    productPreviewImages: ["/offers/cod.webp", "/images/cod-loin.jpg", "/offers/pangasius.webp"],
    shortDescription:
      "Reprocessing plant for Russian and Alaskan whitefish, MAP/IQF lines, EU and US export programs.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "Vannamei Shrimp", forms: "HOSO, HLSO, PD, cooked" },
    ],
    certifications: ["ASC", "BAP 4★", "HACCP"],
    activeOffersCount: 19,
    productPreviewImages: ["/offers/shrimp.webp", "/images/shrimp-vannamei.jpg"],
    shortDescription:
      "Farm-to-container shrimp exporter, container loading directly at the plant, weekly EU departures.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "Yellowfin Tuna", forms: "Loins, steaks, saku, CO-treated" },
      { species: "Skipjack", forms: "Whole round, loins" },
    ],
    certifications: ["MSC CoC", "HACCP", "EU Approved"],
    activeOffersCount: 8,
    productPreviewImages: ["/offers/tuna.webp", "/images/tuna-loin.jpg"],
    shortDescription:
      "Handline tuna sourced from Eastern Indonesia, fresh airfreight and ultra-low-temp frozen lines.",
    responseSignal: "normal",
    documentReadiness: "partial",
    verificationLevel: "basic",
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
    productFocus: [
      { species: "Pangasius", forms: "Fillet, untreated and treated" },
      { species: "Vannamei Shrimp", forms: "PD, PDTO, cooked" },
    ],
    certifications: ["ASC", "BRC", "IFS", "HALAL"],
    activeOffersCount: 22,
    productPreviewImages: ["/offers/pangasius.webp", "/images/pangasius.jpg", "/offers/shrimp.webp"],
    shortDescription:
      "Integrated farming and processing for pangasius and shrimp, EU and Middle East programs.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "Cod", forms: "Fresh fillet, IQF portions" },
      { species: "Haddock", forms: "Fresh fillet, frozen loins" },
      { species: "Saithe", forms: "Frozen blocks" },
    ],
    certifications: ["MSC", "Iceland Responsible Fisheries", "IFS"],
    activeOffersCount: 11,
    productPreviewImages: ["/offers/cod.webp", "/images/cod-loin.jpg"],
    shortDescription:
      "Day-boat catch with same-day processing, fresh airfreight to EU, frozen reefer to Asia.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "King Crab", forms: "Live, frozen sections, cooked legs" },
      { species: "Snow Crab", forms: "Frozen sections, clusters" },
      { species: "Pollock", forms: "H&G, fillet, surimi" },
    ],
    certifications: ["MSC (pollock)", "HACCP"],
    activeOffersCount: 7,
    productPreviewImages: ["/offers/crab.webp", "/images/king-crab.jpg", "/offers/cod.webp"],
    shortDescription:
      "Sea-frozen and shore-processed Pacific catch, reefer container shipments via Vladivostok and Busan.",
    responseSignal: "slow",
    documentReadiness: "on_request",
    verificationLevel: "basic",
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
    productFocus: [
      { species: "Atlantic Salmon", forms: "Fillet trim D, portions, IQF" },
      { species: "Coho Salmon", forms: "HOG, fillet" },
      { species: "Blue Mussels", forms: "Half-shell, meat IQF" },
    ],
    certifications: ["ASC", "BAP", "BRC"],
    activeOffersCount: 17,
    productPreviewImages: ["/offers/salmon.webp", "/images/salmon-fillet.jpg"],
    shortDescription:
      "Export consolidator for southern Chile producers, regular reefer programs to US, EU and Brazil.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "Octopus", forms: "Whole cleaned, T1–T8 grading" },
      { species: "Sardine", forms: "Whole round, frozen blocks" },
      { species: "Mackerel", forms: "Whole round" },
    ],
    certifications: ["HACCP", "EU Approved"],
    activeOffersCount: 6,
    productPreviewImages: ["/offers/squid.webp", "/images/squid-tube.jpg"],
    shortDescription:
      "Atlantic small pelagics and cephalopods, container shipments to Mediterranean and Asian markets.",
    responseSignal: "normal",
    documentReadiness: "partial",
    verificationLevel: "basic",
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
    productFocus: [
      { species: "Squid (Loligo, Illex)", forms: "Tubes, rings, whole cleaned" },
      { species: "Hake", forms: "HGT, fillet" },
      { species: "Octopus", forms: "Whole, cooked legs" },
    ],
    certifications: ["IFS", "BRC", "MSC CoC"],
    activeOffersCount: 20,
    productPreviewImages: ["/offers/squid.webp", "/images/squid-tube.jpg"],
    shortDescription:
      "Vigo-based importer/distributor with cold storage and re-packing, supplies HoReCa and retail in Iberia.",
    responseSignal: "fast",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
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
    productFocus: [
      { species: "Mixed whitefish", forms: "Cod, pollock, hake — blocks and fillets" },
      { species: "Squid", forms: "Tubes, rings" },
    ],
    certifications: ["HACCP"],
    activeOffersCount: 31,
    productPreviewImages: ["/offers/cod.webp", "/offers/squid.webp", "/images/cod-loin.jpg"],
    shortDescription:
      "Trading desk consolidating multiple Dalian-area reprocessors, flexible MOQ and mixed-container loads.",
    responseSignal: "normal",
    documentReadiness: "on_request",
    verificationLevel: "unverified",
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
    productFocus: [
      { species: "Cod (saltfish/klippfisk)", forms: "Salted, dried, portions" },
      { species: "Saithe", forms: "Salted, dried" },
    ],
    certifications: ["MSC", "IFS"],
    activeOffersCount: 5,
    productPreviewImages: ["/offers/cod.webp", "/images/cod-loin.jpg"],
    shortDescription:
      "Traditional Lofoten klippfisk producer, programs for Portugal, Brazil and West Africa.",
    responseSignal: "normal",
    documentReadiness: "ready",
    verificationLevel: "documents_reviewed",
  },
];
