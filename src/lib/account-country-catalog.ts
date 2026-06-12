/**
 * Local country reference catalog for /account/* workspace inputs.
 * Source: ISO 3166-1 (alpha-2, alpha-3) + ITU-T E.164 phone codes.
 * No network calls, no provider. Names localized for EN/RU/ES.
 */

export type CountryLang = "en" | "ru" | "es";

export interface CountryEntry {
  /** Stable id = alpha-2 lowercase. */
  id: string;
  alpha2: string;
  alpha3: string;
  /** International phone code with leading "+". */
  phone: string;
  en: string;
  ru: string;
  es: string;
}

export const COUNTRY_CATALOG: CountryEntry[] = [
  { id: "ar", alpha2: "AR", alpha3: "ARG", phone: "+54",  en: "Argentina",            ru: "Аргентина",            es: "Argentina" },
  { id: "au", alpha2: "AU", alpha3: "AUS", phone: "+61",  en: "Australia",            ru: "Австралия",            es: "Australia" },
  { id: "az", alpha2: "AZ", alpha3: "AZE", phone: "+994", en: "Azerbaijan",           ru: "Азербайджан",          es: "Azerbaiyán" },
  { id: "bd", alpha2: "BD", alpha3: "BGD", phone: "+880", en: "Bangladesh",           ru: "Бангладеш",            es: "Bangladés" },
  { id: "be", alpha2: "BE", alpha3: "BEL", phone: "+32",  en: "Belgium",              ru: "Бельгия",              es: "Bélgica" },
  { id: "br", alpha2: "BR", alpha3: "BRA", phone: "+55",  en: "Brazil",               ru: "Бразилия",             es: "Brasil" },
  { id: "ca", alpha2: "CA", alpha3: "CAN", phone: "+1",   en: "Canada",               ru: "Канада",               es: "Canadá" },
  { id: "cl", alpha2: "CL", alpha3: "CHL", phone: "+56",  en: "Chile",                ru: "Чили",                 es: "Chile" },
  { id: "cn", alpha2: "CN", alpha3: "CHN", phone: "+86",  en: "China",                ru: "Китай",                es: "China" },
  { id: "co", alpha2: "CO", alpha3: "COL", phone: "+57",  en: "Colombia",             ru: "Колумбия",             es: "Colombia" },
  { id: "cr", alpha2: "CR", alpha3: "CRI", phone: "+506", en: "Costa Rica",           ru: "Коста-Рика",           es: "Costa Rica" },
  { id: "dk", alpha2: "DK", alpha3: "DNK", phone: "+45",  en: "Denmark",              ru: "Дания",                es: "Dinamarca" },
  { id: "ec", alpha2: "EC", alpha3: "ECU", phone: "+593", en: "Ecuador",              ru: "Эквадор",              es: "Ecuador" },
  { id: "eg", alpha2: "EG", alpha3: "EGY", phone: "+20",  en: "Egypt",                ru: "Египет",               es: "Egipto" },
  { id: "ee", alpha2: "EE", alpha3: "EST", phone: "+372", en: "Estonia",              ru: "Эстония",              es: "Estonia" },
  { id: "fo", alpha2: "FO", alpha3: "FRO", phone: "+298", en: "Faroe Islands",        ru: "Фарерские острова",    es: "Islas Feroe" },
  { id: "fi", alpha2: "FI", alpha3: "FIN", phone: "+358", en: "Finland",              ru: "Финляндия",            es: "Finlandia" },
  { id: "fr", alpha2: "FR", alpha3: "FRA", phone: "+33",  en: "France",               ru: "Франция",              es: "Francia" },
  { id: "de", alpha2: "DE", alpha3: "DEU", phone: "+49",  en: "Germany",              ru: "Германия",             es: "Alemania" },
  { id: "gr", alpha2: "GR", alpha3: "GRC", phone: "+30",  en: "Greece",               ru: "Греция",               es: "Grecia" },
  { id: "hn", alpha2: "HN", alpha3: "HND", phone: "+504", en: "Honduras",             ru: "Гондурас",             es: "Honduras" },
  { id: "hk", alpha2: "HK", alpha3: "HKG", phone: "+852", en: "Hong Kong",            ru: "Гонконг",              es: "Hong Kong" },
  { id: "is", alpha2: "IS", alpha3: "ISL", phone: "+354", en: "Iceland",              ru: "Исландия",             es: "Islandia" },
  { id: "in", alpha2: "IN", alpha3: "IND", phone: "+91",  en: "India",                ru: "Индия",                es: "India" },
  { id: "id", alpha2: "ID", alpha3: "IDN", phone: "+62",  en: "Indonesia",            ru: "Индонезия",            es: "Indonesia" },
  { id: "ir", alpha2: "IR", alpha3: "IRN", phone: "+98",  en: "Iran",                 ru: "Иран",                 es: "Irán" },
  { id: "ie", alpha2: "IE", alpha3: "IRL", phone: "+353", en: "Ireland",              ru: "Ирландия",             es: "Irlanda" },
  { id: "il", alpha2: "IL", alpha3: "ISR", phone: "+972", en: "Israel",               ru: "Израиль",              es: "Israel" },
  { id: "it", alpha2: "IT", alpha3: "ITA", phone: "+39",  en: "Italy",                ru: "Италия",               es: "Italia" },
  { id: "jp", alpha2: "JP", alpha3: "JPN", phone: "+81",  en: "Japan",                ru: "Япония",               es: "Japón" },
  { id: "kz", alpha2: "KZ", alpha3: "KAZ", phone: "+7",   en: "Kazakhstan",           ru: "Казахстан",            es: "Kazajistán" },
  { id: "ke", alpha2: "KE", alpha3: "KEN", phone: "+254", en: "Kenya",                ru: "Кения",                es: "Kenia" },
  { id: "lv", alpha2: "LV", alpha3: "LVA", phone: "+371", en: "Latvia",               ru: "Латвия",               es: "Letonia" },
  { id: "lt", alpha2: "LT", alpha3: "LTU", phone: "+370", en: "Lithuania",            ru: "Литва",                es: "Lituania" },
  { id: "mg", alpha2: "MG", alpha3: "MDG", phone: "+261", en: "Madagascar",           ru: "Мадагаскар",           es: "Madagascar" },
  { id: "mr", alpha2: "MR", alpha3: "MRT", phone: "+222", en: "Mauritania",           ru: "Мавритания",           es: "Mauritania" },
  { id: "mx", alpha2: "MX", alpha3: "MEX", phone: "+52",  en: "Mexico",               ru: "Мексика",              es: "México" },
  { id: "ma", alpha2: "MA", alpha3: "MAR", phone: "+212", en: "Morocco",              ru: "Марокко",              es: "Marruecos" },
  { id: "mz", alpha2: "MZ", alpha3: "MOZ", phone: "+258", en: "Mozambique",           ru: "Мозамбик",             es: "Mozambique" },
  { id: "mm", alpha2: "MM", alpha3: "MMR", phone: "+95",  en: "Myanmar",              ru: "Мьянма",               es: "Myanmar" },
  { id: "na", alpha2: "NA", alpha3: "NAM", phone: "+264", en: "Namibia",              ru: "Намибия",              es: "Namibia" },
  { id: "nl", alpha2: "NL", alpha3: "NLD", phone: "+31",  en: "Netherlands",          ru: "Нидерланды",           es: "Países Bajos" },
  { id: "nz", alpha2: "NZ", alpha3: "NZL", phone: "+64",  en: "New Zealand",          ru: "Новая Зеландия",       es: "Nueva Zelanda" },
  { id: "no", alpha2: "NO", alpha3: "NOR", phone: "+47",  en: "Norway",               ru: "Норвегия",             es: "Noruega" },
  { id: "om", alpha2: "OM", alpha3: "OMN", phone: "+968", en: "Oman",                 ru: "Оман",                 es: "Omán" },
  { id: "pk", alpha2: "PK", alpha3: "PAK", phone: "+92",  en: "Pakistan",             ru: "Пакистан",             es: "Pakistán" },
  { id: "pa", alpha2: "PA", alpha3: "PAN", phone: "+507", en: "Panama",               ru: "Панама",               es: "Panamá" },
  { id: "pg", alpha2: "PG", alpha3: "PNG", phone: "+675", en: "Papua New Guinea",     ru: "Папуа — Новая Гвинея", es: "Papúa Nueva Guinea" },
  { id: "pe", alpha2: "PE", alpha3: "PER", phone: "+51",  en: "Peru",                 ru: "Перу",                 es: "Perú" },
  { id: "ph", alpha2: "PH", alpha3: "PHL", phone: "+63",  en: "Philippines",          ru: "Филиппины",            es: "Filipinas" },
  { id: "pl", alpha2: "PL", alpha3: "POL", phone: "+48",  en: "Poland",               ru: "Польша",               es: "Polonia" },
  { id: "pt", alpha2: "PT", alpha3: "PRT", phone: "+351", en: "Portugal",             ru: "Португалия",           es: "Portugal" },
  { id: "ru", alpha2: "RU", alpha3: "RUS", phone: "+7",   en: "Russia",               ru: "Россия",               es: "Rusia" },
  { id: "sa", alpha2: "SA", alpha3: "SAU", phone: "+966", en: "Saudi Arabia",         ru: "Саудовская Аравия",    es: "Arabia Saudita" },
  { id: "sn", alpha2: "SN", alpha3: "SEN", phone: "+221", en: "Senegal",              ru: "Сенегал",              es: "Senegal" },
  { id: "sg", alpha2: "SG", alpha3: "SGP", phone: "+65",  en: "Singapore",            ru: "Сингапур",             es: "Singapur" },
  { id: "za", alpha2: "ZA", alpha3: "ZAF", phone: "+27",  en: "South Africa",         ru: "ЮАР",                  es: "Sudáfrica" },
  { id: "kr", alpha2: "KR", alpha3: "KOR", phone: "+82",  en: "South Korea",          ru: "Южная Корея",          es: "Corea del Sur" },
  { id: "es", alpha2: "ES", alpha3: "ESP", phone: "+34",  en: "Spain",                ru: "Испания",              es: "España" },
  { id: "lk", alpha2: "LK", alpha3: "LKA", phone: "+94",  en: "Sri Lanka",            ru: "Шри-Ланка",            es: "Sri Lanka" },
  { id: "se", alpha2: "SE", alpha3: "SWE", phone: "+46",  en: "Sweden",               ru: "Швеция",               es: "Suecia" },
  { id: "tw", alpha2: "TW", alpha3: "TWN", phone: "+886", en: "Taiwan",               ru: "Тайвань",              es: "Taiwán" },
  { id: "tz", alpha2: "TZ", alpha3: "TZA", phone: "+255", en: "Tanzania",             ru: "Танзания",             es: "Tanzania" },
  { id: "th", alpha2: "TH", alpha3: "THA", phone: "+66",  en: "Thailand",             ru: "Таиланд",              es: "Tailandia" },
  { id: "tr", alpha2: "TR", alpha3: "TUR", phone: "+90",  en: "Turkey",               ru: "Турция",               es: "Turquía" },
  { id: "ua", alpha2: "UA", alpha3: "UKR", phone: "+380", en: "Ukraine",              ru: "Украина",              es: "Ucrania" },
  { id: "ae", alpha2: "AE", alpha3: "ARE", phone: "+971", en: "United Arab Emirates", ru: "ОАЭ",                  es: "Emiratos Árabes Unidos" },
  { id: "gb", alpha2: "GB", alpha3: "GBR", phone: "+44",  en: "United Kingdom",       ru: "Великобритания",       es: "Reino Unido" },
  { id: "us", alpha2: "US", alpha3: "USA", phone: "+1",   en: "United States",        ru: "США",                  es: "Estados Unidos" },
  { id: "vn", alpha2: "VN", alpha3: "VNM", phone: "+84",  en: "Vietnam",              ru: "Вьетнам",              es: "Vietnam" },
];

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const localizedCountryName = (entry: CountryEntry, lang: CountryLang): string =>
  entry[lang] || entry.en;

export const findCountryByName = (
  name: string,
  lang: CountryLang = "en",
): CountryEntry | undefined => {
  const q = normalize(name);
  if (!q) return undefined;
  return (
    COUNTRY_CATALOG.find((c) => normalize(c[lang]) === q) ||
    COUNTRY_CATALOG.find(
      (c) =>
        normalize(c.en) === q ||
        normalize(c.ru) === q ||
        normalize(c.es) === q ||
        c.alpha2.toLowerCase() === q ||
        c.alpha3.toLowerCase() === q,
    )
  );
};

export interface CountrySearchResult {
  entry: CountryEntry;
  /** Lower score = better match. */
  score: number;
}

/**
 * Ranked country search. Matches against:
 *   - localized name (active lang)
 *   - English name
 *   - alpha-2, alpha-3
 *   - international phone code
 */
export const searchCountries = (
  query: string,
  lang: CountryLang,
  limit = 25,
): CountryEntry[] => {
  const raw = query.trim();
  if (!raw) {
    return [...COUNTRY_CATALOG]
      .sort((a, b) => localizedCountryName(a, lang).localeCompare(localizedCountryName(b, lang)))
      .slice(0, limit);
  }
  const q = normalize(raw);
  const isPhone = raw.startsWith("+") || /^\d+$/.test(raw);
  const phoneQ = raw.replace(/[^\d]/g, "");

  const scored: CountrySearchResult[] = [];
  for (const entry of COUNTRY_CATALOG) {
    const local = normalize(entry[lang]);
    const en = normalize(entry.en);
    const a2 = entry.alpha2.toLowerCase();
    const a3 = entry.alpha3.toLowerCase();
    const phoneDigits = entry.phone.replace(/[^\d]/g, "");

    let score = Infinity;
    if (a2 === q) score = Math.min(score, 0);
    if (a3 === q) score = Math.min(score, 0);
    if (local === q || en === q) score = Math.min(score, 0);
    if (isPhone && phoneDigits === phoneQ) score = Math.min(score, 1);
    if (local.startsWith(q)) score = Math.min(score, 2);
    if (en.startsWith(q)) score = Math.min(score, 3);
    if (isPhone && phoneDigits.startsWith(phoneQ)) score = Math.min(score, 4);
    if (local.includes(q)) score = Math.min(score, 5);
    if (en.includes(q)) score = Math.min(score, 6);
    if (a2.startsWith(q) || a3.startsWith(q)) score = Math.min(score, 7);

    if (score !== Infinity) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return localizedCountryName(a.entry, lang).localeCompare(
      localizedCountryName(b.entry, lang),
    );
  });

  return scored.slice(0, limit).map((s) => s.entry);
};
