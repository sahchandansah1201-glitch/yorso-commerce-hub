export type Language = "en" | "ru" | "es";

export const languageNames: Record<Language, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
};

export const languageFlags: Record<Language, string> = {
  en: "🇬🇧",
  ru: "🇷🇺",
  es: "🇪🇸",
};

type TranslationKeys = {
  // Header
  nav_liveOffers: string;
  nav_categories: string;
  nav_howItWorks: string;
  nav_faq: string;
  nav_signIn: string;
  nav_registerFree: string;

  // Hero
  hero_title1: string;
  hero_title2: string;
  hero_subtitle: string;
  hero_searchPlaceholder: string;
  hero_searchBtn: string;
  hero_popular: string;
  hero_registerFree: string;
  hero_exploreLiveOffers: string;
  hero_liveOffers: string;
  hero_verifiedSuppliers: string;
  hero_countries: string;
  hero_activeBuyers: string;

  // Live Offers
  offers_liveMarketplace: string;
  offers_title: string;
  offers_subtitle: string;
  offers_viewAll: string;
  offers_viewAllMobile: string;
  offers_showMore: string;
  offers_showLess: string;
  offers_listLabel: string;
  offers_cardLabel: string;

  // Offer Card
  card_verified: string;
  card_viewOffer: string;
  card_perKg: string;
  card_frozen: string;
  card_fresh: string;
  card_chilled: string;
  card_updatedAgo: string;
  card_listedToday: string;

  // Certifications modal
  cert_issuer: string;
  cert_officialWebsite: string;

  // Trust Strip
  trust_liveOffers: string;
  trust_verifiedSuppliers: string;
  trust_countries: string;
  trust_activeBuyers: string;
  trust_liveOffersDetail: string;
  trust_verifiedSuppliersDetail: string;
  trust_countriesDetail: string;
  trust_activeBuyersDetail: string;
  trust_unlikeOthers: string;
  trust_zeroCommission: string;
  trust_directContacts: string;
  trust_verificationEarned: string;

  // Value Split
  value_title: string;
  value_subtitle: string;
  value_forBuyers: string;
  value_forSuppliers: string;
  value_buyerHeadline: string;
  value_supplierHeadline: string;
  value_registerBuyer: string;
  value_registerSupplier: string;
  value_buyerBenefits: { title: string; desc: string }[];
  value_supplierBenefits: { title: string; desc: string }[];

  // Category
  cat_title: string;
  cat_subtitle: string;
  cat_offers: string;
  cat_names: Record<string, string>;
  species_names: Record<string, string>;
  species_descriptors: Record<string, string>;

  // Supplier Verification
  verify_title: string;
  verify_subtitle: string;
  verify_steps: { title: string; desc: string; unlike: string }[];
  verify_failTitle: string;
  verify_failDesc: string;
  verify_ctaHint: string;
  verify_ctaBtn: string;

  // Marketplace Activity
  activity_live: string;
  activity_title: string;
  activity_subtitle: string;
  activity_footer: string;
  activity_feed: { text: string; time: string }[];

  // Social Proof
  social_title: string;
  social_subtitle: string;
  social_testimonials: {
    quote: string;
    name: string;
    role: string;
    company: string;
    country: string;
    painTag: string;
  }[];

  // FAQ
  faq_title: string;
  faq_subtitle: string;
  faq_items: { question: string; answer: string }[];

  // Final CTA
  cta_title1: string;
  cta_title2: string;
  cta_subtitle: string;
  cta_registerFree: string;
  cta_freeNote: string;
  cta_verifiedSuppliers: string;
  cta_zeroCommission: string;
  cta_directContacts: string;

  // Footer
  footer_desc: string;
  footer_worldwide: string;
  footer_copyright: string;
  footer_registered: string;
  footer_platform: string;
  footer_company: string;
  footer_legal: string;
  footer_links: {
    platform: { label: string; href: string }[];
    company: { label: string; href: string }[];
    legal: { label: string; href: string }[];
  };

  // ─── Registration ──────────────────────────────────────────────
  reg_joinYorso: string;
  reg_chooseSubtitle: string;
  reg_imBuyer: string;
  reg_imSupplier: string;
  reg_buyerSubtitle: string;
  reg_supplierSubtitle: string;
  reg_buyerFeatures: string[];
  reg_supplierFeatures: string[];
  reg_enterEmail: string;
  reg_emailSubtitle: string;
  reg_emailPlaceholder: string;
  reg_emailInvalid: string;
  reg_continue: string;
  reg_checking: string;
  reg_couldNotContinue: string;
  reg_byContAgreeTo: string;
  reg_terms: string;
  reg_and: string;
  reg_privacyPolicy: string;
  reg_checkInbox: string;
  reg_codeSentTo: string;
  reg_enterFullCode: string;
  reg_verifyAndContinue: string;
  reg_verifying: string;
  reg_verificationFailed: string;
  reg_didntReceive: string;
  reg_codeResent: string;
  reg_codeResentDesc: string;
  reg_tellAboutYourself: string;
  reg_detailsSubtitleBuyer: string;
  reg_detailsSubtitleSupplier: string;
  reg_fullName: string;
  reg_companyName: string;
  reg_country: string;
  reg_autoDetected: string;
  reg_selectCountry: string;
  reg_vatTin: string;
  reg_vatPlaceholder: string;
  reg_vatDescBuyer: string;
  reg_vatDescSupplier: string;
  reg_phoneNumber: string;
  reg_phoneDesc: string;
  reg_sendCode: string;
  reg_codeSentEnter: string;
  reg_smsCode: string;
  reg_verify: string;
  reg_invalidCodeRetry: string;
  reg_resendCode: string;
  reg_verified: string;
  reg_or: string;
  reg_verifyViaWhatsApp: string;
  reg_whatsAppCodeDesc: string;
  reg_codeSentToast: string;
  reg_codeSentToastDesc: string;
  reg_phoneVerifiedWhatsApp: string;
  reg_phoneVerifiedWhatsAppDesc: string;
  reg_phoneVerified: string;
  reg_phoneVerifiedDesc: string;
  reg_invalidCode: string;
  reg_invalidCodeDesc: string;
  reg_password: string;
  reg_passwordPlaceholder: string;
  reg_saving: string;
  reg_enterFullName: string;
  reg_enterCompanyName: string;
  reg_minChars: string;
  reg_selectCountryErr: string;
  reg_enterValidVat: string;
  reg_enterPhoneNumber: string;
  reg_verifyPhoneNumber: string;
  reg_enterValidPhone: string;
  reg_enterCodeFromSms: string;
  // Onboarding
  reg_whatDoYouSource: string;
  reg_whatDoYouOffer: string;
  reg_onboardingSubtitleBuyer: string;
  reg_onboardingSubtitleSupplier: string;
  reg_productCategories: string;
  reg_businessType: string;
  reg_selectAllApply: string;
  reg_certifications: string;
  reg_monthlyVolumeBuyer: string;
  reg_monthlyVolumeSupplier: string;
  reg_skipForNow: string;
  // Countries
  reg_whereSourceFrom: string;
  reg_whereExportTo: string;
  reg_countriesSubtitleBuyer: string;
  reg_countriesSubtitleSupplier: string;
  reg_showAllCountries: string;
  reg_countriesSelected: string;
  reg_countrySelected: string;
  reg_completeSetup: string;
  // Ready
  reg_welcome: string;
  reg_profileComplete: string;
  reg_yourProfile: string;
  reg_buyer: string;
  reg_supplier: string;
  reg_category: string;
  reg_categories: string;
  reg_market: string;
  reg_markets: string;
  reg_certification: string;
  reg_certificationsLabel: string;
  reg_matchingOffers: string;
  reg_whatsNext: string;
  reg_exploreOffers: string;
  reg_createFirstOffer: string;
  // Registration layout
  reg_alreadyHaveAccount: string;
  reg_signIn: string;
  reg_help: string;

  // ─── Sign In ───────────────────────────────────────────────────
  signin_title: string;
  signin_subtitle: string;
  signin_email: string;
  signin_phone: string;
  signin_emailLabel: string;
  signin_passwordLabel: string;
  signin_forgotPassword: string;
  signin_passwordPlaceholder: string;
  signin_signInBtn: string;
  signin_phoneLabel: string;
  signin_or: string;
  signin_viaWhatsApp: string;
  signin_getCodeWhatsApp: string;
  signin_noAccount: string;
  signin_register: string;
  signin_back: string;
  signin_resetPassword: string;
  signin_resetSubtitle: string;
  signin_sendResetLink: string;
  signin_emailSent: string;
  signin_checkEmailInstructions: string;
  signin_backToSignIn: string;
  signin_fillAll: string;
  signin_enterPhonePassword: string;
  signin_enterValidPhone: string;
  signin_signedIn: string;
  signin_welcomeBack: string;
  signin_codeSentWhatsApp: string;
  signin_checkWhatsApp: string;
  signin_enterEmail: string;
  signin_emailSentToast: string;
  signin_emailSentToastDesc: string;

  // ─── Offers Listing ────────────────────────────────────────────
  offersPage_title: string;
  offersPage_subtitle: string;
  offersPage_searchPlaceholder: string;
  offersPage_backToHome: string;
  offersPage_showingAll: string;
  offersPage_registerToSee: string;

  // ─── Offer Detail ──────────────────────────────────────────────
  offerDetail_notFound: string;
  offerDetail_browseAll: string;
  offerDetail_home: string;
  offerDetail_offers: string;
  offerDetail_registerToContact: string;
  offerDetail_freeRegistration: string;

  // ─── Shared: TrustMicroText ────────────────────────────────────
  trustMicro_users: string;
  trustMicro_security: string;
  trustMicro_verified: string;
  trustMicro_global: string;
  trustMicro_growth: string;
  trustMicro_privacy: string;

  // ─── Shared: SocialProofBanner ─────────────────────────────────
  socialBanner_professionals: string;
  socialBanner_suppliers: string;
  socialBanner_zeroCom: string;
  socialBanner_trustedBy: string;
  socialBanner_detail: string;
};

// ─── ENGLISH ─────────────────────────────────────────────────────

const en: TranslationKeys = {
  // Header
  nav_liveOffers: "Live Offers",
  nav_categories: "Categories",
  nav_howItWorks: "How It Works",
  nav_faq: "FAQ",
  nav_signIn: "Sign In",
  nav_registerFree: "Register Free",

  // Hero
  hero_title1: "Verified Suppliers. Transparent Prices.",
  hero_title2: "Full Control Over Your Sourcing.",
  hero_subtitle: `Source wholesale seafood from {suppliers} verified suppliers across {countries} countries — with direct contacts, real prices, and zero commissions.`,
  hero_searchPlaceholder: "Search products — e.g. salmon fillet, vannamei shrimp...",
  hero_searchBtn: "Search",
  hero_popular: "Popular: Atlantic Salmon · Vannamei Shrimp · Cod Loin · King Crab",
  hero_registerFree: "Register Free",
  hero_exploreLiveOffers: "Explore Live Offers",
  hero_liveOffers: "live offers",
  hero_verifiedSuppliers: "verified suppliers",
  hero_countries: "countries",
  hero_activeBuyers: "active buyers",

  // Live Offers
  offers_liveMarketplace: "Live Marketplace",
  offers_title: "Wholesale Offers",
  offers_subtitle: "Fresh listings from verified suppliers worldwide — updated continuously",
  offers_viewAll: "View all offers",
  offers_viewAllMobile: "View All Offers",
  offers_showMore: "Show more offers",
  offers_showLess: "Show less",

  // Offer Card
  card_verified: "Verified",
  card_viewOffer: "View Offer",
  card_perKg: "per kg",
  card_frozen: "Frozen",
  card_fresh: "Fresh",
  card_chilled: "Chilled",
  card_updatedAgo: "Updated {time} ago",
  card_listedToday: "Listed today",
  cert_issuer: "Issuer",
  cert_officialWebsite: "Official website",

  // Trust Strip
  trust_liveOffers: "Live Offers",
  trust_verifiedSuppliers: "Verified Suppliers",
  trust_countries: "Countries",
  trust_activeBuyers: "Active Buyers",
  trust_liveOffersDetail: "updated daily from verified sources",
  trust_verifiedSuppliersDetail: "each passed 3-step due diligence",
  trust_countriesDetail: "from Norway to Vietnam",
  trust_activeBuyersDetail: "sourcing right now",
  trust_unlikeOthers: "Unlike other platforms:",
  trust_zeroCommission: "0% commission — your margins stay yours",
  trust_directContacts: "Direct contacts — always open, never gated",
  trust_verificationEarned: "Verification earned, not bought",

  // Value Split
  value_title: "Built for Both Sides of the Trade",
  value_subtitle: "Whether you're sourcing seafood or selling it, YORSO gives you the tools to trade with confidence.",
  value_forBuyers: "For Buyers",
  value_forSuppliers: "For Suppliers",
  value_buyerHeadline: "Source with confidence, not guesswork",
  value_supplierHeadline: "Sell directly, without the middleman tax",
  value_registerBuyer: "Register as Buyer",
  value_registerSupplier: "Register as Supplier",
  value_buyerBenefits: [
    { title: "Reduce Supply Risk", desc: "Pre-qualify backup suppliers before your main source fails. Compare verified alternatives across 48 countries." },
    { title: "Price Visibility", desc: "See real prices from multiple origins. Walk into negotiations with benchmark data, not guesswork." },
    { title: "Verified Suppliers Only", desc: "Every supplier passes document review, facility checks, and trade reference verification. No pay-to-play badges." },
    { title: "Faster Sourcing Decisions", desc: "Search, compare, and contact suppliers in hours — not weeks of emails and trade show follow-ups." },
  ],
  value_supplierBenefits: [
    { title: "Zero Commission", desc: "Keep 100% of your margins. No hidden fees, no percentage from deals. Direct buyer relationships." },
    { title: "Qualified Demand", desc: "Connect with verified procurement professionals actively sourcing your products right now." },
    { title: "Year-Round Visibility", desc: "Your offers are live 24/7 to buyers from 48+ countries. Not just during a 3-day trade show." },
    { title: "Build Trust Through Verification", desc: "Showcase your certifications and track record. Buyers contact verified suppliers first." },
  ],

  // Category
  cat_title: "Source by Species",
  cat_subtitle: "Real commercial species, real wholesale offers — recognise what you buy at a glance.",
  cat_offers: "offers",
  cat_names: { Salmon: "Salmon", Shrimp: "Shrimp", Whitefish: "Whitefish", Tuna: "Tuna", Crab: "Crab", "Squid & Octopus": "Squid & Octopus", Shellfish: "Shellfish", Surimi: "Surimi" },
  species_names: {
    atlanticSalmon: "Atlantic Salmon",
    cod: "Atlantic Cod",
    haddock: "Haddock",
    hake: "European Hake",
    seaBass: "Sea Bass",
    seaBream: "Sea Bream",
    yellowfinTuna: "Yellowfin Tuna",
    mackerel: "Atlantic Mackerel",
  },
  species_descriptors: {
    atlanticSalmon: "Farmed · Norway, Faroe",
    cod: "Wild-caught · Atlantic",
    haddock: "Wild-caught · North Sea",
    hake: "Wild-caught · Iberian",
    seaBass: "Farmed · Mediterranean",
    seaBream: "Farmed · Mediterranean",
    yellowfinTuna: "Loins · Sashimi grade",
    mackerel: "Wild-caught · Pelagic",
  },

  // Supplier Verification
  verify_title: "How Suppliers Are Verified",
  verify_subtitle: "Our verification is earned, not bought. Here's exactly what we check — and how it differs from what you've seen before.",
  verify_steps: [
    { title: "Application Review", desc: "Suppliers submit business registration, export licenses, and facility certifications (HACCP, BRC, MSC). Self-certification is not accepted.", unlike: "Unlike Alibaba's \"Gold Supplier\" that anyone can buy for $5K/year." },
    { title: "Due Diligence", desc: "Our team verifies company registration, checks trade references with real buyers, and confirms production capabilities and export history.", unlike: "Unlike directories where suppliers list themselves without any checks." },
    { title: "Verification Badge", desc: "Approved suppliers earn a verified badge visible on all offers. The badge is re-validated annually — it can be revoked if standards slip.", unlike: "Unlike pay-to-play badges that never expire regardless of performance." },
  ],
  verify_failTitle: "What happens if a supplier fails?",
  verify_failDesc: "Verified badges can be suspended or revoked. If a supplier receives quality complaints, fails annual re-verification, or breaches platform rules, their badge is removed and buyers are notified. We've rejected thousands of applications and suspended dozens of previously-verified suppliers.",
  verify_ctaHint: "Register to see full supplier profiles, certifications, and verification status.",
  verify_ctaBtn: "Register to Unlock Supplier Details",

  // Marketplace Activity
  activity_live: "Live",
  activity_title: "Marketplace Activity",
  activity_subtitle: "Real-time updates — new listings, price changes, and supplier activity happening now.",
  activity_footer: "Updates refresh automatically · Showing latest activity across all categories",
  activity_feed: [
    { text: "New listing: Frozen Pollock Fillet from Russia", time: "3 min ago" },
    { text: "New verified supplier: Thai Union Seafood (Thailand)", time: "12 min ago" },
    { text: "Price updated: Atlantic Mackerel HG — Norway", time: "18 min ago" },
    { text: "New listing: Black Tiger Shrimp HLSO from Bangladesh", time: "25 min ago" },
    { text: "New supplier joined: Hokkaido Fisheries (Japan)", time: "34 min ago" },
    { text: "Price updated: Vannamei Shrimp PD — India", time: "41 min ago" },
    { text: "New listing: Frozen Hake Fillet from Chile", time: "52 min ago" },
    { text: "New verified supplier: Austral Fisheries (Australia)", time: "1h ago" },
  ],

  // Social Proof
  social_title: "From Skeptics to Power Users",
  social_subtitle: "Real stories from procurement pros who've been burned before — and found something better.",
  social_testimonials: [
    { quote: "After losing $40K on Alibaba to a supplier who swapped product in the container, I swore off marketplaces. YORSO was different — I verified the factory before ordering, and they never hid the supplier's direct phone number. That changed everything.", name: "Marcus Hendriksen", role: "Procurement Director", company: "Nordic Fish Import AB", country: "Sweden", painTag: "Bait-and-switch survivor" },
    { quote: "My CFO asked why we pay 12% above market on shrimp. I had no answer — we'd been using the same broker for years. Now I walk into board meetings with YORSO's benchmark data and negotiate from strength. Last quarter we saved $180K.", name: "Sofia Chen", role: "Supply Chain Manager", company: "Pacific Seafood Trading", country: "Singapore", painTag: "Price blindness → savings" },
    { quote: "When our Chilean salmon supplier had a force majeure mid-season, we needed 20 tonnes in 48 hours. Previously that meant panicking at trade shows. On YORSO, we found three verified alternatives overnight and shipped on time.", name: "Jean-Pierre Moreau", role: "Import Manager", company: "Marée Fraîche SARL", country: "France", painTag: "Emergency sourcing" },
  ],

  // FAQ
  faq_title: "Frequently Asked Questions",
  faq_subtitle: "Common questions from buyers evaluating YORSO for their sourcing needs.",
  faq_items: [
    { question: "What's the catch? Will you charge commission later or sell my data?", answer: "No catch. YORSO charges 0% commission on your deals — today and always. We monetize through optional premium tools (analytics, priority placement for suppliers), never from your margin. Your data is yours: we're GDPR-compliant and will never sell or share it with third parties." },
    { question: "I already have trusted suppliers. Why would I need a platform?", answer: "Your current suppliers aren't going anywhere. YORSO gives you leverage: compare prices across 48 countries, discover backup suppliers before your single-source fails you at 2 AM, and negotiate from a position of knowledge — not dependency. Most buyers start using YORSO alongside existing relationships, not instead of them." },
    { question: "How do I know suppliers are real and not just another Alibaba scam?", answer: "Every verified supplier passes a multi-step review: business licenses, export documentation, facility certifications (HACCP, BRC, MSC), and trade references. We've rejected thousands of applications. Unlike Alibaba's \"Gold Supplier\" pay-to-play badges, our verification is earned, not bought." },
    { question: "We're in peak season — we don't have time to learn a new system.", answer: "Registration takes 5 minutes. No training, no IT department, no integrations required. Average time from signup to first supplier contact is under 1 hour. If you can use email, you can use YORSO." },
    { question: "Software can't smell fish. I need physical quality control.", answer: "Agreed — and we'd never tell you otherwise. YORSO doesn't replace your QC process. It replaces the weeks of emails, Excel spreadsheets, and trade show trips you spend finding and comparing suppliers. You still inspect, negotiate, and decide. We just get you to the right shortlist 10x faster." },
    { question: "Will my competitors see what I'm buying or who I'm talking to?", answer: "Never. Your activity, inquiries, and supplier conversations are 100% private. Suppliers see your company profile only when you choose to contact them. No public purchase history, no competitor intelligence leaks." },
    { question: "How does YORSO handle security and compliance?", answer: "YORSO is fully GDPR-compliant with data stored in EU-based infrastructure. All communications are encrypted in transit and at rest. We conduct regular security audits, and supplier verification includes compliance checks for export regulations, food safety standards (HACCP, BRC, IFS), and trade sanctions screening. Your data is never shared or sold to third parties." },
  ],

  // Final CTA
  cta_title1: "Start Sourcing with",
  cta_title2: "Confidence",
  cta_subtitle: "Join thousands of procurement professionals who source seafood through verified suppliers, transparent pricing, and direct contacts — with zero commissions and no lock-in.",
  cta_registerFree: "Register Free",
  cta_freeNote: "Free for buyers · No credit card required · Setup in 5 minutes",
  cta_verifiedSuppliers: "380 verified suppliers",
  cta_zeroCommission: "0% commission",
  cta_directContacts: "Direct contacts always",

  // Footer
  footer_desc: "The global B2B seafood marketplace. Connecting professional buyers with verified suppliers across 48 countries — with transparent pricing, direct contacts, and zero commissions.",
  footer_worldwide: "Available worldwide · EN, ES, RU",
  footer_copyright: `© ${new Date().getFullYear()} YORSO B.V. All rights reserved.`,
  footer_registered: "Registered in the Netherlands · KVK 12345678",
  footer_platform: "Platform",
  footer_company: "Company",
  footer_legal: "Legal",
  footer_links: {
    platform: [
      { label: "Live Offers", href: "#offers" },
      { label: "Categories", href: "#categories" },
      { label: "Verified Suppliers", href: "#how-it-works" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
    company: [
      { label: "About YORSO", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Press & Media", href: "/press" },
      { label: "Partner Program", href: "/partners" },
    ],
    legal: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR Compliance", href: "/gdpr" },
      { label: "Anti-Fraud Policy", href: "/anti-fraud" },
    ],
  },

  // Registration
  reg_joinYorso: "Join YORSO",
  reg_chooseSubtitle: "Choose how you'll use the platform. It takes under 3 minutes.",
  reg_imBuyer: "I'm a Buyer",
  reg_imSupplier: "I'm a Supplier",
  reg_buyerSubtitle: "Source seafood from verified suppliers",
  reg_supplierSubtitle: "Reach qualified buyers worldwide",
  reg_buyerFeatures: ["Access 2,000+ verified offers", "Compare prices across 48 countries", "Contact suppliers directly — zero commission"],
  reg_supplierFeatures: ["Year-round visibility for your products", "Direct contact with verified buyers", "Zero commission on all deals"],
  reg_enterEmail: "Enter your business email",
  reg_emailSubtitle: "We'll send a verification code to confirm your identity.",
  reg_emailPlaceholder: "you@company.com",
  reg_emailInvalid: "Please enter a valid business email",
  reg_continue: "Continue",
  reg_checking: "Checking…",
  reg_couldNotContinue: "Could not continue",
  reg_byContAgreeTo: "By continuing, you agree to our",
  reg_terms: "Terms",
  reg_and: "and",
  reg_privacyPolicy: "Privacy Policy",
  reg_checkInbox: "Check your inbox",
  reg_codeSentTo: "We sent a 6-digit code to",
  reg_enterFullCode: "Please enter the full 6-digit code",
  reg_verifyAndContinue: "Verify & Continue",
  reg_verifying: "Verifying…",
  reg_verificationFailed: "Verification failed",
  reg_didntReceive: "Didn't receive the code? Resend",
  reg_codeResent: "Code resent",
  reg_codeResentDesc: "Check your inbox for a new code.",
  reg_tellAboutYourself: "Tell us about yourself",
  reg_detailsSubtitleBuyer: "We use your business details to set up your buyer profile and improve trust between marketplace participants.",
  reg_detailsSubtitleSupplier: "We use your business details to set up your supplier profile and improve trust between marketplace participants.",
  reg_fullName: "Full name",
  reg_companyName: "Company name",
  reg_country: "Country",
  reg_autoDetected: "(auto-detected)",
  reg_selectCountry: "Select country...",
  reg_vatTin: "VAT / TIN number",
  reg_vatPlaceholder: "e.g. DE123456789",
  reg_vatDescBuyer: "Needed for B2B invoicing and trade documentation.",
  reg_vatDescSupplier: "Required for supplier verification and marketplace credibility.",
  reg_phoneNumber: "Phone number",
  reg_phoneDesc: "Used for deal communication and to help prevent fake registrations.",
  reg_sendCode: "Send verification code",
  reg_codeSentEnter: "Code sent. Enter it below:",
  reg_smsCode: "SMS code",
  reg_verify: "Verify",
  reg_invalidCodeRetry: "Invalid code. Please try again.",
  reg_resendCode: "Resend code",
  reg_verified: "Verified",
  reg_or: "or",
  reg_verifyViaWhatsApp: "Verify via WhatsApp",
  reg_whatsAppCodeDesc: "We'll send a verification code to this number via WhatsApp",
  reg_codeSentToast: "Code sent",
  reg_codeSentToastDesc: "An SMS with a verification code has been sent to your number",
  reg_phoneVerifiedWhatsApp: "Phone verified via WhatsApp",
  reg_phoneVerifiedWhatsAppDesc: "Your number has been successfully verified",
  reg_phoneVerified: "Phone verified",
  reg_phoneVerifiedDesc: "Your number has been successfully verified",
  reg_invalidCode: "Invalid code",
  reg_invalidCodeDesc: "Please check the code from the SMS and try again",
  reg_password: "Password",
  reg_passwordPlaceholder: "Minimum 8 characters",
  reg_saving: "Saving…",
  reg_enterFullName: "Please enter your full name",
  reg_enterCompanyName: "Please enter your company name",
  reg_minChars: "Minimum 8 characters",
  reg_selectCountryErr: "Please select a country",
  reg_enterValidVat: "Please enter a valid VAT/TIN number",
  reg_enterPhoneNumber: "Please enter your phone number",
  reg_verifyPhoneNumber: "Please verify your phone number",
  reg_enterValidPhone: "Please enter a valid phone number",
  reg_enterCodeFromSms: "Please enter the code from the SMS",
  reg_whatDoYouSource: "What do you source?",
  reg_whatDoYouOffer: "What do you offer?",
  reg_onboardingSubtitleBuyer: "Select categories you're interested in. We'll show you relevant offers.",
  reg_onboardingSubtitleSupplier: "Tell us about your business so buyers can find you.",
  reg_productCategories: "Product categories",
  reg_businessType: "Business type",
  reg_selectAllApply: "(select all that apply)",
  reg_certifications: "Certifications",
  reg_monthlyVolumeBuyer: "Monthly sourcing volume",
  reg_monthlyVolumeSupplier: "Monthly production capacity",
  reg_skipForNow: "Skip for now — I'll set this up later",
  reg_whereSourceFrom: "Where do you source from?",
  reg_whereExportTo: "Where do you export to?",
  reg_countriesSubtitleBuyer: "Select origin countries you're interested in. We'll prioritize matching offers.",
  reg_countriesSubtitleSupplier: "Select your target markets. Buyers from these countries will see your offers first.",
  reg_showAllCountries: "Show all {count} countries →",
  reg_countriesSelected: "countries selected",
  reg_countrySelected: "country selected",
  reg_completeSetup: "Complete Setup",
  reg_welcome: "Welcome, {name}!",
  reg_profileComplete: "Your {role} profile setup{company} is complete.",
  reg_yourProfile: "Your profile",
  reg_buyer: "Buyer",
  reg_supplier: "Supplier",
  reg_category: "category",
  reg_categories: "categories",
  reg_market: "market",
  reg_markets: "markets",
  reg_certification: "certification",
  reg_certificationsLabel: "certifications",
  reg_matchingOffers: "matching offers",
  reg_whatsNext: "What's next for you",
  reg_exploreOffers: "Explore Offers",
  reg_createFirstOffer: "Create Your First Offer",
  reg_alreadyHaveAccount: "Already have an account?",
  reg_signIn: "Sign in",
  reg_help: "Help",

  // Sign In
  signin_title: "Sign in to YORSO",
  signin_subtitle: "Use the email or phone number you registered with.",
  signin_email: "Email",
  signin_phone: "Phone",
  signin_emailLabel: "Email",
  signin_passwordLabel: "Password",
  signin_forgotPassword: "Forgot password?",
  signin_passwordPlaceholder: "Enter your password",
  signin_signInBtn: "Sign In",
  signin_phoneLabel: "Phone number",
  signin_or: "or",
  signin_viaWhatsApp: "Sign in via WhatsApp",
  signin_getCodeWhatsApp: "Get code via WhatsApp",
  signin_noAccount: "Don't have an account?",
  signin_register: "Register",
  signin_back: "Back",
  signin_resetPassword: "Reset password",
  signin_resetSubtitle: "Enter the email you used to register. We'll send a link to reset your password.",
  signin_sendResetLink: "Send reset link",
  signin_emailSent: "Email sent",
  signin_checkEmailInstructions: "and follow the instructions in the email.",
  signin_backToSignIn: "Back to sign in",
  signin_fillAll: "Please fill in all fields",
  signin_enterPhonePassword: "Please enter your phone number and password",
  signin_enterValidPhone: "Please enter a valid phone number",
  signin_signedIn: "Signed in",
  signin_welcomeBack: "Welcome back!",
  signin_codeSentWhatsApp: "Code sent via WhatsApp",
  signin_checkWhatsApp: "Check your WhatsApp messages",
  signin_enterEmail: "Please enter your email",
  signin_emailSentToast: "Email sent",
  signin_emailSentToastDesc: "Check your inbox for password reset instructions",

  // Offers page
  offersPage_title: "All Wholesale Offers",
  offersPage_subtitle: "Browse {count}+ live offers from verified suppliers worldwide.",
  offersPage_searchPlaceholder: "Search products...",
  offersPage_backToHome: "Back to homepage",
  offersPage_showingAll: "Showing all available offers. Register to see full supplier details and pricing.",
  offersPage_registerToSee: "Register to see full supplier details and pricing.",

  // Offer Detail
  offerDetail_notFound: "Offer not found",
  offerDetail_browseAll: "Browse all offers",
  offerDetail_home: "Home",
  offerDetail_offers: "Offers",
  offerDetail_registerToContact: "Register to Contact Supplier",
  offerDetail_freeRegistration: "Free registration · Direct supplier access · No commission",

  // TrustMicroText
  trustMicro_users: "12,000+ seafood professionals already on YORSO",
  trustMicro_security: "Your data is handled according to our Privacy Policy",
  trustMicro_verified: "2,400+ suppliers verified through document and reference checks",
  trustMicro_global: "Active deals in 48 countries — zero commission",
  trustMicro_growth: "300+ new members joined this week",
  trustMicro_privacy: "We follow industry-standard privacy practices · GDPR-aligned",

  // SocialProofBanner
  socialBanner_professionals: "12,000+ seafood professionals onboard",
  socialBanner_suppliers: "2,400+ verified suppliers across 48 countries",
  socialBanner_zeroCom: "Zero commission — direct deals, always",
  socialBanner_trustedBy: "Trusted by 12,000+ professionals",
  socialBanner_detail: "2,400+ verified suppliers · 48 countries · Zero commission",
};

// ─── RUSSIAN ─────────────────────────────────────────────────────

const ru: TranslationKeys = {
  nav_liveOffers: "Предложения",
  nav_categories: "Категории",
  nav_howItWorks: "Как это работает",
  nav_faq: "FAQ",
  nav_signIn: "Войти",
  nav_registerFree: "Регистрация",

  hero_title1: "Проверенные поставщики. Прозрачные цены.",
  hero_title2: "Полный контроль закупок.",
  hero_subtitle: "Закупайте морепродукты оптом у {suppliers} проверенных поставщиков из {countries} стран — с прямыми контактами, реальными ценами и без комиссий.",
  hero_searchPlaceholder: "Поиск продукции — напр. филе лосося, ваннамей...",
  hero_searchBtn: "Найти",
  hero_popular: "Популярное: Атлантический лосось · Креветка ваннамей · Филе трески · Королевский краб",
  hero_registerFree: "Регистрация",
  hero_exploreLiveOffers: "Изучить живые предложения",
  hero_liveOffers: "предложений",
  hero_verifiedSuppliers: "проверенных поставщиков",
  hero_countries: "стран",
  hero_activeBuyers: "активных покупателей",

  offers_liveMarketplace: "Маркетплейс онлайн",
  offers_title: "Оптовые предложения",
  offers_subtitle: "Актуальные предложения от проверенных поставщиков со всего мира — обновляются постоянно",
  offers_viewAll: "Все предложения",
  offers_viewAllMobile: "Все предложения",
  offers_showMore: "Показать ещё",
  offers_showLess: "Свернуть",

  card_verified: "Проверен",
  card_viewOffer: "Смотреть",
  card_perKg: "за кг",
  card_frozen: "Заморож.",
  card_fresh: "Свежий",
  card_chilled: "Охлажд.",
  card_updatedAgo: "Обновлено {time} назад",
  card_listedToday: "Добавлено сегодня",
  cert_issuer: "Кем выдан",
  cert_officialWebsite: "Официальный сайт",

  trust_liveOffers: "Предложений",
  trust_verifiedSuppliers: "Проверенных поставщиков",
  trust_countries: "Стран",
  trust_activeBuyers: "Активных покупателей",
  trust_liveOffersDetail: "обновляются ежедневно из проверенных источников",
  trust_verifiedSuppliersDetail: "каждый прошёл 3-этапную проверку",
  trust_countriesDetail: "от Норвегии до Вьетнама",
  trust_activeBuyersDetail: "закупают прямо сейчас",
  trust_unlikeOthers: "В отличие от других платформ:",
  trust_zeroCommission: "0% комиссии — ваша маржа остаётся вашей",
  trust_directContacts: "Прямые контакты — всегда открыты, без ограничений",
  trust_verificationEarned: "Верификация заслужена, а не куплена",

  value_title: "Создано для обеих сторон торговли",
  value_subtitle: "Закупаете ли вы морепродукты или продаёте — YORSO даёт инструменты для уверенной торговли.",
  value_forBuyers: "Для покупателей",
  value_forSuppliers: "Для поставщиков",
  value_buyerHeadline: "Закупайте уверенно, а не наугад",
  value_supplierHeadline: "Продавайте напрямую, без посреднических комиссий",
  value_registerBuyer: "Регистрация покупателя",
  value_registerSupplier: "Регистрация поставщика",
  value_buyerBenefits: [
    { title: "Снижение рисков поставок", desc: "Заранее подбирайте резервных поставщиков. Сравнивайте проверенные альтернативы из 48 стран." },
    { title: "Прозрачность цен", desc: "Видите реальные цены из разных регионов. Входите в переговоры с данными, а не догадками." },
    { title: "Только проверенные поставщики", desc: "Каждый поставщик проходит проверку документов, инспекцию производства и проверку торговых рекомендаций." },
    { title: "Быстрые решения по закупкам", desc: "Ищите, сравнивайте и связывайтесь с поставщиками за часы — не за недели переписки." },
  ],
  value_supplierBenefits: [
    { title: "Нулевая комиссия", desc: "Сохраняйте 100% маржи. Без скрытых платежей, без процента от сделок. Прямые отношения с покупателями." },
    { title: "Квалифицированный спрос", desc: "Связывайтесь с проверенными специалистами по закупкам, которые ищут вашу продукцию прямо сейчас." },
    { title: "Круглогодичная видимость", desc: "Ваши предложения доступны 24/7 покупателям из 48+ стран. Не только на 3-дневной выставке." },
    { title: "Доверие через верификацию", desc: "Демонстрируйте сертификаты и репутацию. Покупатели в первую очередь обращаются к проверенным поставщикам." },
  ],

  cat_title: "Поиск по видам рыбы",
  cat_subtitle: "Реальные коммерческие виды и реальные оптовые предложения — узнавайте товар с первого взгляда.",
  cat_offers: "предложений",
  cat_names: { Salmon: "Лосось", Shrimp: "Креветки", Whitefish: "Белая рыба", Tuna: "Тунец", Crab: "Краб", "Squid & Octopus": "Кальмар и осьминог", Shellfish: "Моллюски", Surimi: "Сурими" },
  species_names: {
    atlanticSalmon: "Атлантический лосось",
    cod: "Атлантическая треска",
    haddock: "Пикша",
    hake: "Европейская хек",
    seaBass: "Сибас",
    seaBream: "Дорада",
    yellowfinTuna: "Желтопёрый тунец",
    mackerel: "Атлантическая скумбрия",
  },
  species_descriptors: {
    atlanticSalmon: "Аквакультура · Норвегия, Фареры",
    cod: "Дикий вылов · Атлантика",
    haddock: "Дикий вылов · Северное море",
    hake: "Дикий вылов · Иберия",
    seaBass: "Аквакультура · Средиземноморье",
    seaBream: "Аквакультура · Средиземноморье",
    yellowfinTuna: "Лоины · Сашими-класс",
    mackerel: "Дикий вылов · Пелагический",
  },

  verify_title: "Как проверяются поставщики",
  verify_subtitle: "Наша верификация заслужена, а не куплена. Вот что именно мы проверяем — и чем это отличается от того, что вы видели раньше.",
  verify_steps: [
    { title: "Проверка заявки", desc: "Поставщики предоставляют регистрацию, экспортные лицензии и сертификаты производства (HACCP, BRC, MSC). Самосертификация не принимается.", unlike: "В отличие от «Gold Supplier» Alibaba, который можно купить за $5K/год." },
    { title: "Должная проверка", desc: "Наша команда проверяет регистрацию компании, торговые рекомендации от реальных покупателей и подтверждает производственные возможности.", unlike: "В отличие от каталогов, где поставщики регистрируются без какой-либо проверки." },
    { title: "Значок верификации", desc: "Одобренные поставщики получают значок, видимый на всех предложениях. Значок перепроверяется ежегодно — он может быть отозван.", unlike: "В отличие от платных значков, которые никогда не истекают вне зависимости от качества." },
  ],
  verify_failTitle: "Что происходит, если поставщик не прошёл проверку?",
  verify_failDesc: "Значки верификации могут быть приостановлены или отозваны. Если поставщик получает жалобы на качество, не проходит ежегодную перепроверку или нарушает правила платформы — значок удаляется, а покупатели уведомляются.",
  verify_ctaHint: "Зарегистрируйтесь, чтобы увидеть полные профили поставщиков, сертификаты и статус верификации.",
  verify_ctaBtn: "Разблокировать данные поставщиков",

  activity_live: "Онлайн",
  activity_title: "Активность маркетплейса",
  activity_subtitle: "Обновления в реальном времени — новые предложения, изменения цен и активность поставщиков.",
  activity_footer: "Обновляется автоматически · Показана последняя активность по всем категориям",
  activity_feed: [
    { text: "Новое предложение: Замороженное филе минтая из России", time: "3 мин назад" },
    { text: "Новый верифицированный поставщик: Thai Union Seafood (Таиланд)", time: "12 мин назад" },
    { text: "Обновление цены: Атлантическая скумбрия HG — Норвегия", time: "18 мин назад" },
    { text: "Новое предложение: Тигровая креветка HLSO из Бангладеш", time: "25 мин назад" },
    { text: "Новый поставщик: Hokkaido Fisheries (Япония)", time: "34 мин назад" },
    { text: "Обновление цены: Креветка ваннамей PD — Индия", time: "41 мин назад" },
    { text: "Новое предложение: Замороженное филе хека из Чили", time: "52 мин назад" },
    { text: "Новый верифицированный поставщик: Austral Fisheries (Австралия)", time: "1ч назад" },
  ],

  social_title: "От скептиков к постоянным пользователям",
  social_subtitle: "Реальные истории закупщиков, которые обожглись раньше — и нашли кое-что лучше.",
  social_testimonials: [
    { quote: "Потеряв $40K на Alibaba из-за поставщика, который подменил товар в контейнере, я зарёкся от маркетплейсов. YORSO оказался другим — я проверил фабрику до заказа, и мне никогда не скрывали прямой телефон поставщика.", name: "Маркус Хендриксен", role: "Директор по закупкам", company: "Nordic Fish Import AB", country: "Швеция", painTag: "Выжил после подмены" },
    { quote: "CFO спросил, почему мы платим на 12% выше рынка за креветку. У меня не было ответа. Теперь я прихожу на совет директоров с данными YORSO и веду переговоры с позиции силы. В прошлом квартале сэкономили $180K.", name: "София Чень", role: "Менеджер по цепям поставок", company: "Pacific Seafood Trading", country: "Сингапур", painTag: "Ценовая слепота → экономия" },
    { quote: "Когда у чилийского поставщика лосося случился форс-мажор, нам нужно было 20 тонн за 48 часов. На YORSO мы нашли три проверенные альтернативы за ночь и отгрузили вовремя.", name: "Жан-Пьер Моро", role: "Менеджер по импорту", company: "Marée Fraîche SARL", country: "Франция", painTag: "Экстренные закупки" },
  ],

  faq_title: "Часто задаваемые вопросы",
  faq_subtitle: "Частые вопросы от покупателей, оценивающих YORSO для своих закупок.",
  faq_items: [
    { question: "В чём подвох? Будете брать комиссию позже или продавать мои данные?", answer: "Никакого подвоха. YORSO берёт 0% комиссии с ваших сделок — сегодня и всегда. Мы монетизируемся через премиум-инструменты, никогда за счёт вашей маржи. Ваши данные — ваши: мы соответствуем GDPR и никогда не продаём их третьим лицам." },
    { question: "У меня уже есть проверенные поставщики. Зачем мне платформа?", answer: "Ваши текущие поставщики никуда не денутся. YORSO даёт вам рычаг: сравнивайте цены из 48 стран, находите резервных поставщиков и ведите переговоры с позиции знания." },
    { question: "Как узнать, что поставщики реальные?", answer: "Каждый верифицированный поставщик проходит многоэтапную проверку: бизнес-лицензии, экспортная документация, сертификаты (HACCP, BRC, MSC) и торговые рекомендации. Мы отклонили тысячи заявок." },
    { question: "У нас пик сезона — нет времени осваивать новую систему.", answer: "Регистрация занимает 5 минут. Без обучения, без IT-отдела. Среднее время от регистрации до первого контакта — менее 1 часа." },
    { question: "Программа не может понюхать рыбу.", answer: "Согласны. YORSO не заменяет контроль качества. Он заменяет недели переписок и поездок на выставки. Вы по-прежнему решаете. Мы помогаем составить шорт-лист в 10 раз быстрее." },
    { question: "Мои конкуренты увидят, что я покупаю?", answer: "Никогда. Ваша активность и переписка на 100% конфиденциальны. Поставщики видят ваш профиль только когда вы решите с ними связаться." },
    { question: "Как YORSO обеспечивает безопасность?", answer: "YORSO соответствует GDPR, данные хранятся в ЕС. Коммуникации защищены при передаче и хранении. Мы проводим регулярные аудиты безопасности." },
  ],

  cta_title1: "Начните закупки с",
  cta_title2: "уверенностью",
  cta_subtitle: "Присоединяйтесь к тысячам специалистов по закупкам, которые находят морепродукты через проверенных поставщиков, прозрачные цены и прямые контакты — без комиссий.",
  cta_registerFree: "Регистрация",
  cta_freeNote: "Бесплатно для покупателей · Без карты · Настройка за 5 минут",
  cta_verifiedSuppliers: "380 проверенных поставщиков",
  cta_zeroCommission: "0% комиссии",
  cta_directContacts: "Прямые контакты всегда",

  footer_desc: "Глобальный B2B маркетплейс морепродуктов. Связываем покупателей с проверенными поставщиками из 48 стран.",
  footer_worldwide: "Доступен по всему миру · EN, ES, RU",
  footer_copyright: `© ${new Date().getFullYear()} YORSO B.V. Все права защищены.`,
  footer_registered: "Зарегистрирована в Нидерландах · KVK 12345678",
  footer_platform: "Платформа",
  footer_company: "Компания",
  footer_legal: "Правовая информация",
  footer_links: {
    platform: [
      { label: "Предложения", href: "#offers" },
      { label: "Категории", href: "#categories" },
      { label: "Проверенные поставщики", href: "#how-it-works" },
      { label: "Как это работает", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
    company: [
      { label: "О YORSO", href: "/about" },
      { label: "Контакты", href: "/contact" },
      { label: "Карьера", href: "/careers" },
      { label: "Пресса", href: "/press" },
      { label: "Партнёрская программа", href: "/partners" },
    ],
    legal: [
      { label: "Условия использования", href: "/terms" },
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Политика cookies", href: "/cookies" },
      { label: "Соответствие GDPR", href: "/gdpr" },
      { label: "Антифрод политика", href: "/anti-fraud" },
    ],
  },

  // Registration
  reg_joinYorso: "Присоединиться к YORSO",
  reg_chooseSubtitle: "Выберите, как вы будете использовать платформу. Это займёт менее 3 минут.",
  reg_imBuyer: "Я покупатель",
  reg_imSupplier: "Я поставщик",
  reg_buyerSubtitle: "Закупайте морепродукты у проверенных поставщиков",
  reg_supplierSubtitle: "Выходите на квалифицированных покупателей по всему миру",
  reg_buyerFeatures: ["Доступ к 2,000+ проверенных предложений", "Сравнение цен из 48 стран", "Прямые контакты — без комиссии"],
  reg_supplierFeatures: ["Круглогодичная видимость вашей продукции", "Прямой контакт с проверенными покупателями", "Нулевая комиссия на все сделки"],
  reg_enterEmail: "Введите рабочий email",
  reg_emailSubtitle: "Мы отправим код подтверждения для проверки вашей личности.",
  reg_emailPlaceholder: "you@company.com",
  reg_emailInvalid: "Пожалуйста, введите корректный рабочий email",
  reg_continue: "Продолжить",
  reg_checking: "Проверяем…",
  reg_couldNotContinue: "Не удалось продолжить",
  reg_byContAgreeTo: "Продолжая, вы соглашаетесь с",
  reg_terms: "Условиями",
  reg_and: "и",
  reg_privacyPolicy: "Политикой конфиденциальности",
  reg_checkInbox: "Проверьте почту",
  reg_codeSentTo: "Мы отправили 6-значный код на",
  reg_enterFullCode: "Пожалуйста, введите полный 6-значный код",
  reg_verifyAndContinue: "Подтвердить и продолжить",
  reg_verifying: "Проверяем…",
  reg_verificationFailed: "Проверка не пройдена",
  reg_didntReceive: "Не получили код? Отправить повторно",
  reg_codeResent: "Код отправлен повторно",
  reg_codeResentDesc: "Проверьте вашу почту.",
  reg_tellAboutYourself: "Расскажите о себе",
  reg_detailsSubtitleBuyer: "Мы используем ваши данные для настройки профиля покупателя и повышения доверия между участниками маркетплейса.",
  reg_detailsSubtitleSupplier: "Мы используем ваши данные для настройки профиля поставщика и повышения доверия между участниками маркетплейса.",
  reg_fullName: "Полное имя",
  reg_companyName: "Название компании",
  reg_country: "Страна",
  reg_autoDetected: "(определена автоматически)",
  reg_selectCountry: "Выберите страну...",
  reg_vatTin: "ИНН / VAT",
  reg_vatPlaceholder: "напр. 7707083893",
  reg_vatDescBuyer: "Необходим для B2B документации и выставления счетов.",
  reg_vatDescSupplier: "Необходим для верификации поставщика и доверия на маркетплейсе.",
  reg_phoneNumber: "Номер телефона",
  reg_phoneDesc: "Используется для коммуникации по сделкам и предотвращения фейковых регистраций.",
  reg_sendCode: "Отправить код подтверждения",
  reg_codeSentEnter: "Код отправлен. Введите его ниже:",
  reg_smsCode: "Код из SMS",
  reg_verify: "Проверить",
  reg_invalidCodeRetry: "Неверный код. Попробуйте снова.",
  reg_resendCode: "Отправить повторно",
  reg_verified: "Подтверждён",
  reg_or: "или",
  reg_verifyViaWhatsApp: "Подтвердить через WhatsApp",
  reg_whatsAppCodeDesc: "Мы отправим код подтверждения на этот номер через WhatsApp",
  reg_codeSentToast: "Код отправлен",
  reg_codeSentToastDesc: "SMS с кодом подтверждения отправлено на ваш номер",
  reg_phoneVerifiedWhatsApp: "Телефон подтверждён через WhatsApp",
  reg_phoneVerifiedWhatsAppDesc: "Ваш номер успешно подтверждён",
  reg_phoneVerified: "Телефон подтверждён",
  reg_phoneVerifiedDesc: "Ваш номер успешно подтверждён",
  reg_invalidCode: "Неверный код",
  reg_invalidCodeDesc: "Проверьте код из SMS и попробуйте снова",
  reg_password: "Пароль",
  reg_passwordPlaceholder: "Минимум 8 символов",
  reg_saving: "Сохраняем…",
  reg_enterFullName: "Пожалуйста, введите полное имя",
  reg_enterCompanyName: "Пожалуйста, введите название компании",
  reg_minChars: "Минимум 8 символов",
  reg_selectCountryErr: "Пожалуйста, выберите страну",
  reg_enterValidVat: "Пожалуйста, введите корректный ИНН/VAT",
  reg_enterPhoneNumber: "Пожалуйста, введите номер телефона",
  reg_verifyPhoneNumber: "Пожалуйста, подтвердите номер телефона",
  reg_enterValidPhone: "Пожалуйста, введите корректный номер телефона",
  reg_enterCodeFromSms: "Пожалуйста, введите код из SMS",
  reg_whatDoYouSource: "Что вы закупаете?",
  reg_whatDoYouOffer: "Что вы предлагаете?",
  reg_onboardingSubtitleBuyer: "Выберите интересующие категории. Мы покажем релевантные предложения.",
  reg_onboardingSubtitleSupplier: "Расскажите о вашем бизнесе, чтобы покупатели могли вас найти.",
  reg_productCategories: "Категории продукции",
  reg_businessType: "Тип бизнеса",
  reg_selectAllApply: "(выберите все подходящие)",
  reg_certifications: "Сертификаты",
  reg_monthlyVolumeBuyer: "Ежемесячный объём закупок",
  reg_monthlyVolumeSupplier: "Ежемесячная производственная мощность",
  reg_skipForNow: "Пропустить — настрою позже",
  reg_whereSourceFrom: "Откуда вы закупаете?",
  reg_whereExportTo: "Куда вы экспортируете?",
  reg_countriesSubtitleBuyer: "Выберите страны-источники. Мы приоритизируем подходящие предложения.",
  reg_countriesSubtitleSupplier: "Выберите целевые рынки. Покупатели из этих стран увидят ваши предложения первыми.",
  reg_showAllCountries: "Показать все {count} стран →",
  reg_countriesSelected: "стран выбрано",
  reg_countrySelected: "страна выбрана",
  reg_completeSetup: "Завершить настройку",
  reg_welcome: "Добро пожаловать, {name}!",
  reg_profileComplete: "Настройка вашего профиля {role}{company} завершена.",
  reg_yourProfile: "Ваш профиль",
  reg_buyer: "Покупатель",
  reg_supplier: "Поставщик",
  reg_category: "категория",
  reg_categories: "категорий",
  reg_market: "рынок",
  reg_markets: "рынков",
  reg_certification: "сертификат",
  reg_certificationsLabel: "сертификатов",
  reg_matchingOffers: "подходящих предложений",
  reg_whatsNext: "Что дальше",
  reg_exploreOffers: "Смотреть предложения",
  reg_createFirstOffer: "Создать первое предложение",
  reg_alreadyHaveAccount: "Уже есть аккаунт?",
  reg_signIn: "Войти",
  reg_help: "Помощь",

  // Sign In
  signin_title: "Вход в YORSO",
  signin_subtitle: "Используйте email или номер телефона, с которым регистрировались.",
  signin_email: "Email",
  signin_phone: "Телефон",
  signin_emailLabel: "Email",
  signin_passwordLabel: "Пароль",
  signin_forgotPassword: "Забыли пароль?",
  signin_passwordPlaceholder: "Введите пароль",
  signin_signInBtn: "Войти",
  signin_phoneLabel: "Номер телефона",
  signin_or: "или",
  signin_viaWhatsApp: "Войти через WhatsApp",
  signin_getCodeWhatsApp: "Получить код через WhatsApp",
  signin_noAccount: "Нет аккаунта?",
  signin_register: "Регистрация",
  signin_back: "Назад",
  signin_resetPassword: "Сброс пароля",
  signin_resetSubtitle: "Введите email, с которым регистрировались. Мы отправим ссылку для сброса пароля.",
  signin_sendResetLink: "Отправить ссылку",
  signin_emailSent: "Письмо отправлено",
  signin_checkEmailInstructions: "и следуйте инструкциям в письме.",
  signin_backToSignIn: "Вернуться к входу",
  signin_fillAll: "Пожалуйста, заполните все поля",
  signin_enterPhonePassword: "Пожалуйста, введите номер и пароль",
  signin_enterValidPhone: "Пожалуйста, введите корректный номер телефона",
  signin_signedIn: "Вы вошли",
  signin_welcomeBack: "С возвращением!",
  signin_codeSentWhatsApp: "Код отправлен через WhatsApp",
  signin_checkWhatsApp: "Проверьте сообщения в WhatsApp",
  signin_enterEmail: "Пожалуйста, введите email",
  signin_emailSentToast: "Письмо отправлено",
  signin_emailSentToastDesc: "Проверьте почту для инструкций по сбросу пароля",

  // Offers page
  offersPage_title: "Все оптовые предложения",
  offersPage_subtitle: "Просматривайте {count}+ актуальных предложений от проверенных поставщиков.",
  offersPage_searchPlaceholder: "Поиск продукции...",
  offersPage_backToHome: "На главную",
  offersPage_showingAll: "Показаны все доступные предложения. Зарегистрируйтесь для доступа к полным данным поставщиков и ценам.",
  offersPage_registerToSee: "Зарегистрируйтесь для полного доступа.",

  // Offer Detail
  offerDetail_notFound: "Предложение не найдено",
  offerDetail_browseAll: "Смотреть все предложения",
  offerDetail_home: "Главная",
  offerDetail_offers: "Предложения",
  offerDetail_registerToContact: "Зарегистрируйтесь для связи с поставщиком",
  offerDetail_freeRegistration: "Бесплатная регистрация · Прямой доступ к поставщику · Без комиссии",

  // TrustMicroText
  trustMicro_users: "12,000+ специалистов по морепродуктам уже на YORSO",
  trustMicro_security: "Ваши данные обрабатываются согласно нашей Политике конфиденциальности",
  trustMicro_verified: "2,400+ поставщиков проверены через документы и рекомендации",
  trustMicro_global: "Сделки в 48 странах — без комиссии",
  trustMicro_growth: "300+ новых участников на этой неделе",
  trustMicro_privacy: "Мы следуем стандартным практикам конфиденциальности · Соответствие GDPR",

  // SocialProofBanner
  socialBanner_professionals: "12,000+ специалистов по морепродуктам",
  socialBanner_suppliers: "2,400+ проверенных поставщиков из 48 стран",
  socialBanner_zeroCom: "Без комиссии — прямые сделки, всегда",
  socialBanner_trustedBy: "Доверяют 12,000+ профессионалов",
  socialBanner_detail: "2,400+ проверенных поставщиков · 48 стран · Без комиссии",
};

// ─── SPANISH ─────────────────────────────────────────────────────

const es: TranslationKeys = {
  nav_liveOffers: "Ofertas",
  nav_categories: "Categorías",
  nav_howItWorks: "Cómo funciona",
  nav_faq: "FAQ",
  nav_signIn: "Iniciar sesión",
  nav_registerFree: "Registro gratis",

  hero_title1: "Proveedores verificados. Precios transparentes.",
  hero_title2: "Control total de sus compras.",
  hero_subtitle: "Compre mariscos al por mayor de {suppliers} proveedores verificados en {countries} países — con contactos directos, precios reales y cero comisiones.",
  hero_searchPlaceholder: "Buscar productos — ej. filete de salmón, camarón vannamei...",
  hero_searchBtn: "Buscar",
  hero_popular: "Popular: Salmón Atlántico · Camarón Vannamei · Lomo de Bacalao · Cangrejo Rey",
  hero_registerFree: "Registro gratis",
  hero_exploreLiveOffers: "Ver ofertas",
  hero_liveOffers: "ofertas activas",
  hero_verifiedSuppliers: "proveedores verificados",
  hero_countries: "países",
  hero_activeBuyers: "compradores activos",

  offers_liveMarketplace: "Mercado en vivo",
  offers_title: "Ofertas mayoristas",
  offers_subtitle: "Listados actualizados de proveedores verificados en todo el mundo — actualización continua",
  offers_viewAll: "Ver todas las ofertas",
  offers_viewAllMobile: "Ver todas las ofertas",
  offers_showMore: "Mostrar más ofertas",
  offers_showLess: "Mostrar menos",

  card_verified: "Verificado",
  card_viewOffer: "Ver oferta",
  card_perKg: "por kg",
  card_frozen: "Congelado",
  card_fresh: "Fresco",
  card_chilled: "Refrigerado",
  card_updatedAgo: "Actualizado hace {time}",
  card_listedToday: "Publicado hoy",
  cert_issuer: "Emisor",
  cert_officialWebsite: "Sitio web oficial",

  trust_liveOffers: "Ofertas activas",
  trust_verifiedSuppliers: "Proveedores verificados",
  trust_countries: "Países",
  trust_activeBuyers: "Compradores activos",
  trust_liveOffersDetail: "actualizadas diariamente de fuentes verificadas",
  trust_verifiedSuppliersDetail: "cada uno pasó verificación de 3 pasos",
  trust_countriesDetail: "desde Noruega hasta Vietnam",
  trust_activeBuyersDetail: "comprando ahora mismo",
  trust_unlikeOthers: "A diferencia de otras plataformas:",
  trust_zeroCommission: "0% comisión — sus márgenes son suyos",
  trust_directContacts: "Contactos directos — siempre abiertos, sin restricciones",
  trust_verificationEarned: "Verificación ganada, no comprada",

  value_title: "Diseñado para ambos lados del comercio",
  value_subtitle: "Ya sea que compre o venda mariscos, YORSO le da las herramientas para comerciar con confianza.",
  value_forBuyers: "Para compradores",
  value_forSuppliers: "Para proveedores",
  value_buyerHeadline: "Compre con confianza, no a ciegas",
  value_supplierHeadline: "Venda directamente, sin impuestos de intermediarios",
  value_registerBuyer: "Registrarse como comprador",
  value_registerSupplier: "Registrarse como proveedor",
  value_buyerBenefits: [
    { title: "Reducir riesgo de suministro", desc: "Precalifique proveedores de respaldo. Compare alternativas verificadas de 48 países." },
    { title: "Visibilidad de precios", desc: "Vea precios reales de múltiples orígenes. Negocie con datos, no con suposiciones." },
    { title: "Solo proveedores verificados", desc: "Cada proveedor pasa revisión documental, inspección y verificación de referencias." },
    { title: "Decisiones más rápidas", desc: "Busque, compare y contacte proveedores en horas — no en semanas." },
  ],
  value_supplierBenefits: [
    { title: "Cero comisión", desc: "Conserve el 100% de sus márgenes. Sin tarifas ocultas. Relaciones directas." },
    { title: "Demanda calificada", desc: "Conéctese con profesionales verificados que buscan sus productos." },
    { title: "Visibilidad todo el año", desc: "Sus ofertas están activas 24/7 para compradores de 48+ países." },
    { title: "Confianza por verificación", desc: "Muestre certificaciones y trayectoria. Los compradores contactan primero a verificados." },
  ],

  cat_title: "Comprar por especie",
  cat_subtitle: "Especies comerciales reales y ofertas mayoristas reales — reconozca el producto a primera vista.",
  cat_offers: "ofertas",
  cat_names: { Salmon: "Salmón", Shrimp: "Camarón", Whitefish: "Pescado blanco", Tuna: "Atún", Crab: "Cangrejo", "Squid & Octopus": "Calamar y pulpo", Shellfish: "Mariscos", Surimi: "Surimi" },
  species_names: {
    atlanticSalmon: "Salmón atlántico",
    cod: "Bacalao del Atlántico",
    haddock: "Eglefino",
    hake: "Merluza europea",
    seaBass: "Lubina",
    seaBream: "Dorada",
    yellowfinTuna: "Atún de aleta amarilla",
    mackerel: "Caballa atlántica",
  },
  species_descriptors: {
    atlanticSalmon: "Acuicultura · Noruega, Feroe",
    cod: "Captura salvaje · Atlántico",
    haddock: "Captura salvaje · Mar del Norte",
    hake: "Captura salvaje · Ibérico",
    seaBass: "Acuicultura · Mediterráneo",
    seaBream: "Acuicultura · Mediterráneo",
    yellowfinTuna: "Lomos · Calidad sashimi",
    mackerel: "Captura salvaje · Pelágico",
  },

  verify_title: "Cómo se verifican los proveedores",
  verify_subtitle: "Nuestra verificación se gana, no se compra. Esto es lo que revisamos — y en qué se diferencia.",
  verify_steps: [
    { title: "Revisión de solicitud", desc: "Los proveedores presentan registro, licencias y certificaciones (HACCP, BRC, MSC). No se acepta autocertificación.", unlike: "A diferencia del \"Gold Supplier\" de Alibaba que se compra por $5K/año." },
    { title: "Diligencia debida", desc: "Verificamos registro, referencias comerciales y capacidades de producción.", unlike: "A diferencia de directorios sin verificación." },
    { title: "Insignia de verificación", desc: "Los aprobados obtienen insignia visible. Se revalida anualmente — puede ser revocada.", unlike: "A diferencia de insignias de pago que nunca caducan." },
  ],
  verify_failTitle: "¿Qué pasa si un proveedor no cumple?",
  verify_failDesc: "Las insignias pueden ser suspendidas o revocadas. Si hay quejas, falla la reverificación o incumple reglas, se elimina y se notifica a compradores.",
  verify_ctaHint: "Regístrese para ver perfiles completos, certificaciones y estado de verificación.",
  verify_ctaBtn: "Desbloquear datos de proveedores",

  activity_live: "En vivo",
  activity_title: "Actividad del mercado",
  activity_subtitle: "Actualizaciones en tiempo real — nuevos listados, cambios de precio y actividad.",
  activity_footer: "Se actualiza automáticamente · Última actividad de todas las categorías",
  activity_feed: [
    { text: "Nuevo: Filete de abadejo congelado de Rusia", time: "3 min" },
    { text: "Proveedor verificado: Thai Union Seafood (Tailandia)", time: "12 min" },
    { text: "Precio actualizado: Caballa atlántica HG — Noruega", time: "18 min" },
    { text: "Nuevo: Camarón tigre negro HLSO de Bangladesh", time: "25 min" },
    { text: "Nuevo proveedor: Hokkaido Fisheries (Japón)", time: "34 min" },
    { text: "Precio actualizado: Camarón vannamei PD — India", time: "41 min" },
    { text: "Nuevo: Filete de merluza congelado de Chile", time: "52 min" },
    { text: "Proveedor verificado: Austral Fisheries (Australia)", time: "1h" },
  ],

  social_title: "De escépticos a usuarios habituales",
  social_subtitle: "Historias reales de profesionales que se quemaron antes — y encontraron algo mejor.",
  social_testimonials: [
    { quote: "Después de perder $40K en Alibaba, juré no usar más marketplaces. YORSO fue diferente — verifiqué la fábrica antes de ordenar y nunca ocultaron el teléfono del proveedor.", name: "Marcus Hendriksen", role: "Director de Compras", company: "Nordic Fish Import AB", country: "Suecia", painTag: "Sobreviviente de fraude" },
    { quote: "Mi CFO preguntó por qué pagamos 12% más por camarón. Ahora llego con datos de YORSO y negocio con fuerza. Ahorramos $180K el último trimestre.", name: "Sofia Chen", role: "Gerente de Cadena de Suministro", company: "Pacific Seafood Trading", country: "Singapur", painTag: "Ceguera de precios → ahorro" },
    { quote: "Cuando nuestro proveedor chileno tuvo fuerza mayor, necesitábamos 20 toneladas en 48 horas. En YORSO encontramos tres alternativas verificadas en una noche.", name: "Jean-Pierre Moreau", role: "Gerente de Importación", company: "Marée Fraîche SARL", country: "Francia", painTag: "Compras de emergencia" },
  ],

  faq_title: "Preguntas frecuentes",
  faq_subtitle: "Preguntas comunes de compradores que evalúan YORSO.",
  faq_items: [
    { question: "¿Cuál es la trampa? ¿Cobrarán comisión después?", answer: "Sin trampas. YORSO cobra 0% de comisión — hoy y siempre. Monetizamos con herramientas premium opcionales, nunca de su margen. Cumplimos con GDPR." },
    { question: "Ya tengo proveedores de confianza. ¿Para qué necesito una plataforma?", answer: "Sus proveedores no van a ninguna parte. YORSO le da ventaja: compare precios de 48 países y negocie desde una posición de conocimiento." },
    { question: "¿Cómo sé que los proveedores son reales?", answer: "Cada proveedor pasa revisión de licencias, documentación, certificaciones (HACCP, BRC, MSC) y referencias. Hemos rechazado miles de solicitudes." },
    { question: "Estamos en temporada alta — no tenemos tiempo.", answer: "El registro toma 5 minutos. Sin capacitación ni integraciones. Tiempo promedio hasta el primer contacto: menos de 1 hora." },
    { question: "El software no puede oler el pescado.", answer: "De acuerdo. YORSO no reemplaza su control de calidad. Reemplaza semanas de correos y ferias. Usted decide. Nosotros aceleramos 10x." },
    { question: "¿Mis competidores verán lo que compro?", answer: "Nunca. Su actividad es 100% privada. Los proveedores ven su perfil solo cuando usted los contacta." },
    { question: "¿Cómo maneja la seguridad YORSO?", answer: "Cumplimiento GDPR, datos en la UE, comunicaciones cifradas, auditorías regulares, verificación de regulaciones de exportación y sanciones." },
  ],

  cta_title1: "Comience a comprar con",
  cta_title2: "confianza",
  cta_subtitle: "Únase a miles de profesionales que abastecen mariscos con proveedores verificados, precios transparentes y contactos directos — sin comisiones.",
  cta_registerFree: "Registro gratis",
  cta_freeNote: "Gratis para compradores · Sin tarjeta · Configuración en 5 minutos",
  cta_verifiedSuppliers: "380 proveedores verificados",
  cta_zeroCommission: "0% comisión",
  cta_directContacts: "Contactos directos siempre",

  footer_desc: "El marketplace B2B global de mariscos. Conectando compradores con proveedores verificados en 48 países.",
  footer_worldwide: "Disponible en todo el mundo · EN, ES, RU",
  footer_copyright: `© ${new Date().getFullYear()} YORSO B.V. Todos los derechos reservados.`,
  footer_registered: "Registrada en los Países Bajos · KVK 12345678",
  footer_platform: "Plataforma",
  footer_company: "Empresa",
  footer_legal: "Legal",
  footer_links: {
    platform: [
      { label: "Ofertas activas", href: "#offers" },
      { label: "Categorías", href: "#categories" },
      { label: "Proveedores verificados", href: "#how-it-works" },
      { label: "Cómo funciona", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
    company: [
      { label: "Sobre YORSO", href: "/about" },
      { label: "Contáctenos", href: "/contact" },
      { label: "Carreras", href: "/careers" },
      { label: "Prensa", href: "/press" },
      { label: "Programa de socios", href: "/partners" },
    ],
    legal: [
      { label: "Términos de servicio", href: "/terms" },
      { label: "Política de privacidad", href: "/privacy" },
      { label: "Política de cookies", href: "/cookies" },
      { label: "Cumplimiento GDPR", href: "/gdpr" },
      { label: "Política antifraude", href: "/anti-fraud" },
    ],
  },

  // Registration
  reg_joinYorso: "Únase a YORSO",
  reg_chooseSubtitle: "Elija cómo usará la plataforma. Toma menos de 3 minutos.",
  reg_imBuyer: "Soy comprador",
  reg_imSupplier: "Soy proveedor",
  reg_buyerSubtitle: "Compre mariscos de proveedores verificados",
  reg_supplierSubtitle: "Llegue a compradores calificados en todo el mundo",
  reg_buyerFeatures: ["Acceso a 2,000+ ofertas verificadas", "Compare precios de 48 países", "Contacto directo — sin comisión"],
  reg_supplierFeatures: ["Visibilidad todo el año para sus productos", "Contacto directo con compradores verificados", "Cero comisión en todas las operaciones"],
  reg_enterEmail: "Ingrese su email de negocios",
  reg_emailSubtitle: "Enviaremos un código de verificación para confirmar su identidad.",
  reg_emailPlaceholder: "you@company.com",
  reg_emailInvalid: "Por favor ingrese un email de negocios válido",
  reg_continue: "Continuar",
  reg_checking: "Verificando…",
  reg_couldNotContinue: "No se pudo continuar",
  reg_byContAgreeTo: "Al continuar, acepta nuestros",
  reg_terms: "Términos",
  reg_and: "y",
  reg_privacyPolicy: "Política de privacidad",
  reg_checkInbox: "Revise su bandeja",
  reg_codeSentTo: "Enviamos un código de 6 dígitos a",
  reg_enterFullCode: "Por favor ingrese el código completo de 6 dígitos",
  reg_verifyAndContinue: "Verificar y continuar",
  reg_verifying: "Verificando…",
  reg_verificationFailed: "Verificación fallida",
  reg_didntReceive: "¿No recibió el código? Reenviar",
  reg_codeResent: "Código reenviado",
  reg_codeResentDesc: "Revise su bandeja de entrada.",
  reg_tellAboutYourself: "Cuéntenos sobre usted",
  reg_detailsSubtitleBuyer: "Usamos sus datos para configurar su perfil de comprador y mejorar la confianza entre participantes.",
  reg_detailsSubtitleSupplier: "Usamos sus datos para configurar su perfil de proveedor y mejorar la confianza entre participantes.",
  reg_fullName: "Nombre completo",
  reg_companyName: "Nombre de la empresa",
  reg_country: "País",
  reg_autoDetected: "(detectado automáticamente)",
  reg_selectCountry: "Seleccione país...",
  reg_vatTin: "NIF / VAT",
  reg_vatPlaceholder: "ej. ES12345678A",
  reg_vatDescBuyer: "Necesario para facturación B2B y documentación comercial.",
  reg_vatDescSupplier: "Necesario para verificación del proveedor y credibilidad.",
  reg_phoneNumber: "Número de teléfono",
  reg_phoneDesc: "Usado para comunicación comercial y prevención de registros falsos.",
  reg_sendCode: "Enviar código de verificación",
  reg_codeSentEnter: "Código enviado. Ingréselo abajo:",
  reg_smsCode: "Código SMS",
  reg_verify: "Verificar",
  reg_invalidCodeRetry: "Código inválido. Intente de nuevo.",
  reg_resendCode: "Reenviar código",
  reg_verified: "Verificado",
  reg_or: "o",
  reg_verifyViaWhatsApp: "Verificar por WhatsApp",
  reg_whatsAppCodeDesc: "Enviaremos un código de verificación a este número por WhatsApp",
  reg_codeSentToast: "Código enviado",
  reg_codeSentToastDesc: "Se ha enviado un SMS con el código de verificación",
  reg_phoneVerifiedWhatsApp: "Teléfono verificado por WhatsApp",
  reg_phoneVerifiedWhatsAppDesc: "Su número ha sido verificado exitosamente",
  reg_phoneVerified: "Teléfono verificado",
  reg_phoneVerifiedDesc: "Su número ha sido verificado exitosamente",
  reg_invalidCode: "Código inválido",
  reg_invalidCodeDesc: "Revise el código del SMS e intente de nuevo",
  reg_password: "Contraseña",
  reg_passwordPlaceholder: "Mínimo 8 caracteres",
  reg_saving: "Guardando…",
  reg_enterFullName: "Por favor ingrese su nombre completo",
  reg_enterCompanyName: "Por favor ingrese el nombre de la empresa",
  reg_minChars: "Mínimo 8 caracteres",
  reg_selectCountryErr: "Por favor seleccione un país",
  reg_enterValidVat: "Por favor ingrese un NIF/VAT válido",
  reg_enterPhoneNumber: "Por favor ingrese su número de teléfono",
  reg_verifyPhoneNumber: "Por favor verifique su número de teléfono",
  reg_enterValidPhone: "Por favor ingrese un número válido",
  reg_enterCodeFromSms: "Por favor ingrese el código del SMS",
  reg_whatDoYouSource: "¿Qué compra?",
  reg_whatDoYouOffer: "¿Qué ofrece?",
  reg_onboardingSubtitleBuyer: "Seleccione categorías de interés. Le mostraremos ofertas relevantes.",
  reg_onboardingSubtitleSupplier: "Cuéntenos sobre su negocio para que los compradores lo encuentren.",
  reg_productCategories: "Categorías de producto",
  reg_businessType: "Tipo de negocio",
  reg_selectAllApply: "(seleccione todas las que apliquen)",
  reg_certifications: "Certificaciones",
  reg_monthlyVolumeBuyer: "Volumen mensual de compra",
  reg_monthlyVolumeSupplier: "Capacidad de producción mensual",
  reg_skipForNow: "Omitir por ahora — lo configuro después",
  reg_whereSourceFrom: "¿De dónde compra?",
  reg_whereExportTo: "¿A dónde exporta?",
  reg_countriesSubtitleBuyer: "Seleccione países de origen. Priorizaremos ofertas coincidentes.",
  reg_countriesSubtitleSupplier: "Seleccione sus mercados objetivo. Compradores de estos países verán sus ofertas primero.",
  reg_showAllCountries: "Mostrar los {count} países →",
  reg_countriesSelected: "países seleccionados",
  reg_countrySelected: "país seleccionado",
  reg_completeSetup: "Completar configuración",
  reg_welcome: "¡Bienvenido, {name}!",
  reg_profileComplete: "La configuración de su perfil de {role}{company} está completa.",
  reg_yourProfile: "Su perfil",
  reg_buyer: "Comprador",
  reg_supplier: "Proveedor",
  reg_category: "categoría",
  reg_categories: "categorías",
  reg_market: "mercado",
  reg_markets: "mercados",
  reg_certification: "certificación",
  reg_certificationsLabel: "certificaciones",
  reg_matchingOffers: "ofertas coincidentes",
  reg_whatsNext: "Qué sigue para usted",
  reg_exploreOffers: "Explorar ofertas",
  reg_createFirstOffer: "Crear su primera oferta",
  reg_alreadyHaveAccount: "¿Ya tiene cuenta?",
  reg_signIn: "Iniciar sesión",
  reg_help: "Ayuda",

  // Sign In
  signin_title: "Iniciar sesión en YORSO",
  signin_subtitle: "Use el email o teléfono con el que se registró.",
  signin_email: "Email",
  signin_phone: "Teléfono",
  signin_emailLabel: "Email",
  signin_passwordLabel: "Contraseña",
  signin_forgotPassword: "¿Olvidó su contraseña?",
  signin_passwordPlaceholder: "Ingrese su contraseña",
  signin_signInBtn: "Iniciar sesión",
  signin_phoneLabel: "Número de teléfono",
  signin_or: "o",
  signin_viaWhatsApp: "Iniciar sesión vía WhatsApp",
  signin_getCodeWhatsApp: "Obtener código por WhatsApp",
  signin_noAccount: "¿No tiene cuenta?",
  signin_register: "Registrarse",
  signin_back: "Atrás",
  signin_resetPassword: "Restablecer contraseña",
  signin_resetSubtitle: "Ingrese el email con el que se registró. Enviaremos un enlace para restablecer su contraseña.",
  signin_sendResetLink: "Enviar enlace",
  signin_emailSent: "Email enviado",
  signin_checkEmailInstructions: "y siga las instrucciones del email.",
  signin_backToSignIn: "Volver a iniciar sesión",
  signin_fillAll: "Por favor complete todos los campos",
  signin_enterPhonePassword: "Ingrese su teléfono y contraseña",
  signin_enterValidPhone: "Ingrese un número de teléfono válido",
  signin_signedIn: "Sesión iniciada",
  signin_welcomeBack: "¡Bienvenido de vuelta!",
  signin_codeSentWhatsApp: "Código enviado por WhatsApp",
  signin_checkWhatsApp: "Revise sus mensajes de WhatsApp",
  signin_enterEmail: "Por favor ingrese su email",
  signin_emailSentToast: "Email enviado",
  signin_emailSentToastDesc: "Revise su bandeja para instrucciones de restablecimiento",

  // Offers page
  offersPage_title: "Todas las ofertas mayoristas",
  offersPage_subtitle: "Explore {count}+ ofertas activas de proveedores verificados.",
  offersPage_searchPlaceholder: "Buscar productos...",
  offersPage_backToHome: "Volver al inicio",
  offersPage_showingAll: "Mostrando todas las ofertas. Regístrese para ver detalles completos y precios.",
  offersPage_registerToSee: "Regístrese para ver detalles completos.",

  // Offer Detail
  offerDetail_notFound: "Oferta no encontrada",
  offerDetail_browseAll: "Ver todas las ofertas",
  offerDetail_home: "Inicio",
  offerDetail_offers: "Ofertas",
  offerDetail_registerToContact: "Regístrese para contactar al proveedor",
  offerDetail_freeRegistration: "Registro gratuito · Acceso directo · Sin comisión",

  // TrustMicroText
  trustMicro_users: "12,000+ profesionales de mariscos en YORSO",
  trustMicro_security: "Sus datos se manejan según nuestra Política de privacidad",
  trustMicro_verified: "2,400+ proveedores verificados por documentos y referencias",
  trustMicro_global: "Operaciones en 48 países — sin comisión",
  trustMicro_growth: "300+ nuevos miembros esta semana",
  trustMicro_privacy: "Seguimos prácticas estándar de privacidad · Alineados con GDPR",

  // SocialProofBanner
  socialBanner_professionals: "12,000+ profesionales de mariscos a bordo",
  socialBanner_suppliers: "2,400+ proveedores verificados en 48 países",
  socialBanner_zeroCom: "Sin comisión — operaciones directas, siempre",
  socialBanner_trustedBy: "Confianza de 12,000+ profesionales",
  socialBanner_detail: "2,400+ proveedores verificados · 48 países · Sin comisión",
};

export const translations: Record<Language, TranslationKeys> = { en, ru, es };
