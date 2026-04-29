import { useLanguage } from "./LanguageContext";
import type { Language } from "./translations";

/**
 * Локализация страницы /for-suppliers.
 * Отдельный модуль, чтобы не раздувать общий translations.ts.
 * Все массивы должны иметь одинаковую длину во всех языках.
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

  // Pain map
  pain_eyebrow: string;
  pain_title: string;
  pain_subtitle: string;
  pain_items: { title: string; body: string }[]; // 4

  // How YORSO helps
  help_eyebrow: string;
  help_title: string;
  help_subtitle: string;
  help_items: { title: string; body: string }[]; // 5

  // What supplier gets
  gets_eyebrow: string;
  gets_title: string;
  gets_subtitle: string;
  gets_items: { title: string; body: string }[]; // 5

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
    "A working B2B sales surface for seafood suppliers: controlled price visibility, verified buyer requests, supplier profile with documents.",

  hero_eyebrow: "For suppliers, processors and exporters",
  hero_title: "Stop sending prices into the void.",
  hero_subtitle:
    "Most price requests never become deals. Buyers compare, forward your price and disappear. YORSO is a sales surface where the buyer is identified, the request is qualified and your price is shown only to those you allow.",
  hero_ctaPrimary: "Register as supplier",
  hero_ctaSecondary: "See buyer requests",
  hero_note: "Free to register. No commission on deals.",

  pain_eyebrow: "Where supplier time leaks",
  pain_title: "Four problems that quietly kill supplier margin",
  pain_subtitle:
    "Sales teams in seafood spend most of their day on activity that does not move a deal forward.",
  pain_items: [
    {
      title: "Unqualified price requests",
      body:
        "Anonymous emails, WhatsApp messages, half-formed inquiries. The supplier replies with a full quote and never hears back.",
    },
    {
      title: "Buyers do not trust an unknown supplier",
      body:
        "Without a public profile, documents and history a serious buyer cannot defend the deal internally — and chooses someone they already know.",
    },
    {
      title: "Prices leak the moment you send them",
      body:
        "A price sent to one buyer ends up in three other chats and a competitor’s spreadsheet by the end of the day.",
    },
    {
      title: "Sales work is scattered",
      body:
        "Email, messengers, spreadsheets, screenshots. There is no single place where a manager can see active requests, prices and buyer status.",
    },
  ],

  help_eyebrow: "How YORSO changes the work",
  help_title: "A controlled sales surface, not another marketplace",
  help_subtitle:
    "YORSO is built around the way professional seafood deals actually close.",
  help_items: [
    {
      title: "Controlled price visibility",
      body:
        "You decide who sees the exact price. Anonymous visitors see a range. Qualified buyers receive the figure after you approve access.",
    },
    {
      title: "Verified buyer requests",
      body:
        "Requests come from registered buyers with a known company, country and procurement context — not from a free-mail address.",
    },
    {
      title: "Supplier profile with documents",
      body:
        "Registration data, licence, certifications (MSC, ASC, BRC, IFS, HACCP) and trade history live in one supplier card the buyer can show internally.",
    },
    {
      title: "Product catalogue and offer visibility",
      body:
        "Your offers are placed in front of buyers who are actually sourcing your category, origin and format — not the entire internet.",
    },
    {
      title: "Market signals and buyer activity",
      body:
        "See category demand, origin interest and where buyer attention is moving, so the sales team works on the right offers first.",
    },
  ],

  gets_eyebrow: "What you get inside",
  gets_title: "Five working surfaces, not slides",
  gets_subtitle:
    "Everything below is a real screen the supplier and the sales team work in every day.",
  gets_items: [
    {
      title: "Public supplier profile",
      body:
        "One page with company data, licence, certifications and trade history — the link you send to a buyer instead of a PDF deck.",
    },
    {
      title: "Product offers",
      body:
        "Structured offers by species, format, origin and packaging. Edited once, visible to qualified buyers in the right category.",
    },
    {
      title: "Buyer requests",
      body:
        "Inbound requests from identified buyers with the volume, destination and timing already attached.",
    },
    {
      title: "Price access requests",
      body:
        "A clear queue of buyers asking for your exact price. You approve, decline or ask for more context — without losing the thread.",
    },
    {
      title: "Communication and follow-up workspace",
      body:
        "One place for the conversation, the price decision and the next step. No more searching three messengers for the last quote.",
    },
  ],

  cta_title: "Put your sales work into one surface",
  cta_subtitle:
    "Register the company, publish the supplier profile and start receiving qualified buyer requests.",
  cta_primary: "Register as supplier",
  cta_secondary: "See buyer requests",
  cta_note: "Free to register. You stay in control of price and contact.",
};

const ru: ForSuppliersDict = {
  seo_title: "YORSO для поставщиков — продавайте морепродукты целевым покупателям",
  seo_description:
    "Рабочая поверхность продаж для поставщиков морепродуктов: управляемая видимость цены, проверенные запросы покупателей, карточка поставщика с документами.",

  hero_eyebrow: "Поставщикам, переработчикам и экспортёрам",
  hero_title: "Перестаньте отправлять цены в пустоту.",
  hero_subtitle:
    "Большинство запросов цены никогда не превращаются в сделку. Покупатель сравнил, переслал вашу цену дальше и исчез. YORSO — это поверхность продаж, где покупатель идентифицирован, запрос квалифицирован, а вашу цену видят только те, кому вы это разрешили.",
  hero_ctaPrimary: "Зарегистрироваться как поставщик",
  hero_ctaSecondary: "Смотреть запросы покупателей",
  hero_note: "Регистрация бесплатно. Без комиссии со сделок.",

  pain_eyebrow: "Где утекает время отдела продаж",
  pain_title: "Четыре проблемы, которые тихо съедают маржу поставщика",
  pain_subtitle:
    "Большая часть рабочего дня отдела продаж в морепродуктах уходит на действия, которые не двигают сделку вперёд.",
  pain_items: [
    {
      title: "Неквалифицированные запросы цены",
      body:
        "Анонимные письма, сообщения в WhatsApp, обрывочные вопросы. Менеджер отправляет полную котировку и больше никогда не слышит этого покупателя.",
    },
    {
      title: "Покупатель не доверяет незнакомому поставщику",
      body:
        "Без публичной карточки, документов и истории серьёзный покупатель не может защитить сделку у себя внутри и выбирает того, кого уже знает.",
    },
    {
      title: "Цена утекает в момент отправки",
      body:
        "Цена, отправленная одному покупателю, к вечеру оказывается ещё в трёх чатах и в таблице у конкурента.",
    },
    {
      title: "Работа отдела продаж разбросана",
      body:
        "Почта, мессенджеры, таблицы, скриншоты. Нет одного места, где руководитель видит активные запросы, цены и статус покупателей.",
    },
  ],

  help_eyebrow: "Как YORSO меняет работу",
  help_title: "Управляемая поверхность продаж, а не ещё один маркетплейс",
  help_subtitle:
    "YORSO построен вокруг того, как реально закрываются профессиональные сделки по морепродуктам.",
  help_items: [
    {
      title: "Управляемая видимость цены",
      body:
        "Вы решаете, кто видит точную цену. Анонимный посетитель видит диапазон. Квалифицированный покупатель получает цифру после вашего согласия.",
    },
    {
      title: "Проверенные запросы покупателей",
      body:
        "Запросы приходят от зарегистрированных покупателей с известной компанией, страной и закупочным контекстом, а не с почты на бесплатном домене.",
    },
    {
      title: "Карточка поставщика с документами",
      body:
        "Регистрационные данные, лицензия, сертификации (MSC, ASC, BRC, IFS, ХАССП) и история работы — в одной карточке, которую покупатель может показать у себя внутри.",
    },
    {
      title: "Каталог продукции и видимость предложений",
      body:
        "Ваши предложения попадают к покупателям, которые реально закупают вашу категорию, происхождение и формат — а не ко всему интернету сразу.",
    },
    {
      title: "Рыночные сигналы и активность покупателей",
      body:
        "Видно спрос по категориям, интерес к происхождению и куда смещается внимание покупателей — отдел продаж сначала работает с правильными предложениями.",
    },
  ],

  gets_eyebrow: "Что получает поставщик внутри",
  gets_title: "Пять рабочих поверхностей, а не слайды",
  gets_subtitle:
    "Всё ниже — это реальные экраны, в которых поставщик и отдел продаж работают каждый день.",
  gets_items: [
    {
      title: "Публичная карточка поставщика",
      body:
        "Одна страница с данными компании, лицензией, сертификациями и историей работы — ссылка, которую вы отправляете покупателю вместо PDF-презентации.",
    },
    {
      title: "Предложения по продукции",
      body:
        "Структурированные предложения по виду, формату, происхождению и упаковке. Редактируете один раз — видят квалифицированные покупатели нужной категории.",
    },
    {
      title: "Запросы покупателей",
      body:
        "Входящие запросы от идентифицированных покупателей с объёмом, направлением и сроками сразу в карточке.",
    },
    {
      title: "Запросы доступа к цене",
      body:
        "Понятная очередь покупателей, которые просят вашу точную цену. Вы одобряете, отклоняете или просите контекст — не теряя нить разговора.",
    },
    {
      title: "Коммуникации и работа с покупателем",
      body:
        "Одно место для переписки, решения по цене и следующего шага. Не нужно искать последнюю котировку по трём мессенджерам.",
    },
  ],

  cta_title: "Соберите работу отдела продаж в одной поверхности",
  cta_subtitle:
    "Зарегистрируйте компанию, опубликуйте карточку поставщика и начните получать квалифицированные запросы покупателей.",
  cta_primary: "Зарегистрироваться как поставщик",
  cta_secondary: "Смотреть запросы покупателей",
  cta_note: "Регистрация бесплатно. Цена и контакт остаются под вашим контролем.",
};

const es: ForSuppliersDict = {
  seo_title: "YORSO para proveedores — vende mariscos a compradores cualificados",
  seo_description:
    "Una superficie de ventas B2B para proveedores de mariscos: visibilidad de precio controlada, solicitudes verificadas y perfil de proveedor con documentos.",

  hero_eyebrow: "Para proveedores, procesadores y exportadores",
  hero_title: "Deja de enviar precios al vacío.",
  hero_subtitle:
    "La mayoría de las solicitudes de precio nunca se convierten en una operación. El comprador compara, reenvía tu precio y desaparece. YORSO es una superficie de ventas donde el comprador está identificado, la solicitud está cualificada y tu precio solo lo ven aquellos a quienes lo permites.",
  hero_ctaPrimary: "Registrarse como proveedor",
  hero_ctaSecondary: "Ver solicitudes de compradores",
  hero_note: "Registro gratuito. Sin comisión sobre las operaciones.",

  pain_eyebrow: "Por dónde se pierde el tiempo del proveedor",
  pain_title: "Cuatro problemas que silenciosamente erosionan el margen",
  pain_subtitle:
    "Los equipos de ventas de mariscos pasan la mayor parte del día en actividades que no acercan la operación.",
  pain_items: [
    {
      title: "Solicitudes de precio no cualificadas",
      body:
        "Correos anónimos, mensajes de WhatsApp, consultas a medias. El proveedor envía una cotización completa y nunca recibe respuesta.",
    },
    {
      title: "El comprador no confía en un proveedor desconocido",
      body:
        "Sin un perfil público, documentos e historial, un comprador serio no puede defender la operación internamente y elige a alguien que ya conoce.",
    },
    {
      title: "El precio se filtra en el momento en que lo envías",
      body:
        "Un precio enviado a un comprador termina ese mismo día en tres chats más y en la hoja de cálculo de un competidor.",
    },
    {
      title: "El trabajo de ventas está disperso",
      body:
        "Correo, mensajería, hojas de cálculo, capturas. No hay un único lugar donde el responsable vea solicitudes activas, precios y estado del comprador.",
    },
  ],

  help_eyebrow: "Cómo YORSO cambia el trabajo",
  help_title: "Una superficie de ventas controlada, no otro marketplace",
  help_subtitle:
    "YORSO está construido en torno a la forma en que realmente se cierran las operaciones profesionales de mariscos.",
  help_items: [
    {
      title: "Visibilidad de precio controlada",
      body:
        "Tú decides quién ve el precio exacto. El visitante anónimo ve un rango. El comprador cualificado recibe la cifra tras tu aprobación.",
    },
    {
      title: "Solicitudes de compradores verificadas",
      body:
        "Las solicitudes vienen de compradores registrados con empresa, país y contexto de compra conocidos — no de una dirección de correo gratuita.",
    },
    {
      title: "Perfil de proveedor con documentos",
      body:
        "Datos de registro, licencia, certificaciones (MSC, ASC, BRC, IFS, HACCP) e historial comercial en una sola tarjeta que el comprador puede mostrar internamente.",
    },
    {
      title: "Catálogo de productos y visibilidad de ofertas",
      body:
        "Tus ofertas llegan a compradores que realmente compran tu categoría, origen y formato, no a todo internet.",
    },
    {
      title: "Señales de mercado y actividad de compradores",
      body:
        "Demanda por categoría, interés por origen y hacia dónde se mueve la atención del comprador — el equipo trabaja primero en las ofertas correctas.",
    },
  ],

  gets_eyebrow: "Qué recibe el proveedor por dentro",
  gets_title: "Cinco superficies de trabajo, no diapositivas",
  gets_subtitle:
    "Todo lo siguiente son pantallas reales en las que el proveedor y el equipo de ventas trabajan cada día.",
  gets_items: [
    {
      title: "Perfil público del proveedor",
      body:
        "Una página con datos de la empresa, licencia, certificaciones e historial — el enlace que envías al comprador en lugar de un PDF.",
    },
    {
      title: "Ofertas de producto",
      body:
        "Ofertas estructuradas por especie, formato, origen y empaque. Se edita una vez y la ven los compradores cualificados de la categoría.",
    },
    {
      title: "Solicitudes de compradores",
      body:
        "Solicitudes entrantes de compradores identificados con volumen, destino y plazos ya adjuntos.",
    },
    {
      title: "Solicitudes de acceso al precio",
      body:
        "Una cola clara de compradores que piden tu precio exacto. Apruebas, rechazas o pides contexto sin perder el hilo.",
    },
    {
      title: "Comunicación y seguimiento",
      body:
        "Un solo lugar para la conversación, la decisión de precio y el siguiente paso. Sin buscar la última cotización en tres mensajeros.",
    },
  ],

  cta_title: "Pon el trabajo de ventas en una sola superficie",
  cta_subtitle:
    "Registra la empresa, publica el perfil de proveedor y empieza a recibir solicitudes cualificadas.",
  cta_primary: "Registrarse como proveedor",
  cta_secondary: "Ver solicitudes de compradores",
  cta_note: "Registro gratuito. Mantienes el control del precio y del contacto.",
};

const dictionaries: Record<Language, ForSuppliersDict> = { en, ru, es };

export const useForSuppliers = (): ForSuppliersDict => {
  const { lang } = useLanguage();
  return dictionaries[lang] ?? dictionaries.en;
};
