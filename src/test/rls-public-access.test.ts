/**
 * Интеграционные тесты RLS / GRANT для публичных отношений каталога.
 *
 * Проверяют, что под ролью `anon` (через VITE_SUPABASE_PUBLISHABLE_KEY):
 *   1. SELECT на offers_public / suppliers_public / categories РАБОТАЕТ
 *      (нет 42501 insufficient_privilege — регрессия на инцидент 2026-05-02).
 *   2. Чувствительные колонки НЕ выдаются view-ами:
 *      • offers_public: price_min/price_max/price_currency/price_unit/supplier_id;
 *      • suppliers_public: company_name/website/contact_email/contact_phone/owner_user_id.
 *   3. Запись в защищённые таблицы отклоняется (RLS).
 *
 * Тесты выполняются против реального Supabase. Если env не сконфигурирован —
 * suite автоматически пропускается, чтобы не ломать CI без сети.
 */

import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const hasEnv = Boolean(URL && ANON);
const d = hasEnv ? describe : describe.skip;

const anonClient = (): SupabaseClient =>
  createClient(URL as string, ANON as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const PG_INSUFFICIENT_PRIVILEGE = "42501";

d("RLS / GRANT для публичных отношений каталога (роль anon)", () => {
  describe("SELECT доступ", () => {
    it("offers_public — SELECT не возвращает 42501", async () => {
      const supabase = anonClient();
      const { error } = await supabase.from("offers_public").select("id").limit(1);
      expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
      // Любая другая ошибка (например, временная сеть) — не валим тест жёстко,
      // но 42501 регрессия должна быть пресечена.
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[rls-test] offers_public select error (non-42501):", error);
      }
    });

    it("suppliers_public — SELECT не возвращает 42501", async () => {
      const supabase = anonClient();
      const { error } = await supabase.from("suppliers_public").select("id").limit(1);
      expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[rls-test] suppliers_public select error (non-42501):", error);
      }
    });

    it("categories — SELECT не возвращает 42501", async () => {
      const supabase = anonClient();
      const { error } = await supabase.from("categories").select("id,slug,name").limit(1);
      expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[rls-test] categories select error (non-42501):", error);
      }
    });
  });

  describe("Скрытие чувствительных колонок во view", () => {
    it("offers_public НЕ выдаёт price_min/max/currency/unit/supplier_id", async () => {
      const supabase = anonClient();
      const { data, error } = await supabase.from("offers_public").select("*").limit(1);
      expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
      if (!data || data.length === 0) return; // нечего проверять — view пуст
      const row = data[0] as Record<string, unknown>;
      for (const forbidden of [
        "price_min",
        "price_max",
        "price_currency",
        "price_unit",
        "supplier_id",
      ]) {
        expect(row, `offers_public must not expose ${forbidden}`).not.toHaveProperty(forbidden);
      }
    });

    it("suppliers_public НЕ выдаёт company_name/website/contact_*/owner_user_id", async () => {
      const supabase = anonClient();
      const { data, error } = await supabase.from("suppliers_public").select("*").limit(1);
      expect(error?.code).not.toBe(PG_INSUFFICIENT_PRIVILEGE);
      if (!data || data.length === 0) return;
      const row = data[0] as Record<string, unknown>;
      for (const forbidden of [
        "company_name",
        "website",
        "contact_email",
        "contact_phone",
        "owner_user_id",
      ]) {
        expect(row, `suppliers_public must not expose ${forbidden}`).not.toHaveProperty(forbidden);
      }
    });
  });

  describe("Защита от записи под anon", () => {
    it("INSERT в categories отклоняется RLS / привилегиями", async () => {
      const supabase = anonClient();
      const { data, error } = await supabase
        .from("categories")
        .insert({ slug: `rls-test-${Date.now()}`, name: "RLS test" })
        .select();
      // Должен быть либо явный error, либо пустой data (RLS вернул 0 строк).
      const denied = Boolean(error) || !data || data.length === 0;
      expect(denied).toBe(true);
    });
  });
});
