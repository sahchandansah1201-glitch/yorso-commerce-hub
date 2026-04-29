import { describe, it, expect } from "vitest";
import { forSuppliersTranslations } from "@/i18n/for-suppliers";
import type { Language } from "@/i18n/translations";

const LOCALES = ["en", "ru", "es"] as const satisfies readonly Language[];

// Intent keywords that the FAQ must cover for the supplier audience.
// Each intent is a list of synonyms across EN/RU/ES (case-insensitive substring match).
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

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

describe("/for-suppliers FAQ content", () => {
  LOCALES.forEach((lang) => {
    describe(`locale: ${lang}`, () => {
      const t = forSuppliersTranslations[lang];

      it("has a non-empty FAQ list", () => {
        expect(Array.isArray(t.faq_items)).toBe(true);
        expect(t.faq_items.length).toBeGreaterThanOrEqual(4);
      });

      it("has no empty questions or answers", () => {
        for (const item of t.faq_items) {
          expect(norm(item.q).length).toBeGreaterThan(0);
          expect(norm(item.a).length).toBeGreaterThan(0);
          // Answers must be substantive, not 1-2 word stubs.
          expect(norm(item.a).length).toBeGreaterThanOrEqual(40);
        }
      });

      it("has no duplicate questions (exact)", () => {
        const questions = t.faq_items.map((i) => norm(i.q));
        const unique = new Set(questions);
        expect(unique.size).toBe(questions.length);
      });

      it("has no near-duplicate questions (high token overlap)", () => {
        // Simple Jaccard on word tokens: if two questions share ≥80% of tokens, treat as duplicate.
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
              `FAQ questions ${i} and ${j} are near-duplicates (Jaccard=${jaccard.toFixed(
                2
              )}) in locale ${lang}: "${t.faq_items[i].q}" / "${t.faq_items[j].q}"`
            ).toBe(true);
          }
        }
      });

      it("has no duplicate answers (exact)", () => {
        const answers = t.faq_items.map((i) => norm(i.a));
        const unique = new Set(answers);
        expect(unique.size).toBe(answers.length);
      });

      it.each(Object.entries(INTENT_KEYWORDS))(
        "covers supplier intent: %s",
        (intent, perLang) => {
          const keywords = perLang[lang];
          // Build one searchable blob from all Q+A pairs.
          const blob = norm(
            t.faq_items.map((i) => `${i.q} ${i.a}`).join(" \n ")
          );
          const matched = keywords.filter((kw) => blob.includes(kw.toLowerCase()));
          expect(
            matched.length,
            `Intent "${intent}" not covered in locale ${lang}. Looking for any of: ${keywords.join(
              ", "
            )}`
          ).toBeGreaterThan(0);
        }
      );

      it("has at least one Q&A pair per core supplier intent (price/docs/onboarding)", () => {
        const matchesIntent = (text: string, kws: string[]) =>
          kws.some((k) => text.includes(k.toLowerCase()));

        const intents = ["price_access", "documents_certifications", "onboarding"] as const;

        for (const intent of intents) {
          const kws = INTENT_KEYWORDS[intent][lang];
          const found = t.faq_items.some((item) => {
            const blob = norm(`${item.q} ${item.a}`);
            return matchesIntent(blob, kws);
          });
          expect(found, `No FAQ Q&A pair targets intent "${intent}" in locale ${lang}`).toBe(true);
        }
      });
    });
  });
});
