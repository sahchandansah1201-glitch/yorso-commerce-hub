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

  // Offer Card
  card_verified: string;
  card_viewOffer: string;
  card_perKg: string;
  card_frozen: string;
  card_fresh: string;
  card_chilled: string;

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
};

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

  // Offer Card
  card_verified: "Verified",
  card_viewOffer: "View Offer",
  card_perKg: "per kg",
  card_frozen: "Frozen",
  card_fresh: "Fresh",
  card_chilled: "Chilled",

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
  cat_title: "Browse by Category",
  cat_subtitle: "Find exactly what you need — from salmon and shrimp to crab and surimi.",
  cat_offers: "offers",
  cat_names: {
    Salmon: "Salmon",
    Shrimp: "Shrimp",
    Whitefish: "Whitefish",
    Tuna: "Tuna",
    Crab: "Crab",
    "Squid & Octopus": "Squid & Octopus",
    Shellfish: "Shellfish",
    Surimi: "Surimi",
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
    {
      quote: "After losing $40K on Alibaba to a supplier who swapped product in the container, I swore off marketplaces. YORSO was different — I verified the factory before ordering, and they never hid the supplier's direct phone number. That changed everything.",
      name: "Marcus Hendriksen", role: "Procurement Director", company: "Nordic Fish Import AB", country: "Sweden", painTag: "Bait-and-switch survivor",
    },
    {
      quote: "My CFO asked why we pay 12% above market on shrimp. I had no answer — we'd been using the same broker for years. Now I walk into board meetings with YORSO's benchmark data and negotiate from strength. Last quarter we saved $180K.",
      name: "Sofia Chen", role: "Supply Chain Manager", company: "Pacific Seafood Trading", country: "Singapore", painTag: "Price blindness → savings",
    },
    {
      quote: "When our Chilean salmon supplier had a force majeure mid-season, we needed 20 tonnes in 48 hours. Previously that meant panicking at trade shows. On YORSO, we found three verified alternatives overnight and shipped on time.",
      name: "Jean-Pierre Moreau", role: "Import Manager", company: "Marée Fraîche SARL", country: "France", painTag: "Emergency sourcing",
    },
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
};

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
  hero_exploreLiveOffers: "Смотреть предложения",
  hero_liveOffers: "предложений",
  hero_verifiedSuppliers: "проверенных поставщиков",
  hero_countries: "стран",
  hero_activeBuyers: "активных покупателей",

  offers_liveMarketplace: "Маркетплейс онлайн",
  offers_title: "Оптовые предложения",
  offers_subtitle: "Актуальные предложения от проверенных поставщиков со всего мира — обновляются постоянно",
  offers_viewAll: "Все предложения",
  offers_viewAllMobile: "Все предложения",

  card_verified: "Проверен",
  card_viewOffer: "Смотреть",
  card_perKg: "за кг",
  card_frozen: "Заморож.",
  card_fresh: "Свежий",
  card_chilled: "Охлажд.",

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

  cat_title: "Категории продукции",
  cat_subtitle: "Найдите именно то, что нужно — от лосося и креветок до краба и сурими.",
  cat_offers: "предложений",
  cat_names: {
    Salmon: "Лосось",
    Shrimp: "Креветки",
    Whitefish: "Белая рыба",
    Tuna: "Тунец",
    Crab: "Краб",
    "Squid & Octopus": "Кальмар и осьминог",
    Shellfish: "Моллюски",
    Surimi: "Сурими",
  },

  verify_title: "Как проверяются поставщики",
  verify_subtitle: "Наша верификация заслужена, а не куплена. Вот что именно мы проверяем — и чем это отличается от того, что вы видели раньше.",
  verify_steps: [
    { title: "Проверка заявки", desc: "Поставщики предоставляют регистрацию, экспортные лицензии и сертификаты производства (HACCP, BRC, MSC). Самосертификация не принимается.", unlike: "В отличие от «Gold Supplier» Alibaba, который можно купить за $5K/год." },
    { title: "Должная проверка", desc: "Наша команда проверяет регистрацию компании, торговые рекомендации от реальных покупателей и подтверждает производственные возможности.", unlike: "В отличие от каталогов, где поставщики регистрируются без какой-либо проверки." },
    { title: "Значок верификации", desc: "Одобренные поставщики получают значок, видимый на всех предложениях. Значок перепроверяется ежегодно — он может быть отозван.", unlike: "В отличие от платных значков, которые никогда не истекают вне зависимости от качества." },
  ],
  verify_failTitle: "Что происходит, если поставщик не прошёл проверку?",
  verify_failDesc: "Значки верификации могут быть приостановлены или отозваны. Если поставщик получает жалобы на качество, не проходит ежегодную перепроверку или нарушает правила платформы — значок удаляется, а покупатели уведомляются. Мы отклонили тысячи заявок и приостановили десятки ранее верифицированных поставщиков.",
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
    {
      quote: "Потеряв $40K на Alibaba из-за поставщика, который подменил товар в контейнере, я зарёкся от маркетплейсов. YORSO оказался другим — я проверил фабрику до заказа, и мне никогда не скрывали прямой телефон поставщика. Это изменило всё.",
      name: "Маркус Хендриксен", role: "Директор по закупкам", company: "Nordic Fish Import AB", country: "Швеция", painTag: "Выжил после подмены",
    },
    {
      quote: "CFO спросил, почему мы платим на 12% выше рынка за креветку. У меня не было ответа — мы годами работали с одним брокером. Теперь я прихожу на совет директоров с данными YORSO и веду переговоры с позиции силы. В прошлом квартале сэкономили $180K.",
      name: "София Чень", role: "Менеджер по цепям поставок", company: "Pacific Seafood Trading", country: "Сингапур", painTag: "Ценовая слепота → экономия",
    },
    {
      quote: "Когда у нашего чилийского поставщика лосося случился форс-мажор в разгар сезона, нам нужно было 20 тонн за 48 часов. Раньше это означало панику на выставках. На YORSO мы нашли три проверенные альтернативы за ночь и отгрузили вовремя.",
      name: "Жан-Пьер Моро", role: "Менеджер по импорту", company: "Marée Fraîche SARL", country: "Франция", painTag: "Экстренные закупки",
    },
  ],

  faq_title: "Часто задаваемые вопросы",
  faq_subtitle: "Частые вопросы от покупателей, оценивающих YORSO для своих закупок.",
  faq_items: [
    { question: "В чём подвох? Будете брать комиссию позже или продавать мои данные?", answer: "Никакого подвоха. YORSO берёт 0% комиссии с ваших сделок — сегодня и всегда. Мы монетизируемся через опциональные премиум-инструменты (аналитика, приоритетное размещение для поставщиков), никогда за счёт вашей маржи. Ваши данные — ваши: мы соответствуем GDPR и никогда не продаём и не передаём их третьим лицам." },
    { question: "У меня уже есть проверенные поставщики. Зачем мне платформа?", answer: "Ваши текущие поставщики никуда не денутся. YORSO даёт вам рычаг: сравнивайте цены из 48 стран, находите резервных поставщиков до того, как единственный источник подведёт вас в 2 часа ночи, и ведите переговоры с позиции знания, а не зависимости." },
    { question: "Как узнать, что поставщики реальные, а не очередной скам как на Alibaba?", answer: "Каждый верифицированный поставщик проходит многоэтапную проверку: бизнес-лицензии, экспортная документация, сертификаты производства (HACCP, BRC, MSC) и торговые рекомендации. Мы отклонили тысячи заявок. В отличие от платных значков Alibaba «Gold Supplier», наша верификация заслужена, а не куплена." },
    { question: "У нас пик сезона — нет времени осваивать новую систему.", answer: "Регистрация занимает 5 минут. Без обучения, без IT-отдела, без интеграций. Среднее время от регистрации до первого контакта с поставщиком — менее 1 часа. Если умеете пользоваться почтой — справитесь с YORSO." },
    { question: "Программа не может понюхать рыбу. Мне нужен физический контроль качества.", answer: "Согласны — и никогда не скажем обратного. YORSO не заменяет ваш процесс контроля качества. Он заменяет недели переписок, Excel-таблиц и поездок на выставки, которые вы тратите на поиск и сравнение поставщиков. Вы по-прежнему инспектируете, торгуетесь и решаете. Мы просто помогаем составить правильный шорт-лист в 10 раз быстрее." },
    { question: "Мои конкуренты увидят, что я покупаю или с кем общаюсь?", answer: "Никогда. Ваша активность, запросы и переписка с поставщиками на 100% конфиденциальны. Поставщики видят ваш профиль компании только когда вы решите с ними связаться. Никакой публичной истории покупок, никаких утечек конкурентной разведки." },
    { question: "Как YORSO обеспечивает безопасность и соответствие?", answer: "YORSO полностью соответствует GDPR, данные хранятся в инфраструктуре ЕС. Все коммуникации зашифрованы при передаче и хранении. Мы проводим регулярные аудиты безопасности, а верификация поставщиков включает проверки экспортного регулирования, стандартов пищевой безопасности (HACCP, BRC, IFS) и санкционный скрининг." },
  ],

  cta_title1: "Начните закупки с",
  cta_title2: "уверенностью",
  cta_subtitle: "Присоединяйтесь к тысячам специалистов по закупкам, которые находят морепродукты через проверенных поставщиков, прозрачные цены и прямые контакты — без комиссий и привязок.",
  cta_registerFree: "Регистрация",
  cta_freeNote: "Бесплатно для покупателей · Без банковской карты · Настройка за 5 минут",
  cta_verifiedSuppliers: "380 проверенных поставщиков",
  cta_zeroCommission: "0% комиссии",
  cta_directContacts: "Прямые контакты всегда",

  footer_desc: "Глобальный B2B маркетплейс морепродуктов. Связываем профессиональных покупателей с проверенными поставщиками из 48 стран — с прозрачными ценами, прямыми контактами и без комиссий.",
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
};

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

  card_verified: "Verificado",
  card_viewOffer: "Ver oferta",
  card_perKg: "por kg",
  card_frozen: "Congelado",
  card_fresh: "Fresco",
  card_chilled: "Refrigerado",

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
    { title: "Reducir riesgo de suministro", desc: "Precalifique proveedores de respaldo antes de que su fuente principal falle. Compare alternativas verificadas de 48 países." },
    { title: "Visibilidad de precios", desc: "Vea precios reales de múltiples orígenes. Negocie con datos de referencia, no con suposiciones." },
    { title: "Solo proveedores verificados", desc: "Cada proveedor pasa revisión documental, inspección de instalaciones y verificación de referencias comerciales." },
    { title: "Decisiones de compra más rápidas", desc: "Busque, compare y contacte proveedores en horas — no en semanas de correos y ferias comerciales." },
  ],
  value_supplierBenefits: [
    { title: "Cero comisión", desc: "Conserve el 100% de sus márgenes. Sin tarifas ocultas, sin porcentaje de las operaciones. Relaciones directas con compradores." },
    { title: "Demanda calificada", desc: "Conéctese con profesionales de compras verificados que buscan activamente sus productos." },
    { title: "Visibilidad todo el año", desc: "Sus ofertas están activas 24/7 para compradores de 48+ países. No solo durante una feria de 3 días." },
    { title: "Confianza a través de la verificación", desc: "Muestre sus certificaciones y trayectoria. Los compradores contactan primero a proveedores verificados." },
  ],

  cat_title: "Explorar por categoría",
  cat_subtitle: "Encuentre exactamente lo que necesita — desde salmón y camarón hasta cangrejo y surimi.",
  cat_offers: "ofertas",
  cat_names: {
    Salmon: "Salmón",
    Shrimp: "Camarón",
    Whitefish: "Pescado blanco",
    Tuna: "Atún",
    Crab: "Cangrejo",
    "Squid & Octopus": "Calamar y pulpo",
    Shellfish: "Mariscos",
    Surimi: "Surimi",
  },

  verify_title: "Cómo se verifican los proveedores",
  verify_subtitle: "Nuestra verificación se gana, no se compra. Esto es exactamente lo que revisamos — y en qué se diferencia de lo que ha visto antes.",
  verify_steps: [
    { title: "Revisión de solicitud", desc: "Los proveedores presentan registro comercial, licencias de exportación y certificaciones de instalaciones (HACCP, BRC, MSC). No se acepta autocertificación.", unlike: "A diferencia del \"Gold Supplier\" de Alibaba que cualquiera puede comprar por $5K/año." },
    { title: "Diligencia debida", desc: "Nuestro equipo verifica el registro de la empresa, comprueba referencias comerciales con compradores reales y confirma capacidades de producción.", unlike: "A diferencia de directorios donde los proveedores se listan sin ninguna verificación." },
    { title: "Insignia de verificación", desc: "Los proveedores aprobados obtienen una insignia verificada visible en todas las ofertas. Se revalida anualmente — puede ser revocada.", unlike: "A diferencia de insignias de pago que nunca caducan sin importar el rendimiento." },
  ],
  verify_failTitle: "¿Qué pasa si un proveedor no cumple?",
  verify_failDesc: "Las insignias verificadas pueden ser suspendidas o revocadas. Si un proveedor recibe quejas de calidad, no pasa la reverificación anual o incumple las reglas de la plataforma, su insignia se elimina y se notifica a los compradores. Hemos rechazado miles de solicitudes y suspendido docenas de proveedores previamente verificados.",
  verify_ctaHint: "Regístrese para ver perfiles completos de proveedores, certificaciones y estado de verificación.",
  verify_ctaBtn: "Desbloquear datos de proveedores",

  activity_live: "En vivo",
  activity_title: "Actividad del mercado",
  activity_subtitle: "Actualizaciones en tiempo real — nuevos listados, cambios de precio y actividad de proveedores.",
  activity_footer: "Se actualiza automáticamente · Mostrando la última actividad de todas las categorías",
  activity_feed: [
    { text: "Nuevo listado: Filete de abadejo congelado de Rusia", time: "3 min" },
    { text: "Nuevo proveedor verificado: Thai Union Seafood (Tailandia)", time: "12 min" },
    { text: "Precio actualizado: Caballa atlántica HG — Noruega", time: "18 min" },
    { text: "Nuevo listado: Camarón tigre negro HLSO de Bangladesh", time: "25 min" },
    { text: "Nuevo proveedor: Hokkaido Fisheries (Japón)", time: "34 min" },
    { text: "Precio actualizado: Camarón vannamei PD — India", time: "41 min" },
    { text: "Nuevo listado: Filete de merluza congelado de Chile", time: "52 min" },
    { text: "Nuevo proveedor verificado: Austral Fisheries (Australia)", time: "1h" },
  ],

  social_title: "De escépticos a usuarios habituales",
  social_subtitle: "Historias reales de profesionales de compras que se quemaron antes — y encontraron algo mejor.",
  social_testimonials: [
    {
      quote: "Después de perder $40K en Alibaba con un proveedor que cambió el producto en el contenedor, juré no usar más marketplaces. YORSO fue diferente — verifiqué la fábrica antes de ordenar y nunca ocultaron el teléfono directo del proveedor. Eso lo cambió todo.",
      name: "Marcus Hendriksen", role: "Director de Compras", company: "Nordic Fish Import AB", country: "Suecia", painTag: "Sobreviviente de fraude",
    },
    {
      quote: "Mi CFO preguntó por qué pagamos 12% más que el mercado por camarón. No tenía respuesta — llevábamos años con el mismo bróker. Ahora llego a las reuniones con datos de referencia de YORSO y negocio desde una posición de fuerza. El último trimestre ahorramos $180K.",
      name: "Sofia Chen", role: "Gerente de Cadena de Suministro", company: "Pacific Seafood Trading", country: "Singapur", painTag: "Ceguera de precios → ahorro",
    },
    {
      quote: "Cuando nuestro proveedor de salmón chileno tuvo un caso de fuerza mayor en plena temporada, necesitábamos 20 toneladas en 48 horas. Antes eso significaba pánico en ferias comerciales. En YORSO encontramos tres alternativas verificadas en una noche y enviamos a tiempo.",
      name: "Jean-Pierre Moreau", role: "Gerente de Importación", company: "Marée Fraîche SARL", country: "Francia", painTag: "Compras de emergencia",
    },
  ],

  faq_title: "Preguntas frecuentes",
  faq_subtitle: "Preguntas comunes de compradores que evalúan YORSO para sus necesidades de abastecimiento.",
  faq_items: [
    { question: "¿Cuál es la trampa? ¿Cobrarán comisión después o venderán mis datos?", answer: "Sin trampas. YORSO cobra 0% de comisión en sus operaciones — hoy y siempre. Monetizamos a través de herramientas premium opcionales (analítica, posicionamiento prioritario para proveedores), nunca de su margen. Sus datos son suyos: cumplimos con GDPR y nunca vendemos ni compartimos datos con terceros." },
    { question: "Ya tengo proveedores de confianza. ¿Para qué necesito una plataforma?", answer: "Sus proveedores actuales no van a ninguna parte. YORSO le da ventaja: compare precios de 48 países, descubra proveedores de respaldo antes de que su única fuente le falle a las 2 AM, y negocie desde una posición de conocimiento, no de dependencia." },
    { question: "¿Cómo sé que los proveedores son reales y no otra estafa tipo Alibaba?", answer: "Cada proveedor verificado pasa una revisión de múltiples pasos: licencias comerciales, documentación de exportación, certificaciones de instalaciones (HACCP, BRC, MSC) y referencias comerciales. Hemos rechazado miles de solicitudes. A diferencia de las insignias de pago de Alibaba, nuestra verificación se gana, no se compra." },
    { question: "Estamos en temporada alta — no tenemos tiempo para aprender un nuevo sistema.", answer: "El registro toma 5 minutos. Sin capacitación, sin departamento de IT, sin integraciones. El tiempo promedio desde el registro hasta el primer contacto con un proveedor es menos de 1 hora." },
    { question: "El software no puede oler el pescado. Necesito control de calidad físico.", answer: "De acuerdo — y nunca diríamos lo contrario. YORSO no reemplaza su proceso de control de calidad. Reemplaza las semanas de correos, hojas de Excel y viajes a ferias que dedica a encontrar y comparar proveedores. Usted sigue inspeccionando, negociando y decidiendo. Solo le ayudamos a llegar a la lista correcta 10 veces más rápido." },
    { question: "¿Mis competidores verán lo que compro o con quién hablo?", answer: "Nunca. Su actividad, consultas y conversaciones con proveedores son 100% privadas. Los proveedores ven su perfil de empresa solo cuando usted decide contactarlos. Sin historial público de compras, sin filtraciones de inteligencia competitiva." },
    { question: "¿Cómo maneja YORSO la seguridad y el cumplimiento?", answer: "YORSO cumple totalmente con GDPR con datos almacenados en infraestructura de la UE. Todas las comunicaciones están cifradas en tránsito y en reposo. Realizamos auditorías de seguridad regulares, y la verificación de proveedores incluye controles de regulaciones de exportación, estándares de seguridad alimentaria (HACCP, BRC, IFS) y cribado de sanciones comerciales." },
  ],

  cta_title1: "Comience a comprar con",
  cta_title2: "confianza",
  cta_subtitle: "Únase a miles de profesionales de compras que abastecen mariscos a través de proveedores verificados, precios transparentes y contactos directos — sin comisiones ni compromisos.",
  cta_registerFree: "Registro gratis",
  cta_freeNote: "Gratis para compradores · Sin tarjeta de crédito · Configuración en 5 minutos",
  cta_verifiedSuppliers: "380 proveedores verificados",
  cta_zeroCommission: "0% comisión",
  cta_directContacts: "Contactos directos siempre",

  footer_desc: "El marketplace B2B global de mariscos. Conectando compradores profesionales con proveedores verificados en 48 países — con precios transparentes, contactos directos y cero comisiones.",
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
};

export const translations: Record<Language, TranslationKeys> = { en, ru, es };
