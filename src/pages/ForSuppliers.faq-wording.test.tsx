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

// Intent lexicon: keywords that must appear in the QUESTION wording itself
// (not in the answer). Each question must hit at least one allowed intent.
type Intent =
  | "price_access"
  | "documents_certifications"
  | "onboarding"
  | "buyers" // who sends requests
  | "pricing_fees"; // commission / cost

const INTENT_QUESTION_LEXICON: Record<Intent, Record<Language, string[]>> = {
  price_access: {
    en: ["price", "prices", "pricing", "supplier name", "public", "see"],
    ru: ["цен", "прайс", "название", "публичн", "видит"],
    es: ["precio", "precios", "nombre", "público", "publico", "ve "],
  },
  documents_certifications: {
    en: ["document", "documents", "certif", "certification", "certifications"],
    ru: ["документ", "сертифик"],
    es: ["document", "certific"],
  },
  onboarding: {
    en: ["publish", "first offer", "register", "supplier card", "how long"],
    ru: ["публик", "первое предложение", "первого предложения", "регистр", "карточк", "сколько времени"],
    es: ["publicar", "primera oferta", "registr", "ficha", "cuánto tarda", "cuanto tarda"],
  },
  buyers: {
    en: ["buyer", "buyers", "request", "requests"],
    ru: ["покупател", "запрос"],
    es: ["comprador", "compradores", "solicitud", "solicitudes"],
  },
  pricing_fees: {
    en: ["cost", "commission", "fee", "fees", "how much"],
    ru: ["стоит", "стоимость", "комисси", "цена сделк"],
    es: ["cuesta", "cuánto cuesta", "cuanto cuesta", "comisión", "comision", "tarifa"],
  },
};

// Off-topic / irrelevant wording for the supplier audience.
// FAQ on /for-suppliers must not phrase questions around buyer-side decisions,
// generic marketing fluff or unrelated logistics topics.
const OFF_TOPIC_TERMS: Record<Language, string[]> = {
  en: [
    "lorem",
    "ipsum",
    "best deal",
    "discount code",
    "coupon",
    "newsletter",
    "blog post",
    "as a buyer", // the page is for suppliers
    "for buyers",
  ],
  ru: [
    "lorem",
    "ipsum",
    "скидк",
    "промокод",
    "купон",
    "рассылк",
    "блог",
    "как покупател", // страница для поставщиков
    "для покупател",
  ],
  es: [
    "lorem",
    "ipsum",
    "descuento",
    "cupón",
    "cupon",
    "boletín",
    "boletin",
    "blog",
    "como comprador",
    "para compradores",
  ],
};

const matchesAny = (text: string, kws: string[]) =>
  kws.some((k) => text.includes(k.toLowerCase()));

const classifyQuestion = (
  question: string,
  lang: Language
): Intent[] => {
  const text = norm(question);
  const intents: Intent[] = [];
  (Object.keys(INTENT_QUESTION_LEXICON) as Intent[]).forEach((intent) => {
    const kws = INTENT_QUESTION_LEXICON[intent][lang];
    if (matchesAny(text, kws)) intents.push(intent);
  });
  return intents;
};

describe("/for-suppliers FAQ question wording", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  LOCALES.forEach((lang) => {
    describe(`locale: ${lang}`, () => {
      it("every question wording maps to at least one supplier intent from the lexicon", () => {
        const t = loadDict(lang);
        for (const item of t.faq_items) {
          const intents = classifyQuestion(item.q, lang);
          expect(
            intents.length,
            `Question is off-lexicon in ${lang}: "${item.q}". ` +
              `Expected wording to include one of intents: ${Object.keys(
                INTENT_QUESTION_LEXICON
              ).join(", ")}.`
          ).toBeGreaterThan(0);
        }
      });

      it("question wording covers all 3 core supplier intents (price / documents / onboarding)", () => {
        const t = loadDict(lang);
        const allIntents = t.faq_items.flatMap((item) => classifyQuestion(item.q, lang));
        const coreIntents: Intent[] = [
          "price_access",
          "documents_certifications",
          "onboarding",
        ];

        for (const intent of coreIntents) {
          expect(
            allIntents.includes(intent),
            `No FAQ question wording targets core supplier intent "${intent}" in ${lang}. ` +
              `Allowed keywords: ${INTENT_QUESTION_LEXICON[intent][lang].join(", ")}`
          ).toBe(true);
        }
      });

      it("question wording does not contain off-topic / irrelevant terms", () => {
        const t = loadDict(lang);
        const offTopic = OFF_TOPIC_TERMS[lang];
        for (const item of t.faq_items) {
          const text = norm(item.q);
          for (const term of offTopic) {
            expect(
              text.includes(term.toLowerCase()),
              `Off-topic term "${term}" found in FAQ question wording (${lang}): "${item.q}"`
            ).toBe(false);
          }
        }
      });

      it("each question is phrased as a question (ends with '?' or '？' or '¿…?')", () => {
        const t = loadDict(lang);
        for (const item of t.faq_items) {
          const trimmed = item.q.trim();
          expect(
            trimmed.endsWith("?") || trimmed.endsWith("？"),
            `FAQ entry is not phrased as a question (${lang}): "${item.q}"`
          ).toBe(true);
        }
      });
    });
  });
});
