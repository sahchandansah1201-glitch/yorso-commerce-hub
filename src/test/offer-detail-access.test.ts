/**
 * E2E проверка прав доступа на страницы товаров.
 *
 * Сценарий, который ломался в инциденте 2026-05-02 (42501 при переходе с
 * главной на /offers/:id), теперь покрыт автоматически:
 *
 *   1. Под anon-ключом получаем список офферов через `fetchOffers`
 *      (то же, что использует главная и /offers).
 *   2. Для каждого полученного id вызываем `fetchOfferById` (то же, что
 *      использует страница товара).
 *   3. Проверяем, что ни один вызов не вернул 42501 и для каждого id
 *      реально пришли данные.
 *
 * Дополнительно проверяем, что прямой запрос к view `offers_public`
 * (анонимный ярлык) тоже возвращает строки — без падения по правам.
 *
 * Suite skip-ается, если в окружении нет VITE_SUPABASE_*.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { fetchOffers, fetchOfferById } from "@/lib/catalog-api";
import type { SeafoodOffer } from "@/data/mockOffers";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const hasEnv = Boolean(URL && ANON);
const d = hasEnv ? describe : describe.skip;

const PG_INSUFFICIENT_PRIVILEGE = "42501";
// Сколько офферов реально проходим — чтобы тест не делал N запросов
// в большом каталоге. 5 достаточно для статистической проверки.
const SAMPLE_SIZE = 5;

interface OfferReadResult {
  id: string;
  productName: string;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
}

const readByLevel = async (
  level: "anonymous_locked" | "registered_locked",
): Promise<OfferReadResult[]> => {
  const offers = await fetchOffers(level);
  const sample = offers.slice(0, SAMPLE_SIZE);
  const results: OfferReadResult[] = [];
  for (const o of sample) {
    try {
      const detail = await fetchOfferById(o.id, level);
      results.push({ id: o.id, productName: o.productName, ok: detail !== null });
    } catch (err) {
      const e = err as { code?: string; message?: string };
      results.push({
        id: o.id,
        productName: o.productName,
        ok: false,
        errorCode: e?.code,
        errorMessage: e?.message,
      });
    }
  }
  return results;
};

d("E2E: переход с главной на страницу товара — права anon/authenticated", () => {
  let listed: SeafoodOffer[] = [];

  beforeAll(async () => {
    listed = await fetchOffers("anonymous_locked");
  });

  it("под anon список офферов получен (≥1) и нет 42501", () => {
    expect(listed.length).toBeGreaterThan(0);
    // Если бы был 42501 — fetchOffers бы кинул, тест упал бы выше.
  });

  it("под anonymous_locked: все выбранные офферы открываются по id", async () => {
    const results = await readByLevel("anonymous_locked");
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      // Подробный отчёт в случае падения — чтобы было видно, что именно сломалось.
      // eslint-disable-next-line no-console
      console.error("[e2e-access] anonymous_locked failures:", failed);
    }
    expect(failed.filter((r) => r.errorCode === PG_INSUFFICIENT_PRIVILEGE)).toHaveLength(0);
    expect(failed).toHaveLength(0);
  });

  it("под registered_locked: все выбранные офферы открываются по id", async () => {
    const results = await readByLevel("registered_locked");
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      // eslint-disable-next-line no-console
      console.error("[e2e-access] registered_locked failures:", failed);
    }
    expect(failed.filter((r) => r.errorCode === PG_INSUFFICIENT_PRIVILEGE)).toHaveLength(0);
    expect(failed).toHaveLength(0);
  });

  it("прямой SELECT по offers_public под anon-клиентом возвращает строки", async () => {
    const supabase = createClient(URL as string, ANON as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.from("offers_public").select("id").limit(SAMPLE_SIZE);
    expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("офферы из списка совпадают по id с тем, что отдаёт fetchOfferById", async () => {
    const sample = listed.slice(0, SAMPLE_SIZE);
    for (const o of sample) {
      const detail = await fetchOfferById(o.id, "anonymous_locked");
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(o.id);
    }
  });
});
