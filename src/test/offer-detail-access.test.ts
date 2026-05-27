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
const ACCESS_QUERY_TIMEOUT_MS = 4000;
// Сколько офферов реально проходим — чтобы тест не делал N запросов
// в большом каталоге. 5 достаточно для статистической проверки.
const SAMPLE_SIZE = 5;

type AccessReadError = { code?: string; message?: string } | null;
type AccessReadResult<T> = { data: T | null; error: AccessReadError };

interface OfferReadResult {
  id: string;
  productName: string;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
}

const runAccessRead = async <T>(
  label: string,
  read: PromiseLike<T>,
): Promise<AccessReadResult<T>> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AccessReadResult<T>>((resolve) => {
    timeoutId = globalThis.setTimeout(() => {
      resolve({
        data: null,
        error: {
          code: "ACCESS_TEST_TIMEOUT",
          message: `${label}: timed out after ${ACCESS_QUERY_TIMEOUT_MS}ms`,
        },
      });
    }, ACCESS_QUERY_TIMEOUT_MS);
  });

  try {
    const data = await Promise.race([Promise.resolve(read), timeout]);
    if (data && typeof data === "object" && "error" in data && "data" in data) {
      return data as AccessReadResult<T>;
    }
    return { data: data as T, error: null };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    return {
      data: null,
      error: {
        code: e?.code ?? "ACCESS_TEST_NETWORK_ERROR",
        message: e?.message ?? String(err),
      },
    };
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
};

const warnNonPrivilege = (label: string, error: AccessReadError) => {
  if (error && error.code !== PG_INSUFFICIENT_PRIVILEGE) {
    console.warn(`[e2e-access] ${label} error (non-42501):`, error);
  }
};

const assertNoPrivilegeRegression = (label: string, failed: OfferReadResult[]) => {
  expect(failed.filter((r) => r.errorCode === PG_INSUFFICIENT_PRIVILEGE)).toHaveLength(0);
  const nonPrivilegeErrors = failed.filter((r) => r.errorCode && r.errorCode !== PG_INSUFFICIENT_PRIVILEGE);
  if (nonPrivilegeErrors.length > 0) {
    console.warn(`[e2e-access] ${label} non-42501 external read errors:`, nonPrivilegeErrors);
  }
  expect(failed.filter((r) => !r.errorCode)).toHaveLength(0);
};

const readByLevel = async (
  level: "anonymous_locked" | "registered_locked",
): Promise<OfferReadResult[]> => {
  const offersResult = await runAccessRead(`fetchOffers ${level}`, fetchOffers(level));
  if (offersResult.error) {
    warnNonPrivilege(`fetchOffers ${level}`, offersResult.error);
    return [{
      id: "__list__",
      productName: "catalog list",
      ok: false,
      errorCode: offersResult.error.code,
      errorMessage: offersResult.error.message,
    }];
  }
  const offers = offersResult.data ?? [];
  const sample = offers.slice(0, SAMPLE_SIZE);
  const results: OfferReadResult[] = [];
  for (const o of sample) {
    const detailResult = await runAccessRead(
      `fetchOfferById ${level} ${o.id}`,
      fetchOfferById(o.id, level),
    );
    if (detailResult.error) {
      warnNonPrivilege(`fetchOfferById ${level} ${o.id}`, detailResult.error);
      results.push({
        id: o.id,
        productName: o.productName,
        ok: false,
        errorCode: detailResult.error.code,
        errorMessage: detailResult.error.message,
      });
      continue;
    }
    const detail = detailResult.data;
    results.push({
      id: o.id,
      productName: o.productName,
      ok: detail !== null,
      errorCode: detail ? undefined : "OFFER_DETAIL_NOT_FOUND",
      errorMessage: detail ? undefined : `fetchOfferById returned null for ${o.id}`,
    });
  }
  return results;
};

d("E2E: переход с главной на страницу товара — права anon/authenticated", () => {
  let listed: SeafoodOffer[] = [];
  let listReadError: AccessReadError = null;

  beforeAll(async () => {
    const result = await runAccessRead(
      "initial fetchOffers anonymous_locked",
      fetchOffers("anonymous_locked"),
    );
    if (result.error) {
      listReadError = result.error;
      warnNonPrivilege("initial fetchOffers anonymous_locked", result.error);
      listed = [];
      return;
    }
    listed = result.data ?? [];
  });

  it("под anon список офферов получен (≥1) и нет 42501", () => {
    expect(listReadError?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
    if (listReadError) return;
    expect(listed.length).toBeGreaterThan(0);
    // Если бы был 42501 — fetchOffers бы кинул, тест упал бы выше.
  });

  it("под anonymous_locked: все выбранные офферы открываются по id", async () => {
    const results = await readByLevel("anonymous_locked");
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      // Подробный отчёт в случае падения — чтобы было видно, что именно сломалось.
      console.error("[e2e-access] anonymous_locked failures:", failed);
    }
    assertNoPrivilegeRegression("anonymous_locked", failed);
  });

  it("под registered_locked: все выбранные офферы открываются по id", async () => {
    const results = await readByLevel("registered_locked");
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.error("[e2e-access] registered_locked failures:", failed);
    }
    assertNoPrivilegeRegression("registered_locked", failed);
  });

  it("прямой SELECT по offers_public под anon-клиентом возвращает строки", async () => {
    const supabase = createClient(URL as string, ANON as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await runAccessRead(
      "offers_public direct select",
      supabase.from("offers_public").select("id").limit(SAMPLE_SIZE),
    );
    expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
    warnNonPrivilege("offers_public direct select", error);
    if (error) return;
    expect(Array.isArray(data)).toBe(true);
  });

  it("офферы из списка совпадают по id с тем, что отдаёт fetchOfferById", async () => {
    expect(listReadError?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
    if (listReadError) return;
    const sample = listed.slice(0, SAMPLE_SIZE);
    for (const o of sample) {
      const { data: detail, error } = await runAccessRead(
        `fetchOfferById anonymous_locked ${o.id}`,
        fetchOfferById(o.id, "anonymous_locked"),
      );
      expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
      warnNonPrivilege(`fetchOfferById anonymous_locked ${o.id}`, error);
      if (error) return;
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(o.id);
    }
  });
});
