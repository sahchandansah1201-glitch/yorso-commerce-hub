/**
 * Нижний онбординг-блок «Получите больше от каталога» на странице /offers.
 * Является якорем `#catalog-anchor-recovery`, на который ссылается
 * TrustProofStrip. Видимостью управляет общий `CatalogRecoveryGate`
 * (см. `catalog-recovery-visibility.tsx`) — единый источник правды
 * для всех recovery-CTA каталога.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { CatalogRecoveryGate } from "./catalog-recovery-visibility";

export const CatalogRecoveryCard = () => {
  const { t } = useLanguage();
  return (
    <CatalogRecoveryGate>
      <div
        id="catalog-anchor-recovery"
        data-testid="catalog-recovery-card"
        className="mt-10 scroll-mt-20 rounded-lg border border-border bg-card p-6 text-center"
      >
        <h2 className="font-heading text-lg font-bold text-foreground">
          {t.catalog_recovery_title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.catalog_recovery_body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link to="/register">
            <Button className="font-semibold">{t.catalog_recovery_signup}</Button>
          </Link>
          <Link to="/signin">
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
