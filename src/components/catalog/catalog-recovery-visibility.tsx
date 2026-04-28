/**
 * Единый источник правды для видимости блоков
 * «Получите больше от каталога» (CatalogValueStrip + нижний
 * `#catalog-anchor-recovery`-блок на /offers).
 *
 * Контракт:
 *   Любой онбординг-нудж этой группы показывается ТОЛЬКО
 *   незарегистрированным посетителям (`anonymous_locked` без buyer-сессии).
 *   Любой авторизованный пользователь — `registered_locked`,
 *   `qualified_unlocked` или просто наличие buyer-сессии — этих блоков
 *   видеть не должен. Правило применяется одинаково на desktop и mobile.
 *
 * Чтобы добавить новый recovery-блок:
 *   1) Оборачивайте его в `<CatalogRecoveryGate>...</CatalogRecoveryGate>`,
 *      либо проверяйте `useCatalogRecoveryVisible()` перед рендером.
 *   2) Не дублируйте локальные `if (isSignedIn) return null` — это ломает
 *      инвариант «один источник правды».
 */
import type { ReactNode } from "react";
import { useAccessLevel } from "@/lib/access-level";

/**
 * Возвращает `true`, если recovery-блоки каталога должны быть видимы
 * текущему посетителю. Используйте этот хук в любом компоненте,
 * который показывает CTA «зарегистрируйтесь / войдите, чтобы получить
 * больше от каталога».
 */
export const useCatalogRecoveryVisible = (): boolean => {
  const { level, isSignedIn } = useAccessLevel();
  if (isSignedIn) return false;
  return level === "anonymous_locked";
};

interface CatalogRecoveryGateProps {
  children: ReactNode;
  /**
   * Опциональный fallback-рендер для случая, когда блок скрыт.
   * По умолчанию возвращает `null`.
   */
  fallback?: ReactNode;
}

/**
 * Декларативная обёртка вокруг `useCatalogRecoveryVisible`.
 *
 * ```tsx
 * <CatalogRecoveryGate>
 *   <CatalogRecoveryCard />
 * </CatalogRecoveryGate>
 * ```
 */
export const CatalogRecoveryGate = ({
  children,
  fallback = null,
}: CatalogRecoveryGateProps) => {
  const visible = useCatalogRecoveryVisible();
  return <>{visible ? children : fallback}</>;
};

export default CatalogRecoveryGate;
