/* eslint-disable react-refresh/only-export-components */
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
  // ВАЖНО: title здесь — дефолтный «сайт»-тайтл. Если конкретная страница
  // (например, SupplierProfile) уже установила свой title, перезаписывать
  // его нельзя — иначе SEO-тайтл страницы мерцает или теряется.
  // Поэтому держим last-known site title и обновляем document.title только
  // если он совпадает с прошлым site title (или пуст).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = translations[lang];
    document.documentElement.setAttribute("lang", lang);
    const prevSiteTitle = (window as Window & { __yorsoSiteTitle?: string })
      .__yorsoSiteTitle;
    if (!document.title || document.title === prevSiteTitle) {
      document.title = t.meta_siteTitle;
    }
    (window as Window & { __yorsoSiteTitle?: string }).__yorsoSiteTitle =
      t.meta_siteTitle;
    let descTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", t.meta_siteDescription);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
