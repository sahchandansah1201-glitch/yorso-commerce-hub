export interface SeafoodOffer {
  id: string;
  productName: string;
  species: string;
  latinName: string;
  origin: string;
  originFlag: string;
  supplierName: string;
  isVerified: boolean;
  priceRange: string;
  priceUnit: string;
  moq: string;
  freshness: string;
  image: string;
  category: string;
}

export const mockOffers: SeafoodOffer[] = [
  {
    id: "1",
    productName: "Atlantic Salmon Fillet",
    species: "Atlantic Salmon",
    latinName: "Salmo salar",
    origin: "Norway",
    originFlag: "🇳🇴",
    supplierName: "Nordic Seafood AS",
    isVerified: true,
    priceRange: "$8.50 – $9.20",
    priceUnit: "per kg",
    moq: "MOQ: 1,000 kg",
    freshness: "Updated 2h ago",
    image: "/images/salmon-fillet.jpg",
    category: "Salmon",
  },
  {
    id: "2",
    productName: "Vannamei Shrimp HOSO",
    species: "White Shrimp",
    latinName: "Litopenaeus vannamei",
    origin: "Ecuador",
    originFlag: "🇪🇨",
    supplierName: "Pacífico Export S.A.",
    isVerified: true,
    priceRange: "$5.80 – $6.40",
    priceUnit: "per kg",
    moq: "MOQ: 5,000 kg",
    freshness: "Listed today",
    image: "/images/shrimp-vannamei.jpg",
    category: "Shrimp",
  },
  {
    id: "3",
    productName: "Cod Loin Skinless Boneless",
    species: "Atlantic Cod",
    latinName: "Gadus morhua",
    origin: "Iceland",
    originFlag: "🇮🇸",
    supplierName: "Ísland Fish ehf",
    isVerified: true,
    priceRange: "$11.00 – $12.50",
    priceUnit: "per kg",
    moq: "MOQ: 2,000 kg",
    freshness: "Updated 5h ago",
    image: "/images/cod-loin.jpg",
    category: "Whitefish",
  },
  {
    id: "4",
    productName: "Yellowfin Tuna Loin Grade A",
    species: "Yellowfin Tuna",
    latinName: "Thunnus albacares",
    origin: "Philippines",
    originFlag: "🇵🇭",
    supplierName: "Gen. Santos Tuna Corp.",
    isVerified: false,
    priceRange: "$9.50 – $11.00",
    priceUnit: "per kg",
    moq: "MOQ: 500 kg",
    freshness: "Updated 1d ago",
    image: "/images/tuna-loin.jpg",
    category: "Tuna",
  },
  {
    id: "5",
    productName: "King Crab Clusters",
    species: "Red King Crab",
    latinName: "Paralithodes camtschaticus",
    origin: "Russia",
    originFlag: "🇷🇺",
    supplierName: "Kamchatka Seafood LLC",
    isVerified: true,
    priceRange: "$28.00 – $32.00",
    priceUnit: "per kg",
    moq: "MOQ: 200 kg",
    freshness: "Listed today",
    image: "/images/king-crab.jpg",
    category: "Crab",
  },
  {
    id: "6",
    productName: "Squid Tube & Tentacle",
    species: "Illex Squid",
    latinName: "Illex argentinus",
    origin: "Argentina",
    originFlag: "🇦🇷",
    supplierName: "Mar del Plata Pesca",
    isVerified: true,
    priceRange: "$3.20 – $3.80",
    priceUnit: "per kg",
    moq: "MOQ: 10,000 kg",
    freshness: "Updated 8h ago",
    image: "/images/squid-tube.jpg",
    category: "Squid",
  },
  {
    id: "7",
    productName: "Mahi Mahi Portion 6oz",
    species: "Dolphinfish",
    latinName: "Coryphaena hippurus",
    origin: "Peru",
    originFlag: "🇵🇪",
    supplierName: "Pesquera del Pacífico",
    isVerified: false,
    priceRange: "$7.00 – $7.80",
    priceUnit: "per kg",
    moq: "MOQ: 3,000 kg",
    freshness: "Updated 3h ago",
    image: "/images/mahi-mahi.jpg",
    category: "Whitefish",
  },
  {
    id: "8",
    productName: "Pangasius Fillet Well-Trimmed",
    species: "Pangasius",
    latinName: "Pangasianodon hypophthalmus",
    origin: "Vietnam",
    originFlag: "🇻🇳",
    supplierName: "Mekong Delta Foods",
    isVerified: true,
    priceRange: "$2.40 – $2.90",
    priceUnit: "per kg",
    moq: "MOQ: 20,000 kg",
    freshness: "Updated 1h ago",
    image: "/images/pangasius.jpg",
    category: "Whitefish",
  },
];

export const categories = [
  { name: "Salmon", icon: "🐟", count: 245 },
  { name: "Shrimp", icon: "🦐", count: 312 },
  { name: "Whitefish", icon: "🐠", count: 189 },
  { name: "Tuna", icon: "🐟", count: 156 },
  { name: "Crab", icon: "🦀", count: 87 },
  { name: "Squid & Octopus", icon: "🦑", count: 134 },
  { name: "Shellfish", icon: "🦪", count: 98 },
  { name: "Surimi", icon: "🍥", count: 67 },
];

export const marketplaceStats = {
  totalOffers: 1247,
  verifiedSuppliers: 380,
  countries: 48,
  activeBuyers: 2100,
};

export const activityFeed = [
  { type: "new_listing" as const, text: "New listing: Frozen Pollock Fillet from Russia", time: "3 min ago" },
  { type: "new_supplier" as const, text: "New verified supplier: Thai Union Seafood (Thailand)", time: "12 min ago" },
  { type: "price_update" as const, text: "Price updated: Atlantic Mackerel HG — Norway", time: "18 min ago" },
  { type: "new_listing" as const, text: "New listing: Black Tiger Shrimp HLSO from Bangladesh", time: "25 min ago" },
  { type: "new_supplier" as const, text: "New supplier joined: Hokkaido Fisheries (Japan)", time: "34 min ago" },
  { type: "price_update" as const, text: "Price updated: Vannamei Shrimp PD — India", time: "41 min ago" },
  { type: "new_listing" as const, text: "New listing: Frozen Hake Fillet from Chile", time: "52 min ago" },
  { type: "new_supplier" as const, text: "New verified supplier: Austral Fisheries (Australia)", time: "1h ago" },
];

export const testimonials = [
  {
    quote: "YORSO cut our sourcing time by 60%. We found three verified shrimp suppliers from Ecuador within a week.",
    name: "Marcus Hendriksen",
    role: "Procurement Director",
    company: "Nordic Fish Import AB",
    country: "Sweden",
  },
  {
    quote: "The verified supplier badges give us confidence. We've sourced over 200 tonnes of salmon through the platform.",
    name: "Sofia Chen",
    role: "Supply Chain Manager",
    company: "Pacific Seafood Trading",
    country: "Singapore",
  },
  {
    quote: "Finally, a B2B seafood platform that actually has real offers with real prices. Not just a directory.",
    name: "Jean-Pierre Moreau",
    role: "Import Manager",
    company: "Marée Fraîche SARL",
    country: "France",
  },
];

export const faqItems = [
  {
    question: "Is registration free?",
    answer: "Yes. Creating a buyer account on YORSO is completely free. You can browse offers, compare suppliers, and contact verified sellers at no cost.",
  },
  {
    question: "How are suppliers verified?",
    answer: "Our verification team reviews business documents, export licenses, facility certifications, and trade references. Verified suppliers display a badge and have passed our due diligence process.",
  },
  {
    question: "What products are available?",
    answer: "YORSO covers all major seafood categories: salmon, shrimp, whitefish, tuna, crab, squid, shellfish, surimi, and more. Products span fresh, frozen, and processed formats from 48+ countries.",
  },
  {
    question: "Can I negotiate prices directly?",
    answer: "Yes. YORSO connects you directly with suppliers. Once registered, you can request quotes, negotiate terms, and arrange shipments on your own commercial terms.",
  },
  {
    question: "How do I know offers are current?",
    answer: "Every offer displays a freshness timestamp showing when it was last updated. Offers that haven't been refreshed within 14 days are automatically flagged or removed.",
  },
  {
    question: "Is my business information protected?",
    answer: "Absolutely. Your company details are only shared with suppliers you choose to contact. We comply with GDPR and international data protection standards.",
  },
];
