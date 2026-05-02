-- ============================================================================
-- Оптимизация прав доступа: минимальные GRANT + дефолты для будущих объектов.
--
-- Цель:
--   1. Зацементировать стабильное чтение публичных витрин (offers_public,
--      suppliers_public, categories) для anon/authenticated. Это устраняет
--      повторение инцидента 42501 (insufficient_privilege) при ручных правках.
--   2. Убрать чрезмерные привилегии (anon=arwdDxtm), оставить минимально
--      необходимое: anon = SELECT, authenticated = CRUD (RLS режет строки).
--   3. Настроить ALTER DEFAULT PRIVILEGES, чтобы новые таблицы и view в схеме
--      public автоматически получали SELECT для anon/authenticated.
-- ============================================================================

-- Базовый USAGE на схему (без него никакие права на объекты не работают).
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ── 1. Сброс и переустановка прав на критичные сущности каталога ────────────

-- Таблицы (RLS уже включён и реализует ролевую логику).
REVOKE ALL ON public.offers     FROM anon, authenticated;
REVOKE ALL ON public.suppliers  FROM anon, authenticated;
REVOKE ALL ON public.categories FROM anon, authenticated;

-- Anon: только SELECT — RLS сама решит, какие строки реально видны.
GRANT SELECT ON public.offers     TO anon;
GRANT SELECT ON public.suppliers  TO anon;
GRANT SELECT ON public.categories TO anon;

-- Authenticated: SELECT + INSERT/UPDATE/DELETE. RLS политики (admin / supplier
-- owner / buyer) фильтруют строки. Для categories управляет только admin.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- Витрины (view) — только чтение, обоим ролям.
REVOKE ALL ON public.offers_public    FROM anon, authenticated;
REVOKE ALL ON public.suppliers_public FROM anon, authenticated;
GRANT SELECT ON public.offers_public    TO anon, authenticated;
GRANT SELECT ON public.suppliers_public TO anon, authenticated;

-- ── 2. Дефолты для будущих объектов в схеме public ──────────────────────────
-- Любая новая таблица или view, созданная ролью postgres в схеме public,
-- автоматически получит SELECT для anon и authenticated. Это убирает
-- необходимость каждый раз вручную писать GRANT-миграцию.
-- (Безопасно: RLS на новых таблицах включается отдельно и режет строки.)

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO anon, authenticated;
