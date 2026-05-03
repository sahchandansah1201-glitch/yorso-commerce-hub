/**
 * Локализованный контент постов блога (RU/ES).
 *
 * Источник «истины» структуры — `src/data/blogPosts.ts` (английский).
 * Здесь хранятся только переводы пользовательского текста: заголовки,
 * выдержки, SEO, секции, alt и productUpdate.userBenefit/howToUse.
 *
 * `getLocalizedPost(post, lang)` возвращает копию поста с подставленным
 * переводом. Если перевода нет — отдаём исходный английский текст
 * (графовый фолбэк), чтобы UI никогда не падал.
 */
import type { BlogPost, BlogArticleSection, ProductUpdateMeta } from "./blogPosts";
import type { Language } from "@/i18n/translations";

interface LocalizedSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LocalizedProductUpdate {
  userBenefit: string;
  howToUse: string[];
}

interface LocalizedPostFields {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  heroImageAlt: string;
  sections: LocalizedSection[];
  productUpdate?: LocalizedProductUpdate;
}

type LocaleDict = Record<string, LocalizedPostFields>;

const RU: LocaleDict = {
  "atlantic-salmon-q1-price-pressure": {
    title: "Атлантический лосось: что давит на цены в первом квартале",
    excerpt:
      "Пример обзора торговых условий и факторов предложения, на которые закупщики обычно смотрят по атлантическому лососю в начале Q1.",
    seoTitle: "Атлантический лосось в Q1: взгляд закупщика (пример)",
    seoDescription:
      "Пример материала о факторах предложения, спроса и логистики, которые обычно влияют на цены атлантического лосося в начале Q1.",
    heroImageAlt: "Филе атлантического лосося на льду — иллюстрация условий закупки в Q1",
    sections: [
      {
        heading: "Почему Q1 важен для покупателей лосося",
        paragraphs: [
          "Q1 исторически — узкий период по атлантическому лососю. Биологический рост замедляется в холодной воде, объёмы вылова в Норвегии и на Фарерских островах снижаются, а постовый спрос в ряде европейских рынков растёт.",
          "Эта статья — пример того, какие факторы команда закупок обычно учитывает при планировании контрактов на Q1. Здесь нет данных в реальном времени.",
        ],
      },
      {
        heading: "Факторы предложения, на которые смотрят",
        paragraphs: [
          "Покупатели обычно отслеживают прогнозы вылова в крупнейших регионах фермерства, температуру моря и биологические события, влияющие на доступную биомассу.",
        ],
        bullets: [
          "Прогнозы вылова Норвегии и Фарерских островов",
          "Темп экспорта Чили в США и Бразилию",
          "Циклы смертности и обработки, влияющие на биомассу",
          "Доступность авиаперевозок из ключевых хабов",
        ],
      },
      {
        heading: "Что покупатель может сделать на YORSO",
        paragraphs: [
          "Сравнить предложения по странам происхождения в каталоге, запросить доступ к ценам у поставщиков под нужный объём и собрать шорт-лист поставщиков с подходящими сертификатами и готовностью документов.",
        ],
      },
    ],
  },
  "vannamei-shrimp-supply-shifts": {
    title: "Креветка ваннамей: как сдвиги поставок из Азии и LATAM влияют на покупателей",
    excerpt:
      "Пример обзора динамики поставок между Эквадором, Индией, Вьетнамом и Индонезией, которую закупщики регулярно отслеживают по ваннамей.",
    seoTitle: "Сдвиги поставок ваннамей (пример закупочного обзора)",
    seoDescription:
      "Пример материала о том, как структура поставок креветки из Эквадора, Индии, Вьетнама и Индонезии влияет на решения закупщиков.",
    heroImageAlt: "Улов креветки ваннамей — азиатские и латиноамериканские поставки",
    sections: [
      {
        heading: "Почему важна структура происхождения",
        paragraphs: [
          "Покупатели ваннамей редко работают только с одной страной. Разные источники дают разные размеры, форматы переработки, сертификаты и итоговую стоимость поставки.",
        ],
      },
      {
        heading: "Какие источники обычно сравнивают",
        paragraphs: [
          "Команды закупок часто сравнивают предложения из Эквадора, Индии, Вьетнама и Индонезии, балансируя цену, сертификацию и скорость поставки в свой рынок.",
        ],
        bullets: [
          "Эквадор: крупные размеры, доступны BAP и ASC",
          "Индия: широкий размерный ряд, value-added форматы",
          "Вьетнам: сила в варёной и value-added продукции",
          "Индонезия: доступен ASC, рост экспорта",
        ],
      },
    ],
  },
  "whitefish-cod-pollock-trade-conditions": {
    title: "Белая рыба: торговые условия по треске и минтаю",
    excerpt:
      "Пример комментария о квотах, местах переработки и валютных факторах, которые закупщики обычно отслеживают по треске и минтаю.",
    seoTitle: "Торговые условия по треске и минтаю: пример обзора",
    seoDescription:
      "Пример материала о квотах, валюте и переработке, которые типично влияют на закупки трески и минтая.",
    heroImageAlt: "Замороженные блоки белой рыбы — треска и минтай для торгового анализа",
    sections: [
      {
        heading: "Квоты и валюта",
        paragraphs: [
          "Торговля белой рыбой определяется решениями по квотам в Баренцевом и Беринговом морях, движением курсов NOK и ISK и длинной цепочкой поставок через азиатскую переработку.",
        ],
      },
      {
        heading: "Что это значит для покупателей",
        paragraphs: [
          "Закупщики, формирующие сезонное покрытие, обычно делят заказы между первичной переработкой в стране вылова и продукцией двойной заморозки, переработанной в Азии — в зависимости от формата и ценовой точки.",
        ],
      },
    ],
  },
  "how-to-run-a-tight-rfq": {
    title: "Как сделать чёткий RFQ на YORSO",
    excerpt:
      "Гид для покупателя: как описать RFQ, чтобы поставщики быстро ответили сравнимыми предложениями.",
    seoTitle: "Как сделать чёткий RFQ по морепродуктам (гид покупателя)",
    seoDescription:
      "Гид по составлению RFQ по морепродуктам, чтобы поставщики могли быстро дать сравнимые, готовые к решению предложения.",
    heroImageAlt: "Команда закупок изучает RFQ по морепродуктам на ноутбуке",
    sections: [
      {
        heading: "Опишите, что вам действительно нужно",
        paragraphs: [
          "Чёткий RFQ указывает вид, размерную сетку, формат, упаковку, требуемые сертификаты, инкотермс, порт назначения, месячный объём и срок контракта.",
        ],
        bullets: [
          "Вид и латинское название",
          "Размер и формат упаковки",
          "Требуемые сертификаты",
          "Инкотермс и пункт назначения",
          "Объём и периодичность",
        ],
      },
      {
        heading: "Почему это ускоряет решение",
        paragraphs: [
          "Получив полный бриф, поставщик отвечает за часы, а не за дни, и его предложения напрямую сравнимы.",
        ],
      },
    ],
  },
  "supplier-verification-and-price-access": {
    title: "Верификация поставщика и доступ к ценам: что важно знать покупателю",
    excerpt:
      "Гид о модели доступа YORSO и о том, почему точные цены и личность поставщика открываются только после квалификации.",
    seoTitle: "Верификация поставщика и доступ к ценам: гид покупателя",
    seoDescription:
      "Как работают верификация поставщика и доступ к ценам на YORSO и почему точные цены открываются только после квалификации покупателя.",
    heroImageAlt: "Покупатель изучает верификацию поставщика и доступ к ценам на YORSO",
    sections: [
      {
        heading: "Три уровня доступа",
        paragraphs: [
          "YORSO использует три явных уровня доступа: анонимный просмотр, регистрация со скрытой личностью и квалифицированный доступ с точной ценой и именем поставщика. Это защищает поставщиков от парсинга цен и оставляет каталог открытым для поиска.",
        ],
      },
      {
        heading: "Как открыть точные цены",
        paragraphs: [
          "Создайте аккаунт покупателя, пройдите короткий шаг квалификации и запросите доступ к ценам по интересующим предложениям. Поставщики подтверждают доступ для каждого покупателя отдельно.",
        ],
      },
    ],
  },
  "buyer-qualification-for-suppliers": {
    title: "Квалификация покупателя: что видит и решает поставщик",
    excerpt:
      "Гид для поставщиков о сигналах покупателя, которые YORSO показывает до того, как запрос на доступ к цене попадёт в почту.",
    seoTitle: "Квалификация покупателя для поставщиков морепродуктов",
    seoDescription:
      "Гид для поставщиков о сигналах покупателя, которые YORSO показывает до того, как запрос на доступ попадёт во входящие — чтобы быстрее одобрять серьёзных покупателей.",
    heroImageAlt: "Команда поставщика изучает сигналы квалификации покупателя",
    sections: [
      {
        heading: "Что видит поставщик",
        paragraphs: [
          "До одобрения доступа поставщик видит компанию покупателя, страну, целевой объём и продуктовое соответствие. Это помогает тратить время на серьёзных покупателей и вежливо отказывать при несовпадении.",
        ],
      },
      {
        heading: "Быстрее отвечать — быстрее продавать",
        paragraphs: [
          "Поставщики, отвечающие в течение суток, отмечаются в каталоге сигналом быстрого отклика, что повышает их видимость для покупателей по тому же виду.",
        ],
      },
    ],
  },
  "writing-product-cards-that-convert": {
    title: "Как писать карточки товара, которые конвертируют серьёзных покупателей",
    excerpt:
      "Гид для поставщика о структуре конверсионной карточки: заголовок, формат, сертификаты, MOQ и детали для решения.",
    seoTitle: "Карточки морепродуктов, которые конвертируют (гид поставщика)",
    seoDescription:
      "Гид для поставщиков о том, как писать карточки, дающие покупателю всё необходимое, чтобы попасть в шорт-лист или запросить доступ менее чем за 30 секунд.",
    heroImageAlt: "Макет карточки морепродуктов с высокой конверсией",
    sections: [
      {
        heading: "Начинайте с идентичности",
        paragraphs: [
          "Покупатель просматривает десятки карточек в день. Самый быстрый способ попасть в шорт-лист — указать в начале вид, латинское название, формат, размер и ключевой сертификат.",
        ],
        bullets: [
          "Вид + латинское название",
          "Формат и разделка",
          "Размер и упаковка",
          "Ведущие сертификаты",
          "Происхождение и страна поставщика",
        ],
      },
      {
        heading: "Будьте честны о текущей доступности",
        paragraphs: [
          "Карточки, тихо рекламирующие недоступный товар, разрушают доверие. Чётко помечайте сезонные позиции и обновляйте MOQ и срок поставки минимум раз в месяц.",
        ],
      },
    ],
  },
  "yorso-catalog-update-supplier-trust-signals": {
    title: "Обновление каталога: более понятные сигналы доверия к поставщику",
    excerpt:
      "Обновление продукта о новых компактных сигналах доверия в строках поставщиков и карточках предложений.",
    seoTitle: "Обновление каталога YORSO: понятные сигналы доверия к поставщику",
    seoDescription:
      "Обновление с компактными сигналами доверия в строках поставщиков, чтобы покупатели быстрее видели верификацию, скорость отклика и готовность документов.",
    heroImageAlt: "Строки каталога YORSO с понятными сигналами доверия",
    sections: [
      {
        heading: "Что изменилось",
        paragraphs: [
          "Строки поставщиков теперь используют одну компактную линию для верификации, готовности документов и скорости отклика — без дублирования значка в двух местах.",
        ],
      },
      {
        heading: "Почему это важно",
        paragraphs: [
          "Менеджеры по закупкам просили меньше визуального шума в строке. Новый макет вмещает больше поставщиков на экране и сохраняет сигналы доверия, влияющие на шорт-лист.",
        ],
      },
    ],
    productUpdate: {
      userBenefit:
        "Покупатели видят больше поставщиков на экране и сразу читают верификацию, скорость отклика и готовность документов.",
      howToUse: [
        "Откройте каталог поставщиков.",
        "Посмотрите на новую компактную линию доверия в каждой строке.",
        "Фильтруйте или добавляйте в шорт-лист по объединённым сигналам.",
      ],
    },
  },
  "yorso-supplier-profiles-redesigned": {
    title: "Обновление продукта: переработанные профили поставщиков",
    excerpt:
      "Обновление о новой структуре профиля поставщика: скрытая личность, сертификаты и панель запроса доступа.",
    seoTitle: "Профили поставщиков YORSO переработаны (обновление продукта)",
    seoDescription:
      "Обновление о новой структуре профиля поставщика: скрытая личность для закрытого доступа, сетка сертификатов и более понятный поток запроса доступа.",
    heroImageAlt: "Переработанный профиль поставщика YORSO со скрытой личностью",
    sections: [
      {
        heading: "Что нового",
        paragraphs: [
          "Профили поставщиков теперь начинаются с проверенных фактов, сертификатов и более понятной панели запроса доступа, объясняющей, что покупатель увидит после одобрения.",
        ],
      },
      {
        heading: "Что осталось",
        paragraphs: [
          "Трёхуровневая модель доступа не изменилась: анонимный просмотр, регистрация и квалифицированный доступ остаются явными — покупатель и поставщик видят, что доступно на каждом шаге.",
        ],
      },
    ],
    productUpdate: {
      userBenefit:
        "Покупатели быстрее находят нужного поставщика и понимают, что именно открывается после одобрения доступа.",
      howToUse: [
        "Откройте любой профиль поставщика из каталога.",
        "Изучите проверенные факты и сетку сертификатов.",
        "Используйте панель запроса доступа к цене и личности.",
      ],
    },
  },
  "yorso-price-access-request-flow": {
    title: "Прототип обновления: упрощённый запрос доступа к цене",
    excerpt:
      "Обновление продукта об упрощённой панели запроса доступа к цене на страницах предложений и в профилях поставщиков.",
    seoTitle: "Упрощённый запрос доступа к цене (обновление YORSO)",
    seoDescription:
      "Обновление об упрощённом потоке запроса доступа к цене, который позволяет квалифицированным покупателям запрашивать точные цены за меньшее число шагов.",
    heroImageAlt: "Упрощённая форма запроса доступа к цене на YORSO",
    sections: [
      {
        heading: "Что изменилось",
        paragraphs: [
          "Панель запроса доступа к цене теперь — одна короткая форма. Покупатель видит, какие поля обязательны и что увидит поставщик до того, как нажмёт «Отправить».",
        ],
      },
      {
        heading: "Почему мы это сделали",
        paragraphs: [
          "Покупатели сообщили, что прежний поток запрашивал поля, которыми поставщики не пользуются для квалификации. Эти поля убрали, оставшиеся сгруппировали по смыслу.",
        ],
      },
    ],
    productUpdate: {
      userBenefit:
        "Квалифицированные покупатели запрашивают точные цены за меньшее число шагов и заранее знают, что увидит поставщик.",
      howToUse: [
        "Откройте предложение в каталоге.",
        "Нажмите «Запросить доступ к цене» в панели предложения.",
        "Подтвердите объём и пункт назначения, затем отправьте.",
      ],
    },
  },
  "seafood-procurement-glossary": {
    title: "Глоссарий закупок морепродуктов: 20 терминов покупателя и поставщика",
    excerpt:
      "Короткий глоссарий терминов, которые чаще всего встречаются в предложениях, профилях поставщиков и запросах доступа на YORSO.",
    seoTitle: "Глоссарий закупок морепродуктов: 20 ключевых терминов",
    seoDescription:
      "Глоссарий распространённых терминов закупок морепродуктов, используемых в предложениях, профилях поставщиков и запросах доступа на YORSO.",
    heroImageAlt: "Справочная карточка с терминами закупок морепродуктов",
    sections: [
      {
        heading: "Торговля и цены",
        paragraphs: [
          "Часто встречаются: FOB, CFR, CIF, DAP, landed cost, MOQ, lead time, инкотермс. Каждый меняет, кто платит за тот или иной этап доставки.",
        ],
        bullets: [
          "FOB: Free on board",
          "CFR: Cost and freight",
          "CIF: Cost, insurance, freight",
          "DAP: Delivered at place",
          "MOQ: Минимальный размер заказа",
        ],
      },
      {
        heading: "Продукт и качество",
        paragraphs: [
          "Форматы: HOG (с головой, потрошёная), HGT (без головы, потрошёная, с хвостом), филе, порция, IQF, блок. Сертификаты: ASC, MSC, BAP, GlobalG.A.P., BRCGS.",
        ],
      },
    ],
  },
};

const ES: LocaleDict = {
  "atlantic-salmon-q1-price-pressure": {
    title: "Salmón atlántico: qué presiona los precios en el primer trimestre",
    excerpt:
      "Ejemplo de análisis de las condiciones comerciales y factores de oferta que los equipos de compras suelen vigilar para el salmón atlántico al inicio del Q1.",
    seoTitle: "Salmón atlántico Q1: visión de compras (ejemplo)",
    seoDescription:
      "Ejemplo de análisis de oferta, demanda y logística que típicamente influyen en los precios del salmón atlántico al inicio del Q1.",
    heroImageAlt: "Filete de salmón atlántico sobre hielo — condiciones de compra del Q1",
    sections: [
      {
        heading: "Por qué el Q1 importa para los compradores de salmón",
        paragraphs: [
          "El Q1 es históricamente un periodo ajustado para el salmón atlántico. El crecimiento biológico se ralentiza en agua fría, los volúmenes de cosecha en Noruega y las Feroe tienden a bajar y la demanda de Cuaresma en varios mercados europeos empieza a subir.",
          "Este artículo de ejemplo describe los factores que un equipo de compras normalmente pondera al planificar contratos de Q1. No representa datos de mercado en tiempo real.",
        ],
      },
      {
        heading: "Factores de oferta habitualmente observados",
        paragraphs: [
          "Los compradores suelen monitorear las guías de cosecha de las mayores regiones de cultivo, las tendencias de temperatura del mar y los eventos biológicos que afectan la biomasa disponible.",
        ],
        bullets: [
          "Guías de cosecha noruegas y feroesas",
          "Ritmo de exportación chilena hacia EE. UU. y Brasil",
          "Ciclos de mortalidad y tratamientos que afectan la biomasa",
          "Capacidad aérea desde los principales hubs",
        ],
      },
      {
        heading: "Qué pueden hacer los compradores en YORSO",
        paragraphs: [
          "Comparar ofertas por origen, solicitar acceso a precios a proveedores que cumplan su volumen y elaborar una lista corta de proveedores cuyas certificaciones y documentación encajen con su perfil de cumplimiento.",
        ],
      },
    ],
  },
  "vannamei-shrimp-supply-shifts": {
    title: "Camarón vannamei: cómo los cambios de oferta en Asia y LATAM afectan al comprador",
    excerpt:
      "Ejemplo de visión general de la dinámica de oferta entre Ecuador, India, Vietnam e Indonesia que los compradores siguen para el vannamei.",
    seoTitle: "Cambios de oferta del vannamei (ejemplo de visión de compras)",
    seoDescription:
      "Ejemplo de cómo los patrones de oferta de camarón de Ecuador, India, Vietnam e Indonesia afectan las decisiones de compra.",
    heroImageAlt: "Captura de camarón vannamei — oferta asiática y latinoamericana",
    sections: [
      {
        heading: "Por qué importa la mezcla de orígenes",
        paragraphs: [
          "Los compradores de vannamei rara vez se abastecen de un solo país. Cada origen ofrece distintos calibres, formatos, certificaciones y costo de entrega.",
        ],
      },
      {
        heading: "Orígenes que se suelen comparar",
        paragraphs: [
          "Los equipos de compras comparan ofertas de Ecuador, India, Vietnam e Indonesia para equilibrar precio, certificación y velocidad de entrega.",
        ],
        bullets: [
          "Ecuador: calibres grandes, BAP y ASC disponibles",
          "India: amplio rango de calibres, productos de valor agregado",
          "Vietnam: fuerte en cocido y valor agregado",
          "Indonesia: ASC disponible y exportaciones en crecimiento",
        ],
      },
    ],
  },
  "whitefish-cod-pollock-trade-conditions": {
    title: "Pescado blanco: condiciones comerciales de bacalao y abadejo a vigilar",
    excerpt:
      "Ejemplo de comentario sobre cuotas, lugares de procesamiento y factores cambiarios que los equipos de compras suelen seguir para bacalao y abadejo.",
    seoTitle: "Condiciones comerciales de bacalao y abadejo: ejemplo",
    seoDescription:
      "Ejemplo sobre cuotas, divisas y procesamiento que afectan típicamente a las decisiones de compra de bacalao y abadejo.",
    heroImageAlt: "Bloques congelados de bacalao y abadejo para análisis comercial",
    sections: [
      {
        heading: "Cuotas y divisas",
        paragraphs: [
          "El comercio de pescado blanco está marcado por las cuotas en el Mar de Barents y el Mar de Bering, los movimientos de NOK e ISK y la larga cadena de suministro a través del reprocesamiento asiático.",
        ],
      },
      {
        heading: "Qué significa para los compradores",
        paragraphs: [
          "Los compradores que arman cobertura estacional suelen dividir pedidos entre producto procesado en origen y producto reprocesado en Asia, según formato y precio objetivo.",
        ],
      },
    ],
  },
  "how-to-run-a-tight-rfq": {
    title: "Cómo lanzar un RFQ ajustado en YORSO",
    excerpt:
      "Guía para el comprador sobre cómo definir un RFQ para que los proveedores respondan rápido con ofertas comparables.",
    seoTitle: "Cómo lanzar un RFQ ajustado de mariscos (guía del comprador)",
    seoDescription:
      "Guía para definir un RFQ que permita a los proveedores responder rápido con ofertas comparables y listas para decidir.",
    heroImageAlt: "Equipo de compras revisando un RFQ de mariscos en una laptop",
    sections: [
      {
        heading: "Define lo que realmente necesitas",
        paragraphs: [
          "Un RFQ ajustado especifica especie, calibre, formato, embalaje, certificaciones, incoterm, puerto de destino, volumen mensual y duración del contrato.",
        ],
        bullets: [
          "Especie y nombre latino",
          "Calibre y formato de pack",
          "Certificaciones requeridas",
          "Incoterm y destino",
          "Volumen y frecuencia",
        ],
      },
      {
        heading: "Por qué acelera la decisión",
        paragraphs: [
          "Con un brief completo, los proveedores cotizan en horas y las ofertas son directamente comparables.",
        ],
      },
    ],
  },
  "supplier-verification-and-price-access": {
    title: "Verificación del proveedor y acceso a precios: lo que el comprador debe saber",
    excerpt:
      "Guía para el comprador sobre cómo funciona el modelo de acceso de YORSO y por qué los precios y la identidad del proveedor solo se ven tras la calificación.",
    seoTitle: "Verificación del proveedor y acceso a precios: guía del comprador",
    seoDescription:
      "Cómo funcionan la verificación de proveedor y el acceso a precios en YORSO y por qué los precios exactos se desbloquean tras calificar al comprador.",
    heroImageAlt: "Comprador revisando verificación de proveedor y acceso a precios en YORSO",
    sections: [
      {
        heading: "Tres niveles de acceso",
        paragraphs: [
          "YORSO usa tres niveles explícitos: navegación anónima, acceso registrado con identidad oculta y acceso calificado con precio exacto e identidad del proveedor. Esto protege al proveedor del scraping y mantiene el catálogo abierto al descubrimiento.",
        ],
      },
      {
        heading: "Cómo desbloquear precios exactos",
        paragraphs: [
          "Crea una cuenta de comprador, completa la breve calificación y solicita acceso al precio en las ofertas que evalúas. El proveedor aprueba el acceso por comprador.",
        ],
      },
    ],
  },
  "buyer-qualification-for-suppliers": {
    title: "Calificación del comprador: qué ve y decide el proveedor",
    excerpt:
      "Guía para proveedores sobre las señales de comprador que YORSO muestra antes de que la solicitud de acceso al precio llegue a tu bandeja.",
    seoTitle: "Calificación del comprador para proveedores de mariscos",
    seoDescription:
      "Guía sobre las señales de comprador que YORSO muestra antes de que la solicitud llegue al proveedor, para aprobar más rápido a compradores serios.",
    heroImageAlt: "Equipo de proveedor revisando señales de calificación del comprador",
    sections: [
      {
        heading: "Qué ve el proveedor",
        paragraphs: [
          "Antes de aprobar el acceso, el proveedor revisa la empresa del comprador, el país, el volumen objetivo y el ajuste de producto. Así dedica tiempo a compradores serios y declina con elegancia los desajustes.",
        ],
      },
      {
        heading: "Aprobar más rápido, vender más rápido",
        paragraphs: [
          "Los proveedores que responden en un día se destacan en el catálogo con una señal de respuesta rápida, lo que aumenta su visibilidad para compradores que buscan la misma especie.",
        ],
      },
    ],
  },
  "writing-product-cards-that-convert": {
    title: "Cómo escribir fichas de producto que conviertan a compradores serios",
    excerpt:
      "Guía para proveedores sobre la estructura de una ficha de alta conversión: título, formato, certificaciones, MOQ y datos para decidir.",
    seoTitle: "Fichas de mariscos que convierten (guía del proveedor)",
    seoDescription:
      "Guía para escribir fichas que den al comprador todo lo necesario para añadir a la lista corta o solicitar acceso en menos de 30 segundos.",
    heroImageAlt: "Diseño de ficha de marisco con alta conversión para proveedores",
    sections: [
      {
        heading: "Empieza por la identidad",
        paragraphs: [
          "El comprador escanea decenas de fichas al día. La forma más rápida de entrar a la lista corta es liderar con especie, nombre latino, formato, calibre y certificación principal.",
        ],
        bullets: [
          "Especie + nombre latino",
          "Formato y corte",
          "Calibre y embalaje",
          "Certificaciones principales",
          "Origen y país del proveedor",
        ],
      },
      {
        heading: "Sé honesto sobre lo que está disponible ahora",
        paragraphs: [
          "Las fichas que promocionan en silencio producto no disponible erosionan la confianza. Marca con claridad lo estacional y actualiza MOQ y plazo al menos cada mes.",
        ],
      },
    ],
  },
  "yorso-catalog-update-supplier-trust-signals": {
    title: "Actualización de catálogo: señales de confianza del proveedor más claras",
    excerpt:
      "Actualización de producto sobre las nuevas señales compactas de confianza en filas de proveedores y fichas de oferta.",
    seoTitle: "Catálogo YORSO: señales de confianza del proveedor más claras",
    seoDescription:
      "Actualización con señales compactas de confianza en las filas de proveedores para escanear verificación, velocidad de respuesta y documentación más rápido.",
    heroImageAlt: "Filas del catálogo YORSO con señales de confianza más claras",
    sections: [
      {
        heading: "Qué cambió",
        paragraphs: [
          "Las filas de proveedores ahora usan una sola línea compacta para verificación, documentación y velocidad de respuesta, sin repetir el mismo distintivo en dos lugares.",
        ],
      },
      {
        heading: "Por qué importa",
        paragraphs: [
          "Los gerentes de compras pidieron menos ruido visual por fila. El nuevo diseño muestra más proveedores en pantalla sin perder las señales de confianza que guían la lista corta.",
        ],
      },
    ],
    productUpdate: {
      userBenefit:
        "El comprador escanea más proveedores por pantalla y sigue viendo verificación, velocidad de respuesta y documentación de un vistazo.",
      howToUse: [
        "Abre el directorio de proveedores.",
        "Mira la nueva línea compacta de confianza en cada fila.",
        "Filtra o añade a la lista corta usando las señales consolidadas.",
      ],
    },
  },
  "yorso-supplier-profiles-redesigned": {
    title: "Actualización: perfiles de proveedor rediseñados",
    excerpt:
      "Actualización sobre la nueva estructura del perfil de proveedor: identidad oculta, certificaciones y panel de solicitud de acceso.",
    seoTitle: "Perfiles de proveedor rediseñados (actualización YORSO)",
    seoDescription:
      "Actualización sobre la nueva estructura del perfil de proveedor: identidad oculta para acceso bloqueado, cuadrícula de certificaciones y flujo de solicitud más claro.",
    heroImageAlt: "Perfil de proveedor YORSO rediseñado con identidad oculta",
    sections: [
      {
        heading: "Qué hay de nuevo",
        paragraphs: [
          "Los perfiles ahora destacan hechos verificados, certificaciones y un panel de solicitud que explica exactamente qué verá el comprador tras la aprobación.",
        ],
      },
      {
        heading: "Qué se mantiene",
        paragraphs: [
          "El modelo de tres niveles no cambia: navegación anónima, registro y acceso calificado siguen siendo explícitos para que comprador y proveedor sepan qué se ve en cada paso.",
        ],
      },
    ],
    productUpdate: {
      userBenefit:
        "El comprador llega antes al proveedor adecuado y entiende qué se desbloquea tras la aprobación.",
      howToUse: [
        "Abre cualquier perfil de proveedor desde el directorio.",
        "Revisa los hechos verificados y la cuadrícula de certificaciones.",
        "Usa el panel de solicitud para pedir acceso a precio e identidad.",
      ],
    },
  },
  "yorso-price-access-request-flow": {
    title: "Prototipo: flujo de solicitud de acceso a precio simplificado",
    excerpt:
      "Actualización sobre el panel simplificado de solicitud de acceso a precio en páginas de oferta y perfiles de proveedor.",
    seoTitle: "Solicitud de acceso a precio simplificada (actualización YORSO)",
    seoDescription:
      "Actualización del flujo de solicitud de acceso a precio que permite a compradores calificados pedir precios exactos en menos pasos.",
    heroImageAlt: "Formulario simplificado de solicitud de acceso a precio en YORSO",
    sections: [
      {
        heading: "Qué cambió",
        paragraphs: [
          "El panel de solicitud ahora es un único formulario corto. El comprador ve qué campos son obligatorios y qué verá el proveedor antes de enviar.",
        ],
      },
      {
        heading: "Por qué lo cambiamos",
        paragraphs: [
          "Los compradores nos dijeron que el flujo anterior pedía campos que el proveedor no usa para calificar. Eliminamos esos campos y agrupamos los restantes por propósito.",
        ],
      },
    ],
    productUpdate: {
      userBenefit:
        "Los compradores calificados solicitan precios exactos en menos pasos y saben de antemano qué verá el proveedor.",
      howToUse: [
        "Abre una oferta en el catálogo.",
        "Pulsa «Solicitar acceso a precio» en el panel de la oferta.",
        "Confirma volumen y destino, y envía.",
      ],
    },
  },
  "seafood-procurement-glossary": {
    title: "Glosario de compras de mariscos: 20 términos para comprador y proveedor",
    excerpt:
      "Glosario breve de los términos que más aparecen en ofertas, perfiles de proveedor y solicitudes de acceso de YORSO.",
    seoTitle: "Glosario de compras de mariscos: 20 términos esenciales",
    seoDescription:
      "Glosario de términos comunes de compras de mariscos usados en ofertas, perfiles de proveedor y solicitudes de acceso de YORSO.",
    heroImageAlt: "Tarjeta de referencia con términos de compras de mariscos",
    sections: [
      {
        heading: "Comercio y precio",
        paragraphs: [
          "Términos comunes: FOB, CFR, CIF, DAP, costo en destino, MOQ, plazo de entrega e incoterm. Cada uno cambia quién paga qué tramo del envío.",
        ],
        bullets: [
          "FOB: Free on board",
          "CFR: Cost and freight",
          "CIF: Cost, insurance, freight",
          "DAP: Delivered at place",
          "MOQ: Cantidad mínima de pedido",
        ],
      },
      {
        heading: "Producto y calidad",
        paragraphs: [
          "Formatos: HOG (con cabeza, eviscerado), HGT (sin cabeza, eviscerado, con cola), filete, porción, IQF, bloque. Certificaciones: ASC, MSC, BAP, GlobalG.A.P., BRCGS.",
        ],
      },
    ],
  },
};

const DICTS: Record<Exclude<Language, "en">, LocaleDict> = {
  ru: RU,
  es: ES,
};

const mergeSections = (
  base: BlogArticleSection[],
  loc: LocalizedSection[] | undefined,
): BlogArticleSection[] => {
  if (!loc) return base;
  return base.map((s, i) => {
    const t = loc[i];
    if (!t) return s;
    return {
      heading: t.heading ?? s.heading,
      paragraphs: t.paragraphs ?? s.paragraphs,
      bullets: t.bullets ?? s.bullets,
    };
  });
};

const mergeProductUpdate = (
  base: ProductUpdateMeta | undefined,
  loc: LocalizedProductUpdate | undefined,
): ProductUpdateMeta | undefined => {
  if (!base) return base;
  if (!loc) return base;
  return {
    ...base,
    userBenefit: loc.userBenefit ?? base.userBenefit,
    howToUse: loc.howToUse ?? base.howToUse,
  };
};

export const getLocalizedPost = (post: BlogPost, lang: Language): BlogPost => {
  if (lang === "en") return post;
  const dict = DICTS[lang];
  const tr = dict?.[post.slug];
  if (!tr) return post;
  return {
    ...post,
    title: tr.title ?? post.title,
    excerpt: tr.excerpt ?? post.excerpt,
    seoTitle: tr.seoTitle ?? post.seoTitle,
    seoDescription: tr.seoDescription ?? post.seoDescription,
    heroImageAlt: tr.heroImageAlt ?? post.heroImageAlt,
    sections: mergeSections(post.sections, tr.sections),
    productUpdate: mergeProductUpdate(post.productUpdate, tr.productUpdate),
  };
};

/** Локализованная подпись категории по contentType. */
export const localizedCategoryLabel = (
  t: { [k: string]: string },
  contentType: BlogPost["contentType"],
): string => {
  switch (contentType) {
    case "market_intelligence":
      return t.blog_filter_marketIntelligence;
    case "buyer_guide":
      return t.blog_filter_buyerGuides;
    case "supplier_guide":
      return t.blog_filter_supplierGuides;
    case "product_update":
      return t.blog_filter_productUpdates;
    case "glossary":
      return t.blog_filter_glossary;
    default:
      return contentType;
  }
};
