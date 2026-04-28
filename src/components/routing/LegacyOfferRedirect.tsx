/**
 * LegacyOfferRedirect — роут-уровневый редирект для старых числовых id оффера.
 *
 * Если в URL пришёл `/offers/1` (или другой `\d{1,12}`), отдаём `<Navigate>`
 * на `/offers/<uuid>` с сохранением search/hash/state. Если id не legacy —
 * рендерим переданный children-компонент (обычно `<OfferDetail />`).
 *
 * Зачем на уровне App.tsx, а не только внутри OfferDetail:
 *   • Любой будущий роут вида `/offers/:id/*` (например, `/offers/:id/specs`)
 *     получит редирект автоматически.
 *   • Дедуплицирует логику: единый источник правды legacy → uuid.
 *   • Не зависит от того, успел ли OfferDetail смонтироваться и отработать
 *     useEffect — `Navigate` срабатывает сразу при матче роута.
 */

import { type ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { isLegacyOfferId, legacyOfferIdToUuid } from "@/lib/legacy-offer-id";

interface LegacyOfferRedirectProps {
  children: ReactNode;
}

const LegacyOfferRedirect = ({ children }: LegacyOfferRedirectProps) => {
  const { id } = useParams();
  const location = useLocation();

  if (isLegacyOfferId(id)) {
    // Сохраняем «хвост» пути после :id, если он есть (на будущее — вложенные
    // подстраницы оффера). Сейчас pathname === `/offers/${id}`, но если
    // появится `/offers/:id/specs`, location.pathname будет содержать его.
    const tail = location.pathname.replace(/^\/offers\/\d{1,12}/, "");
    return (
      <Navigate
        to={{
          pathname: `/offers/${legacyOfferIdToUuid(id)}${tail}`,
          search: location.search,
          hash: location.hash,
        }}
        state={location.state}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default LegacyOfferRedirect;
