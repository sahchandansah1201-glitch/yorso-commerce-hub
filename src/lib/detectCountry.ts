const TIMEZONE_COUNTRIES: Record<string, string> = {
  "Europe/Moscow": "Russia",
  "Europe/London": "United Kingdom",
  "Europe/Paris": "France",
  "Europe/Berlin": "Germany",
  "Europe/Madrid": "Spain",
  "Europe/Rome": "Italy",
  "Europe/Oslo": "Norway",
  "Europe/Stockholm": "Sweden",
  "Europe/Copenhagen": "Denmark",
  "Europe/Amsterdam": "Netherlands",
  "Europe/Brussels": "Belgium",
  "Europe/Lisbon": "Portugal",
  "Europe/Athens": "Greece",
  "Europe/Istanbul": "Turkey",
  "Europe/Warsaw": "Poland",
  "Europe/Helsinki": "Finland",
  "Europe/Tallinn": "Estonia",
  "Europe/Riga": "Latvia",
  "Europe/Vilnius": "Lithuania",
  "Europe/Bucharest": "Romania",
  "Europe/Prague": "Czech Republic",
  "Europe/Budapest": "Hungary",
  "Europe/Vienna": "Austria",
  "Europe/Zurich": "Switzerland",
  "Europe/Dublin": "Ireland",
  "Europe/Belgrade": "Serbia",
  "Europe/Sofia": "Bulgaria",
  "Europe/Zagreb": "Croatia",
  "Europe/Kiev": "Ukraine",
  "Europe/Minsk": "Belarus",
  "Asia/Tokyo": "Japan",
  "Asia/Shanghai": "China",
  "Asia/Seoul": "South Korea",
  "Asia/Bangkok": "Thailand",
  "Asia/Ho_Chi_Minh": "Vietnam",
  "Asia/Jakarta": "Indonesia",
  "Asia/Kolkata": "India",
  "Asia/Dubai": "UAE",
  "Asia/Singapore": "Singapore",
  "Asia/Hong_Kong": "Hong Kong",
  "Asia/Taipei": "Taiwan",
  "Asia/Manila": "Philippines",
  "Asia/Vladivostok": "Russia",
  "Asia/Yekaterinburg": "Russia",
  "Asia/Novosibirsk": "Russia",
  "America/New_York": "United States",
  "America/Chicago": "United States",
  "America/Denver": "United States",
  "America/Los_Angeles": "United States",
  "America/Toronto": "Canada",
  "America/Vancouver": "Canada",
  "America/Sao_Paulo": "Brazil",
  "America/Argentina/Buenos_Aires": "Argentina",
  "America/Santiago": "Chile",
  "America/Lima": "Peru",
  "America/Mexico_City": "Mexico",
  "America/Bogota": "Colombia",
  "Pacific/Auckland": "New Zealand",
  "Australia/Sydney": "Australia",
  "Australia/Melbourne": "Australia",
  "Africa/Lagos": "Nigeria",
  "Africa/Johannesburg": "South Africa",
  "Africa/Nairobi": "Kenya",
  "Africa/Casablanca": "Morocco",
  "Atlantic/Reykjavik": "Iceland",
};

// Map browser language codes to country names
const LANGUAGE_COUNTRIES: Record<string, string> = {
  "ru": "Russia",
  "en-US": "United States",
  "en-GB": "United Kingdom",
  "en-AU": "Australia",
  "en-CA": "Canada",
  "en-NZ": "New Zealand",
  "fr": "France",
  "fr-CA": "Canada",
  "de": "Germany",
  "de-AT": "Austria",
  "de-CH": "Switzerland",
  "es": "Spain",
  "es-MX": "Mexico",
  "es-AR": "Argentina",
  "es-CL": "Chile",
  "es-CO": "Colombia",
  "es-PE": "Peru",
  "es-EC": "Ecuador",
  "it": "Italy",
  "pt": "Portugal",
  "pt-BR": "Brazil",
  "ja": "Japan",
  "zh": "China",
  "zh-CN": "China",
  "zh-TW": "Taiwan",
  "zh-HK": "Hong Kong",
  "ko": "South Korea",
  "th": "Thailand",
  "vi": "Vietnam",
  "id": "Indonesia",
  "hi": "India",
  "ar": "UAE",
  "ar-SA": "Saudi Arabia",
  "ar-EG": "Egypt",
  "ar-MA": "Morocco",
  "tr": "Turkey",
  "pl": "Poland",
  "nl": "Netherlands",
  "nl-BE": "Belgium",
  "sv": "Sweden",
  "da": "Denmark",
  "nb": "Norway",
  "nn": "Norway",
  "no": "Norway",
  "fi": "Finland",
  "el": "Greece",
  "uk": "Ukraine",
  "ro": "Romania",
  "cs": "Czech Republic",
  "hu": "Hungary",
  "bg": "Bulgaria",
  "hr": "Croatia",
  "sr": "Serbia",
  "is": "Iceland",
  "et": "Estonia",
  "lv": "Latvia",
  "lt": "Lithuania",
  "ms": "Singapore",
  "tl": "Philippines",
};

/**
 * Synchronous detection: timezone first, then browser language fallback.
 */
export function detectCountry(): string {
  try {
    // 1. Timezone-based detection (most accurate for single-country timezones)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzCountry = TIMEZONE_COUNTRIES[tz];
    if (tzCountry) return tzCountry;

    // 2. Browser language fallback
    const lang = navigator.language;
    // Try exact match first (e.g. "en-US"), then base language (e.g. "en")
    const langCountry = LANGUAGE_COUNTRIES[lang] || LANGUAGE_COUNTRIES[lang.split("-")[0]];
    if (langCountry) return langCountry;

    return "";
  } catch {
    return "";
  }
}

/**
 * Async detection via IP geolocation API.
 * Returns country name matching SEAFOOD_COUNTRIES, or empty string.
 */
export async function detectCountryByIP(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return "";
    const data = await res.json();

    const countryName = data.country_name as string | undefined;
    if (!countryName) return "";

    // Check if it matches our known countries list
    if (SEAFOOD_COUNTRIES.includes(countryName)) return countryName;

    // Handle common naming differences
    const NAME_ALIASES: Record<string, string> = {
      "United States of America": "United States",
      "Korea, Republic of": "South Korea",
      "Korea, South": "South Korea",
      "Russian Federation": "Russia",
      "Türkiye": "Turkey",
      "Czechia": "Czech Republic",
      "United Arab Emirates": "UAE",
      "Viet Nam": "Vietnam",
    };

    return NAME_ALIASES[countryName] || "";
  } catch {
    return "";
  }
}

export const SEAFOOD_COUNTRIES = [
  "Argentina", "Australia", "Belgium", "Brazil", "Canada", "Chile", "China",
  "Colombia", "Croatia", "Czech Republic", "Denmark", "Ecuador", "Estonia",
  "Finland", "France", "Germany", "Greece", "Hong Kong", "Hungary",
  "Iceland", "India", "Indonesia", "Ireland", "Italy", "Japan", "Kenya",
  "Latvia", "Lithuania", "Mexico", "Morocco", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Peru", "Philippines", "Poland", "Portugal",
  "Romania", "Russia", "Serbia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "UAE",
  "Ukraine", "United Kingdom", "United States", "Vietnam",
];
