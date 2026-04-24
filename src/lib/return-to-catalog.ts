/**
 * Контекст «возврата в каталог» при переходе buyer → /offers/:id.
 *
 * Цель UX:
 *   Покупатель в /offers (procurement workspace) пролистывает офферы,
 *   открывает один по «View details», просматривает детали — и хочет
 *   ОДНИМ кликом вернуться к ровно тому же месту списка с тем же
 *   выбранным оффером, не теряя позицию скролла и выделение.
 *
 * Дизайн:
 *   - Передаём контекст через `Link state` react-router. Не URL, потому что
 *     это эфемерное состояние сессии, не deep-linkable (никто не должен
 *     получать ссылку «вернись к моему скроллу 1247px»).
 *   - На странице деталей читаем state и показываем «← Назад в каталог».
 *   - Если state нет (прямой заход в /offers/:id, share-link, перезагрузка),
 *     deep-link на /offers и без скролл-восстановления — это honest fallback.
 *   - На странице /offers читаем `location.state.focusOfferId` и
 *     `scrollY`, восстанавливаем выбор + scroll один раз.
 */
import type { Location } from "react-router-dom";

export interface CatalogReturnState {
  /** Маркер: state принадлежит этой системе. */
  __catalogReturn: true;
  /** Полный путь возврата (обычно "/offers" + текущий search). */
  pathname: string;
  /** ID оффера, с которого ушли — чтобы выделить и проскроллить к нему. */
  offerId: string;
  /** Позиция вертикального скролла на момент перехода. */
  scrollY: number;
}

/**
 * Создаёт state для `<Link state={...} />` или `navigate(_, { state })`.
 * Снимает scrollY прямо в момент клика.
 */
export const buildCatalogReturnState = (offerId: string): CatalogReturnState => ({
  __catalogReturn: true,
  pathname: typeof window !== "undefined"
    ? `${window.location.pathname}${window.location.search}`
    : "/offers",
  offerId,
  scrollY: typeof window !== "undefined" ? window.scrollY : 0,
});

/**
 * Безопасно достаёт CatalogReturnState из location. Возвращает undefined,
 * если state отсутствует или не принадлежит системе (например, юзер пришёл
 * по deep-link или из другого места).
 */
export const readCatalogReturnState = (
  location: Pick<Location, "state">,
): CatalogReturnState | undefined => {
  const s = location.state as Partial<CatalogReturnState> | null | undefined;
  if (!s || s.__catalogReturn !== true || typeof s.pathname !== "string") {
    return undefined;
  }
  return {
    __catalogReturn: true,
    pathname: s.pathname,
    offerId: typeof s.offerId === "string" ? s.offerId : "",
    scrollY: typeof s.scrollY === "number" ? s.scrollY : 0,
  };
};
