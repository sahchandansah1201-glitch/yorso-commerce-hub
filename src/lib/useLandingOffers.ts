/**
 * useLandingOffers — self-hosted-first загрузчик офферов для landing.
 *
 * Стратегия (согласовано):
 * 1. На mount тянем `fetchOffers("anonymous_locked")` (landing всегда публичный).
 * 2. Если запрос упал ИЛИ вернул пустой массив → используем `mockOffers` как fallback,
 *    чтобы маркетинг-витрина никогда не была пустой.
 * 3. Источник раскрываем через поле `source` для диагностики/тестов.
 *
 * Тесты компонентов остаются на mockOffers как fixture — это unit-тесты UI,
 * а не интеграция с БД.
 */

import { useEffect, useState } from "react";
import type { SeafoodOffer } from "@/data/mockOffers";
import { mockOffers } from "@/data/mockOffers";
import { fetchOffers } from "@/lib/catalog-api";

export type LandingOffersSource = "catalog-api" | "mock-fallback" | "loading";

export interface LandingOffersResult {
  offers: SeafoodOffer[];
  source: LandingOffersSource;
  isLoading: boolean;
}

export function useLandingOffers(): LandingOffersResult {
  // Сразу возвращаем mock как initial state — landing должен быть моментально
  // отрисован без skeleton-flash. Когда придёт ответ catalog API, переключим.
  const [offers, setOffers] = useState<SeafoodOffer[]>(mockOffers);
  const [source, setSource] = useState<LandingOffersSource>("loading");

  useEffect(() => {
    let cancelled = false;
    fetchOffers("anonymous_locked")
      .then((rows) => {
        if (cancelled) return;
        if (rows.length > 0) {
          setOffers(rows);
          setSource("catalog-api");
        } else {
          // Preview/API source is empty — keep local fixture so landing is never blank.
          setSource("mock-fallback");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[useLandingOffers] Catalog API fetch failed, using local fixture fallback", err);
        setSource("mock-fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { offers, source, isLoading: source === "loading" };
}
