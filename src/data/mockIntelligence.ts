/**
 * Procurement Intelligence — mock data for the catalog rail.
 *
 * Phase 1: static. Backend-readiness: shapes mirror what real
 * endpoints (price-trends, country-news, country-impact) should return.
 */

export type TrendDirection = "up" | "down" | "flat";
export type Volatility = "low" | "medium" | "high";
export type CountryRole =
  | "supplier_country"
  | "origin_country"
  | "export_port"
  | "competing_producer"
  | "demand_driver";

export interface PriceTrendPoint {
  /** ISO date or short label, e.g. "W12" */
  label: string;
  /** Indexed price, base = 100 */
  index: number;
}

export interface PriceTrend {
  /** Category key (matches mockOffers categories) or "all" */
  category: string;
  currentIndex: number;
  d7: { dir: TrendDirection; pct: number };
  d30: { dir: TrendDirection; pct: number };
  d90: { dir: TrendDirection; pct: number };
  volatility: Volatility;
  /** Short procurement explanation, EN — translated layer renders i18n version when level is qualified */
  explanation: string;
  series: PriceTrendPoint[];
}

export type NewsRelevanceReason =
  | "price"
  | "availability"
  | "logistics"
  | "compliance"
  | "supplier_risk";

export interface CountryNewsItem {
  id: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  /** Topic tags drive relevance: pricing | logistics | regulation | export | seasonality */
  tags: ("pricing" | "logistics" | "regulation" | "export" | "seasonality")[];
  category: string;
  headline: string;
  source: string;
  /** @deprecated kept for legacy callers — use `daysAgo` for localized rendering. */
  publishedAt: string;
  /** Days since publication; `formatDaysAgo(lang, daysAgo)` renders the visible label. */
  daysAgo: number;
  /** Short 1-line summary */
  summary: string;
  /** Why this news matters for procurement decisions on this offer. */
  relevanceReason: NewsRelevanceReason;
}

export interface CountryImpact {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  role: CountryRole;
  /** -100..100 — directional contribution to current price */
  impactPct: number;
  /** Short reason why this country appears */
  reason: string;
}

export interface SignalUpdate {
  id: string;
  publishedAt: string;
  /** Short headline for the alerts feed */
  headline: string;
  /** Optional short body shown in expanded alert */
  body?: string;
}

export interface MarketSignal {
  id: string;
  kind: "supply" | "demand" | "logistics" | "regulation";
  severity: "info" | "watch" | "alert";
  text: string;
  /** Optional richer context shown in the click-to-open drawer. */
  publishedAt?: string;
  context?: string;
  meaning?: string;
  actions?: string[];
  /** Mock updates surfaced in alerts when the user is subscribed. */
  updates?: SignalUpdate[];
}

// ── Price trends per category ────────────────────────────────────────────────
export const priceTrends: Record<string, PriceTrend> = {
  Salmon: {
    category: "Salmon",
    currentIndex: 112,
    d7: { dir: "up", pct: 1.4 },
    d30: { dir: "up", pct: 4.8 },
    d90: { dir: "down", pct: -2.1 },
    volatility: "medium",
    explanation:
      "Norwegian export volumes tightened on biological growth limits; Chilean supply offsets long-term but lags by 2–3 weeks.",
    series: [
      { label: "W1", index: 108 },
      { label: "W3", index: 109 },
      { label: "W5", index: 107 },
      { label: "W7", index: 110 },
      { label: "W9", index: 111 },
      { label: "W11", index: 112 },
    ],
  },
  Shrimp: {
    category: "Shrimp",
    currentIndex: 96,
    d7: { dir: "down", pct: -0.8 },
    d30: { dir: "down", pct: -3.2 },
    d90: { dir: "flat", pct: 0.2 },
    volatility: "low",
    explanation:
      "Ecuadorian harvest cycle peak puts downward pressure on vannamei; Indian and Vietnamese stocks remain stable.",
    series: [
      { label: "W1", index: 100 },
      { label: "W3", index: 99 },
      { label: "W5", index: 98 },
      { label: "W7", index: 97 },
      { label: "W9", index: 97 },
      { label: "W11", index: 96 },
    ],
  },
  Whitefish: {
    category: "Whitefish",
    currentIndex: 118,
    d7: { dir: "up", pct: 0.6 },
    d30: { dir: "up", pct: 5.4 },
    d90: { dir: "up", pct: 9.1 },
    volatility: "high",
    explanation:
      "Lower 2025 cod quotas in the Barents Sea continue to push prices up across cod and haddock substitutes.",
    series: [
      { label: "W1", index: 108 },
      { label: "W3", index: 111 },
      { label: "W5", index: 113 },
      { label: "W7", index: 115 },
      { label: "W9", index: 117 },
      { label: "W11", index: 118 },
    ],
  },
  Tuna: {
    category: "Tuna",
    currentIndex: 102,
    d7: { dir: "flat", pct: 0.1 },
    d30: { dir: "down", pct: -1.6 },
    d90: { dir: "up", pct: 2.4 },
    volatility: "medium",
    explanation:
      "Western Pacific catch is steady; sashimi grade premium narrows as Japanese demand eases post-season.",
    series: [
      { label: "W1", index: 104 },
      { label: "W3", index: 103 },
      { label: "W5", index: 102 },
      { label: "W7", index: 102 },
      { label: "W9", index: 102 },
      { label: "W11", index: 102 },
    ],
  },
  Crab: {
    category: "Crab",
    currentIndex: 134,
    d7: { dir: "up", pct: 2.6 },
    d30: { dir: "up", pct: 8.0 },
    d90: { dir: "up", pct: 15.2 },
    volatility: "high",
    explanation:
      "Quota cuts in the Sea of Okhotsk and ongoing sanctions complexity tighten king crab availability.",
    series: [
      { label: "W1", index: 116 },
      { label: "W3", index: 121 },
      { label: "W5", index: 125 },
      { label: "W7", index: 128 },
      { label: "W9", index: 131 },
      { label: "W11", index: 134 },
    ],
  },
  "Squid & Octopus": {
    category: "Squid & Octopus",
    currentIndex: 107,
    d7: { dir: "up", pct: 0.9 },
    d30: { dir: "up", pct: 3.1 },
    d90: { dir: "down", pct: -1.4 },
    volatility: "medium",
    explanation:
      "Argentine illex season ending; Moroccan octopus quota recently revised, slowing Iberian inflows.",
    series: [
      { label: "W1", index: 105 },
      { label: "W3", index: 105 },
      { label: "W5", index: 106 },
      { label: "W7", index: 106 },
      { label: "W9", index: 107 },
      { label: "W11", index: 107 },
    ],
  },
};

// ── Country news per category ────────────────────────────────────────────────
export const countryNews: CountryNewsItem[] = [
  {
    id: "n1",
    countryCode: "NO",
    countryName: "Norway",
    countryFlag: "🇳🇴",
    tags: ["pricing", "regulation"],
    category: "Salmon",
    headline: "Norwegian salmon exports rise 6% in volume but margins tighten on resource rent tax",
    source: "Norwegian Seafood Council",
    publishedAt: "2 days ago",
    daysAgo: 2,
    summary: "Export value up year-on-year; producers signal tighter Q2 spot offers.",
    relevanceReason: "price",
  },
  {
    id: "n2",
    countryCode: "CL",
    countryName: "Chile",
    countryFlag: "🇨🇱",
    tags: ["pricing", "export"],
    category: "Salmon",
    headline: "Chilean salmon harvest accelerates ahead of US Lent demand",
    source: "Salmonexpert",
    publishedAt: "5 days ago",
    daysAgo: 5,
    summary: "Higher harvest pace expected to soften prices for North American buyers in 4–6 weeks.",
    relevanceReason: "availability",
  },
  {
    id: "n3",
    countryCode: "EC",
    countryName: "Ecuador",
    countryFlag: "🇪🇨",
    tags: ["pricing", "logistics"],
    category: "Shrimp",
    headline: "Ecuador shrimp pond yields strong as energy costs ease",
    source: "Undercurrent News",
    publishedAt: "1 day ago",
    daysAgo: 1,
    summary: "Lower input costs translate into stable FOB pricing through Q2.",
    relevanceReason: "price",
  },
  {
    id: "n4",
    countryCode: "IN",
    countryName: "India",
    countryFlag: "🇮🇳",
    tags: ["regulation", "export"],
    category: "Shrimp",
    headline: "Indian shrimp exporters await USDOC antidumping review outcome",
    source: "SeafoodSource",
    publishedAt: "4 days ago",
    daysAgo: 4,
    summary: "Pending review keeps US-bound contracts cautious; EU and MEA inflows continue normally.",
    relevanceReason: "compliance",
  },
  {
    id: "n5",
    countryCode: "RU",
    countryName: "Russia",
    countryFlag: "🇷🇺",
    tags: ["regulation", "export"],
    category: "Whitefish",
    headline: "Russia revises 2025 cod and haddock quotas downward",
    source: "Federal Agency for Fishery",
    publishedAt: "1 week ago",
    daysAgo: 7,
    summary: "Quota cut continues to support firm whitefish prices into Q3.",
    relevanceReason: "availability",
  },
  {
    id: "n6",
    countryCode: "IS",
    countryName: "Iceland",
    countryFlag: "🇮🇸",
    tags: ["seasonality", "pricing"],
    category: "Whitefish",
    headline: "Iceland fresh cod auction prices stable as winter quota fills",
    source: "Fiskistofa",
    publishedAt: "3 days ago",
    daysAgo: 3,
    summary: "Steady auction results keep European fresh cod offers predictable.",
    relevanceReason: "price",
  },
  {
    id: "n7",
    countryCode: "RU",
    countryName: "Russia",
    countryFlag: "🇷🇺",
    tags: ["regulation", "export"],
    category: "Crab",
    headline: "Sea of Okhotsk king crab quota tightens further for 2025",
    source: "TASS",
    publishedAt: "1 week ago",
    daysAgo: 7,
    summary: "Stricter quotas push spot prices upward, especially for Asian export lanes.",
    relevanceReason: "availability",
  },
  {
    id: "n8",
    countryCode: "PH",
    countryName: "Philippines",
    countryFlag: "🇵🇭",
    tags: ["seasonality", "logistics"],
    category: "Tuna",
    headline: "Philippine yellowfin landings rise on improving weather window",
    source: "BFAR",
    publishedAt: "2 days ago",
    daysAgo: 2,
    summary: "Better weather increases handline catch availability through April.",
    relevanceReason: "logistics",
  },
  {
    id: "n9",
    countryCode: "AR",
    countryName: "Argentina",
    countryFlag: "🇦🇷",
    tags: ["seasonality"],
    category: "Squid & Octopus",
    headline: "Argentine illex season nearing close, exporters prioritize EU contracts",
    source: "Pescare",
    publishedAt: "6 days ago",
    daysAgo: 6,
    summary: "Late-season inventory directed to long-standing European customers.",
    relevanceReason: "supplier_risk",
  },
  {
    id: "n10",
    countryCode: "MA",
    countryName: "Morocco",
    countryFlag: "🇲🇦",
    tags: ["regulation", "pricing"],
    category: "Squid & Octopus",
    headline: "Morocco maintains octopus moratorium periods, supply remains tight",
    source: "INRH",
    publishedAt: "1 week ago",
    daysAgo: 7,
    summary: "Conservation-driven closures sustain elevated Iberian landed prices.",
    relevanceReason: "compliance",
  },
];

// ── Countries affecting price ────────────────────────────────────────────────
export const countryImpact: Record<string, CountryImpact[]> = {
  Salmon: [
    { countryCode: "NO", countryName: "Norway", countryFlag: "🇳🇴", role: "supplier_country", impactPct: 38, reason: "Largest farmed Atlantic salmon producer; sets benchmark spot price." },
    { countryCode: "CL", countryName: "Chile", countryFlag: "🇨🇱", role: "competing_producer", impactPct: 22, reason: "Primary alternative supply for North American buyers." },
    { countryCode: "FO", countryName: "Faroe Islands", countryFlag: "🇫🇴", role: "competing_producer", impactPct: 8, reason: "Smaller volume, but premium quality benchmark." },
    { countryCode: "US", countryName: "United States", countryFlag: "🇺🇸", role: "demand_driver", impactPct: 18, reason: "Largest single import market; demand swings move global FOB." },
    { countryCode: "FR", countryName: "France", countryFlag: "🇫🇷", role: "demand_driver", impactPct: 14, reason: "Top European retail demand; smoked-salmon season pulls volume." },
  ],
  Shrimp: [
    { countryCode: "EC", countryName: "Ecuador", countryFlag: "🇪🇨", role: "supplier_country", impactPct: 34, reason: "Largest vannamei exporter; harvest cycle drives global benchmark." },
    { countryCode: "IN", countryName: "India", countryFlag: "🇮🇳", role: "competing_producer", impactPct: 24, reason: "Major HOSO and PD supplier; US trade actions move prices." },
    { countryCode: "VN", countryName: "Vietnam", countryFlag: "🇻🇳", role: "competing_producer", impactPct: 12, reason: "Value-added processing hub; absorbs raw material from neighbours." },
    { countryCode: "CN", countryName: "China", countryFlag: "🇨🇳", role: "demand_driver", impactPct: 18, reason: "Reprocessing and end-demand combined; biggest swing buyer." },
    { countryCode: "US", countryName: "United States", countryFlag: "🇺🇸", role: "demand_driver", impactPct: 12, reason: "Tariff and antidumping reviews directly hit landed cost." },
  ],
  Whitefish: [
    { countryCode: "RU", countryName: "Russia", countryFlag: "🇷🇺", role: "supplier_country", impactPct: 32, reason: "Largest cod and pollock quota holder in the Northern Pacific and Barents." },
    { countryCode: "NO", countryName: "Norway", countryFlag: "🇳🇴", role: "supplier_country", impactPct: 22, reason: "Co-manages Barents cod quota; Norwegian auctions set EU reference." },
    { countryCode: "IS", countryName: "Iceland", countryFlag: "🇮🇸", role: "supplier_country", impactPct: 14, reason: "Premium fresh cod benchmark; auction prices closely tracked." },
    { countryCode: "CN", countryName: "China", countryFlag: "🇨🇳", role: "export_port", impactPct: 18, reason: "Major reprocessor of Russian and Pacific cod for global resale." },
    { countryCode: "GB", countryName: "United Kingdom", countryFlag: "🇬🇧", role: "demand_driver", impactPct: 14, reason: "High structural demand for cod and haddock fish-and-chips." },
  ],
  Tuna: [
    { countryCode: "PH", countryName: "Philippines", countryFlag: "🇵🇭", role: "supplier_country", impactPct: 22, reason: "Large yellowfin handline and longline fleet; sashimi grade focus." },
    { countryCode: "ID", countryName: "Indonesia", countryFlag: "🇮🇩", role: "supplier_country", impactPct: 24, reason: "Key supplier for both EU and Japanese markets." },
    { countryCode: "VN", countryName: "Vietnam", countryFlag: "🇻🇳", role: "competing_producer", impactPct: 16, reason: "Strong loin processing capacity for EU-bound product." },
    { countryCode: "JP", countryName: "Japan", countryFlag: "🇯🇵", role: "demand_driver", impactPct: 22, reason: "Premium sashimi demand sets the high-grade benchmark." },
    { countryCode: "ES", countryName: "Spain", countryFlag: "🇪🇸", role: "demand_driver", impactPct: 16, reason: "Largest EU tuna processor and end-buyer." },
  ],
  Crab: [
    { countryCode: "RU", countryName: "Russia", countryFlag: "🇷🇺", role: "supplier_country", impactPct: 46, reason: "Dominant supplier of red king crab; quota cuts directly drive price." },
    { countryCode: "US", countryName: "United States", countryFlag: "🇺🇸", role: "competing_producer", impactPct: 18, reason: "Alaskan king crab; small volume but premium reference price." },
    { countryCode: "KR", countryName: "South Korea", countryFlag: "🇰🇷", role: "demand_driver", impactPct: 22, reason: "Largest single import market for live and frozen king crab." },
    { countryCode: "CN", countryName: "China", countryFlag: "🇨🇳", role: "demand_driver", impactPct: 14, reason: "Festive demand cycles cause sharp short-term price moves." },
  ],
  "Squid & Octopus": [
    { countryCode: "AR", countryName: "Argentina", countryFlag: "🇦🇷", role: "supplier_country", impactPct: 28, reason: "Illex argentinus season sets global squid reference." },
    { countryCode: "MA", countryName: "Morocco", countryFlag: "🇲🇦", role: "supplier_country", impactPct: 26, reason: "Common octopus quota and moratorium directly set landed price." },
    { countryCode: "MR", countryName: "Mauritania", countryFlag: "🇲🇷", role: "competing_producer", impactPct: 12, reason: "Alternative octopus origin during Moroccan closures." },
    { countryCode: "ES", countryName: "Spain", countryFlag: "🇪🇸", role: "demand_driver", impactPct: 22, reason: "Largest cephalopod consumer in the EU." },
    { countryCode: "JP", countryName: "Japan", countryFlag: "🇯🇵", role: "demand_driver", impactPct: 12, reason: "Stable premium demand for sushi-grade product." },
  ],
};

// ── Short market signals (procurement-relevant, brief) ───────────────────────
export const marketSignals: Record<string, MarketSignal[]> = {
  Salmon: [
    {
      id: "s1", kind: "supply", severity: "watch",
      text: "Norway: harvest weights below 5-year average for week 11",
      publishedAt: "2 days ago",
      context: "Norwegian Seafood Council reports week 11 average harvest weights ~4.2 kg vs 5-year norm of 4.6 kg, driven by colder sea temperatures and tighter biological growth limits in regions PO3–PO5.",
      meaning: "Lower average weights reduce availability of premium 4–5 kg+ size grades — the segment most relevant for portion-cut and fillet programs. Expect upward pressure on superior-grade prices over the next 2–4 weeks.",
      actions: [
        "Lock in volumes for premium size grades (4–6 kg) sooner rather than later",
        "Consider Faroe Islands or Chilean fillet as a partial substitute for spot needs",
        "Re-confirm size-grade tolerance with this supplier before committing",
      ],
      updates: [
        { id: "s1-u1", publishedAt: "6h ago", headline: "Week 12 weights still trailing 5-yr average by ~7%", body: "Norwegian Seafood Council preliminary data confirms continued size-grade tightness in PO3–PO5." },
        { id: "s1-u2", publishedAt: "2d ago", headline: "Premium 5–6 kg spot prices firm +3% week-on-week" },
      ],
    },
    {
      id: "s2", kind: "demand", severity: "info",
      text: "EU retail promotions ramping for Easter window",
      publishedAt: "5 days ago",
      context: "Major EU retail chains (Germany, France, Benelux) have published Easter promotional calendars with elevated salmon volumes versus 2024.",
      meaning: "Demand-side pull in EU retail typically tightens Norwegian fillet availability 2–3 weeks before Easter. This offer's price window may narrow as retail orders consolidate.",
      actions: [
        "If your Easter program is still open, request a firm price from this supplier this week",
        "Avoid waiting for spot dips — promo windows historically remove that downside",
      ],
    },
    {
      id: "s3", kind: "logistics", severity: "info",
      text: "Air freight Oslo–USA capacity normal",
      publishedAt: "1 day ago",
      context: "OSL cargo capacity for fresh salmon to JFK/MIA tracking at 5-year seasonal average; rates stable week-on-week.",
      meaning: "Air freight is not a price-risk factor for this offer right now. Logistics cost projections in the supplier quote can be treated as reliable for the next 7–14 days.",
      actions: [
        "Use current freight quote as a stable input in your landed-cost model",
      ],
    },
  ],
  Shrimp: [
    {
      id: "s4", kind: "supply", severity: "info",
      text: "Ecuador pond yields stable; large counts well supplied",
      publishedAt: "3 days ago",
      context: "Ecuadorian producer associations report normal pond cycles; 30/40 and 40/50 counts well covered through Q2.",
      meaning: "Supply stability supports negotiating leverage on large-count programs. Limited urgency to commit forward beyond your normal coverage horizon.",
      actions: [
        "Negotiate against 2–3 Ecuadorian suppliers before committing",
        "Hold on extending forward cover beyond 60 days",
      ],
    },
    {
      id: "s5", kind: "regulation", severity: "watch",
      text: "USDOC antidumping review on Indian shrimp pending",
      publishedAt: "1 week ago",
      context: "US Department of Commerce administrative review on Indian shrimp imports underway; preliminary determination expected within 6–8 weeks.",
      meaning: "If your downstream customer is US-bound, an adverse ruling could shift demand toward Ecuadorian and Vietnamese origin — tightening this offer's pricing window.",
      actions: [
        "Confirm origin requirements with end customer",
        "Track preliminary determination date and re-evaluate cover before publication",
      ],
    },
  ],
  Whitefish: [
    {
      id: "s6", kind: "supply", severity: "alert",
      text: "Barents cod quota down again; substitution plans recommended",
      publishedAt: "1 week ago",
      context: "ICES advice and Joint Russian-Norwegian Fisheries Commission set Barents cod TAC down ~20% YoY for 2025, the third consecutive cut.",
      meaning: "Structural tightening of Atlantic cod supply will continue to push prices upward through 2025. Programs reliant on Atlantic cod loins/fillets should evaluate substitution.",
      actions: [
        "Evaluate Pacific cod and haddock as partial substitutes",
        "Lock multi-month volumes early; spot exposure carries material price risk",
        "Re-price downstream contracts that index to Atlantic cod",
      ],
    },
    {
      id: "s7", kind: "logistics", severity: "info",
      text: "Iceland–EU airfreight reliable through April",
      publishedAt: "4 days ago",
      context: "KEF cargo schedules confirmed; no disruption from spring weather pattern.",
      meaning: "Fresh whitefish flows from Iceland are operationally reliable for this offer's delivery window.",
      actions: ["Treat lead times in supplier quote as firm"],
    },
  ],
  Tuna: [
    {
      id: "s8", kind: "supply", severity: "info",
      text: "Western Pacific landings improving with weather",
      publishedAt: "6 days ago",
      context: "WCPFC reporting recovery in skipjack and yellowfin landings after Q1 weather disruptions.",
      meaning: "Improved landings ease supply tightness on yellowfin loin programs. Slight downward pressure on raw material cost expected over 2–4 weeks.",
      actions: ["Delay non-urgent forward cover to capture potential softening"],
    },
    {
      id: "s9", kind: "demand", severity: "info",
      text: "Japan post-season demand softening",
      publishedAt: "1 week ago",
      context: "Japanese sashimi-grade demand normalizing post-season; auction prices at Toyosu trending sideways to lower.",
      meaning: "Reduced premium-segment competition supports negotiating leverage on this offer.",
      actions: ["Push for an additional price concession in current quote"],
    },
  ],
  Crab: [
    {
      id: "s10", kind: "supply", severity: "alert",
      text: "Russian Far East quota cut: secure forward cover early",
      publishedAt: "5 days ago",
      context: "Russian Federal Fisheries Agency announced reduced TAC for snow crab in Far East zones; estimated 15% YoY cut.",
      meaning: "Snow crab availability for export markets will tighten in H2. This offer's window may not be repeatable at current pricing for 2026 contracts.",
      actions: [
        "Secure forward cover for confirmed customer commitments now",
        "Document all sanctions-screening for non-Russian destinations",
      ],
    },
    {
      id: "s11", kind: "regulation", severity: "watch",
      text: "Sanctions complexity remains for some destinations",
      publishedAt: "2 weeks ago",
      context: "OFAC and EU sanctions guidance on Russian-origin crab products continues to evolve; destination-specific compliance required.",
      meaning: "Compliance risk varies by destination market. This offer requires explicit sanctions-screening before commitment.",
      actions: [
        "Verify end-destination eligibility with compliance",
        "Request supplier's sanctions-clearance documentation",
      ],
    },
  ],
  "Squid & Octopus": [
    {
      id: "s12", kind: "supply", severity: "watch",
      text: "Illex season closing; expect forward shortages",
      publishedAt: "4 days ago",
      context: "Argentine Illex squid season approaching seasonal close; landings tracking below 2024 by ~12%.",
      meaning: "Forward Illex availability through Q3 will be limited. Programs relying on Illex tubes/rings should plan substitution to Loligo or Pacific squid.",
      actions: [
        "Lock confirmed Illex needs from current production",
        "Qualify Loligo as substitute SKU before season-end shortage",
      ],
    },
    {
      id: "s13", kind: "regulation", severity: "info",
      text: "Moroccan moratorium dates published for next quarter",
      publishedAt: "1 week ago",
      context: "Moroccan government published octopus fishery moratorium calendar; standard biological-rest periods confirmed.",
      meaning: "No surprise risk on Moroccan octopus availability — moratorium periods can be planned around for this offer.",
      actions: ["Align delivery schedule with published opening windows"],
    },
  ],
};

// ── Related Requests block (mock RFQs) ───────────────────────────────────────
export interface RelatedRequest {
  id: string;
  product: string;
  origin?: string;
  volume: string;
  buyerCountry: string;
  buyerCountryFlag: string;
  postedAgo: string;
  category: string;
}

export const relatedRequests: RelatedRequest[] = [
  { id: "r1", product: "Atlantic Salmon Fillet, IQF, 4–5 lb", volume: "20 t / month", buyerCountry: "Germany", buyerCountryFlag: "🇩🇪", postedAgo: "3h ago", category: "Salmon", origin: "Norway / Faroe" },
  { id: "r2", product: "Vannamei HOSO 30/40", volume: "40 ft container", buyerCountry: "Spain", buyerCountryFlag: "🇪🇸", postedAgo: "5h ago", category: "Shrimp", origin: "Ecuador / India" },
  { id: "r3", product: "Cod Loin Skinless Boneless", volume: "10 t spot", buyerCountry: "United Kingdom", buyerCountryFlag: "🇬🇧", postedAgo: "1d ago", category: "Whitefish", origin: "Iceland" },
  { id: "r4", product: "Yellowfin Tuna Loin Grade A", volume: "2 t / month", buyerCountry: "France", buyerCountryFlag: "🇫🇷", postedAgo: "2d ago", category: "Tuna" },
  { id: "r5", product: "Octopus T4 Cleaned", volume: "5 t spot", buyerCountry: "Italy", buyerCountryFlag: "🇮🇹", postedAgo: "2d ago", category: "Squid & Octopus", origin: "Morocco" },
  { id: "r6", product: "King Crab Clusters", volume: "1 t spot", buyerCountry: "South Korea", buyerCountryFlag: "🇰🇷", postedAgo: "3d ago", category: "Crab" },
];

export const getPriceTrend = (category: string) => priceTrends[category] ?? null;
export const getCountryNews = (category: string) =>
  countryNews.filter((n) => n.category === category);
export const getCountryImpact = (category: string) => countryImpact[category] ?? [];
export const getMarketSignals = (category: string) => marketSignals[category] ?? [];
export const getRelatedRequests = (category?: string) =>
  category ? relatedRequests.filter((r) => r.category === category) : relatedRequests;
