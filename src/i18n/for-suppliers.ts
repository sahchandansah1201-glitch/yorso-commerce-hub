import { useLanguage } from "./LanguageContext";
import type { Language } from "./translations";

/**
 * Локализация страницы /for-suppliers.
 * Структура копирайта по секциям: проблема → текущий обходной путь →
 * механика YORSO → артефакт → действие.
 */

export interface ForSuppliersDict {
  seo_title: string;
  seo_description: string;
  seo_ogImageAlt: string;
  seo_ogLocale: string;

  // Hero
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_ctaPrimary: string;
  hero_ctaSecondary: string;
  hero_note: string;

  // Pain map (problem + current workaround)
  pain_eyebrow: string;
  pain_title: string;
  pain_subtitle: string;
  pain_items: { title: string; today: string; cost: string }[]; // 4

  // How YORSO helps (mechanism)
  help_eyebrow: string;
  help_title: string;
  help_subtitle: string;
  help_items: { title: string; body: string }[]; // 5

  // What supplier gets (concrete artifact)
  gets_eyebrow: string;
  gets_title: string;
  gets_subtitle: string;
  gets_items: { title: string; body: string }[]; // 5
  gets_today: string; // small label "Сегодня"
  gets_inYorso: string; // small label "В YORSO"

  // Workflow: how a supplier works in YORSO (4 steps)
  flow_eyebrow: string;
  flow_title: string;
  flow_subtitle: string;
  flow_stepLabel: string; // "Step"
  flow_steps: { title: string; body: string }[]; // 4

  // What buyers see (mock preview)
  preview_eyebrow: string;
  preview_title: string;
  preview_subtitle: string;
  preview_product: string;
  preview_origin: string;
  preview_originValue: string;
  preview_format: string;
  preview_formatValue: string;
  preview_certifications: string;
  preview_priceRange: string;
  preview_priceLocked: string;
  preview_priceLockedHint: string;
  preview_supplier: string;
  preview_supplierLocked: string;
  preview_supplierLockedHint: string;
  preview_ctaRequest: string;
  preview_caption: string;

  // Price visibility control (3 access states)
  access_eyebrow: string;
  access_title: string;
  access_subtitle: string;
  access_states: { label: string; who: string; sees: { text: string; hidden?: boolean }[] }[]; // 3
  access_flowTitle: string;
  access_flowSteps: string[]; // 4

  // Less noise: before / after
  noise_eyebrow: string;
  noise_title: string;
  noise_subtitle: string;
  noise_beforeLabel: string;
  noise_afterLabel: string;
  noise_before: string[]; // 4
  noise_after: string[]; // 4

  // Final CTA
  cta_title: string;
  cta_subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  cta_note: string;
}

const en: ForSuppliersDict = {
  seo_title: "YORSO for Suppliers · Sell Seafood B2B Without Price Leaks",
  seo_description:
    "B2B sales workspace for seafood exporters: control who sees your prices, receive qualified buyer requests, manage documents and certifications in one card.",
  seo_ogImageAlt:
    "YORSO for Suppliers — controlled price access, qualified buyer requests, one supplier card with documents and certifications.",
  seo_ogLocale: "en_US",

  hero_eyebrow: "For seafood suppliers, processors and exporters",
  hero_title: "Stop sending price lists to people who never buy.",
  hero_subtitle:
    "A supplier doesn’t need hundreds of random requests. A supplier needs buyers who understand the product, the volume, the documents and the delivery terms. YORSO shows your offer to those buyers — and opens the price by your rules, not to every visitor.",
  hero_ctaPrimary: "Register as supplier",
  hero_ctaSecondary: "See buyer requests",
  hero_note: "Free to register. 0% commission on deals.",

  pain_eyebrow: "Where supplier time goes today",
  pain_title: "Four things that quietly burn the sales day",
  pain_subtitle:
    "These are not abstractions — this is how a seafood sales team actually spends Monday.",
  pain_items: [
    {
      title: "Buyers ask for prices and disappear",
      today:
        "Today: a free-mail address asks for a full price list, the manager prepares the quote, sends it — and never hears back.",
      cost: "Result: time spent on someone who was never going to buy from you.",
    },
    {
      title: "The price list leaks before the deal",
      today:
        "Today: a price sent to one buyer ends up in three other chats and a competitor’s spreadsheet by the end of the week.",
      cost: "Result: you anchor the market against your own margin.",
    },
    {
      title: "The same documents asked again and again",
      today:
        "Today: licence, plant attestation, MSC/ASC/BRC/IFS/HACCP certificates and trade history are re-sent for every new buyer, by email and messenger.",
      cost: "Result: a serious buyer still cannot defend the deal internally without a single supplier card.",
    },
    {
      title: "Sales work is scattered across tools",
      today:
        "Today: WhatsApp, email, Excel and last year’s buyer list. No single place where active requests, prices and buyer status live together.",
      cost: "Result: the head of sales cannot see what the team is actually working on this week.",
    },
  ],

  help_eyebrow: "How YORSO helps",
  help_title: "Visibility with qualified buyers — not random traffic",
  help_subtitle:
    "YORSO helps you show your offer to buyers who are already sourcing fish and seafood for purchase, and opens prices and supplier data by access rules, not to every visitor.",
  help_items: [
    {
      title: "Controlled price access",
      body:
        "Anonymous visitors see a range. The exact price opens only after a registered buyer requests access — and you approve.",
    },
    {
      title: "Qualified buyer requests",
      body:
        "Requests come from registered buyers with a known company, country and procurement context. No more free-mail price hunting.",
    },
    {
      title: "One supplier card with documents",
      body:
        "Registration data, licence, certifications (MSC, ASC, BRC, IFS, HACCP) and trade history live in one card the buyer can show internally.",
    },
    {
      title: "Offer visibility in the right category",
      body:
        "Your offers reach buyers sourcing your species, origin and format — not the entire internet.",
    },
    {
      title: "Buyer activity in your category",
      body:
        "See where demand is moving and which categories buyers are actively requesting, so the sales team starts the day with the right offers.",
    },
  ],

  gets_eyebrow: "What you get inside",
  gets_today: "Today",
  gets_inYorso: "In YORSO",
  gets_title: "Five working surfaces, not slides",
  gets_subtitle:
    "Each surface replaces a piece of work the supplier currently does in WhatsApp, email or Excel.",
  gets_items: [
    {
      title: "Public supplier card",
      body:
        "One link with company data, licence, certifications and trade history. Send it instead of a PDF deck — the buyer can paste it into an internal approval.",
    },
    {
      title: "Product offers",
      body:
        "Structured offers by species, format, origin and packaging. Edited once, visible to qualified buyers in the right category.",
    },
    {
      title: "Buyer requests",
      body:
        "Inbound requests from identified buyers with volume, destination and timing already attached — instead of a one-line WhatsApp message.",
    },
    {
      title: "Price access requests",
      body:
        "A clear queue of buyers asking for the exact price. Approve, decline or ask for context — without losing the thread.",
    },
    {
      title: "One workspace for follow-up",
      body:
        "Conversation, price decision and next step in one place. The head of sales can see what the team is working on without asking.",
    },
  ],

  flow_eyebrow: "How a supplier works in YORSO",
  flow_title: "Four steps, not an implementation project",
  flow_subtitle: "The sales team goes through the same sequence every week — only in one place.",
  flow_stepLabel: "Step",
  flow_steps: [
    { title: "Create the supplier profile", body: "Company data, licence, certifications and trade history — once. The buyer sees the same card your internal team uses." },
    { title: "Publish offers", body: "By species, format, origin and packaging. Offers appear in the right category, not across the whole internet." },
    { title: "Receive qualified buyer interest", body: "Requests come from registered buyers with volume, destination and timing already attached." },
    { title: "Manage price access and follow-up", body: "Approve or decline access to the exact price. The conversation and the decision live on one screen." },
  ],

  preview_eyebrow: "What buyers see",
  preview_title: "Your offer from the buyer’s side",
  preview_subtitle: "Public product data is visible at once. Exact price and supplier details — only after your approval.",
  preview_product: "Atlantic salmon, fillet skinless, frozen",
  preview_origin: "Origin",
  preview_originValue: "Norway",
  preview_format: "Format",
  preview_formatValue: "Fillet 2–3 kg, IQF, 20 kg case",
  preview_certifications: "Certifications",
  preview_priceRange: "Price range",
  preview_priceLocked: "Exact price",
  preview_priceLockedHint: "Opens after supplier approval",
  preview_supplier: "Supplier",
  preview_supplierLocked: "Supplier details",
  preview_supplierLockedHint: "Open together with price access",
  preview_ctaRequest: "Request price access",
  preview_caption: "UI mock. Real offers are managed inside the supplier workspace.",

  access_eyebrow: "Control over price visibility",
  access_title: "Three access levels, one rule",
  access_subtitle: "Supplier details follow price access. No approved price — no supplier contact.",
  access_states: [
    {
      label: "Anonymous visitor",
      who: "Not registered",
      sees: [
        { text: "Product name, origin, format" },
        { text: "Certifications" },
        { text: "Price range" },
        { text: "Exact price and supplier details — hidden", hidden: true },
      ],
    },
    {
      label: "Registered buyer",
      who: "Verified company and country",
      sees: [
        { text: "Everything above" },
        { text: "Offer context and terms" },
        { text: "Can request price access" },
        { text: "Exact price and supplier details — still hidden", hidden: true },
      ],
    },
    {
      label: "Access approved",
      who: "Access granted by the supplier",
      sees: [
        { text: "Exact price" },
        { text: "Supplier name and details" },
        { text: "Direct contact actions" },
        { text: "Workspace for conversation and follow-up" },
      ],
    },
  ],
  access_flowTitle: "Access request flow",
  access_flowSteps: [
    "The registered buyer clicks “Request price access”",
    "You see the request with company, country and context",
    "You approve, decline or ask for context",
    "The approved buyer sees the exact price and supplier details",
  ],

  noise_eyebrow: "Less noise for the sales team",
  noise_title: "Before and after on a normal day",
  noise_subtitle: "Same team, same Monday — different working surface.",
  noise_beforeLabel: "Today",
  noise_afterLabel: "In YORSO",
  noise_before: [
    "Five WhatsApp chats with price questions",
    "Spreadsheets with last week’s quotes",
    "Documents and certifications re-sent again",
    "Price requests from unknown free-mail addresses",
  ],
  noise_after: [
    "Buyer requests with volume and destination",
    "Offer cards with status and price in one place",
    "One supplier card with documents",
    "Queue of price access requests to approve",
  ],

  cta_title: "Put your sales work into one surface",
  cta_subtitle:
    "Register the company, publish the supplier card and start receiving qualified buyer requests in your category.",
  cta_primary: "Register as supplier",
  cta_secondary: "See buyer requests",
  cta_note: "Free to register. 0% commission on deals. You stay in control of price and contact.",
};

const ru: ForSuppliersDict = {
  seo_title: "YORSO для поставщиков · B2B-продажи морепродуктов без утечки цен",
  seo_description:
    "Рабочая B2B-площадка для экспортёров морепродуктов: контролируйте, кто видит цены, получайте квалифицированные запросы, ведите документы и сертификаты в одной карточке.",

  hero_eyebrow: "Поставщикам, переработчикам и экспортёрам",
  hero_title: "Перестаньте отправлять прайсы тем, кто не покупает.",
  hero_subtitle:
    "Поставщику не нужны сотни случайных запросов. Нужны покупатели, которые понимают продукт, объём, документы и условия поставки. YORSO показывает ваше предложение таким покупателям — и открывает цену по вашим правилам, а не всем посетителям подряд.",
  hero_ctaPrimary: "Зарегистрироваться как поставщик",
  hero_ctaSecondary: "Смотреть запросы покупателей",
  hero_note: "Регистрация бесплатно. 0% комиссии со сделок.",

  pain_eyebrow: "Куда уходит время отдела продаж",
  pain_title: "Четыре вещи, которые тихо съедают рабочий день",
  pain_subtitle:
    "Это не абстракции — так реально проходит понедельник у отдела продаж морепродуктов.",
  pain_items: [
    {
      title: "Покупатели спрашивают цену и исчезают",
      today:
        "Сегодня: запрос приходит с адреса на бесплатной почте, менеджер готовит полную котировку, отправляет — и никогда больше не слышит этого покупателя.",
      cost: "Итог: время потрачено на того, кто и не собирался покупать.",
    },
    {
      title: "Прайс утекает раньше сделки",
      today:
        "Сегодня: цена, отправленная одному покупателю, к концу недели лежит ещё в трёх чатах и в таблице у конкурента.",
      cost: "Итог: вы сами якорите рынок против своей же маржи.",
    },
    {
      title: "Документы и сертификаты просят снова и снова",
      today:
        "Сегодня: лицензия, аттестация завода, MSC/ASC/BRC/IFS/ХАССП и история работы пересылаются каждому новому покупателю — почтой и в мессенджерах.",
      cost: "Итог: серьёзный покупатель всё равно не может защитить сделку внутри без одной карточки поставщика.",
    },
    {
      title: "Работа продаж разбросана по инструментам",
      today:
        "Сегодня: WhatsApp, почта, Excel и прошлогодний список покупателей. Нет места, где активные запросы, цены и статус покупателей живут вместе.",
      cost: "Итог: руководитель не видит, над чем команда реально работает на этой неделе.",
    },
  ],

  help_eyebrow: "Чем помогает YORSO",
  help_title: "Видимость для квалифицированных покупателей, а не случайный трафик",
  help_subtitle:
    "YORSO помогает показывать предложение тем, кто уже ищет рыбу и морепродукты для закупки. Цены и данные поставщика открываются по правилам доступа, а не всем посетителям подряд.",
  help_items: [
    {
      title: "Управляемый доступ к цене",
      body:
        "Анонимный посетитель видит диапазон. Точная цена открывается только после запроса от зарегистрированного покупателя — и вашего согласия.",
    },
    {
      title: "Квалифицированные запросы покупателей",
      body:
        "Запросы приходят от зарегистрированных покупателей с известной компанией, страной и закупочным контекстом. Без охоты за прайсом с бесплатной почты.",
    },
    {
      title: "Одна карточка поставщика с документами",
      body:
        "Регистрационные данные, лицензия, сертификации (MSC, ASC, BRC, IFS, ХАССП) и история работы — в одной карточке, которую покупатель показывает у себя внутри.",
    },
    {
      title: "Видимость в нужной категории",
      body:
        "Ваши предложения попадают к покупателям, которые закупают ваш вид, происхождение и формат, а не ко всему интернету.",
    },
    {
      title: "Активность покупателей в категории",
      body:
        "Видно, куда смещается спрос и какие категории покупатели сейчас активно запрашивают — отдел продаж начинает день с правильных предложений.",
    },
  ],

  gets_eyebrow: "Что получает поставщик внутри",
  gets_today: "Сегодня",
  gets_inYorso: "В YORSO",
  gets_title: "Пять рабочих поверхностей, а не слайды",
  gets_subtitle:
    "Каждая поверхность заменяет работу, которую сейчас приходится делать в WhatsApp, почте и Excel.",
  gets_items: [
    {
      title: "Публичная карточка поставщика",
      body:
        "Одна ссылка с данными компании, лицензией, сертификациями и историей работы. Отправляете её вместо PDF-презентации — покупатель вставляет в своё внутреннее согласование.",
    },
    {
      title: "Предложения по продукции",
      body:
        "Структурированные предложения по виду, формату, происхождению и упаковке. Редактируете один раз — видят квалифицированные покупатели нужной категории.",
    },
    {
      title: "Запросы покупателей",
      body:
        "Входящие запросы от идентифицированных покупателей с объёмом, направлением и сроками сразу в карточке — вместо одной строки в WhatsApp.",
    },
    {
      title: "Запросы доступа к цене",
      body:
        "Понятная очередь покупателей, которые просят точную цену. Одобряете, отклоняете или просите контекст — не теряя нить разговора.",
    },
    {
      title: "Одно место для работы с покупателем",
      body:
        "Переписка, решение по цене и следующий шаг — в одном месте. Руководитель видит, над чем работает команда, не дёргая каждого по отдельности.",
    },
  ],

  flow_eyebrow: "Как поставщик работает в YORSO",
  flow_title: "Четыре шага, а не проект внедрения",
  flow_subtitle: "Отдел продаж проходит одну и ту же последовательность каждую неделю — только в одном месте.",
  flow_stepLabel: "Шаг",
  flow_steps: [
    { title: "Создать карточку поставщика", body: "Данные компании, лицензия, сертификации и история — один раз. Покупатель видит ту же карточку, что и ваш отдел внутри." },
    { title: "Опубликовать предложения", body: "По виду, формату, происхождению и упаковке. Предложения видны в нужной категории, а не во всём интернете." },
    { title: "Получать квалифицированный интерес", body: "Запросы от зарегистрированных покупателей с объёмом, направлением и сроками сразу в карточке." },
    { title: "Управлять доступом к цене и работой с покупателем", body: "Одобряете или отклоняете доступ к точной цене. Переписка и решение живут в одном экране." },
  ],

  preview_eyebrow: "Что видит покупатель",
  preview_title: "Ваше предложение со стороны покупателя",
  preview_subtitle: "Публичные данные продукта видны сразу. Точная цена и данные поставщика — только после вашего согласия.",
  preview_product: "Сёмга атлантическая, филе б/к, замороженная",
  preview_origin: "Происхождение",
  preview_originValue: "Норвегия",
  preview_format: "Формат",
  preview_formatValue: "Филе 2–3 кг, IQF, короб 20 кг",
  preview_certifications: "Сертификации",
  preview_priceRange: "Диапазон цены",
  preview_priceLocked: "Точная цена",
  preview_priceLockedHint: "Открывается после согласия поставщика",
  preview_supplier: "Поставщик",
  preview_supplierLocked: "Данные поставщика",
  preview_supplierLockedHint: "Открываются вместе с доступом к цене",
  preview_ctaRequest: "Запросить доступ к цене",
  preview_caption: "Макет интерфейса. Реальные предложения управляются внутри рабочего места поставщика.",

  access_eyebrow: "Контроль видимости цены",
  access_title: "Три уровня доступа, одно правило",
  access_subtitle: "Данные поставщика следуют за доступом к цене. Нет одобренной цены — нет контактов поставщика.",
  access_states: [
    {
      label: "Анонимный посетитель",
      who: "Без регистрации",
      sees: [
        { text: "Название продукта, происхождение, формат" },
        { text: "Сертификации" },
        { text: "Диапазон цены" },
        { text: "Точная цена и данные поставщика — скрыты", hidden: true },
      ],
    },
    {
      label: "Зарегистрированный покупатель",
      who: "Подтверждённая компания и страна",
      sees: [
        { text: "Всё, что выше" },
        { text: "Контекст предложения и условия" },
        { text: "Может запросить доступ к цене" },
        { text: "Точная цена и данные поставщика — пока скрыты", hidden: true },
      ],
    },
    {
      label: "Доступ одобрен",
      who: "Доступ выдан поставщиком",
      sees: [
        { text: "Точная цена" },
        { text: "Название и данные поставщика" },
        { text: "Действия для прямого контакта" },
        { text: "Рабочее место для переписки и работы с покупателем" },
      ],
    },
  ],
  access_flowTitle: "Поток запроса доступа",
  access_flowSteps: [
    "Зарегистрированный покупатель нажимает «Запросить доступ к цене»",
    "Вы видите запрос с компанией, страной и контекстом",
    "Одобряете, отклоняете или просите контекст",
    "Одобренный покупатель видит точную цену и данные поставщика",
  ],

  noise_eyebrow: "Меньше шума для отдела продаж",
  noise_title: "До и после в обычный день",
  noise_subtitle: "Та же команда, тот же понедельник — другая поверхность работы.",
  noise_beforeLabel: "Сегодня",
  noise_afterLabel: "В YORSO",
  noise_before: [
    "Пять чатов в WhatsApp с вопросами по цене",
    "Excel-таблицы с прошлой неделей котировок",
    "Документы и сертификаты, отправленные ещё раз",
    "Запросы цены с незнакомых бесплатных адресов",
  ],
  noise_after: [
    "Запросы покупателей с объёмом и направлением",
    "Карточки предложений со статусом и ценой в одном месте",
    "Одна карточка поставщика с документами",
    "Очередь запросов доступа к цене для одобрения",
  ],

  cta_title: "Соберите работу отдела продаж в одной поверхности",
  cta_subtitle:
    "Зарегистрируйте компанию, опубликуйте карточку поставщика и начните получать квалифицированные запросы в своей категории.",
  cta_primary: "Зарегистрироваться как поставщик",
  cta_secondary: "Смотреть запросы покупателей",
  cta_note: "Регистрация бесплатно. 0% комиссии со сделок. Цена и контакт остаются под вашим контролем.",
};

const es: ForSuppliersDict = {
  seo_title: "YORSO para Proveedores · Vende Mariscos B2B Sin Filtrar Precios",
  seo_description:
    "Espacio B2B para exportadores de mariscos: controla quién ve tus precios, recibe solicitudes cualificadas y gestiona documentos y certificaciones en una sola ficha.",

  hero_eyebrow: "Para proveedores, procesadores y exportadores",
  hero_title: "Deja de enviar precios a quien nunca compra.",
  hero_subtitle:
    "Un proveedor no necesita cientos de solicitudes al azar. Necesita compradores que entiendan el producto, el volumen, los documentos y las condiciones de entrega. YORSO muestra tu oferta a esos compradores — y abre el precio según tus reglas, no a cualquier visitante.",
  hero_ctaPrimary: "Registrarse como proveedor",
  hero_ctaSecondary: "Ver solicitudes de compradores",
  hero_note: "Registro gratuito. 0% de comisión sobre operaciones.",

  pain_eyebrow: "A dónde se va el tiempo del proveedor",
  pain_title: "Cuatro cosas que silenciosamente queman el día de ventas",
  pain_subtitle:
    "No son abstracciones — así pasa el lunes un equipo real de ventas de mariscos.",
  pain_items: [
    {
      title: "Compradores piden precio y desaparecen",
      today:
        "Hoy: una dirección de correo gratuita pide la lista completa, el responsable prepara la cotización, la envía — y nunca vuelve a saber del comprador.",
      cost: "Resultado: tiempo gastado en alguien que nunca iba a comprarte.",
    },
    {
      title: "La lista de precios se filtra antes de la operación",
      today:
        "Hoy: un precio enviado a un comprador termina la misma semana en tres chats más y en la hoja de cálculo de un competidor.",
      cost: "Resultado: tú mismo anclas el mercado contra tu propio margen.",
    },
    {
      title: "Los mismos documentos pedidos una y otra vez",
      today:
        "Hoy: licencia, atestación de planta, MSC/ASC/BRC/IFS/HACCP e historial comercial se reenvían a cada nuevo comprador, por correo y mensajería.",
      cost: "Resultado: el comprador serio sigue sin poder defender la operación internamente sin una sola tarjeta de proveedor.",
    },
    {
      title: "El trabajo de ventas está disperso",
      today:
        "Hoy: WhatsApp, correo, Excel y la lista de compradores del año pasado. No hay un lugar donde las solicitudes activas, los precios y el estado vivan juntos.",
      cost: "Resultado: el responsable no ve en qué trabaja realmente el equipo esta semana.",
    },
  ],

  help_eyebrow: "Cómo ayuda YORSO",
  help_title: "Visibilidad ante compradores cualificados, no tráfico al azar",
  help_subtitle:
    "YORSO ayuda a mostrar la oferta a quienes ya buscan pescado y mariscos para comprar. Los precios y los datos del proveedor se abren por reglas de acceso, no a cualquier visitante.",
  help_items: [
    {
      title: "Acceso al precio controlado",
      body:
        "El visitante anónimo ve un rango. El precio exacto se abre solo tras la solicitud de un comprador registrado — y tu aprobación.",
    },
    {
      title: "Solicitudes cualificadas",
      body:
        "Las solicitudes vienen de compradores registrados con empresa, país y contexto de compra conocidos. Sin caza de precios desde correos gratuitos.",
    },
    {
      title: "Una tarjeta de proveedor con documentos",
      body:
        "Datos de registro, licencia, certificaciones (MSC, ASC, BRC, IFS, HACCP) e historial — en una tarjeta que el comprador puede mostrar internamente.",
    },
    {
      title: "Visibilidad en la categoría correcta",
      body:
        "Tus ofertas llegan a quienes compran tu especie, origen y formato — no a todo internet.",
    },
    {
      title: "Actividad de compradores en tu categoría",
      body:
        "Ves hacia dónde se mueve la demanda y qué categorías están solicitando ahora — el equipo empieza el día con las ofertas correctas.",
    },
  ],

  gets_eyebrow: "Qué recibe el proveedor por dentro",
  gets_today: "Hoy",
  gets_inYorso: "En YORSO",
  gets_title: "Cinco superficies de trabajo, no diapositivas",
  gets_subtitle:
    "Cada superficie sustituye un trabajo que hoy se hace en WhatsApp, correo o Excel.",
  gets_items: [
    {
      title: "Tarjeta pública del proveedor",
      body:
        "Un enlace con datos de la empresa, licencia, certificaciones e historial. Se envía en lugar de un PDF — el comprador lo pega en su aprobación interna.",
    },
    {
      title: "Ofertas de producto",
      body:
        "Ofertas estructuradas por especie, formato, origen y empaque. Se edita una vez y la ven los compradores cualificados de la categoría.",
    },
    {
      title: "Solicitudes de compradores",
      body:
        "Solicitudes entrantes de compradores identificados con volumen, destino y plazos — en lugar de una línea en WhatsApp.",
    },
    {
      title: "Solicitudes de acceso al precio",
      body:
        "Una cola clara de compradores que piden el precio exacto. Apruebas, rechazas o pides contexto sin perder el hilo.",
    },
    {
      title: "Un único espacio para el seguimiento",
      body:
        "Conversación, decisión de precio y siguiente paso en un solo lugar. El responsable ve en qué trabaja el equipo sin tener que preguntar.",
    },
  ],

  flow_eyebrow: "Cómo trabaja el proveedor en YORSO",
  flow_title: "Cuatro pasos, no un proyecto",
  flow_subtitle: "El equipo de ventas pasa por la misma secuencia cada semana — solo que en un solo lugar.",
  flow_stepLabel: "Paso",
  flow_steps: [
    { title: "Crear el perfil del proveedor", body: "Datos de la empresa, licencia, certificaciones e historial — una sola vez. El comprador ve la misma tarjeta que tu equipo interno." },
    { title: "Publicar las ofertas", body: "Por especie, formato, origen y empaque. Las ofertas se ven en la categoría correcta, no en todo internet." },
    { title: "Recibir interés cualificado", body: "Solicitudes de compradores registrados con volumen, destino y plazos ya adjuntos." },
    { title: "Gestionar acceso al precio y seguimiento", body: "Apruebas o rechazas el acceso al precio exacto. La conversación y la decisión viven en una sola pantalla." },
  ],

  preview_eyebrow: "Lo que ve el comprador",
  preview_title: "Tu oferta vista desde el lado del comprador",
  preview_subtitle: "Datos públicos del producto a la vista. Precio exacto y datos del proveedor — solo tras tu aprobación.",
  preview_product: "Salmón atlántico, fileteado, sin piel, congelado",
  preview_origin: "Origen",
  preview_originValue: "Noruega",
  preview_format: "Formato",
  preview_formatValue: "Filete 2–3 kg, IQF, caja 20 kg",
  preview_certifications: "Certificaciones",
  preview_priceRange: "Rango de precio",
  preview_priceLocked: "Precio exacto",
  preview_priceLockedHint: "Disponible tras aprobación del proveedor",
  preview_supplier: "Proveedor",
  preview_supplierLocked: "Datos del proveedor",
  preview_supplierLockedHint: "Se abren junto con el acceso al precio",
  preview_ctaRequest: "Solicitar acceso al precio",
  preview_caption: "Maqueta. Las ofertas reales se gestionan dentro del espacio del proveedor.",

  access_eyebrow: "Control de la visibilidad del precio",
  access_title: "Tres niveles de acceso, una sola regla",
  access_subtitle: "Los datos del proveedor siguen al acceso al precio. Sin precio aprobado — sin contacto del proveedor.",
  access_states: [
    {
      label: "Visitante anónimo",
      who: "Sin registro",
      sees: [
        { text: "Nombre del producto, origen, formato" },
        { text: "Certificaciones" },
        { text: "Rango de precio" },
        { text: "Precio exacto y datos del proveedor — ocultos", hidden: true },
      ],
    },
    {
      label: "Comprador registrado",
      who: "Empresa y país verificados",
      sees: [
        { text: "Todo lo anterior" },
        { text: "Contexto de oferta y términos" },
        { text: "Puede solicitar acceso al precio" },
        { text: "Precio exacto y datos del proveedor — aún ocultos", hidden: true },
      ],
    },
    {
      label: "Acceso aprobado",
      who: "Acceso concedido por el proveedor",
      sees: [
        { text: "Precio exacto" },
        { text: "Nombre y datos del proveedor" },
        { text: "Acciones de contacto directo" },
        { text: "Espacio de comunicación y seguimiento" },
      ],
    },
  ],
  access_flowTitle: "Flujo de solicitud de acceso",
  access_flowSteps: [
    "El comprador registrado pulsa «Solicitar acceso al precio»",
    "Tú ves la solicitud con la empresa, el país y el contexto",
    "Apruebas, rechazas o pides más contexto",
    "El comprador aprobado ve el precio y los datos del proveedor",
  ],

  noise_eyebrow: "Menos ruido para el equipo de ventas",
  noise_title: "Antes y después en un día normal",
  noise_subtitle: "El mismo equipo, el mismo lunes — distinta superficie de trabajo.",
  noise_beforeLabel: "Antes",
  noise_afterLabel: "Después",
  noise_before: [
    "Cinco chats de WhatsApp con preguntas de precio",
    "Hojas de cálculo con cotizaciones de la semana pasada",
    "Documentos y certificaciones reenviados otra vez",
    "Solicitudes de precio de correos gratuitos desconocidos",
  ],
  noise_after: [
    "Solicitudes de compradores con volumen y destino",
    "Tarjetas de oferta con estado y precio en un solo lugar",
    "Una sola tarjeta de proveedor con documentos",
    "Cola de solicitudes de acceso al precio para aprobar",
  ],

  cta_title: "Reúne el trabajo de ventas en una sola superficie",
  cta_subtitle:
    "Registra la empresa, publica la tarjeta de proveedor y empieza a recibir solicitudes cualificadas en tu categoría.",
  cta_primary: "Registrarse como proveedor",
  cta_secondary: "Ver solicitudes de compradores",
  cta_note: "Registro gratuito. 0% de comisión sobre operaciones. Mantienes el control del precio y del contacto.",
};

const dictionaries: Record<Language, ForSuppliersDict> = { en, ru, es };

export const useForSuppliers = (): ForSuppliersDict => {
  const { lang } = useLanguage();
  return dictionaries[lang] ?? dictionaries.en;
};
