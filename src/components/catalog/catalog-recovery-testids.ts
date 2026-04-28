/**
 * Стабильные `data-testid` селекторы recovery-блока «Получите больше от каталога».
 *
 * Зачем:
 *   - e2e и unit-тесты должны привязываться к тестовым атрибутам, а не
 *     к классам Tailwind, тегам или текстам перевода;
 *   - один источник правды защищает от рассинхрона между компонентом и
 *     тестами — переименование testid в одном месте сразу ломает
 *     зависимый код, а не молча проходит мимо;
 *   - якорь `#catalog-anchor-recovery` тоже зафиксирован здесь — на него
 *     ссылается TrustProofStrip; менять только согласованно.
 */
export const CATALOG_RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";

export const CATALOG_RECOVERY_TEST_IDS = {
  /** Корневой контейнер блока (он же якорь #catalog-anchor-recovery). */
  card: "catalog-recovery-card",
  /** Заголовок (h2) с текстом catalog_recovery_title. */
  title: "catalog-recovery-title",
  /** Описание (p) с текстом catalog_recovery_body. */
  body: "catalog-recovery-body",
  /** Группа CTA — обе кнопки. */
  ctaGroup: "catalog-recovery-cta-group",
  /** Основная CTA: «Открыть кабинет покупателя» → /register. */
  ctaSignup: "catalog-recovery-cta-signup",
  /** Вторичная CTA: «Войти, чтобы продолжить» → /signin. */
  ctaSignin: "catalog-recovery-cta-signin",
} as const;

export type CatalogRecoveryTestId =
  (typeof CATALOG_RECOVERY_TEST_IDS)[keyof typeof CATALOG_RECOVERY_TEST_IDS];
