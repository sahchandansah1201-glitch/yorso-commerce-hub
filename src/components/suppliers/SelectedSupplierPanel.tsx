import { Link } from "react-router-dom";
import {
  BadgeCheck,
  FileCheck2,
  FileClock,
  FileQuestion,
  Lock,
  ShieldCheck,
  Activity,
  Building2,
  CalendarDays,
  Globe2,
  Package,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  countryCodeToFlag,
  type MockSupplier,
  type DocumentReadiness,
} from "@/data/mockSuppliers";
import type { AccessLevel } from "@/lib/access-level";
import { useLanguage } from "@/i18n/LanguageContext";
import type { translations } from "@/i18n/translations";

type Dict = (typeof translations)["en"];

interface SelectedSupplierPanelProps {
  supplier: MockSupplier | null;
  accessLevel: AccessLevel;
  isShortlisted: boolean;
  onShortlist: (id: string) => void;
  onPrimaryAction: (supplier: MockSupplier) => void;
}

const docsLabel = (t: Dict, r: DocumentReadiness) =>
  r === "ready" ? t.supplierRow_docsReady : r === "partial" ? t.supplierRow_docsPartial : t.supplierRow_docsOnRequest;

const docsIcon = (r: DocumentReadiness) =>
  r === "ready" ? FileCheck2 : r === "partial" ? FileClock : FileQuestion;

const accessExplainer = (t: Dict, level: AccessLevel) => {
  if (level === "anonymous_locked") return t.selectedSupplier_accessAnonExplainer;
  if (level === "registered_locked") return t.selectedSupplier_accessRegisteredExplainer;
  return t.selectedSupplier_accessUnlockedExplainer;
};

const primaryCtaCopy = (t: Dict, level: AccessLevel) => {
  if (level === "anonymous_locked") return t.supplierRow_ctaCreateAccount;
  if (level === "registered_locked") return t.supplierRow_ctaRequestAccess;
  return t.supplierRow_ctaOpenProfile;
};

const supplierTypeLabel = (t: Dict, type: MockSupplier["supplierType"]) => {
  switch (type) {
    case "producer": return t.supplier_type_producer;
    case "processor": return t.supplier_type_processor;
    case "exporter": return t.supplier_type_exporter;
    case "distributor": return t.supplier_type_distributor;
    case "trader": return t.supplier_type_trader;
  }
};

const interpolate = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

const EmptyState = () => {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Building2 className="h-4 w-4" aria-hidden />
      </div>
      <p className="text-foreground">{t.selectedSupplier_emptyTitle}</p>
      <p className="mt-1.5 text-xs leading-relaxed">{t.selectedSupplier_emptyBody}</p>
    </div>
  );
};

export const SelectedSupplierPanel = ({
  supplier,
  accessLevel,
  isShortlisted,
  onShortlist,
  onPrimaryAction,
}: SelectedSupplierPanelProps) => {
  const { t } = useLanguage();
  if (!supplier) return <EmptyState />;

  const isUnlocked = accessLevel === "qualified_unlocked";
  const isMasked = !isUnlocked;
  const displayName = isMasked ? supplier.maskedName : supplier.companyName;
  const DocIcon = docsIcon(supplier.documentReadiness);
  const flag = countryCodeToFlag(supplier.countryCode);

  const previewDeliveries = supplier.deliveryCountries.slice(0, 6);
  const deliveryRest = isUnlocked
    ? Math.max(0, supplier.deliveryCountriesTotal - previewDeliveries.length)
    : 0;
  const showDeliveryTeaser =
    !isUnlocked && supplier.deliveryCountriesTotal > previewDeliveries.length;

  // Catalog preview shown to all levels — items per level differ.
  const catalogVisible = isUnlocked
    ? supplier.productCatalogPreview
    : supplier.productCatalogPreview.slice(0, 3);
  const catalogHidden = Math.max(
    0,
    supplier.totalProductsCount - catalogVisible.length,
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {/* Hero strip */}
      <div className="relative h-32 w-full overflow-hidden bg-muted">
        <img
          src={supplier.heroImage}
          alt={`${supplier.productFocus[0]?.species ?? "Seafood"} reference image for ${displayName}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
          <span aria-hidden className="text-sm leading-none">
            {flag || "🌐"}
          </span>
          <span>
            {supplier.country} · {supplier.city}
          </span>
        </div>
        {supplier.verificationLevel === "documents_reviewed" && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded border border-primary/30 bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur-sm">
            <BadgeCheck className="h-3 w-3" aria-hidden />
            {t.supplierRow_reviewed}
          </div>
        )}
      </div>

      <div className="p-5">
        <p
          data-testid="selected-supplier-preview-label"
          className="mb-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          {t.selectedSupplier_quickPreview}
        </p>
        <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere]">
          <Link
            to={`/suppliers/${supplier.id}`}
            data-testid="selected-supplier-title-link"
            className="hover:text-primary hover:underline"
            aria-label={interpolate(t.supplierRow_openProfileAria, { name: displayName })}
          >
            {displayName}
          </Link>
        </h2>
        {isMasked && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden />
            {t.supplierRow_identityRestricted}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{supplierTypeLabel(t, supplier.supplierType)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {interpolate(t.supplierRow_inBusinessSince, { year: supplier.inBusinessSinceYear })}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {isUnlocked ? supplier.about : supplier.shortDescription}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {t.selectedSupplier_activeOffers}
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {isUnlocked ? supplier.activeOffersCount : t.selectedSupplier_activeOffersHidden}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {isUnlocked ? t.selectedSupplier_catalogSize : t.selectedSupplier_catalogPreview}
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {isUnlocked
                ? interpolate(t.selectedSupplier_productsValue, { n: supplier.totalProductsCount })
                : t.selectedSupplier_previewOnly}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {isUnlocked ? t.selectedSupplier_markets : t.selectedSupplier_deliveryPreview}
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {isUnlocked
                ? interpolate(t.selectedSupplier_countriesValue, { n: supplier.deliveryCountriesTotal })
                : t.selectedSupplier_previewOnly}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {t.selectedSupplier_activityLabel}
            </dt>
            <dd className="mt-1 inline-flex items-center gap-1 font-medium text-foreground">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <span>
                {supplier.responseSignal === "fast"
                  ? t.supplierRow_replyFast
                  : supplier.responseSignal === "normal"
                  ? t.supplierRow_replyNormal
                  : t.supplierRow_replySlow}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t.selectedSupplier_trustEvidence}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {supplier.certificationBadges.map((c) => (
              <span
                key={c.code}
                className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
                title={c.label}
              >
                {c.label}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <DocIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-foreground/85">
              {docsLabel(t, supplier.documentReadiness)}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
            <Globe2 className="h-3 w-3" aria-hidden />
            {t.selectedSupplier_deliveryMarkets}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {previewDeliveries.map((d) => (
              <span
                key={d.code}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-foreground/85"
                title={d.name}
              >
                <span aria-hidden className="text-sm leading-none">
                  {countryCodeToFlag(d.code) || "🌐"}
                </span>
                <span>{d.name}</span>
              </span>
            ))}
            {deliveryRest > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {interpolate(t.supplierRow_marketsCount, { n: deliveryRest })}
              </span>
            )}
            {showDeliveryTeaser && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {t.selectedSupplier_fullDeliveryTeaser}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
            <Package className="h-3 w-3" aria-hidden />
            {t.selectedSupplier_productCatalogPreview}
          </p>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {catalogVisible.map((item, i) => (
              <li
                key={`${item.image}-${i}`}
                className="overflow-hidden rounded-md border border-border bg-background"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={`${item.species} (${item.form}) product preview from ${displayName}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-1.5">
                  <p className="truncate text-[11px] font-medium text-foreground" title={item.name}>
                    {item.name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {isUnlocked ? (
            catalogHidden > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {interpolate(t.selectedSupplier_moreProductsInProfile, { n: catalogHidden })}
              </p>
            )
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t.selectedSupplier_fullCatalogTeaser}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-md border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t.selectedSupplier_accessLabel}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {accessExplainer(t, accessLevel)}
          </p>

          {isUnlocked && (supplier.website || supplier.whatsapp) && (
            <div
              className="mt-3 flex flex-wrap gap-2"
              aria-label={t.selectedSupplier_contactChannelsAria}
            >
              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:border-foreground/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {t.selectedSupplier_website}
                </a>
              )}
              {supplier.whatsapp && (
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:border-foreground/30"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  {t.selectedSupplier_whatsapp}
                </a>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2">
            {accessLevel === "anonymous_locked" ? (
              <Button asChild type="button" className="w-full gap-2">
                <Link to="/register">{primaryCtaCopy(t, accessLevel)}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => onPrimaryAction(supplier)}
              >
                {primaryCtaCopy(t, accessLevel)}
              </Button>
            )}
            <Button asChild variant="outline" className="w-full gap-2">
              <Link
                to={`/suppliers/${supplier.id}`}
                data-testid="selected-supplier-open-profile"
                aria-label={interpolate(t.supplierRow_openProfileAria, { name: displayName })}
              >
                {t.selectedSupplier_openFullProfile}
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2"
              onClick={() => onShortlist(supplier.id)}
              aria-pressed={isShortlisted}
            >
              <BadgeCheck
                className={cn(
                  "h-4 w-4",
                  isShortlisted ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              {isShortlisted ? t.supplierRow_shortlisted : t.selectedSupplier_shortlistSupplier}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
