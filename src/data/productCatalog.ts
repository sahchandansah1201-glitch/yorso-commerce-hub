import { mackerelProduct } from "./mackerelProduct";

export interface ProductData {
  id: string;
  slug: string;
  name: string;
  h1: string;
  species: string;
  latinName: string;
  shortSummary: string;
  whyBuyersChoose: string;
  badges: { label: string; icon: string }[];
  commercial: {
    pricePerKg: string;
    currency: string;
    moq: string;
    paymentTerms: string;
    incoterm: string;
    port: string;
    stockStatus: string;
    priceNote: string;
  };
  overview: { paragraphs: string[] };
  specs: { label: string; value: string }[];
  logistics: {
    incoterm: string;
    incotermExplain: string;
    shipmentOrigin: string;
    port: string;
    packaging: string;
    storage: string;
    moqLogic: string;
    leadTime: string;
    exportDocs: string;
  };
  supplier: {
    name: string;
    country: string;
    countryFlag: string;
    yearsInBusiness: number;
    tradeReadiness: string;
    verifiedFields: string[];
    unverifiedNote: string;
    certifications: string[];
    responseNote: string;
  };
  documents: {
    available: { name: string; type: string; gated: boolean }[];
    missing: { name: string; note: string }[];
  };
  related: {
    id: string;
    name: string;
    species: string;
    origin: string;
    price: string;
    format: string;
    image: string;
    substituteReason: string;
  }[];
  seo: { title: string; description: string };
  image: string;
}

const salmonProduct: ProductData = {
  id: "1",
  slug: "atlantic-salmon-fillet",
  name: "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade",
  h1: "Frozen Atlantic Salmon Fillet — Premium Wholesale Supply",
  species: "Atlantic Salmon",
  latinName: "Salmo salar",
  shortSummary: "Skin-on, pin bone out premium grade Atlantic salmon fillets from Norwegian aquaculture. Individually vacuum-packed, consistent grading for retail and HoReCa channels.",
  whyBuyersChoose: "Premium grade skin-on fillets are the most versatile salmon format — suitable for retail portioning, sushi-grade presentation, and food-service plating with minimal processing.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "Fillet — Skin-On PBO", icon: "scissors" },
    { label: "Norway Origin", icon: "flag" },
    { label: "FAO 27 — NE Atlantic", icon: "map" },
    { label: "Farmed — ASC", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$8.50 – $9.20",
    currency: "USD",
    moq: "1,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "CIF / DAP",
    port: "Ålesund, Norway",
    stockStatus: "In stock — ready to ship",
    priceNote: "Price varies by fillet size, trim level, season, and delivery basis. Request a quote for firm pricing.",
  },
  overview: {
    paragraphs: [
      "Atlantic Salmon (Salmo salar) fillet skin-on pin bone out is the benchmark format for premium salmon trade. Norwegian origin ensures consistent quality, color, and fat content backed by strict aquaculture standards.",
      "This product is individually vacuum-packed (IVP), enabling flexible portioning and extended shelf life. The 10 kg carton format is standard for cold-chain distribution across EU, Asia, and North American markets.",
      "Typical end uses: retail skin-pack portioning, sushi and sashimi preparation, HoReCa plating, smoked salmon production, and premium ready-meal manufacturing.",
    ],
  },
  specs: [
    { label: "Species", value: "Salmo salar (Atlantic Salmon)" },
    { label: "Cut type", value: "Fillet — Skin-On, Pin Bone Out" },
    { label: "Production type", value: "Farmed (aquaculture)" },
    { label: "Farming method", value: "Sea cage, ASC certified" },
    { label: "Freezing process", value: "IQF / IVP (Individually Vacuum Packed)" },
    { label: "Glazing", value: "Minimal glaze, net weight basis" },
    { label: "Ingredients", value: "Atlantic Salmon (Salmo salar)" },
    { label: "Size range", value: "1.0 – 2.5 kg per fillet (graded)" },
    { label: "Origin", value: "Norway" },
    { label: "Packing", value: "10 kg carton, IVP" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 27 — Northeast Atlantic" },
  ],
  logistics: {
    incoterm: "CIF / DAP",
    incotermExplain: "CIF: supplier covers cost, insurance, and freight to your port. DAP: delivered to your warehouse, duties unpaid.",
    shipmentOrigin: "Ålesund, Norway",
    port: "Ålesund Port",
    packaging: "10 kg carton, IVP, palletized, ~20 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ is 1,000 kg. Full container loads preferred for best pricing.",
    leadTime: "5–10 days from order confirmation",
    exportDocs: "Health certificate, EUR.1, packing list, commercial invoice, bill of lading.",
  },
  supplier: {
    name: "Nordic Seafood AS",
    country: "Norway",
    countryFlag: "🇳🇴",
    yearsInBusiness: 22,
    tradeReadiness: "Export-ready, experienced with EU / Asia / North America markets",
    verifiedFields: ["Business license verified", "Export license verified", "ASC certification on file", "HACCP certification on file"],
    unverifiedNote: "Individual batch lab reports and specific production facility audits are not yet independently verified by YORSO.",
    certifications: ["HACCP", "ASC", "BRC Grade A", "GlobalG.A.P."],
    responseNote: "Typically responds within 12 hours",
  },
  documents: {
    available: [
      { name: "ASC Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "BRC Audit Report", note: "Available on request after registration" },
      { name: "Batch Lab Test Report", note: "Not provided — request from supplier" },
    ],
  },
  related: [
    { id: "mackerel-hgt-50-120", name: "Mackerel HGT 50+", species: "Scomber japonicus", origin: "China", price: "$1.45 – $1.70 / kg", format: "Frozen", image: "/offers/cod.webp", substituteReason: "Budget pelagic alternative for different market segments" },
    { id: "9", name: "Sea Bass Fillet Skin-On", species: "Dicentrarchus labrax", origin: "Turkey", price: "$9.00 – $10.20 / kg", format: "Fresh", image: "/offers/salmon.webp", substituteReason: "Premium white fish fillet — complements salmon in mixed sourcing" },
  ],
  seo: {
    title: "Atlantic Salmon Fillet Wholesale — Premium Norwegian Salmon | YORSO",
    description: "Buy premium Atlantic salmon fillet skin-on PBO from verified Norwegian suppliers. ASC certified, wholesale pricing, CIF/DAP terms. Compare and request quotes on YORSO.",
  },
  image: "/offers/salmon.webp",
};

const shrimpProduct: ProductData = {
  id: "2",
  slug: "vannamei-shrimp-hoso",
  name: "Vannamei Shrimp HOSO",
  h1: "Frozen Vannamei Shrimp HOSO — Wholesale Supply from Ecuador",
  species: "White Shrimp",
  latinName: "Litopenaeus vannamei",
  shortSummary: "Head-on, shell-on vannamei shrimp from Ecuadorian aquaculture. IQF frozen, graded by count, packed in 20 kg master cartons for bulk distribution.",
  whyBuyersChoose: "HOSO format retains maximum flavor and presentation value — preferred for retail display, Asian food-service, and markets where whole-shrimp appearance drives purchase decisions.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "HOSO — Head-On Shell-On", icon: "scissors" },
    { label: "Ecuador Origin", icon: "flag" },
    { label: "Farmed — BAP", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$5.80 – $6.40",
    currency: "USD",
    moq: "5,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "CFR / FOB",
    port: "Guayaquil, Ecuador",
    stockStatus: "In stock — ready to load",
    priceNote: "Price varies by count size (U10, U15, 16/20, 21/25, etc.), glazing %, and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Vannamei Shrimp HOSO (Head-On Shell-On) is one of the highest-volume traded shrimp formats globally. Ecuador is the world's largest shrimp exporter, known for consistent sizing, clean aquaculture practices, and reliable year-round supply.",
      "IQF freezing ensures individual piece separation for flexible portioning and retail repacking. The 20 kg master carton is the industry standard for container-load shipments.",
      "Typical end uses: retail whole-shrimp display, HoReCa grilled/steamed preparations, Asian cuisine, boil-in-bag consumer products, and further processing (peeling, breading).",
    ],
  },
  specs: [
    { label: "Species", value: "Litopenaeus vannamei (White Shrimp)" },
    { label: "Cut type", value: "HOSO — Head-On, Shell-On" },
    { label: "Production type", value: "Farmed (aquaculture)" },
    { label: "Farming method", value: "Pond culture, BAP certified" },
    { label: "Freezing process", value: "IQF (Individually Quick Frozen)" },
    { label: "Glazing", value: "Net weight, glazing 10–15%" },
    { label: "Ingredients", value: "Vannamei Shrimp (Litopenaeus vannamei), water (glaze)" },
    { label: "Size range", value: "Various counts: U10 to 71/90" },
    { label: "Origin", value: "Ecuador" },
    { label: "Packing", value: "20 kg master carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "N/A — Aquaculture" },
  ],
  logistics: {
    incoterm: "CFR / FOB",
    incotermExplain: "CFR: supplier covers freight to your port. FOB: you arrange freight from Guayaquil.",
    shipmentOrigin: "Guayaquil, Ecuador",
    port: "Port of Guayaquil",
    packaging: "20 kg master carton, palletized, ~25 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ is 5,000 kg (1/4 container). Full FCL preferred for best pricing.",
    leadTime: "10–21 days from order confirmation",
    exportDocs: "Health certificate, certificate of origin, packing list, commercial invoice, bill of lading, BAP CoC.",
  },
  supplier: {
    name: "Pacífico Export S.A.",
    country: "Ecuador",
    countryFlag: "🇪🇨",
    yearsInBusiness: 18,
    tradeReadiness: "Export-ready, experienced with EU / US / Asia / MENA markets",
    verifiedFields: ["Business license verified", "Export license verified", "BAP certification on file", "HACCP certification on file"],
    unverifiedNote: "Farm-level audits and antibiotic test reports are not independently verified by YORSO.",
    certifications: ["HACCP", "BAP 4-star", "EU Approved"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "BAP Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Antibiotic Test Report", note: "Available on request after registration" },
      { name: "Traceability Document", note: "Not provided — request from supplier" },
    ],
  },
  related: [
    { id: "12", name: "Black Tiger Shrimp HLSO", species: "Penaeus monodon", origin: "Bangladesh", price: "$7.20 – $8.10 / kg", format: "Frozen", image: "/offers/shrimp.webp", substituteReason: "Premium species alternative — larger size, different flavor profile" },
    { id: "1", name: "Atlantic Salmon Fillet", species: "Salmo salar", origin: "Norway", price: "$8.50 – $9.20 / kg", format: "Frozen", image: "/offers/salmon.webp", substituteReason: "Cross-category premium protein for diversified sourcing" },
  ],
  seo: {
    title: "Vannamei Shrimp HOSO Wholesale — Ecuador White Shrimp | YORSO",
    description: "Buy frozen vannamei shrimp HOSO from verified Ecuadorian suppliers. BAP certified, wholesale pricing, CFR/FOB terms. Compare and request quotes on YORSO.",
  },
  image: "/offers/shrimp.webp",
};

const codProduct: ProductData = {
  id: "3",
  slug: "cod-loin-skinless-boneless",
  name: "Cod Loin Skinless Boneless Center Cut Premium Selection",
  h1: "Fresh Cod Loin Skinless Boneless — Premium Wholesale",
  species: "Atlantic Cod",
  latinName: "Gadus morhua",
  shortSummary: "Center-cut skinless boneless cod loins from Icelandic wild fisheries. Fresh, never frozen, packed in 5 kg styrofoam boxes for premium retail and HoReCa distribution.",
  whyBuyersChoose: "Center-cut loins offer the highest yield portion with zero waste — the premium format for white tablecloth restaurants, airline catering, and high-end retail counters.",
  badges: [
    { label: "Fresh", icon: "snowflake" },
    { label: "Loin — Skinless Boneless", icon: "scissors" },
    { label: "Iceland Origin", icon: "flag" },
    { label: "FAO 27 — NE Atlantic", icon: "map" },
    { label: "Wild-Caught — MSC", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$11.00 – $12.50",
    currency: "USD",
    moq: "2,000 kg",
    paymentTerms: "T/T advance, L/C",
    incoterm: "FCA / DAP",
    port: "Reykjavík, Iceland",
    stockStatus: "In stock — seasonal availability",
    priceNote: "Price varies by loin weight grading, season (peak Oct–Mar), and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Atlantic Cod loin is the premium cut from one of the world's most valued whitefish species. Icelandic cod is renowned for its firm texture, clean white flesh, and sustainable MSC-certified fisheries.",
      "Skinless boneless center-cut format eliminates all processing on the buyer's end — ready for direct portioning or plating. The 5 kg styrofoam format maintains freshness for 7–10 days from production.",
      "Typical end uses: fine-dining fish courses, premium retail counter display, airline and cruise catering, ready-meal manufacturing requiring consistent portion weight.",
    ],
  },
  specs: [
    { label: "Species", value: "Gadus morhua (Atlantic Cod)" },
    { label: "Cut type", value: "Loin — Skinless, Boneless, Center Cut" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Longline / Trawl" },
    { label: "Processing", value: "Fresh, never frozen" },
    { label: "Glazing", value: "N/A — fresh product" },
    { label: "Ingredients", value: "Atlantic Cod (Gadus morhua)" },
    { label: "Size range", value: "200 – 500 g per loin (graded)" },
    { label: "Origin", value: "Iceland" },
    { label: "Packing", value: "5 kg styrofoam box, ice-packed" },
    { label: "Storage", value: "0–2 °C, shelf life 7–10 days" },
    { label: "Fishing area", value: "FAO 27 — Northeast Atlantic" },
  ],
  logistics: {
    incoterm: "FCA / DAP",
    incotermExplain: "FCA: goods delivered to carrier at origin. DAP: delivered to your address, duties unpaid. Air freight typical for fresh product.",
    shipmentOrigin: "Reykjavík, Iceland",
    port: "Keflavík International Airport / Reykjavík Port",
    packaging: "5 kg styrofoam box, ice-packed, air freight palletized",
    storage: "Chilled 0–2 °C, cold chain integrity critical",
    moqLogic: "Standard MOQ 2,000 kg. Smaller orders possible via air freight at premium rates.",
    leadTime: "2–5 days from catch to delivery (air freight)",
    exportDocs: "Health certificate, MSC CoC, packing list, commercial invoice, air waybill.",
  },
  supplier: {
    name: "Ísland Fish ehf",
    country: "Iceland",
    countryFlag: "🇮🇸",
    yearsInBusiness: 30,
    tradeReadiness: "Export-ready, experienced with EU / UK / US / Japan markets",
    verifiedFields: ["Business license verified", "Export license verified", "MSC Chain of Custody on file", "HACCP certification on file"],
    unverifiedNote: "Specific vessel-level catch data and individual batch analyses are not independently verified by YORSO.",
    certifications: ["HACCP", "MSC", "BRC", "IFS"],
    responseNote: "Typically responds within 12 hours",
  },
  documents: {
    available: [
      { name: "MSC Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "BRC Audit Report", note: "Available on request after registration" },
      { name: "Catch Certificate", note: "Provided per shipment — request from supplier" },
    ],
  },
  related: [
    { id: "8", name: "Pangasius Fillet Well-Trimmed", species: "Pangasianodon hypophthalmus", origin: "Vietnam", price: "$2.40 – $2.90 / kg", format: "Frozen", image: "/offers/pangasius.webp", substituteReason: "Budget whitefish alternative for price-sensitive markets" },
    { id: "9", name: "Sea Bass Fillet Skin-On", species: "Dicentrarchus labrax", origin: "Turkey", price: "$9.00 – $10.20 / kg", format: "Fresh", image: "/offers/salmon.webp", substituteReason: "Premium fresh fillet alternative with Mediterranean sourcing" },
  ],
  seo: {
    title: "Fresh Cod Loin Wholesale — Icelandic Atlantic Cod | YORSO",
    description: "Buy premium fresh cod loin skinless boneless from verified Icelandic suppliers. MSC certified, wholesale pricing, FCA/DAP terms. Request quotes on YORSO.",
  },
  image: "/offers/cod.webp",
};

const tunaProduct: ProductData = {
  id: "4",
  slug: "yellowfin-tuna-loin",
  name: "Yellowfin Tuna Loin Grade A",
  h1: "Chilled Yellowfin Tuna Loin Grade A — Wholesale Supply",
  species: "Yellowfin Tuna",
  latinName: "Thunnus albacares",
  shortSummary: "Grade A yellowfin tuna loins from Philippine handline fisheries. Chilled, CO-treated or natural, vacuum-packed for sashimi-grade retail and HoReCa distribution.",
  whyBuyersChoose: "Grade A loins are the standard for sashimi, poke, and premium raw-fish applications — offering the color consistency and texture that high-end buyers demand.",
  badges: [
    { label: "Chilled", icon: "snowflake" },
    { label: "Loin — Grade A", icon: "scissors" },
    { label: "Philippines Origin", icon: "flag" },
    { label: "FAO 71 — W Pacific", icon: "map" },
    { label: "Wild-Caught", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$9.50 – $11.00",
    currency: "USD",
    moq: "500 kg",
    paymentTerms: "T/T advance",
    incoterm: "FOB / CFR",
    port: "General Santos, Philippines",
    stockStatus: "Available — subject to catch",
    priceNote: "Price varies by grade (A/B), loin weight, CO-treatment, season, and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Yellowfin Tuna (Thunnus albacares) loin is a premium sashimi-grade product traded globally. General Santos City in the Philippines is one of the world's key tuna landing ports, known for handline-caught quality.",
      "Grade A loins are selected for color, fat content, and texture consistency. Vacuum-packing ensures freshness for air freight distribution to sashimi markets worldwide.",
      "Typical end uses: sashimi and sushi restaurants, poke bowl chains, premium retail fish counters, tuna tartare preparations, and high-end catering.",
    ],
  },
  specs: [
    { label: "Species", value: "Thunnus albacares (Yellowfin Tuna)" },
    { label: "Cut type", value: "Loin — Grade A" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Handline" },
    { label: "Processing", value: "Chilled, vacuum-packed" },
    { label: "Treatment", value: "CO-treated or natural (specify on order)" },
    { label: "Ingredients", value: "Yellowfin Tuna (Thunnus albacares)" },
    { label: "Size range", value: "2 – 8 kg per loin" },
    { label: "Origin", value: "Philippines (General Santos)" },
    { label: "Packing", value: "10 kg vacuum pack" },
    { label: "Storage", value: "0–2 °C, shelf life 14–21 days (vacuum)" },
    { label: "Fishing area", value: "FAO 71 — Western Central Pacific" },
  ],
  logistics: {
    incoterm: "FOB / CFR",
    incotermExplain: "FOB: you arrange freight from General Santos. CFR: supplier covers freight to your port.",
    shipmentOrigin: "General Santos, Philippines",
    port: "General Santos International Airport / Makar Wharf",
    packaging: "10 kg vacuum pack, air freight palletized",
    storage: "Chilled 0–2 °C, cold chain critical",
    moqLogic: "MOQ 500 kg. Flexible for air freight shipments.",
    leadTime: "3–7 days from catch to delivery (air freight)",
    exportDocs: "Health certificate, catch certificate, packing list, commercial invoice, air waybill.",
  },
  supplier: {
    name: "Gen. Santos Tuna Corp.",
    country: "Philippines",
    countryFlag: "🇵🇭",
    yearsInBusiness: 12,
    tradeReadiness: "Export-ready, experienced with Japan / US / EU markets",
    verifiedFields: ["Business license verified", "Export license verified", "HACCP certification on file"],
    unverifiedNote: "Vessel registration, individual catch documentation, and mercury testing reports are not independently verified by YORSO.",
    certifications: ["HACCP"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Catch Certificate (EU IUU)", note: "Provided per shipment" },
      { name: "Mercury Test Report", note: "Available on request" },
      { name: "Histamine Test Report", note: "Available on request" },
    ],
  },
  related: [
    { id: "1", name: "Atlantic Salmon Fillet", species: "Salmo salar", origin: "Norway", price: "$8.50 – $9.20 / kg", format: "Frozen", image: "/offers/salmon.webp", substituteReason: "Premium alternative for sushi/sashimi diversification" },
    { id: "3", name: "Cod Loin Skinless Boneless", species: "Gadus morhua", origin: "Iceland", price: "$11.00 – $12.50 / kg", format: "Fresh", image: "/offers/cod.webp", substituteReason: "Premium whitefish for mixed high-end sourcing" },
  ],
  seo: {
    title: "Yellowfin Tuna Loin Grade A Wholesale — Sashimi Grade | YORSO",
    description: "Buy chilled yellowfin tuna loin Grade A from Philippine handline fisheries. Sashimi grade, wholesale pricing, FOB/CFR terms. Request quotes on YORSO.",
  },
  image: "/offers/tuna.webp",
};

const crabProduct: ProductData = {
  id: "5",
  slug: "king-crab-clusters",
  name: "King Crab Clusters",
  h1: "Frozen King Crab Clusters — Premium Wholesale Supply",
  species: "Red King Crab",
  latinName: "Paralithodes camtschaticus",
  shortSummary: "Wild-caught Red King Crab clusters from Russian Far East fisheries. Cooked and frozen at sea, graded by size, packed in 10 kg cartons.",
  whyBuyersChoose: "King crab clusters are the highest-value crustacean format — commanding premium retail prices and driving destination dining traffic in HoReCa settings.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "Clusters — Cooked", icon: "scissors" },
    { label: "Russia Origin", icon: "flag" },
    { label: "FAO 61 — NW Pacific", icon: "map" },
    { label: "Wild-Caught — MSC", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$28.00 – $32.00",
    currency: "USD",
    moq: "200 kg",
    paymentTerms: "T/T advance, L/C",
    incoterm: "CIF / DAP",
    port: "Vladivostok, Russia",
    stockStatus: "In stock — seasonal",
    priceNote: "Price varies by cluster size (L/XL/2XL), season, and sanctions compliance requirements by destination.",
  },
  overview: {
    paragraphs: [
      "Red King Crab (Paralithodes camtschaticus) is the most prized crab species globally. Russian Far East fisheries produce MSC-certified clusters that are cooked and blast-frozen on factory vessels within hours of catch.",
      "Cluster format preserves the natural leg presentation — ready for direct retail display or restaurant tableside service with minimal preparation.",
      "Typical end uses: premium retail seafood counters, fine-dining crab legs, casino and cruise buffets, Japanese and Korean specialty restaurants.",
    ],
  },
  specs: [
    { label: "Species", value: "Paralithodes camtschaticus (Red King Crab)" },
    { label: "Cut type", value: "Clusters — Cooked, Split" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Pot / Trap" },
    { label: "Freezing process", value: "Blast frozen at sea" },
    { label: "Glazing", value: "Light glaze, net weight basis" },
    { label: "Ingredients", value: "King Crab (Paralithodes camtschaticus), salt, water" },
    { label: "Size range", value: "L: 0.7–1.0 kg, XL: 1.0–1.5 kg, 2XL: 1.5+ kg per cluster" },
    { label: "Origin", value: "Russia (Kamchatka / Sea of Okhotsk)" },
    { label: "Packing", value: "10 kg carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 61 — Northwest Pacific" },
  ],
  logistics: {
    incoterm: "CIF / DAP",
    incotermExplain: "CIF: cost, insurance, and freight to your port. DAP: delivered to destination. Note: sanctions compliance may affect routing.",
    shipmentOrigin: "Vladivostok, Russia",
    port: "Port of Vladivostok",
    packaging: "10 kg carton, palletized",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "MOQ 200 kg. Flexible for air and sea freight.",
    leadTime: "14–28 days sea freight, 5–7 days air freight",
    exportDocs: "Health certificate, catch certificate, MSC CoC, packing list, commercial invoice, bill of lading.",
  },
  supplier: {
    name: "Kamchatka Seafood LLC",
    country: "Russia",
    countryFlag: "🇷🇺",
    yearsInBusiness: 16,
    tradeReadiness: "Export-ready, experienced with Asia / US / MENA markets",
    verifiedFields: ["Business license verified", "Export license verified", "MSC certification on file", "HACCP certification on file"],
    unverifiedNote: "Sanctions compliance status varies by destination country. YORSO does not verify regulatory compliance for specific import jurisdictions.",
    certifications: ["HACCP", "MSC", "GOST"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "MSC Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
    ],
    missing: [
      { name: "Product Specification Sheet", note: "Available on request after registration" },
      { name: "Catch Certificate", note: "Provided per shipment" },
      { name: "Sanctions Compliance Note", note: "Discuss with supplier" },
    ],
  },
  related: [
    { id: "10", name: "Octopus Whole Cleaned T4", species: "Octopus vulgaris", origin: "Morocco", price: "$6.50 – $7.40 / kg", format: "Frozen", image: "/offers/squid.webp", substituteReason: "Premium shellfish alternative at lower price point" },
    { id: "2", name: "Vannamei Shrimp HOSO", species: "Litopenaeus vannamei", origin: "Ecuador", price: "$5.80 – $6.40 / kg", format: "Frozen", image: "/offers/shrimp.webp", substituteReason: "High-volume crustacean for broader market appeal" },
  ],
  seo: {
    title: "King Crab Clusters Wholesale — Russian Red King Crab | YORSO",
    description: "Buy frozen king crab clusters from verified Russian suppliers. MSC certified, wholesale pricing, CIF/DAP terms. Compare and request quotes on YORSO.",
  },
  image: "/offers/crab.webp",
};

const squidProduct: ProductData = {
  id: "6",
  slug: "squid-tube-tentacle",
  name: "Squid Tube & Tentacle",
  h1: "Frozen Squid Tube & Tentacle — Wholesale Supply",
  species: "Illex Squid",
  latinName: "Illex argentinus",
  shortSummary: "Cleaned squid tubes and tentacles from Argentine wild fisheries. Block-frozen, packed in 20 kg blocks, ideal for high-volume processing and food-service distribution.",
  whyBuyersChoose: "Tube & tentacle is the most versatile squid format — suitable for calamari rings, stuffed squid, stir-fry, and further processing with minimal additional preparation.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "Tube & Tentacle", icon: "scissors" },
    { label: "Argentina Origin", icon: "flag" },
    { label: "FAO 41 — SW Atlantic", icon: "map" },
    { label: "Wild-Caught", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$3.20 – $3.80",
    currency: "USD",
    moq: "10,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "FOB / CFR",
    port: "Mar del Plata, Argentina",
    stockStatus: "In stock — ready to load",
    priceNote: "Price varies by tube size, season (peak Feb–Jun), and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Illex Squid (Illex argentinus) is one of the world's most commercially important squid species. Argentine fisheries produce large volumes of cleaned tube & tentacle product for global markets.",
      "Block-frozen format is optimized for container shipping and cold-storage warehousing. Tubes are cleaned, skinned, and graded by size for consistent processing performance.",
      "Typical end uses: calamari ring production, stuffed squid preparations, stir-fry ingredients, canned squid, surimi manufacturing, and institutional catering.",
    ],
  },
  specs: [
    { label: "Species", value: "Illex argentinus (Argentine Shortfin Squid)" },
    { label: "Cut type", value: "Tube & Tentacle — Cleaned, Skinned" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Jigging" },
    { label: "Freezing process", value: "Block frozen" },
    { label: "Glazing", value: "N/A — block frozen" },
    { label: "Ingredients", value: "Squid (Illex argentinus)" },
    { label: "Size range", value: "10–20 cm tube length (graded)" },
    { label: "Origin", value: "Argentina" },
    { label: "Packing", value: "20 kg block" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 41 — Southwest Atlantic" },
  ],
  logistics: {
    incoterm: "FOB / CFR",
    incotermExplain: "FOB: you arrange freight from Mar del Plata. CFR: supplier covers freight to your port.",
    shipmentOrigin: "Mar del Plata, Argentina",
    port: "Port of Mar del Plata",
    packaging: "20 kg block, palletized, ~25 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ is 10,000 kg (approx. half FCL). Full container loads preferred.",
    leadTime: "14–21 days from order confirmation",
    exportDocs: "Health certificate, catch certificate, packing list, commercial invoice, bill of lading.",
  },
  supplier: {
    name: "Mar del Plata Pesca",
    country: "Argentina",
    countryFlag: "🇦🇷",
    yearsInBusiness: 25,
    tradeReadiness: "Export-ready, experienced with EU / Asia / Africa markets",
    verifiedFields: ["Business license verified", "Export license verified", "HACCP certification on file"],
    unverifiedNote: "Vessel-level catch documentation and specific sustainability assessments are not independently verified by YORSO.",
    certifications: ["HACCP"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Catch Certificate", note: "Provided per shipment" },
      { name: "Lab Test Report", note: "Available on request" },
    ],
  },
  related: [
    { id: "10", name: "Octopus Whole Cleaned T4", species: "Octopus vulgaris", origin: "Morocco", price: "$6.50 – $7.40 / kg", format: "Frozen", image: "/offers/squid.webp", substituteReason: "Premium cephalopod alternative for Mediterranean markets" },
    { id: "2", name: "Vannamei Shrimp HOSO", species: "Litopenaeus vannamei", origin: "Ecuador", price: "$5.80 – $6.40 / kg", format: "Frozen", image: "/offers/shrimp.webp", substituteReason: "Cross-category seafood for mixed sourcing orders" },
  ],
  seo: {
    title: "Squid Tube & Tentacle Wholesale — Argentine Illex Squid | YORSO",
    description: "Buy frozen squid tube & tentacle from verified Argentine suppliers. Wholesale pricing, FOB/CFR terms, MOQ 10 MT. Compare and request quotes on YORSO.",
  },
  image: "/offers/squid.webp",
};

const mahiProduct: ProductData = {
  id: "7",
  slug: "mahi-mahi-portion",
  name: "Mahi Mahi Portion 6oz",
  h1: "Frozen Mahi Mahi Portion 6oz — Wholesale Supply",
  species: "Dolphinfish",
  latinName: "Coryphaena hippurus",
  shortSummary: "IQF mahi mahi portions, 6 oz (170g), skinless boneless, from Peruvian wild fisheries. Packed in 10 kg cartons for food-service and retail portioning.",
  whyBuyersChoose: "Pre-portioned 6oz format eliminates cutting waste and ensures consistent plating — the go-to for food-service chains, airline catering, and retail value-added packs.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "Portion — 6oz Skinless", icon: "scissors" },
    { label: "Peru Origin", icon: "flag" },
    { label: "FAO 87 — SE Pacific", icon: "map" },
    { label: "Wild-Caught", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$7.00 – $7.80",
    currency: "USD",
    moq: "3,000 kg",
    paymentTerms: "T/T, L/C",
    incoterm: "FOB / CFR",
    port: "Paita, Peru",
    stockStatus: "In stock — ready to load",
    priceNote: "Price varies by portion weight tolerance, glazing %, and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Mahi Mahi (Coryphaena hippurus), also known as dolphinfish, is a popular tropical species valued for its firm white flesh, mild flavor, and versatility in cooking.",
      "The 6oz (170g) pre-portioned format is IQF frozen, enabling case-ready distribution to food-service and retail with zero cutting or portioning required.",
      "Typical end uses: restaurant grilled/blackened mahi, fish tacos, airline and cruise catering, retail value-added packs, and institutional food-service programs.",
    ],
  },
  specs: [
    { label: "Species", value: "Coryphaena hippurus (Dolphinfish / Mahi Mahi)" },
    { label: "Cut type", value: "Portion — 6oz (170g), Skinless, Boneless" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Longline" },
    { label: "Freezing process", value: "IQF" },
    { label: "Glazing", value: "Net weight, glazing 5–10%" },
    { label: "Ingredients", value: "Mahi Mahi (Coryphaena hippurus), water (glaze)" },
    { label: "Size range", value: "6 oz ± 5% per portion" },
    { label: "Origin", value: "Peru" },
    { label: "Packing", value: "10 kg IQF carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 87 — Southeast Pacific" },
  ],
  logistics: {
    incoterm: "FOB / CFR",
    incotermExplain: "FOB: you arrange freight from Paita. CFR: supplier covers freight to your destination port.",
    shipmentOrigin: "Paita, Peru",
    port: "Port of Paita",
    packaging: "10 kg IQF carton, palletized, ~25 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ 3,000 kg. Full container loads for best pricing.",
    leadTime: "10–14 days from order confirmation",
    exportDocs: "Health certificate, catch certificate, packing list, commercial invoice, bill of lading.",
  },
  supplier: {
    name: "Pesquera del Pacífico",
    country: "Peru",
    countryFlag: "🇵🇪",
    yearsInBusiness: 15,
    tradeReadiness: "Export-ready, experienced with US / EU / Asia markets",
    verifiedFields: ["Business license verified", "Export license verified", "HACCP certification on file"],
    unverifiedNote: "BAP certification status and individual vessel documentation are not independently verified by YORSO.",
    certifications: ["HACCP", "BAP"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "BAP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Catch Certificate", note: "Provided per shipment" },
      { name: "Mercury Test Report", note: "Available on request" },
    ],
  },
  related: [
    { id: "3", name: "Cod Loin Skinless Boneless", species: "Gadus morhua", origin: "Iceland", price: "$11.00 – $12.50 / kg", format: "Fresh", image: "/offers/cod.webp", substituteReason: "Premium whitefish alternative for higher-end markets" },
    { id: "8", name: "Pangasius Fillet Well-Trimmed", species: "Pangasianodon hypophthalmus", origin: "Vietnam", price: "$2.40 – $2.90 / kg", format: "Frozen", image: "/offers/pangasius.webp", substituteReason: "Budget whitefish option for price-driven channels" },
  ],
  seo: {
    title: "Mahi Mahi Portion 6oz Wholesale — Frozen Dolphinfish | YORSO",
    description: "Buy frozen mahi mahi 6oz portions from verified Peruvian suppliers. IQF, wholesale pricing, FOB/CFR terms. Compare and request quotes on YORSO.",
  },
  image: "/offers/mahi.webp",
};

const pangasiusProduct: ProductData = {
  id: "8",
  slug: "pangasius-fillet",
  name: "Pangasius Fillet Well-Trimmed",
  h1: "Frozen Pangasius Fillet Well-Trimmed — Wholesale Supply",
  species: "Pangasius",
  latinName: "Pangasianodon hypophthalmus",
  shortSummary: "Well-trimmed pangasius fillets from Vietnamese aquaculture. IVP frozen, white to light pink color, packed in 10 kg cartons for mass retail and food-service distribution.",
  whyBuyersChoose: "The most cost-effective whitefish fillet on the global market — well-trimmed format ensures consistent appearance and yield for private-label retail and institutional catering.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "Fillet — Well-Trimmed", icon: "scissors" },
    { label: "Vietnam Origin", icon: "flag" },
    { label: "Farmed — ASC", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$2.40 – $2.90",
    currency: "USD",
    moq: "20,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "CFR / CIF",
    port: "Ho Chi Minh City, Vietnam",
    stockStatus: "In stock — continuous production",
    priceNote: "Price varies by trim level (well-trimmed / untrimmed), color grading, glazing %, and volume.",
  },
  overview: {
    paragraphs: [
      "Pangasius (Pangasianodon hypophthalmus) is the world's most traded farmed whitefish. Vietnam's Mekong Delta produces over 1.5 million tonnes annually, with well-established export infrastructure to 140+ countries.",
      "Well-trimmed fillets offer consistent appearance with belly fat and red meat removed. IVP packaging allows flexible case-building for retail shelf presentation.",
      "Typical end uses: private-label retail frozen fish, institutional catering, ready-meal manufacturing, breaded/battered fish products, and fish & chips operations.",
    ],
  },
  specs: [
    { label: "Species", value: "Pangasianodon hypophthalmus (Pangasius)" },
    { label: "Cut type", value: "Fillet — Well-Trimmed, Skinless, Boneless" },
    { label: "Production type", value: "Farmed (aquaculture)" },
    { label: "Farming method", value: "Pond / cage culture, ASC available" },
    { label: "Freezing process", value: "IQF / IVP" },
    { label: "Glazing", value: "Net weight, glazing 10–20%" },
    { label: "Ingredients", value: "Pangasius (Pangasianodon hypophthalmus), water (glaze)" },
    { label: "Size range", value: "120–220 g per fillet (graded)" },
    { label: "Origin", value: "Vietnam (Mekong Delta)" },
    { label: "Packing", value: "10 kg IVP carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "N/A — Aquaculture" },
  ],
  logistics: {
    incoterm: "CFR / CIF",
    incotermExplain: "CFR: freight included. CIF: freight + insurance included. FOB Ho Chi Minh available on request.",
    shipmentOrigin: "Ho Chi Minh City, Vietnam",
    port: "Cat Lai Port, HCMC",
    packaging: "10 kg IVP carton, palletized, ~27 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ 20,000 kg (1 × 40′ FCL). Smaller trial orders negotiable.",
    leadTime: "7–14 days from order confirmation",
    exportDocs: "Health certificate, certificate of origin, packing list, commercial invoice, bill of lading, ASC CoC.",
  },
  supplier: {
    name: "Mekong Delta Foods",
    country: "Vietnam",
    countryFlag: "🇻🇳",
    yearsInBusiness: 20,
    tradeReadiness: "Export-ready, experienced with EU / US / MENA / Africa markets",
    verifiedFields: ["Business license verified", "Export license verified", "ASC certification on file", "HACCP certification on file", "BRC certification on file"],
    unverifiedNote: "Individual farm-level audits and specific antibiotic/chemical residue test reports are not independently verified by YORSO.",
    certifications: ["HACCP", "ASC", "BRC", "IFS", "EU Approved"],
    responseNote: "Typically responds within 12 hours",
  },
  documents: {
    available: [
      { name: "ASC Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "BRC Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Residue Test Report", note: "Available on request after registration" },
      { name: "Traceability Document", note: "Provided per shipment" },
    ],
  },
  related: [
    { id: "3", name: "Cod Loin Skinless Boneless", species: "Gadus morhua", origin: "Iceland", price: "$11.00 – $12.50 / kg", format: "Fresh", image: "/offers/cod.webp", substituteReason: "Premium whitefish upgrade for higher-margin channels" },
    { id: "7", name: "Mahi Mahi Portion 6oz", species: "Coryphaena hippurus", origin: "Peru", price: "$7.00 – $7.80 / kg", format: "Frozen", image: "/offers/mahi.webp", substituteReason: "Mid-range whitefish alternative with tropical appeal" },
  ],
  seo: {
    title: "Pangasius Fillet Well-Trimmed Wholesale — Vietnam | YORSO",
    description: "Buy frozen pangasius fillet well-trimmed from verified Vietnamese suppliers. ASC certified, wholesale pricing, CFR/CIF terms. Request quotes on YORSO.",
  },
  image: "/offers/pangasius.webp",
};

const seaBassProduct: ProductData = {
  id: "9",
  slug: "sea-bass-fillet",
  name: "Sea Bass Fillet Skin-On",
  h1: "Fresh Sea Bass Fillet Skin-On — Premium Wholesale",
  species: "European Sea Bass",
  latinName: "Dicentrarchus labrax",
  shortSummary: "Fresh skin-on European sea bass fillets from Turkish aquaculture. Never frozen, packed in 5 kg styrofoam boxes for premium retail and Mediterranean HoReCa channels.",
  whyBuyersChoose: "European sea bass is the flagship Mediterranean fish — skin-on fillets allow crispy-skin preparation, the most requested cooking method in European fine dining.",
  badges: [
    { label: "Fresh", icon: "snowflake" },
    { label: "Fillet — Skin-On", icon: "scissors" },
    { label: "Turkey Origin", icon: "flag" },
    { label: "Farmed — GlobalG.A.P.", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$9.00 – $10.20",
    currency: "USD",
    moq: "1,500 kg",
    paymentTerms: "T/T, L/C",
    incoterm: "FCA / DAP",
    port: "Izmir, Turkey",
    stockStatus: "In stock — year-round production",
    priceNote: "Price varies by fillet size, season, and delivery basis. Air freight costs additional.",
  },
  overview: {
    paragraphs: [
      "European Sea Bass (Dicentrarchus labrax) is one of the most valued Mediterranean fish species. Turkey is the world's largest producer, with modern aquaculture operations delivering consistent quality year-round.",
      "Skin-on fillets preserve the characteristic silver skin for presentation-driven cooking methods. Fresh, never-frozen format commands premium pricing in Western European markets.",
      "Typical end uses: fine-dining crispy-skin preparations, retail fish counter display, Mediterranean restaurant menus, premium airline catering.",
    ],
  },
  specs: [
    { label: "Species", value: "Dicentrarchus labrax (European Sea Bass)" },
    { label: "Cut type", value: "Fillet — Skin-On, Pin Bone Out" },
    { label: "Production type", value: "Farmed (aquaculture)" },
    { label: "Farming method", value: "Sea cage, GlobalG.A.P. certified" },
    { label: "Processing", value: "Fresh, never frozen" },
    { label: "Glazing", value: "N/A — fresh product" },
    { label: "Ingredients", value: "European Sea Bass (Dicentrarchus labrax)" },
    { label: "Size range", value: "100 – 300 g per fillet" },
    { label: "Origin", value: "Turkey (Aegean coast)" },
    { label: "Packing", value: "5 kg styrofoam, ice-packed" },
    { label: "Storage", value: "0–2 °C, shelf life 7–10 days" },
    { label: "Fishing area", value: "N/A — Aquaculture" },
  ],
  logistics: {
    incoterm: "FCA / DAP",
    incotermExplain: "FCA: goods delivered to carrier at Izmir. DAP: delivered to your door. Air freight standard for fresh product.",
    shipmentOrigin: "Izmir, Turkey",
    port: "Adnan Menderes Airport / Izmir Port",
    packaging: "5 kg styrofoam box, ice-packed, air freight palletized",
    storage: "Chilled 0–2 °C, cold chain critical",
    moqLogic: "Standard MOQ 1,500 kg. Smaller orders possible at adjusted pricing.",
    leadTime: "2–4 days harvest to delivery (air freight)",
    exportDocs: "Health certificate, GlobalG.A.P. CoC, packing list, commercial invoice, air waybill.",
  },
  supplier: {
    name: "Aegean Aqua A.Ş.",
    country: "Turkey",
    countryFlag: "🇹🇷",
    yearsInBusiness: 18,
    tradeReadiness: "Export-ready, experienced with EU / UK / MENA markets",
    verifiedFields: ["Business license verified", "Export license verified", "GlobalG.A.P. certification on file", "HACCP certification on file"],
    unverifiedNote: "Specific cage-site environmental assessments and individual batch analyses are not independently verified by YORSO.",
    certifications: ["HACCP", "GlobalG.A.P.", "ISO 22000"],
    responseNote: "Typically responds within 12 hours",
  },
  documents: {
    available: [
      { name: "GlobalG.A.P. Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "ISO 22000 Audit Report", note: "Available on request after registration" },
      { name: "Environmental Impact Assessment", note: "Not provided" },
    ],
  },
  related: [
    { id: "3", name: "Cod Loin Skinless Boneless", species: "Gadus morhua", origin: "Iceland", price: "$11.00 – $12.50 / kg", format: "Fresh", image: "/offers/cod.webp", substituteReason: "Premium fresh whitefish from Northern European fisheries" },
    { id: "1", name: "Atlantic Salmon Fillet", species: "Salmo salar", origin: "Norway", price: "$8.50 – $9.20 / kg", format: "Frozen", image: "/offers/salmon.webp", substituteReason: "Top-selling premium fillet for diversified sourcing" },
  ],
  seo: {
    title: "Sea Bass Fillet Fresh Wholesale — Turkish European Sea Bass | YORSO",
    description: "Buy fresh European sea bass fillet skin-on from verified Turkish suppliers. GlobalG.A.P. certified, wholesale pricing, FCA/DAP terms. Request quotes on YORSO.",
  },
  image: "/offers/salmon.webp",
};

const octopusProduct: ProductData = {
  id: "10",
  slug: "octopus-whole-cleaned",
  name: "Octopus Whole Cleaned T4",
  h1: "Frozen Octopus Whole Cleaned T4 — Wholesale Supply",
  species: "Common Octopus",
  latinName: "Octopus vulgaris",
  shortSummary: "Whole cleaned common octopus T4 grade from Moroccan wild fisheries. IQF frozen, graded by weight, packed in 20 kg cartons for Mediterranean and Asian markets.",
  whyBuyersChoose: "T4 (4+ kg) whole cleaned octopus is the preferred format for Southern European and Japanese markets — offering the best combination of yield, texture, and presentation value.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "Whole Cleaned — T4", icon: "scissors" },
    { label: "Morocco Origin", icon: "flag" },
    { label: "FAO 34 — E Atlantic", icon: "map" },
    { label: "Wild-Caught — MSC", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$6.50 – $7.40",
    currency: "USD",
    moq: "5,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "FOB / CFR",
    port: "Agadir, Morocco",
    stockStatus: "In stock — seasonal",
    priceNote: "Price varies by weight grade (T2/T3/T4/T5+), season, and delivery basis. Moroccan octopus season affects availability.",
  },
  overview: {
    paragraphs: [
      "Common Octopus (Octopus vulgaris) from Moroccan waters is considered among the finest quality globally. Morocco is the world's largest octopus exporter, with well-established processing and export infrastructure.",
      "Whole cleaned T4 format means the octopus is eviscerated, beak removed, and graded at 4+ kg — ready for cooking with minimal preparation. IQF ensures individual piece separation.",
      "Typical end uses: Spanish/Portuguese pulpo preparations, Greek taverna grilling, Japanese tako sashimi, Italian antipasti, premium retail whole-octopus display.",
    ],
  },
  specs: [
    { label: "Species", value: "Octopus vulgaris (Common Octopus)" },
    { label: "Cut type", value: "Whole Cleaned — eviscerated, beak removed" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Pot / Trap" },
    { label: "Freezing process", value: "IQF" },
    { label: "Glazing", value: "Light glaze, net weight basis" },
    { label: "Ingredients", value: "Octopus (Octopus vulgaris)" },
    { label: "Size range", value: "T4: 3–4 kg per piece" },
    { label: "Origin", value: "Morocco (Atlantic coast)" },
    { label: "Packing", value: "20 kg carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 34 — Eastern Central Atlantic" },
  ],
  logistics: {
    incoterm: "FOB / CFR",
    incotermExplain: "FOB: you arrange freight from Agadir. CFR: supplier covers freight to your destination port.",
    shipmentOrigin: "Agadir, Morocco",
    port: "Port of Agadir",
    packaging: "20 kg carton, palletized, ~25 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ 5,000 kg. Full container loads preferred.",
    leadTime: "10–14 days from order confirmation (subject to season)",
    exportDocs: "Health certificate, catch certificate, MSC CoC, packing list, commercial invoice, bill of lading.",
  },
  supplier: {
    name: "Atlas Pelagic SARL",
    country: "Morocco",
    countryFlag: "🇲🇦",
    yearsInBusiness: 20,
    tradeReadiness: "Export-ready, experienced with EU / Japan / Korea markets",
    verifiedFields: ["Business license verified", "Export license verified", "MSC certification on file", "HACCP certification on file"],
    unverifiedNote: "Specific trap-location data and individual batch cadmium/heavy metal test reports are not independently verified by YORSO.",
    certifications: ["HACCP", "MSC", "EU Approved"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "MSC Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Heavy Metal Test Report", note: "Available on request" },
      { name: "Catch Certificate", note: "Provided per shipment" },
    ],
  },
  related: [
    { id: "6", name: "Squid Tube & Tentacle", species: "Illex argentinus", origin: "Argentina", price: "$3.20 – $3.80 / kg", format: "Frozen", image: "/offers/squid.webp", substituteReason: "Budget cephalopod alternative for volume-driven markets" },
    { id: "5", name: "King Crab Clusters", species: "Paralithodes camtschaticus", origin: "Russia", price: "$28.00 – $32.00 / kg", format: "Frozen", image: "/offers/crab.webp", substituteReason: "Premium shellfish for upscale seafood assortment" },
  ],
  seo: {
    title: "Octopus Whole Cleaned T4 Wholesale — Moroccan Octopus | YORSO",
    description: "Buy frozen octopus whole cleaned T4 from verified Moroccan suppliers. MSC certified, wholesale pricing, FOB/CFR terms. Compare and request quotes on YORSO.",
  },
  image: "/offers/squid.webp",
};

const mackerelHGProduct: ProductData = {
  id: "11",
  slug: "mackerel-hg-300-500",
  name: "Mackerel HG 300-500g",
  h1: "Frozen Mackerel HG 300-500g — Wholesale Supply from Norway",
  species: "Atlantic Mackerel",
  latinName: "Scomber scombrus",
  shortSummary: "Headed and gutted Atlantic mackerel 300-500g from Norwegian pelagic fisheries. Block or IQF frozen, MSC certified, packed in 20 kg cartons for global distribution.",
  whyBuyersChoose: "300-500g is the most demanded grading for African, Eastern European, and Asian retail markets — large enough for whole-fish display, optimal for smoking and grilling.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "HG — Headed & Gutted", icon: "scissors" },
    { label: "Norway Origin", icon: "flag" },
    { label: "FAO 27 — NE Atlantic", icon: "map" },
    { label: "Wild-Caught — MSC", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$1.80 – $2.20",
    currency: "USD",
    moq: "25,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "CFR / CIF",
    port: "Bergen, Norway",
    stockStatus: "In stock — seasonal (peak Sep–Dec)",
    priceNote: "Price varies by size grading, fat content (season-dependent), freezing method (IQF/block), and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Atlantic Mackerel (Scomber scombrus) is one of the most traded pelagic fish globally. Norwegian mackerel is known for its high fat content (especially autumn catch), firm flesh, and MSC sustainability certification.",
      "HG (Headed & Gutted) 300-500g is the core commercial format — retaining the body shape for whole-fish retail while removing head and viscera for food safety and extended shelf life.",
      "Typical end uses: retail whole-fish display, hot-smoked mackerel production, grilled mackerel for food-service, canned mackerel, and West African / Asian market distribution.",
    ],
  },
  specs: [
    { label: "Species", value: "Scomber scombrus (Atlantic Mackerel)" },
    { label: "Cut type", value: "HG — Headed & Gutted" },
    { label: "Production type", value: "Wild-caught" },
    { label: "Catching method", value: "Purse seine / Pelagic trawl" },
    { label: "Freezing process", value: "IQF or Block frozen" },
    { label: "Glazing", value: "Net weight, glazing 5–10%" },
    { label: "Ingredients", value: "Atlantic Mackerel (Scomber scombrus), water (glaze)" },
    { label: "Size range", value: "300–500 g per piece" },
    { label: "Origin", value: "Norway" },
    { label: "Packing", value: "20 kg carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "FAO 27 — Northeast Atlantic" },
  ],
  logistics: {
    incoterm: "CFR / CIF",
    incotermExplain: "CFR: freight included to your port. CIF: freight and insurance included.",
    shipmentOrigin: "Bergen, Norway",
    port: "Port of Bergen",
    packaging: "20 kg carton, palletized, ~25 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ 25,000 kg (1 × 40′ FCL). High-volume trade — multi-FCL contracts common.",
    leadTime: "7–14 days from order confirmation",
    exportDocs: "Health certificate, MSC CoC, catch certificate, packing list, commercial invoice, bill of lading.",
  },
  supplier: {
    name: "Bergen Pelagic AS",
    country: "Norway",
    countryFlag: "🇳🇴",
    yearsInBusiness: 35,
    tradeReadiness: "Export-ready, experienced with Africa / Eastern Europe / Asia markets",
    verifiedFields: ["Business license verified", "Export license verified", "MSC certification on file", "HACCP certification on file"],
    unverifiedNote: "Specific vessel catch reports and individual batch fat-content analyses are not independently verified by YORSO.",
    certifications: ["HACCP", "MSC", "BRC", "IFS"],
    responseNote: "Typically responds within 12 hours",
  },
  documents: {
    available: [
      { name: "MSC Certificate", type: "certification", gated: false },
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "BRC Certificate", type: "certification", gated: false },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Fat Content Analysis", note: "Available per season/batch on request" },
      { name: "Catch Certificate", note: "Provided per shipment" },
    ],
  },
  related: [
    { id: "mackerel-hgt-50-120", name: "Mackerel HGT 50+", species: "Scomber japonicus", origin: "China", price: "$1.45 – $1.70 / kg", format: "Frozen", image: "/offers/cod.webp", substituteReason: "Pacific mackerel HGT — smaller size, Chinese processing, lower price tier" },
    { id: "1", name: "Atlantic Salmon Fillet", species: "Salmo salar", origin: "Norway", price: "$8.50 – $9.20 / kg", format: "Frozen", image: "/offers/salmon.webp", substituteReason: "Premium Norwegian fish for upselling within same origin" },
  ],
  seo: {
    title: "Mackerel HG 300-500g Wholesale — Norwegian Atlantic Mackerel | YORSO",
    description: "Buy frozen mackerel HG 300-500g from verified Norwegian suppliers. MSC certified, wholesale pricing, CFR/CIF terms. Compare and request quotes on YORSO.",
  },
  image: "/offers/cod.webp",
};

const blackTigerProduct: ProductData = {
  id: "12",
  slug: "black-tiger-shrimp-hlso",
  name: "Black Tiger Shrimp HLSO",
  h1: "Frozen Black Tiger Shrimp HLSO — Wholesale Supply",
  species: "Black Tiger Shrimp",
  latinName: "Penaeus monodon",
  shortSummary: "Headless shell-on black tiger shrimp from Bangladeshi aquaculture. IQF frozen, graded by count, packed in 10 kg cartons for premium retail and HoReCa channels.",
  whyBuyersChoose: "Black tiger HLSO commands premium pricing over vannamei — larger size, firmer texture, and distinctive striped appearance drive higher retail value and plate presentation.",
  badges: [
    { label: "Frozen", icon: "snowflake" },
    { label: "HLSO — Headless Shell-On", icon: "scissors" },
    { label: "Bangladesh Origin", icon: "flag" },
    { label: "Farmed — BAP", icon: "anchor" },
  ],
  commercial: {
    pricePerKg: "$7.20 – $8.10",
    currency: "USD",
    moq: "3,000 kg",
    paymentTerms: "T/T, L/C at sight",
    incoterm: "CFR / CIF",
    port: "Chittagong, Bangladesh",
    stockStatus: "In stock — ready to load",
    priceNote: "Price varies by count size (U6, U8, U10, 13/15, 16/20), glazing %, and delivery basis.",
  },
  overview: {
    paragraphs: [
      "Black Tiger Shrimp (Penaeus monodon) is the premium shrimp species in global trade. Bangladeshi aquaculture produces some of the largest-sized tigers, particularly in the Khulna region's traditional extensive farming systems.",
      "HLSO (Headless Shell-On) format is preferred for high-end retail and food-service — the shell protects flavor during cooking while the headed presentation reduces preparation time.",
      "Typical end uses: premium retail shell-on shrimp display, restaurant grilled/steamed tiger prawns, Japanese tempura, barbecue shrimp, and upscale frozen retail packs.",
    ],
  },
  specs: [
    { label: "Species", value: "Penaeus monodon (Black Tiger Shrimp)" },
    { label: "Cut type", value: "HLSO — Headless, Shell-On" },
    { label: "Production type", value: "Farmed (aquaculture)" },
    { label: "Farming method", value: "Extensive / semi-intensive pond culture" },
    { label: "Freezing process", value: "IQF (Individually Quick Frozen)" },
    { label: "Glazing", value: "Net weight, glazing 10–20%" },
    { label: "Ingredients", value: "Black Tiger Shrimp (Penaeus monodon), water (glaze)" },
    { label: "Size range", value: "Various counts: U6 to 21/25" },
    { label: "Origin", value: "Bangladesh (Khulna region)" },
    { label: "Packing", value: "10 kg carton" },
    { label: "Storage", value: "−18 °C or below, shelf life 24 months" },
    { label: "Fishing area", value: "N/A — Aquaculture" },
  ],
  logistics: {
    incoterm: "CFR / CIF",
    incotermExplain: "CFR: freight included. CIF: freight + insurance included to your port.",
    shipmentOrigin: "Chittagong, Bangladesh",
    port: "Port of Chittagong",
    packaging: "10 kg carton, palletized, ~20 MT per 40′ HC reefer",
    storage: "Reefer container at −18 °C minimum",
    moqLogic: "Standard MOQ 3,000 kg. Full container loads for best pricing.",
    leadTime: "14–21 days from order confirmation",
    exportDocs: "Health certificate, certificate of origin, packing list, commercial invoice, bill of lading, BAP CoC.",
  },
  supplier: {
    name: "Bengal Seafood Ltd",
    country: "Bangladesh",
    countryFlag: "🇧🇩",
    yearsInBusiness: 10,
    tradeReadiness: "Export-ready, experienced with EU / US / Japan markets",
    verifiedFields: ["Business license verified", "Export license verified", "HACCP certification on file"],
    unverifiedNote: "BAP certification status, individual farm audits, and antibiotic test reports are not independently verified by YORSO.",
    certifications: ["HACCP", "BAP"],
    responseNote: "Typically responds within 24 hours",
  },
  documents: {
    available: [
      { name: "HACCP Certificate", type: "certification", gated: false },
      { name: "BAP Certificate", type: "certification", gated: true },
      { name: "Product Specification Sheet", type: "spec", gated: true },
    ],
    missing: [
      { name: "Antibiotic Residue Test", note: "Available on request after registration" },
      { name: "Traceability Document", note: "Not provided — request from supplier" },
    ],
  },
  related: [
    { id: "2", name: "Vannamei Shrimp HOSO", species: "Litopenaeus vannamei", origin: "Ecuador", price: "$5.80 – $6.40 / kg", format: "Frozen", image: "/offers/shrimp.webp", substituteReason: "Budget shrimp alternative — higher volume, lower per-kg cost" },
    { id: "5", name: "King Crab Clusters", species: "Paralithodes camtschaticus", origin: "Russia", price: "$28.00 – $32.00 / kg", format: "Frozen", image: "/offers/crab.webp", substituteReason: "Ultra-premium crustacean for luxury seafood assortment" },
  ],
  seo: {
    title: "Black Tiger Shrimp HLSO Wholesale — Bangladesh | YORSO",
    description: "Buy frozen black tiger shrimp HLSO from verified Bangladeshi suppliers. Premium sizes, wholesale pricing, CFR/CIF terms. Request quotes on YORSO.",
  },
  image: "/offers/shrimp.webp",
};

// Product catalog — maps slug and mockOffer ID to full product data
export const productCatalog: Record<string, ProductData> = {
  // By slug
  "atlantic-salmon-fillet": salmonProduct,
  "vannamei-shrimp-hoso": shrimpProduct,
  "cod-loin-skinless-boneless": codProduct,
  "yellowfin-tuna-loin": tunaProduct,
  "king-crab-clusters": crabProduct,
  "squid-tube-tentacle": squidProduct,
  "mahi-mahi-portion": mahiProduct,
  "pangasius-fillet": pangasiusProduct,
  "sea-bass-fillet": seaBassProduct,
  "octopus-whole-cleaned": octopusProduct,
  "mackerel-hg-300-500": mackerelHGProduct,
  "black-tiger-shrimp-hlso": blackTigerProduct,
  "mackerel-hgt-50-plus": mackerelProduct as ProductData,
  // By mock offer ID
  "1": salmonProduct,
  "2": shrimpProduct,
  "3": codProduct,
  "4": tunaProduct,
  "5": crabProduct,
  "6": squidProduct,
  "7": mahiProduct,
  "8": pangasiusProduct,
  "9": seaBassProduct,
  "10": octopusProduct,
  "11": mackerelHGProduct,
  "12": blackTigerProduct,
};
