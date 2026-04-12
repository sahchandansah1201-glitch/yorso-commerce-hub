export const mackerelProduct = {
  id: "mackerel-hgt-50-120",
  slug: "mackerel-hgt-50-plus",

  // Identity
  name: "Mackerel HGT, 50+, 1/20",
  h1: "Frozen Mackerel HGT 50+ — Wholesale Supply",
  species: "Pacific Chub Mackerel",
  latinName: "Scomber japonicus",
  shortSummary:
    "Headed, gutted & tail-off Pacific mackerel, individually frozen, packed 20 kg per master carton. Sourced from FAO 61, available year-round with consistent grading.",

  whyBuyersChoose:
    "HGT format is the most requested mackerel cut for retail repacking, HoReCa portioning, and further processing — balancing yield, shelf appeal, and ease of handling.",

  // Badges
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "HGT — Headed, Gutted & Tail-off", icon: "scissors" },
    { label: "China Origin", icon: "flag" },
    { label: "FAO 61 — NW Pacific", icon: "map" },
    { label: "Wild-Caught", icon: "anchor" },
  ],

  // Commercial
  commercial: {
    pricePerKg: "$1.45 – $1.70",
    currency: "USD",
    moq: "1 × 20′ FCL (~27 MT)",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "CFR / CIF",
    port: "Qingdao, China",
    stockStatus: "In stock — ready to load",
    priceNote:
      "Price varies by delivery basis (FOB / CFR / CIF), volume, glazing %, and current raw-material season. Request a quote for firm pricing.",
  },

  // Product overview
  overview: {
    paragraphs: [
      "Mackerel HGT (Headed, Gutted, Tail-off) is one of the most traded frozen pelagic formats globally. The 50+ gram size grading targets retail and food-service buyers who need consistent portion weight for repacking lines, ready-meal production, or whole-fish display.",
      "This product is individually quick-frozen (IQF), which allows partial thawing and flexible portioning. The 1/20 packing format (1 × 20 kg master carton) is the industry-standard configuration for container shipping and cold-chain warehousing.",
      "Typical end uses include: retail repacking under private label, HoReCa smoked or grilled mackerel preparations, canning and further processing, and institutional catering programs.",
    ],
  },

  // Specs
  specs: [
    { label: "Species", value: "Scomber japonicus (Pacific Chub Mackerel)" },
    { label: "Cut type", value: "HGT — Headed, Gutted & Tail-off" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Purse seine" },
    { label: "Freezing process", value: "IQF (Individually Quick Frozen)" },
    { label: "Glazing", value: "Net weight, glazing 10–20% by agreement" },
    { label: "Ingredients", value: "Mackerel (Scomber japonicus), water (glaze)" },
    { label: "Size range", value: "50 g+ per piece" },
    { label: "Origin", value: "China (processing), NW Pacific (catch)" },
    { label: "Packing", value: "20 kg / master carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 61 — Northwest Pacific" },
  ],

  // Logistics
  logistics: {
    incoterm: "CFR / CIF",
    incotermExplain:
      "CFR (Cost & Freight): supplier covers freight to your destination port. CIF adds insurance. FOB available on request — you arrange freight.",
    shipmentOrigin: "Qingdao, China",
    port: "Qingdao Port (CNQIN)",
    packaging: "20 kg master carton, palletized, 27 MT per 20′ FCL",
    storage: "Reefer container at −18 °C minimum",
    moqLogic:
      "Standard MOQ is 1 × 20′ FCL (~27 MT). Smaller trial orders may be negotiable — register to discuss with the supplier.",
    leadTime: "7–14 days from order confirmation (subject to stock)",
    exportDocs:
      "Health certificate, certificate of origin, packing list, commercial invoice, bill of lading. Phytosanitary or specific import permits arranged on request.",
  },

  // Supplier
  supplier: {
    name: "Qingdao Ocean Foods Co., Ltd.",
    country: "China",
    countryFlag: "🇨🇳",
    yearsInBusiness: 14,
    tradeReadiness: "Export-ready, experienced with EU / EFTA / MENA / Africa markets",
    verifiedFields: [
      "Business license verified",
      "Export license verified",
      "HACCP certification on file",
    ],
    unverifiedNote:
      "Production facility audit, BRC/IFS status, and individual product lab reports are not yet independently verified by YORSO. Register to request documentation directly from the supplier.",
    certifications: ["HACCP", "ISO 22000", "EU Approved (registered establishment)"],
    responseNote: "Typically responds within 24 hours on business days",
  },

  // Documents
  documents: {
    available: [
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Health Certificate (sample)", type: "compliance", gated: true },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "BRC / IFS Certificate", note: "Not provided — request from supplier" },
      { name: "Lab Test Report", note: "Not provided — request from supplier" },
      { name: "Traceability Document", note: "Available on request after registration" },
    ],
  },

  // Related
  related: [
    {
      id: "mackerel-wround-200",
      name: "Mackerel W/R 200-300g",
      species: "Scomber japonicus",
      origin: "China",
      price: "$1.10 – $1.30 / kg",
      format: "Frozen",
      image: "/offers/cod.webp",
      substituteReason: "Whole-round alternative — lower processing cost, higher yield for in-house cutting",
    },
    {
      id: "mackerel-fillet-iqf",
      name: "Mackerel Fillet IQF Skin-On",
      species: "Scomber japonicus",
      origin: "China",
      price: "$2.20 – $2.60 / kg",
      format: "Frozen",
      image: "/offers/cod.webp",
      substituteReason: "Ready-to-use fillet — saves processing, higher per-kg cost",
    },
    {
      id: "horse-mackerel-hgt",
      name: "Horse Mackerel HGT 6/8",
      species: "Trachurus trachurus",
      origin: "Mauritania",
      price: "$1.30 – $1.55 / kg",
      format: "Frozen",
      image: "/offers/cod.webp",
      substituteReason: "Species substitute — similar price tier, different taste profile for West African markets",
    },
  ],

  // SEO
  seo: {
    title: "Frozen Mackerel HGT 50+ Wholesale — Pacific Chub Mackerel | YORSO",
    description:
      "Buy frozen mackerel HGT (headed, gutted, tail-off) 50+ g from verified Chinese suppliers. Wholesale pricing, CFR/CIF terms, MOQ 1 FCL. Compare and request quotes on YORSO.",
  },

  // Image
  image: "/offers/cod.webp",
};
