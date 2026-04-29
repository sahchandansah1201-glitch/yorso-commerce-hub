import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { useForSuppliers, type ForSuppliersDict } from "@/i18n/for-suppliers";
import type { Language } from "@/i18n/translations";

const STORAGE_KEY = "yorso-lang";
const LOCALES = ["en", "ru", "es"] as const satisfies readonly Language[];

const loadDict = (lang: Language): ForSuppliersDict => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEY, lang);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );
  const { result } = renderHook(() => useForSuppliers(), { wrapper });
  return result.current;
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// Intent keywords per locale (case-insensitive substring match).
const INTENT_KEYWORDS: Record<string, Record<Language, string[]>> = {
  price_access: {
    en: ["price", "approve", "access"],
    ru: ["цен", "доступ"],
    es: ["precio", "acceso", "aprueb"],
  },
  documents_certifications: {
    en: ["document", "certif", "msc", "asc", "haccp"],
    ru: ["документ", "сертифик", "msc", "asc", "хассп"],
    es: ["document", "certific", "msc", "asc", "haccp"],
  },
  onboarding: {
    en: ["publish", "register", "first offer", "supplier card"],
    ru: ["публик", "регистр", "карточк", "первое предложение", "первого предложения"],
    es: ["publicar", "registr", "ficha", "primera oferta"],
  },
};

describe("/for-suppliers FAQ content", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  LOCALES.forEach((lang) => {
    describe(`locale: ${lang}`, () => {
      it("has a substantive FAQ list (>=4 items, no empty Q/A, answers >=40 chars)", () => {
        const t = loadDict(lang);
        expect(Array.isArray(t.faq_items)).toBe(true);
        expect(t.faq_items.length).toBeGreaterThanOrEqual(4);

        for (const item of t.faq_items) {
          expect(norm(item.q).length).toBeGreaterThan(0);
          expect(norm(item.a).length).toBeGreaterThanOrEqual(40);
        }
      });

      it("has no duplicate questions (exact, normalized)", () => {
        const t = loadDict(lang);
        const questions = t.faq_items.map((i) => norm(i.q));
        const unique = new Set(questions);
        expect(unique.size, `Duplicate FAQ questions in ${lang}`).toBe(questions.length);
      });

      it("has no near-duplicate questions (Jaccard token overlap < 0.8)", () => {
        const t = loadDict(lang);
        const tokenize = (s: string) =>
          new Set(
            norm(s)
              .replace(/[^\p{L}\p{N}\s]/gu, " ")
              .split(/\s+/)
              .filter((w) => w.length > 2)
          );
        const sets = t.faq_items.map((i) => tokenize(i.q));

        for (let i = 0; i < sets.length; i++) {
          for (let j = i + 1; j < sets.length; j++) {
            const a = sets[i];
            const b = sets[j];
            const intersection = new Set([...a].filter((x) => b.has(x))).size;
            const union = new Set([...a, ...b]).size;
            const jaccard = union === 0 ? 0 : intersection / union;
            expect(
              jaccard < 0.8,
              `FAQ Q${i} and Q${j} are near-duplicates (Jaccard=${jaccard.toFixed(
                2
              )}) in ${lang}: "${t.faq_items[i].q}" / "${t.faq_items[j].q}"`
            ).toBe(true);
          }
        }
      });

      it("has no duplicate answers (exact, normalized)", () => {
        const t = loadDict(lang);
        const answers = t.faq_items.map((i) => norm(i.a));
        const unique = new Set(answers);
        expect(unique.size, `Duplicate FAQ answers in ${lang}`).toBe(answers.length);
      });

      it("covers core supplier intents (price access, documents/certifications, onboarding)", () => {
        const t = loadDict(lang);
        const intents = ["price_access", "documents_certifications", "onboarding"] as const;

        for (const intent of intents) {
          const kws = INTENT_KEYWORDS[intent][lang];
          const found = t.faq_items.some((item) => {
            const blob = norm(`${item.q} ${item.a}`);
            return kws.some((k) => blob.includes(k.toLowerCase()));
          });
          expect(
            found,
            `No FAQ Q&A pair targets supplier intent "${intent}" in ${lang}. ` +
              `Expected any keyword: ${kws.join(", ")}`
          ).toBe(true);
        }
      });
    });
  });
});
