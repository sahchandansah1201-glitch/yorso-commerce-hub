/**
 * Mock content for the YORSO Insights section (/blog).
 *
 * Frontend-only. No backend, no CMS. The shape is designed to mirror what
 * a future content API is expected to return so the UI can stay stable.
 *
 * Honesty rules:
 *   - All articles are clearly marked as "Example insight" / "Mock article"
 *     in the UI shell.
 *   - We never claim numbers come from a live data feed.
 *   - We never imply real-time market data here.
 */

import salmonVerticalImg from "@/assets/salmon-vertical.jpg";
import suppliersOgImg from "@/assets/og-for-suppliers.jpg";

export type BlogAudience = "buyer" | "supplier" | "both";

export type BlogContentType =
  | "market_intelligence"
  | "buyer_guide"
  | "supplier_guide"
  | "product_update"
  | "glossary";

export type BlogRelatedCta =
  | "/offers"
  | "/suppliers"
  | "/for-suppliers"
  | "/register"
  | "/how-it-works";

export type ProductUpdateType = "added" | "improved" | "fixed" | "guide";

export type ProductUpdateArea =
  | "Catalog"
  | "Supplier Profiles"
  | "Price Access"
  | "Registration"
  | "Requests"
  | "Intelligence";

/**
 * Optional structured fields used only by product_update posts.
 * Renderers fall back gracefully when absent.
 */
export interface ProductUpdateMeta {
  updateType: ProductUpdateType;
  affectedArea: ProductUpdateArea;
  /** One sentence describing who benefits and how. */
  userBenefit: string;
  /** Concrete steps a user can follow today. */
  howToUse: string[];
  /** App route the update applies to. */
  relatedRoute: string;
  /** True when the change is mock/prototype rather than shipped. */
  prototype?: boolean;
}

export interface BlogArticleSection {
  /** Section heading rendered as <h2>. */
  heading: string;
  /** One or more paragraphs of body copy. */
  paragraphs: string[];
  /** Optional bullet list under the section. */
  bullets?: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  audience: BlogAudience;
  contentType: BlogContentType;
  speciesTags?: string[];
  countryTags?: string[];
  relatedCta?: BlogRelatedCta;
  publishedAt: string; // ISO date
  updatedAt: string;   // ISO date
  readingTimeMinutes: number;
  authorName: string;
  /**
   * Hero image URL. Defaults to a safe local placeholder when missing.
   */
  heroImage: string;
  /** Meaningful alt text for the hero image. Required for editorial images. */
  heroImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  sections: BlogArticleSection[];
  /** Structured metadata for product_update posts only. */
  productUpdate?: ProductUpdateMeta;
}

const PLACEHOLDER = "/placeholder.svg";

export const blogCategories = [
  "Market intelligence",
  "Buyer guides",
  "Supplier guides",
  "Product updates",
  "Seafood glossary",
] as const;

export const blogPosts: BlogPost[] = [
  {
    id: "post-001",
    slug: "atlantic-salmon-q1-price-pressure",
    title: "Atlantic salmon: what is putting pressure on Q1 prices",
    excerpt:
      "An example walkthrough of the trade conditions and supply factors procurement teams typically watch for Atlantic salmon in early Q1.",
    category: "Market intelligence",
    audience: "buyer",
    contentType: "market_intelligence",
    speciesTags: ["Atlantic Salmon"],
    countryTags: ["NO", "CL", "FO"],
    relatedCta: "/offers",
    publishedAt: "2026-01-12",
    updatedAt: "2026-02-04",
    readingTimeMinutes: 7,
    authorName: "YORSO Editorial",
    heroImage: "/src/assets/salmon-vertical.jpg",
    seoTitle: "Atlantic salmon Q1 price pressure: a procurement view (example)",
    seoDescription:
      "Example market intelligence piece on the supply, demand, and logistics factors that typically influence Atlantic salmon prices in early Q1.",
    sections: [
      {
        heading: "Why Q1 matters for salmon buyers",
        paragraphs: [
          "Q1 is historically a tight period for Atlantic salmon. Biological growth slows in colder water, harvest volumes from Norway and the Faroe Islands tend to soften, and Lent demand in several European markets begins to lift orders.",
          "This example article describes the type of factors a procurement team would normally weigh when planning Q1 contracts. It does not represent live market data.",
        ],
      },
      {
        heading: "Supply factors typically in focus",
        paragraphs: [
          "Buyers usually monitor harvest guidance from the largest farming regions, sea temperature trends, and biological events that can affect available biomass.",
        ],
        bullets: [
          "Norwegian and Faroese harvest guidance",
          "Chilean export pace into the US and Brazil",
          "Mortality and treatment cycles affecting biomass",
          "Air freight capacity from major hubs",
        ],
      },
      {
        heading: "What buyers can do on YORSO",
        paragraphs: [
          "Buyers can use the catalog to compare offers across origins, request price access from suppliers that match their volume needs, and shortlist suppliers whose certifications and document readiness fit their compliance profile.",
        ],
      },
    ],
  },
  {
    id: "post-002",
    slug: "vannamei-shrimp-supply-shifts",
    title: "Vannamei shrimp: how Asian and LATAM supply shifts affect buyers",
    excerpt:
      "An example overview of the supply dynamics between Ecuador, India, Vietnam, and Indonesia that procurement teams routinely track for vannamei shrimp.",
    category: "Market intelligence",
    audience: "buyer",
    contentType: "market_intelligence",
    speciesTags: ["Vannamei Shrimp"],
    countryTags: ["EC", "IN", "VN", "ID"],
    relatedCta: "/offers",
    publishedAt: "2026-01-22",
    updatedAt: "2026-01-30",
    readingTimeMinutes: 6,
    authorName: "YORSO Editorial",
    heroImage: PLACEHOLDER,
    seoTitle: "Vannamei shrimp supply shifts (example procurement view)",
    seoDescription:
      "Example article describing how shrimp supply patterns from Ecuador, India, Vietnam, and Indonesia typically affect buyers' sourcing decisions.",
    sections: [
      {
        heading: "Why origin mix matters",
        paragraphs: [
          "Vannamei shrimp buyers rarely source from a single country. Different origins offer different sizes, processing strengths, certifications, and landed cost profiles.",
        ],
      },
      {
        heading: "Origins typically compared",
        paragraphs: [
          "Procurement teams will often compare offers from Ecuador, India, Vietnam, and Indonesia to balance price, certification, and delivery speed into their destination market.",
        ],
        bullets: [
          "Ecuador: large counts, BAP and ASC availability",
          "India: broad size range, value-added formats",
          "Vietnam: cooked and value-added strength",
          "Indonesia: ASC availability and growing exports",
        ],
      },
    ],
  },
  {
    id: "post-003",
    slug: "whitefish-cod-pollock-trade-conditions",
    title: "Whitefish: cod and pollock trade conditions to watch",
    excerpt:
      "Example commentary on quotas, processing locations, and currency factors that procurement teams normally track for cod and pollock.",
    category: "Market intelligence",
    audience: "buyer",
    contentType: "market_intelligence",
    speciesTags: ["Cod", "Pollock"],
    countryTags: ["NO", "IS", "RU", "US", "CN"],
    relatedCta: "/offers",
    publishedAt: "2026-02-02",
    updatedAt: "2026-02-12",
    readingTimeMinutes: 8,
    authorName: "YORSO Editorial",
    heroImage: PLACEHOLDER,
    seoTitle: "Cod and pollock trade conditions: example procurement view",
    seoDescription:
      "Example article on the quotas, currency, and processing factors that typically affect cod and pollock procurement decisions.",
    sections: [
      {
        heading: "Quotas and currency",
        paragraphs: [
          "Whitefish trade is shaped by quota decisions in the Barents Sea and Bering Sea, exchange rate moves in NOK and ISK, and the long supply chain through Asian reprocessing.",
        ],
      },
      {
        heading: "What this means for buyers",
        paragraphs: [
          "Buyers building seasonal coverage typically split orders between primary processed product from origin and twice-frozen product reprocessed in Asia, depending on format and price point.",
        ],
      },
    ],
  },
  {
    id: "post-004",
    slug: "how-to-run-a-tight-rfq",
    title: "How to run a tight RFQ on YORSO",
    excerpt:
      "A buyer guide explaining how to scope an RFQ so suppliers can respond quickly with comparable offers.",
    category: "Buyer guides",
    audience: "buyer",
    contentType: "buyer_guide",
    relatedCta: "/offers",
    publishedAt: "2026-01-08",
    updatedAt: "2026-01-25",
    readingTimeMinutes: 5,
    authorName: "YORSO Editorial",
    heroImage: PLACEHOLDER,
    seoTitle: "How to run a tight seafood RFQ (buyer guide)",
    seoDescription:
      "Buyer guide on scoping a seafood RFQ so suppliers can respond quickly with comparable, decision-ready offers.",
    sections: [
      {
        heading: "Define what you actually need",
        paragraphs: [
          "A tight RFQ specifies species, size grade, format, packaging, certification requirements, incoterm, destination port, monthly volume, and contract length.",
        ],
        bullets: [
          "Species and Latin name",
          "Size grade and pack format",
          "Required certifications",
          "Incoterm and destination",
          "Volume and frequency",
        ],
      },
      {
        heading: "Why it speeds up decisions",
        paragraphs: [
          "When suppliers receive a complete brief, they can quote within hours instead of days, and the offers they return are directly comparable.",
        ],
      },
    ],
  },
  {
    id: "post-005",
    slug: "supplier-verification-and-price-access",
    title: "Supplier verification and price access: what buyers should know",
    excerpt:
      "A buyer guide explaining how YORSO's access model works and why exact prices and supplier identity become visible only after qualification.",
    category: "Buyer guides",
    audience: "buyer",
    contentType: "buyer_guide",
    relatedCta: "/register",
    publishedAt: "2026-01-15",
    updatedAt: "2026-02-01",
    readingTimeMinutes: 6,
    authorName: "YORSO Editorial",
    heroImage: PLACEHOLDER,
    seoTitle: "Supplier verification and price access: buyer guide",
    seoDescription:
      "Buyer guide on how supplier verification and price access work on YORSO, and why exact prices unlock only after buyer qualification.",
    sections: [
      {
        heading: "Three access levels",
        paragraphs: [
          "YORSO uses three explicit access levels: anonymous browsing, registered access with masked identity, and qualified access with exact price and supplier identity. This protects suppliers from price scraping while keeping the catalog open for discovery.",
        ],
      },
      {
        heading: "How to unlock exact prices",
        paragraphs: [
          "Create a buyer account, complete the short qualification step, and request price access for the offers you are evaluating. Suppliers approve access on a per-buyer basis.",
        ],
      },
    ],
  },
  {
    id: "post-006",
    slug: "buyer-qualification-for-suppliers",
    title: "Buyer qualification: what suppliers see and decide",
    excerpt:
      "A supplier guide explaining the buyer signals YORSO surfaces before a price access request reaches your inbox.",
    category: "Supplier guides",
    audience: "supplier",
    contentType: "supplier_guide",
    relatedCta: "/for-suppliers",
    publishedAt: "2026-01-18",
    updatedAt: "2026-02-03",
    readingTimeMinutes: 5,
    authorName: "YORSO Editorial",
    heroImage: "/src/assets/og-for-suppliers.jpg",
    seoTitle: "Buyer qualification for seafood suppliers (supplier guide)",
    seoDescription:
      "Supplier guide on the buyer signals YORSO surfaces before access requests reach your inbox, so you can approve serious buyers faster.",
    sections: [
      {
        heading: "What suppliers see",
        paragraphs: [
          "Before approving access, suppliers can review the buyer's company, country, target volume, and intended product fit. This makes it easier to spend time on serious buyers and politely decline mismatches.",
        ],
      },
      {
        heading: "Approve faster, sell faster",
        paragraphs: [
          "Suppliers that respond within a day are highlighted in the catalog with a fast-response signal, which lifts their visibility for buyers searching the same species.",
        ],
      },
    ],
  },
  {
    id: "post-007",
    slug: "writing-product-cards-that-convert",
    title: "Writing product cards that convert serious buyers",
    excerpt:
      "A supplier guide on the structure of a high-converting product card: title, format, certifications, MOQ, and decision-ready details.",
    category: "Supplier guides",
    audience: "supplier",
    contentType: "supplier_guide",
    relatedCta: "/for-suppliers",
    publishedAt: "2026-01-28",
    updatedAt: "2026-02-08",
    readingTimeMinutes: 6,
    authorName: "YORSO Editorial",
    heroImage: PLACEHOLDER,
    seoTitle: "Writing seafood product cards that convert (supplier guide)",
    seoDescription:
      "Supplier guide on writing product cards that give buyers everything they need to shortlist or request access in under 30 seconds.",
    sections: [
      {
        heading: "Lead with identity",
        paragraphs: [
          "Buyers scan dozens of cards a day. The fastest way to be shortlisted is to lead with species, Latin name, format, size grade, and primary certification.",
        ],
        bullets: [
          "Species + Latin name",
          "Format and cut",
          "Size grade and packaging",
          "Lead certifications",
          "Origin and supplier country",
        ],
      },
      {
        heading: "Be honest about what is available now",
        paragraphs: [
          "Cards that quietly advertise unavailable product erode trust. Mark seasonal items clearly and update MOQ and lead time at least monthly.",
        ],
      },
    ],
  },
  {
    id: "post-008",
    slug: "yorso-catalog-update-supplier-trust-signals",
    title: "Catalog update: clearer supplier trust signals",
    excerpt:
      "A product update describing the new compact trust signals on supplier rows and offer cards.",
    category: "Product updates",
    audience: "both",
    contentType: "product_update",
    publishedAt: "2026-02-10",
    updatedAt: "2026-02-10",
    readingTimeMinutes: 3,
    authorName: "YORSO Product",
    heroImage: PLACEHOLDER,
    seoTitle: "YORSO catalog update: clearer supplier trust signals",
    seoDescription:
      "Product update introducing clearer trust signals on supplier rows so buyers can scan verification, response speed, and document readiness faster.",
    sections: [
      {
        heading: "What changed",
        paragraphs: [
          "Supplier rows now use a single, compact line for verification, document readiness, and response speed, instead of repeating the same badge in two places.",
        ],
      },
      {
        heading: "Why it matters",
        paragraphs: [
          "Procurement managers told us they wanted less visual noise per row. The new layout fits more suppliers on the screen without losing the trust signals that drive shortlist decisions.",
        ],
      },
    ],
    productUpdate: {
      updateType: "improved",
      affectedArea: "Supplier Profiles",
      userBenefit:
        "Buyers scan more suppliers per screen and still see verification, response speed, and document readiness at a glance.",
      howToUse: [
        "Open the supplier directory.",
        "Look at the new compact trust line on each supplier row.",
        "Filter or shortlist suppliers using the consolidated signals.",
      ],
      relatedRoute: "/suppliers",
    },
  },
  {
    id: "post-009",
    slug: "yorso-supplier-profiles-redesigned",
    title: "Product update: redesigned supplier profiles",
    excerpt:
      "A product update on the new supplier profile structure, including masked identity, certifications, and access request panel.",
    category: "Product updates",
    audience: "both",
    contentType: "product_update",
    publishedAt: "2026-02-18",
    updatedAt: "2026-02-18",
    readingTimeMinutes: 4,
    authorName: "YORSO Product",
    heroImage: PLACEHOLDER,
    seoTitle: "YORSO supplier profiles redesigned (product update)",
    seoDescription:
      "Product update on the redesigned supplier profile structure: masked identity for locked access, certification grid, and a clearer access request flow.",
    sections: [
      {
        heading: "What is new",
        paragraphs: [
          "Supplier profiles now lead with verified facts, certifications, and a clearer access request panel that explains exactly what the buyer will see after approval.",
        ],
      },
      {
        heading: "What stayed",
        paragraphs: [
          "The three-level access model is unchanged: anonymous browsing, registered access, and qualified access remain explicit so buyers and suppliers know what is visible at each step.",
        ],
      },
    ],
    productUpdate: {
      updateType: "improved",
      affectedArea: "Supplier Profiles",
      userBenefit:
        "Buyers reach the right supplier faster and understand exactly what unlocks after access is granted.",
      howToUse: [
        "Open any supplier profile from the directory.",
        "Review the verified facts and certification grid.",
        "Use the access request panel to request price and identity access.",
      ],
      relatedRoute: "/suppliers",
    },
  },
  {
    id: "post-011",
    slug: "yorso-price-access-request-flow",
    title: "Prototype update: simpler price access request flow",
    excerpt:
      "A product update describing the streamlined price access request panel on offer pages and supplier profiles.",
    category: "Product updates",
    audience: "buyer",
    contentType: "product_update",
    publishedAt: "2026-03-04",
    updatedAt: "2026-03-04",
    readingTimeMinutes: 3,
    authorName: "YORSO Product",
    heroImage: PLACEHOLDER,
    seoTitle: "Simpler price access request flow (YORSO product update)",
    seoDescription:
      "Product update on the streamlined price access request flow that lets qualified buyers request exact prices in fewer steps.",
    sections: [
      {
        heading: "What changed",
        paragraphs: [
          "The price access request panel is now a single short form. Buyers see exactly which fields are required and what the supplier will see before they click submit.",
        ],
      },
      {
        heading: "Why we changed it",
        paragraphs: [
          "Buyers reported that the previous flow asked for fields suppliers do not actually use to qualify a request. We removed those fields and grouped the remaining ones by purpose.",
        ],
      },
    ],
    productUpdate: {
      updateType: "improved",
      affectedArea: "Price Access",
      userBenefit:
        "Qualified buyers request exact prices in fewer steps and know in advance what suppliers will see.",
      howToUse: [
        "Open an offer in the catalog.",
        "Click Request price access on the offer panel.",
        "Confirm volume and destination, then submit.",
      ],
      relatedRoute: "/offers",
      prototype: true,
    },
  },
  {
    id: "post-010",
    slug: "seafood-procurement-glossary",
    title: "Seafood procurement glossary: 20 terms buyers and suppliers use",
    excerpt:
      "A short glossary of the terms that show up most often in YORSO offers, supplier profiles, and access requests.",
    category: "Seafood glossary",
    audience: "both",
    contentType: "glossary",
    publishedAt: "2026-01-05",
    updatedAt: "2026-02-15",
    readingTimeMinutes: 9,
    authorName: "YORSO Editorial",
    heroImage: PLACEHOLDER,
    seoTitle: "Seafood procurement glossary: 20 essential terms",
    seoDescription:
      "Glossary of common seafood procurement terms used across YORSO offers, supplier profiles, and access requests.",
    sections: [
      {
        heading: "Trade and pricing",
        paragraphs: [
          "Common terms include FOB, CFR, CIF, DAP, landed cost, MOQ, lead time, and incoterm. Each one changes who pays for which leg of the shipment.",
        ],
        bullets: [
          "FOB: Free on board",
          "CFR: Cost and freight",
          "CIF: Cost, insurance, freight",
          "DAP: Delivered at place",
          "MOQ: Minimum order quantity",
        ],
      },
      {
        heading: "Product and quality",
        paragraphs: [
          "Format terms include HOG (head on, gutted), HGT (head off, gutted, tail on), fillet, portion, IQF, and block. Certification terms include ASC, MSC, BAP, GlobalG.A.P., and BRCGS.",
        ],
      },
    ],
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug);
