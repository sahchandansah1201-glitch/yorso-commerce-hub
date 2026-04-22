import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Language } from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("yorso-lang") as Language | null;
    if (saved && translations[saved]) return saved;
    if (typeof navigator !== "undefined") {
      const browserLangs = [navigator.language, ...(navigator.languages ?? [])]
        .filter(Boolean)
        .map((l) => l.toLowerCase().split("-")[0]);
      for (const code of browserLangs) {
        if (code === "ru" || code === "es" || code === "en") {
          return code as Language;
        }
      }
    }
    return "en";
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("yorso-lang", newLang);
  };

  // Синхронизируем метаданные документа с текущей локалью.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = translations[lang];
    document.documentElement.setAttribute("lang", lang);
    document.title = t.meta_siteTitle;

    const upsertMeta = (selector: string, attr: "name" | "property", key: string): HTMLMetaElement => {
      let tag = document.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      return tag;
    };

    const descTag = upsertMeta('meta[name="description"]', "name", "description");
    descTag.setAttribute("content", t.meta_siteDescription);

    // Open Graph: title, description, locale — синхронизируем с активной локалью.
    const ogLocaleMap: Record<Language, string> = {
      en: "en_US",
      ru: "ru_RU",
      es: "es_ES",
    };

    const ogTitle = upsertMeta('meta[property="og:title"]', "property", "og:title");
    ogTitle.setAttribute("content", t.meta_siteTitle);

    const ogDesc = upsertMeta('meta[property="og:description"]', "property", "og:description");
    ogDesc.setAttribute("content", t.meta_siteDescription);

    const ogLocale = upsertMeta('meta[property="og:locale"]', "property", "og:locale");
    ogLocale.setAttribute("content", ogLocaleMap[lang]);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
