/**
 * Localized labels for onboarding option chips (categories, certifications, volumes).
 *
 * Canonical values stay in English so analytics events and the backend contract
 * remain stable across locales. Only the displayed text is translated.
 */
import type { Language } from "./translations";

type Dict = Record<string, Partial<Record<Language, string>>>;

const CATEGORY_LABELS: Dict = {
  // Buyer
  "Salmon & Trout": { en: "Salmon & Trout", ru: "Лосось и форель", es: "Salmón y trucha" },
  "Shrimp & Prawns": { en: "Shrimp & Prawns", ru: "Креветки", es: "Camarones y langostinos" },
  "White Fish (Cod, Haddock, Pollock)": {
    en: "White Fish (Cod, Haddock, Pollock)",
    ru: "Белая рыба (треска, пикша, минтай)",
    es: "Pescado blanco (bacalao, eglefino, abadejo)",
  },
  "Tuna & Swordfish": { en: "Tuna & Swordfish", ru: "Тунец и меч-рыба", es: "Atún y pez espada" },
  "Crab & Lobster": { en: "Crab & Lobster", ru: "Краб и лобстер", es: "Cangrejo y langosta" },
  "Squid & Octopus": { en: "Squid & Octopus", ru: "Кальмар и осьминог", es: "Calamar y pulpo" },
  "Mussels & Scallops": { en: "Mussels & Scallops", ru: "Мидии и гребешки", es: "Mejillones y vieiras" },
  "Surimi & Value-Added": {
    en: "Surimi & Value-Added",
    ru: "Сурими и продукты переработки",
    es: "Surimi y productos elaborados",
  },
  // Supplier business types
  "Wild Catch": { en: "Wild Catch", ru: "Дикий вылов", es: "Captura salvaje" },
  "Aquaculture / Farming": { en: "Aquaculture / Farming", ru: "Аквакультура", es: "Acuicultura" },
  "Processing & Value-Added": {
    en: "Processing & Value-Added",
    ru: "Переработка",
    es: "Procesamiento y elaboración",
  },
  "Trading & Distribution": {
    en: "Trading & Distribution",
    ru: "Трейдинг и дистрибуция",
    es: "Comercio y distribución",
  },
  "Cold Storage & Logistics": {
    en: "Cold Storage & Logistics",
    ru: "Холодное хранение и логистика",
    es: "Almacenamiento en frío y logística",
  },
  // Shared
  Other: { en: "Other", ru: "Другое", es: "Otro" },
};

const CERTIFICATION_LABELS: Dict = {
  MSC: { en: "MSC", ru: "MSC", es: "MSC" },
  ASC: { en: "ASC", ru: "ASC", es: "ASC" },
  HACCP: { en: "HACCP", ru: "HACCP (ХАССП)", es: "HACCP (APPCC)" },
  BRC: { en: "BRC", ru: "BRC", es: "BRC" },
  IFS: { en: "IFS", ru: "IFS", es: "IFS" },
  "GlobalG.A.P.": { en: "GlobalG.A.P.", ru: "GlobalG.A.P.", es: "GlobalG.A.P." },
  BAP: { en: "BAP", ru: "BAP", es: "BAP" },
  "ISO 22000": { en: "ISO 22000", ru: "ISO 22000", es: "ISO 22000" },
  "EU Approved": { en: "EU Approved", ru: "Одобрено ЕС", es: "Aprobado por la UE" },
  "FDA Registered": { en: "FDA Registered", ru: "Зарегистрировано FDA", es: "Registrado en la FDA" },
  Other: { en: "Other", ru: "Другое", es: "Otro" },
};

const VOLUME_LABELS: Dict = {
  "< 10 tons/month": { en: "< 10 tons/month", ru: "< 10 тонн/мес", es: "< 10 toneladas/mes" },
  "10–50 tons/month": { en: "10–50 tons/month", ru: "10–50 тонн/мес", es: "10–50 toneladas/mes" },
  "50–200 tons/month": { en: "50–200 tons/month", ru: "50–200 тонн/мес", es: "50–200 toneladas/mes" },
  "200+ tons/month": { en: "200+ tons/month", ru: "200+ тонн/мес", es: "200+ toneladas/mes" },
  "< 50 tons/month": { en: "< 50 tons/month", ru: "< 50 тонн/мес", es: "< 50 toneladas/mes" },
  "200–1000 tons/month": {
    en: "200–1000 tons/month",
    ru: "200–1000 тонн/мес",
    es: "200–1000 toneladas/mes",
  },
  "1000+ tons/month": { en: "1000+ tons/month", ru: "1000+ тонн/мес", es: "1000+ toneladas/mes" },
};

const lookup = (dict: Dict, key: string, lang: Language): string =>
  dict[key]?.[lang] ?? dict[key]?.en ?? key;

export const getCategoryLabel = (key: string, lang: Language) => lookup(CATEGORY_LABELS, key, lang);
export const getCertificationLabel = (key: string, lang: Language) =>
  lookup(CERTIFICATION_LABELS, key, lang);
export const getVolumeLabel = (key: string, lang: Language) => lookup(VOLUME_LABELS, key, lang);
