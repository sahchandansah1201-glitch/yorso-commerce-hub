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
  access_states: { label: string; who: string; sees: string[] }[]; // 3
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
  seo_title: "YORSO for suppliers — sell seafood to qualified buyers",
  seo_description:
    "A working B2B sales surface for seafood suppliers: controlled price access, qualified buyer requests, one supplier card with documents and certifications.",

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

  cta_title: "Put your sales work into one surface",
  cta_subtitle:
    "Register the company, publish the supplier card and start receiving qualified buyer requests in your category.",
  cta_primary: "Register as supplier",
  cta_secondary: "See buyer requests",
  cta_note: "Free to register. 0% commission on deals. You stay in control of price and contact.",
};

const ru: ForSuppliersDict = {
  seo_title: "YORSO для поставщиков — продавайте морепродукты целевым покупателям",
  seo_description:
    "Рабочая поверхность продаж для поставщиков морепродуктов: управляемый доступ к цене, квалифицированные запросы покупателей, одна карточка поставщика с документами и сертификациями.",

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

  cta_title: "Соберите работу отдела продаж в одной поверхности",
  cta_subtitle:
    "Зарегистрируйте компанию, опубликуйте карточку поставщика и начните получать квалифицированные запросы в своей категории.",
  cta_primary: "Зарегистрироваться как поставщик",
  cta_secondary: "Смотреть запросы покупателей",
  cta_note: "Регистрация бесплатно. 0% комиссии со сделок. Цена и контакт остаются под вашим контролем.",
};

const es: ForSuppliersDict = {
  seo_title: "YORSO para proveedores — vende mariscos a compradores cualificados",
  seo_description:
    "Una superficie de ventas B2B para proveedores de mariscos: acceso controlado al precio, solicitudes cualificadas y una sola tarjeta de proveedor con documentos y certificaciones.",

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
