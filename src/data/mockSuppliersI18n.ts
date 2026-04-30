/**
 * Локализационный оверрейд для `mockSuppliers`.
 *
 * Зачем отдельный модуль:
 *  - Тип `MockSupplier` оставлен в виде, как ожидается от будущего API
 *    (плоские строковые поля). Все существующие потребители продолжают
 *    читать поставщика как и раньше — это безопасный baseline (EN).
 *  - Этот файл содержит детерминированные переводы тех полей, которые
 *    нужно показывать пользователю в его языке: `country`, `city`,
 *    `productFocus[].species/forms`, `productCatalogPreview[].name/species/form`,
 *    `deliveryCountries[].name`, `shortDescription`, `about`, `maskedName`.
 *  - При появлении реального бекенда уберём этот файл и будем брать
 *    локализованные значения прямо из ответа API.
 *
 * Ключи словаря — `supplier.id`. Если перевод отсутствует, потребитель
 * через `localizeSupplier()` получит исходное (EN) значение.
 */
import {
  type MockSupplier,
  type SupplierProductFocus,
  type SupplierDeliveryCountry,
  type SupplierCatalogPreviewItem,
} from "./mockSuppliers";
import type { Language } from "@/i18n/translations";

type LocalizedField = Partial<Record<Language, string>>;

interface LocalizedSupplierPatch {
  country?: LocalizedField;
  city?: LocalizedField;
  maskedName?: LocalizedField;
  shortDescription?: LocalizedField;
  about?: LocalizedField;
  productFocus?: Array<{ species?: LocalizedField; forms?: LocalizedField }>;
  productCatalogPreview?: Array<{
    name?: LocalizedField;
    species?: LocalizedField;
    form?: LocalizedField;
  }>;
  deliveryCountries?: Record<string, LocalizedField>; // key = ISO-2 code
}

/**
 * Общая карта стран → RU/ES (используется и для supplier.country,
 * и для deliveryCountries[].name). EN — baseline в исходных данных.
 */
const COUNTRY_LOCALES: Record<string, Partial<Record<Language, string>>> = {
  Norway: { ru: "Норвегия", es: "Noruega" },
  China: { ru: "Китай", es: "China" },
  Ecuador: { ru: "Эквадор", es: "Ecuador" },
  Indonesia: { ru: "Индонезия", es: "Indonesia" },
  Vietnam: { ru: "Вьетнам", es: "Vietnam" },
  Iceland: { ru: "Исландия", es: "Islandia" },
  Russia: { ru: "Россия", es: "Rusia" },
  Chile: { ru: "Чили", es: "Chile" },
  Germany: { ru: "Германия", es: "Alemania" },
  France: { ru: "Франция", es: "Francia" },
  Poland: { ru: "Польша", es: "Polonia" },
  Japan: { ru: "Япония", es: "Japón" },
  "South Korea": { ru: "Южная Корея", es: "Corea del Sur" },
  "United States": { ru: "США", es: "Estados Unidos" },
  Netherlands: { ru: "Нидерланды", es: "Países Bajos" },
  "United Kingdom": { ru: "Великобритания", es: "Reino Unido" },
  Spain: { ru: "Испания", es: "España" },
  Italy: { ru: "Италия", es: "Italia" },
  UAE: { ru: "ОАЭ", es: "EAU" },
  "Saudi Arabia": { ru: "Саудовская Аравия", es: "Arabia Saudí" },
  Brazil: { ru: "Бразилия", es: "Brasil" },
};

const CITY_LOCALES: Record<string, Partial<Record<Language, string>>> = {
  Ålesund: { ru: "Олесунн", es: "Ålesund" },
  Qingdao: { ru: "Циндао", es: "Qingdao" },
  Guayaquil: { ru: "Гуаякиль", es: "Guayaquil" },
  Denpasar: { ru: "Денпасар", es: "Denpasar" },
  "Cần Thơ": { ru: "Кантхо", es: "Cần Thơ" },
  Reykjavík: { ru: "Рейкьявик", es: "Reikiavik" },
  "Petropavlovsk-Kamchatsky": { ru: "Петропавловск-Камчатский", es: "Petropávlovsk-Kamchatski" },
  "Puerto Montt": { ru: "Пуэрто-Монтт", es: "Puerto Montt" },
};

/** Виды (species). EN — baseline. */
const SPECIES_LOCALES: Record<string, Partial<Record<Language, string>>> = {
  "Atlantic Salmon": { ru: "Атлантический лосось", es: "Salmón atlántico" },
  Trout: { ru: "Форель", es: "Trucha" },
  Cod: { ru: "Треска", es: "Bacalao" },
  Pollock: { ru: "Минтай", es: "Abadejo" },
  Tilapia: { ru: "Тиляпия", es: "Tilapia" },
  "Vannamei Shrimp": { ru: "Креветка ваннамей", es: "Camarón vannamei" },
  "Yellowfin Tuna": { ru: "Жёлтопёрый тунец", es: "Atún rabil" },
  Skipjack: { ru: "Скипджек", es: "Listado" },
  Pangasius: { ru: "Пангасиус", es: "Panga" },
  Haddock: { ru: "Пикша", es: "Eglefino" },
  Saithe: { ru: "Сайда", es: "Carbonero" },
  "King Crab": { ru: "Камчатский краб", es: "Cangrejo real" },
  "Snow Crab": { ru: "Краб-стригун", es: "Cangrejo de las nieves" },
  Mussels: { ru: "Мидии", es: "Mejillones" },
};

/** Подсказка по словам в свободных строках форматов / catalog name. */
const TERM_LOCALES: Record<string, Partial<Record<Language, string>>> = {
  HOG: { ru: "потрошёный (HOG)", es: "eviscerado (HOG)" },
  fillet: { ru: "филе", es: "filete" },
  Fillet: { ru: "филе", es: "filete" },
  portions: { ru: "порции", es: "porciones" },
  Portions: { ru: "порции", es: "porciones" },
  Loins: { ru: "лоины", es: "lomos" },
  loins: { ru: "лоины", es: "lomos" },
  Blocks: { ru: "блоки", es: "bloques" },
  blocks: { ru: "блоки", es: "bloques" },
  IQF: { ru: "IQF", es: "IQF" },
  HOSO: { ru: "HOSO", es: "HOSO" },
  HLSO: { ru: "HLSO", es: "HLSO" },
  PD: { ru: "PD", es: "PD" },
  PDTO: { ru: "PDTO", es: "PDTO" },
  cooked: { ru: "варёная", es: "cocido" },
  Saku: { ru: "саку", es: "saku" },
  saku: { ru: "саку", es: "saku" },
  "CO-treated": { ru: "обработка CO", es: "tratado con CO" },
  Sections: { ru: "секции", es: "secciones" },
  sections: { ru: "секции", es: "secciones" },
  "Cooked legs": { ru: "варёные ноги", es: "patas cocidas" },
  "H&G": { ru: "H&G", es: "H&G" },
  surimi: { ru: "сурими", es: "surimi" },
  "Whole round": { ru: "целая тушка", es: "entero redondo" },
  "whole round": { ru: "целая тушка", es: "entero redondo" },
  "Fresh fillet": { ru: "свежее филе", es: "filete fresco" },
  "fresh fillet": { ru: "свежее филе", es: "filete fresco" },
  "IQF portions": { ru: "IQF-порции", es: "porciones IQF" },
  "Twice-frozen fillet": { ru: "филе двойной заморозки", es: "filete doble congelado" },
  treated: { ru: "обработанное", es: "tratado" },
  untreated: { ru: "без обработки", es: "sin tratar" },
};

/**
 * Локализационные патчи. Покрытие: country, city, productFocus,
 * deliveryCountries (через ISO-код), shortDescription, about,
 * productCatalogPreview, maskedName. EN остаётся в исходных данных.
 */
const PATCHES: Record<string, LocalizedSupplierPatch> = {
  // ───── 1. Nordfjord Sjømat AS (NO) ─────
  "sup-no-001": {
    maskedName: {
      ru: "Норвежский производитель лосося · NO-114",
      es: "Productor noruego de salmón · NO-114",
    },
    shortDescription: {
      ru: "Вертикально интегрированная лососёвая ферма и перерабатывающий завод, еженедельные авиаотгрузки в ЕС и Азию.",
      es: "Granja salmonera y planta procesadora verticalmente integradas, envíos aéreos semanales a la UE y Asia.",
    },
    about: {
      ru: "Семейный норвежский производитель лосося с собственными фермами в фьордах вокруг Олесунна и HACCP-аттестованным заводом переработки. Полный цикл от смолта до упакованной продукции, еженедельные авиапрограммы в розницу и HoReCa ЕС и Азии.",
      es: "Productor noruego de salmón de propiedad familiar con granjas propias en los fiordos de Ålesund y planta procesadora con auditoría HACCP. Integración vertical desde el smolt hasta el producto envasado, programas semanales de carga aérea para retail y HoReCa de la UE y Asia.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Atlantic Salmon"], forms: { ru: "потрошёный (HOG), филе, порции", es: "HOG, filete, porciones" } },
      { species: SPECIES_LOCALES["Trout"], forms: { ru: "потрошёный (HOG), филе", es: "HOG, filete" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Лосось HOG 4–5 кг", es: "Salmón HOG 4–5 kg" }, species: SPECIES_LOCALES["Atlantic Salmon"], form: { ru: "HOG", es: "HOG" } },
      { name: { ru: "Филе лосося, тримминг D", es: "Filete de salmón trim D" }, species: SPECIES_LOCALES["Atlantic Salmon"], form: { ru: "Филе", es: "Filete" } },
      { name: { ru: "Порции лосося IQF", es: "Porciones de salmón IQF" }, species: SPECIES_LOCALES["Atlantic Salmon"], form: { ru: "Порции", es: "Porciones" } },
      { name: { ru: "Форель HOG 2–3 кг", es: "Trucha HOG 2–3 kg" }, species: SPECIES_LOCALES["Trout"], form: { ru: "HOG", es: "HOG" } },
    ],
  },

  // ───── 2. Qingdao Ocean Harvest Foods (CN) ─────
  "sup-cn-002": {
    maskedName: {
      ru: "Китайский переработчик белой рыбы · CN-207",
      es: "Procesador chino de pescado blanco · CN-207",
    },
    shortDescription: {
      ru: "Завод переработки русской и аляскинской белой рыбы, линии MAP/IQF, экспортные программы в ЕС и США.",
      es: "Planta de reprocesamiento para pescado blanco ruso y de Alaska, líneas MAP/IQF, programas de exportación a la UE y EE. UU.",
    },
    about: {
      ru: "Среднего размера переработчик в Циндао, специализирующийся на белой рыбе двойной заморозки из российского и аляскинского сырья. Две линии MAP/IQF, BRC- и IFS-аттестованные холодильники, постоянные программы private label для ЕС и США.",
      es: "Procesador de tamaño medio en Qingdao especializado en pescado blanco de doble congelación a partir de materia prima rusa y de Alaska. Dos líneas MAP/IQF, almacenes frigoríficos auditados BRC e IFS, y programas continuos de marca privada para la UE y EE. UU.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Cod"], forms: { ru: "филе двойной заморозки, порции", es: "filete doble congelado, porciones" } },
      { species: SPECIES_LOCALES["Pollock"], forms: { ru: "филе, блоки", es: "filete, bloques" } },
      { species: SPECIES_LOCALES["Tilapia"], forms: { ru: "филе IQF", es: "filete IQF" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Филе трески 4–6 oz", es: "Filete de bacalao 4–6 oz" }, species: SPECIES_LOCALES["Cod"], form: { ru: "Филе", es: "Filete" } },
      { name: { ru: "Лоины трески без кожи", es: "Lomos de bacalao sin piel" }, species: SPECIES_LOCALES["Cod"], form: { ru: "Лоины", es: "Lomos" } },
      { name: { ru: "Блоки минтая 16,5 lb", es: "Bloques de abadejo 16,5 lb" }, species: SPECIES_LOCALES["Pollock"], form: { ru: "Блоки", es: "Bloques" } },
      { name: { ru: "Филе тиляпии IQF", es: "Filete de tilapia IQF" }, species: SPECIES_LOCALES["Tilapia"], form: { ru: "Филе", es: "Filete" } },
    ],
  },

  // ───── 3. Pacific Blue Shrimp S.A. (EC) ─────
  "sup-ec-003": {
    maskedName: {
      ru: "Эквадорский экспортёр креветки · EC-051",
      es: "Exportador ecuatoriano de camarón · EC-051",
    },
    shortDescription: {
      ru: "Экспортёр креветки «ферма-контейнер»: погрузка прямо на заводе, еженедельные отправки в ЕС.",
      es: "Exportador de camarón «de la granja al contenedor»: carga directa en planta, salidas semanales a la UE.",
    },
    about: {
      ru: "Вертикально интегрированный экспортёр креветки ваннамей с побережья Эквадора. Фермы, переработка и упаковка под одной крышей, еженедельные программы reefer-контейнеров в ЕС, Китай и США.",
      es: "Exportador verticalmente integrado de camarón vannamei de la costa ecuatoriana. Granjas, planta de proceso y envasado en un único emplazamiento, programas semanales de contenedores reefer a la UE, China y EE. UU.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Vannamei Shrimp"], forms: { ru: "HOSO, HLSO, PD, варёная", es: "HOSO, HLSO, PD, cocido" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Ваннамей HOSO 30/40", es: "Vannamei HOSO 30/40" }, species: SPECIES_LOCALES["Vannamei Shrimp"], form: { ru: "HOSO", es: "HOSO" } },
      { name: { ru: "Ваннамей HLSO 21/25", es: "Vannamei HLSO 21/25" }, species: SPECIES_LOCALES["Vannamei Shrimp"], form: { ru: "HLSO", es: "HLSO" } },
      { name: { ru: "Ваннамей PD варёная", es: "Vannamei PD cocido" }, species: SPECIES_LOCALES["Vannamei Shrimp"], form: { ru: "PD варёная", es: "PD cocido" } },
    ],
  },

  // ───── 4. Bali Tuna Pratama (ID) ─────
  "sup-id-004": {
    maskedName: {
      ru: "Индонезийский экспортёр тунца · ID-077",
      es: "Exportador indonesio de atún · ID-077",
    },
    shortDescription: {
      ru: "Тунец ярусного лова из Восточной Индонезии: свежая авиаотправка и сверхнизкотемпературные замороженные линии.",
      es: "Atún de pesca artesanal del este de Indonesia: envío aéreo en fresco y líneas congeladas a temperatura ultra baja.",
    },
    about: {
      ru: "Специализированный экспортёр жёлтопёрого тунца и скипджека ярусного лова от артельных флотов Восточной Индонезии. Свежая авиаперевозка и линии глубокой заморозки (ULT, −60 °C) для рынков сашими ЕС, США и Японии.",
      es: "Exportador especializado en atún rabil y listado de pesca artesanal de las flotas del este de Indonesia. Programas de carga aérea en fresco y líneas congeladas ULT (−60 °C) para los mercados de sashimi de la UE, EE. UU. y Japón.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Yellowfin Tuna"], forms: { ru: "лоины, стейки, саку, обработка CO", es: "lomos, filetes, saku, tratado con CO" } },
      { species: SPECIES_LOCALES["Skipjack"], forms: { ru: "целая тушка, лоины", es: "entero redondo, lomos" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Лоины жёлтопёрого тунца CO", es: "Lomos de atún rabil CO" }, species: SPECIES_LOCALES["Yellowfin Tuna"], form: { ru: "Лоины", es: "Lomos" } },
      { name: { ru: "Жёлтопёрый тунец саку ULT", es: "Atún rabil saku ULT" }, species: SPECIES_LOCALES["Yellowfin Tuna"], form: { ru: "Саку", es: "Saku" } },
      { name: { ru: "Скипджек, целая тушка", es: "Listado entero redondo" }, species: SPECIES_LOCALES["Skipjack"], form: { ru: "Целая тушка", es: "Entero redondo" } },
    ],
  },

  // ───── 5. Mekong Aquatic Products JSC (VN) ─────
  "sup-vn-005": {
    maskedName: {
      ru: "Вьетнамский переработчик пангасиуса · VN-132",
      es: "Procesador vietnamita de panga · VN-132",
    },
    shortDescription: {
      ru: "Интегрированное выращивание и переработка пангасиуса и креветки, программы для ЕС и Ближнего Востока.",
      es: "Cultivo y procesamiento integrados de panga y camarón, programas para la UE y Oriente Medio.",
    },
    about: {
      ru: "Переработчик из дельты Меконга с собственными фермами пангасиуса и контрактной сетью креветочных хозяйств. Программы для ЕС и Ближнего Востока, ASC- и BRC-аттестованное предприятие с HALAL-линией.",
      es: "Procesador del delta del Mekong con granjas propias de panga y red contratada de granjas camaroneras. Programas orientados a la UE y a Oriente Medio, planta auditada ASC y BRC con línea HALAL.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Pangasius"], forms: { ru: "филе, без обработки и обработанное", es: "filete, sin tratar y tratado" } },
      { species: SPECIES_LOCALES["Vannamei Shrimp"], forms: { ru: "PD, PDTO, варёная", es: "PD, PDTO, cocido" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Филе пангасиуса без обработки", es: "Filete de panga sin tratar" }, species: SPECIES_LOCALES["Pangasius"], form: { ru: "Филе", es: "Filete" } },
      { name: { ru: "Порции пангасиуса IQF", es: "Porciones de panga IQF" }, species: SPECIES_LOCALES["Pangasius"], form: { ru: "Порции", es: "Porciones" } },
      { name: { ru: "Ваннамей PDTO", es: "Vannamei PDTO" }, species: SPECIES_LOCALES["Vannamei Shrimp"], form: { ru: "PDTO", es: "PDTO" } },
    ],
  },

  // ───── 6. Reykjanes Seafood ehf. (IS) ─────
  "sup-is-006": {
    maskedName: {
      ru: "Исландский производитель белой рыбы · IS-019",
      es: "Productor islandés de pescado blanco · IS-019",
    },
    shortDescription: {
      ru: "Дневной улов с обработкой в день вылова: свежая авиаотправка в ЕС, замороженные reefer-партии в Азию.",
      es: "Captura del día con procesamiento en la misma jornada: envío aéreo fresco a la UE y partidas congeladas en reefer a Asia.",
    },
    about: {
      ru: "Исландская компания дневного промысла с собственным филетировочным заводом под Рейкьявиком. Обработка в день вылова для свежей авиаотправки в ЕС, IQF и блоки для программ в Азии и США.",
      es: "Operador islandés de pesca diaria con planta de fileteado propia cerca de Reikiavik. Procesamiento en el día para envío aéreo fresco a la UE, IQF y bloques para programas en Asia y EE. UU.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Cod"], forms: { ru: "свежее филе, порции IQF", es: "filete fresco, porciones IQF" } },
      { species: SPECIES_LOCALES["Haddock"], forms: { ru: "свежее филе, лоины замороженные", es: "filete fresco, lomos congelados" } },
      { species: SPECIES_LOCALES["Saithe"], forms: { ru: "блоки замороженные", es: "bloques congelados" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Свежее филе трески", es: "Filete fresco de bacalao" }, species: SPECIES_LOCALES["Cod"], form: { ru: "Свежее филе", es: "Filete fresco" } },
      { name: { ru: "Порции трески IQF", es: "Porciones de bacalao IQF" }, species: SPECIES_LOCALES["Cod"], form: { ru: "Порции IQF", es: "Porciones IQF" } },
      { name: { ru: "Лоины пикши замороженные", es: "Lomos de eglefino congelados" }, species: SPECIES_LOCALES["Haddock"], form: { ru: "Лоины", es: "Lomos" } },
    ],
  },

  // ───── 7. Kamchatka Pacific Fisheries (RU) ─────
  "sup-ru-007": {
    maskedName: {
      ru: "Российский поставщик краба и минтая · RU-064",
      es: "Proveedor ruso de cangrejo y abadejo · RU-064",
    },
    shortDescription: {
      ru: "Тихоокеанский улов морской и береговой переработки, reefer-контейнерные отгрузки через Владивосток и Пусан.",
      es: "Captura del Pacífico procesada en mar y en costa, envíos en contenedor reefer vía Vladivostok y Busán.",
    },
    about: {
      ru: "Камчатская рыболовная и перерабатывающая компания с тихоокеанским уловом морской и береговой переработки. Reefer-контейнерные отгрузки через Владивосток и Пусан в направлении рынков Азии и ЕС.",
      es: "Compañía pesquera y procesadora de Kamchatka con captura del Pacífico procesada en mar y en costa. Envíos en contenedor reefer vía Vladivostok y Busán a los mercados de Asia y la UE.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["King Crab"], forms: { ru: "живой, замороженные секции, варёные ноги", es: "vivo, secciones congeladas, patas cocidas" } },
      { species: SPECIES_LOCALES["Snow Crab"], forms: { ru: "замороженные секции, кластеры", es: "secciones congeladas, clusters" } },
      { species: SPECIES_LOCALES["Pollock"], forms: { ru: "H&G, филе, сурими", es: "H&G, filete, surimi" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Камчатский краб, замороженные секции", es: "Cangrejo real, secciones congeladas" }, species: SPECIES_LOCALES["King Crab"], form: { ru: "Секции", es: "Secciones" } },
      { name: { ru: "Камчатский краб, варёные ноги", es: "Cangrejo real, patas cocidas" }, species: SPECIES_LOCALES["King Crab"], form: { ru: "Варёные ноги", es: "Patas cocidas" } },
      { name: { ru: "Минтай H&G", es: "Abadejo H&G" }, species: SPECIES_LOCALES["Pollock"], form: { ru: "H&G", es: "H&G" } },
    ],
  },

  // ───── 8. AustralChile Seafoods SpA (CL) ─────
  "sup-cl-008": {
    maskedName: {
      ru: "Чилийский экспортёр лосося и мидий · CL-038",
      es: "Exportador chileno de salmón y mejillones · CL-038",
    },
    shortDescription: {
      ru: "Чилийский лосось и мидии Patagonia с круглогодичной экспортной программой.",
      es: "Salmón chileno y mejillones de la Patagonia con programa de exportación durante todo el año.",
    },
    about: {
      ru: "Чилийский экспортёр атлантического лосося и мидий с фермами в регионе Лос-Лагос. Круглогодичные программы экспорта в США, ЕС и Азию, морозильные суда и береговые холодильные мощности.",
      es: "Exportador chileno de salmón atlántico y mejillones con granjas en la región de Los Lagos. Programas de exportación durante todo el año a EE. UU., la UE y Asia, buques congeladores y capacidad frigorífica en costa.",
    },
    productFocus: [
      { species: SPECIES_LOCALES["Atlantic Salmon"], forms: { ru: "филе тримминг D, порции, IQF", es: "filete trim D, porciones, IQF" } },
      { species: SPECIES_LOCALES["Mussels"], forms: { ru: "цельные, мясо, варёные", es: "enteros, carne, cocidos" } },
    ],
    productCatalogPreview: [
      { name: { ru: "Филе чилийского лосося, тримминг D", es: "Filete de salmón chileno trim D" }, species: SPECIES_LOCALES["Atlantic Salmon"], form: { ru: "Филе", es: "Filete" } },
      { name: { ru: "Порции лосося IQF", es: "Porciones de salmón IQF" }, species: SPECIES_LOCALES["Atlantic Salmon"], form: { ru: "Порции", es: "Porciones" } },
      { name: { ru: "Мясо мидий варёное", es: "Carne de mejillón cocida" }, species: SPECIES_LOCALES["Mussels"], form: { ru: "Варёные", es: "Cocidas" } },
    ],
  },
};

/** Достаём перевод поля с graceful fallback к baseline (en/исходное). */
const pick = (
  field: LocalizedField | undefined,
  language: Language,
  fallback: string,
): string => field?.[language] ?? fallback;

/**
 * Возвращает копию поставщика с локализованными строковыми полями
 * для текущего языка. Поля без перевода остаются как в исходных данных
 * (EN baseline). Сигнатура совпадает с `MockSupplier`, поэтому всё,
 * что принимает `MockSupplier`, продолжит работать.
 */
export const localizeSupplier = (
  supplier: MockSupplier,
  language: Language,
): MockSupplier => {
  if (language === "en") return supplier;

  const patch = PATCHES[supplier.id];
  const country = pick(
    patch?.country ?? COUNTRY_LOCALES[supplier.country],
    language,
    supplier.country,
  );
  const city = pick(
    patch?.city ?? CITY_LOCALES[supplier.city],
    language,
    supplier.city,
  );

  const productFocus: SupplierProductFocus[] = supplier.productFocus.map((p, i) => {
    const fp = patch?.productFocus?.[i];
    return {
      species: pick(fp?.species ?? SPECIES_LOCALES[p.species], language, p.species),
      forms: pick(fp?.forms, language, p.forms),
    };
  });

  const productCatalogPreview: SupplierCatalogPreviewItem[] =
    supplier.productCatalogPreview.map((it, i) => {
      const fp = patch?.productCatalogPreview?.[i];
      return {
        name: pick(fp?.name, language, it.name),
        species: pick(fp?.species ?? SPECIES_LOCALES[it.species], language, it.species),
        form: pick(fp?.form ?? TERM_LOCALES[it.form], language, it.form),
        image: it.image,
      };
    });

  const deliveryCountries: SupplierDeliveryCountry[] = supplier.deliveryCountries.map((dc) => {
    const override = patch?.deliveryCountries?.[dc.code];
    return {
      code: dc.code,
      name: pick(override ?? COUNTRY_LOCALES[dc.name], language, dc.name),
    };
  });

  return {
    ...supplier,
    country,
    city,
    maskedName: pick(patch?.maskedName, language, supplier.maskedName),
    shortDescription: pick(patch?.shortDescription, language, supplier.shortDescription),
    about: pick(patch?.about, language, supplier.about),
    productFocus,
    productCatalogPreview,
    deliveryCountries,
  };
};
