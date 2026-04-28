/**
 * Нижний онбординг-блок «Получите больше от каталога» на странице /offers.
 * Является якорем `#catalog-anchor-recovery`, на который ссылается
 * TrustProofStrip. Видимостью управляет общий `CatalogRecoveryGate`
 * (см. `catalog-recovery-visibility.tsx`) — единый источник правды
 * для всех recovery-CTA каталога.
 *
 * Все testid берутся из `catalog-recovery-testids.ts` — единого
 * источника правды для unit и e2e тестов. Не хардкодьте строки testid
 * в тестах — импортируйте из этого модуля.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { CatalogRecoveryGate } from "./catalog-recovery-visibility";
import {
  CATALOG_RECOVERY_ANCHOR_ID,
  CATALOG_RECOVERY_TEST_IDS as TID,
} from "./catalog-recovery-testids";

export const CatalogRecoveryCard = () => {
  const { t } = useLanguage();
  return (
    <CatalogRecoveryGate>
      <div
        id={CATALOG_RECOVERY_ANCHOR_ID}
        data-testid={TID.card}
        className="mt-10 scroll-mt-20 rounded-lg border border-border bg-card p-6 text-center"
      >
        <h2
          data-testid={TID.title}
          className="font-heading text-lg font-bold text-foreground"
        >
          {t.catalog_recovery_title}
        </h2>
        <p data-testid={TID.body} className="mt-1 text-sm text-muted-foreground">
          {t.catalog_recovery_body}
        </p>
        <div
          data-testid={TID.ctaGroup}
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
        >
          <Link to="/register" data-testid={TID.ctaSignup}>
            <Button className="font-semibold">{t.catalog_recovery_signup}</Button>
          </Link>
          <Link to="/signin" data-testid={TID.ctaSignin}>
            <Button variant="outline" className="font-semibold">
              {t.catalog_recovery_signin}
            </Button>
          </Link>
        </div>
      </div>
    </CatalogRecoveryGate>
  );
};

export default CatalogRecoveryCard;
