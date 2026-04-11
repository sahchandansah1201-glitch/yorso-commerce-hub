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
  format: "Frozen" | "Fresh" | "Chilled";
  packaging: string;
  certifications: string[];
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
    image: "/offers/salmon.jpg",
    category: "Salmon",
    format: "Frozen",
    packaging: "10 kg carton",
    certifications: ["HACCP", "ASC"],
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
    image: "/offers/shrimp.jpg",
    category: "Shrimp",
    format: "Frozen",
    packaging: "20 kg master carton",
    certifications: ["HACCP", "BAP"],
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
    image: "/offers/cod.jpg",
    category: "Whitefish",
    format: "Fresh",
    packaging: "5 kg styrofoam",
    certifications: ["MSC", "HACCP"],
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
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=450&fit=crop",
    category: "Tuna",
    format: "Chilled",
    packaging: "10 kg vacuum pack",
    certifications: ["HACCP"],
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
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600&h=450&fit=crop",
    category: "Crab",
    format: "Frozen",
    packaging: "10 kg carton",
    certifications: ["HACCP", "MSC"],
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
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
    category: "Squid",
    format: "Frozen",
    packaging: "20 kg block",
    certifications: ["HACCP"],
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
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&h=450&fit=crop",
    category: "Whitefish",
    format: "Frozen",
    packaging: "10 kg IQF carton",
    certifications: ["HACCP", "BAP"],
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
    image: "https://images.unsplash.com/photo-1535140728325-a4d3707eee61?w=600&h=450&fit=crop",
    category: "Whitefish",
    format: "Frozen",
    packaging: "10 kg IVP carton",
    certifications: ["HACCP", "ASC", "BRC"],
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
    quote: "After losing $40K on Alibaba to a supplier who swapped product in the container, I swore off marketplaces. YORSO was different — I verified the factory before ordering, and they never hid the supplier's direct phone number. That changed everything.",
    name: "Marcus Hendriksen",
    role: "Procurement Director",
    company: "Nordic Fish Import AB",
    country: "Sweden",
    painTag: "Bait-and-switch survivor",
  },
  {
    quote: "My CFO asked why we pay 12% above market on shrimp. I had no answer — we'd been using the same broker for years. Now I walk into board meetings with YORSO's benchmark data and negotiate from strength. Last quarter we saved $180K.",
    name: "Sofia Chen",
    role: "Supply Chain Manager",
    company: "Pacific Seafood Trading",
    country: "Singapore",
    painTag: "Price blindness → savings",
  },
  {
    quote: "When our Chilean salmon supplier had a force majeure mid-season, we needed 20 tonnes in 48 hours. Previously that meant panicking at trade shows. On YORSO, we found three verified alternatives overnight and shipped on time.",
    name: "Jean-Pierre Moreau",
    role: "Import Manager",
    company: "Marée Fraîche SARL",
    country: "France",
    painTag: "Emergency sourcing",
  },
];

export const faqItems = [
  {
    question: "What's the catch? Will you charge commission later or sell my data?",
    answer: "No catch. YORSO charges 0% commission on your deals — today and always. We monetize through optional premium tools (analytics, priority placement for suppliers), never from your margin. Your data is yours: we're GDPR-compliant and will never sell or share it with third parties.",
  },
  {
    question: "I already have trusted suppliers. Why would I need a platform?",
    answer: "Your current suppliers aren't going anywhere. YORSO gives you leverage: compare prices across 48 countries, discover backup suppliers before your single-source fails you at 2 AM, and negotiate from a position of knowledge — not dependency. Most buyers start using YORSO alongside existing relationships, not instead of them.",
  },
  {
    question: "How do I know suppliers are real and not just another Alibaba scam?",
    answer: "Every verified supplier passes a multi-step review: business licenses, export documentation, facility certifications (HACCP, BRC, MSC), and trade references. We've rejected thousands of applications. Unlike Alibaba's \"Gold Supplier\" pay-to-play badges, our verification is earned, not bought.",
  },
  {
    question: "We're in peak season — we don't have time to learn a new system.",
    answer: "Registration takes 5 minutes. No training, no IT department, no integrations required. Average time from signup to first supplier contact is under 1 hour. If you can use email, you can use YORSO.",
  },
  {
    question: "Software can't smell fish. I need physical quality control.",
    answer: "Agreed — and we'd never tell you otherwise. YORSO doesn't replace your QC process. It replaces the weeks of emails, Excel spreadsheets, and trade show trips you spend finding and comparing suppliers. You still inspect, negotiate, and decide. We just get you to the right shortlist 10x faster.",
  },
  {
    question: "Will my competitors see what I'm buying or who I'm talking to?",
    answer: "Never. Your activity, inquiries, and supplier conversations are 100% private. Suppliers see your company profile only when you choose to contact them. No public purchase history, no competitor intelligence leaks.",
  },
  {
    question: "How does YORSO handle security and compliance?",
    answer: "YORSO is fully GDPR-compliant with data stored in EU-based infrastructure. All communications are encrypted in transit and at rest. We conduct regular security audits, and supplier verification includes compliance checks for export regulations, food safety standards (HACCP, BRC, IFS), and trade sanctions screening. Your data is never shared or sold to third parties.",
  },
];
