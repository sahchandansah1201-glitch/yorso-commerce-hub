import { memo } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  FileCheck2,
  FileClock,
  FileQuestion,
  Lock,
  Star,
  Activity,
  ChevronRight,
  CalendarDays,
  Globe2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  countryCodeToFlag,
  type MockSupplier,
  type ResponseSignal,
  type DocumentReadiness,
} from "@/data/mockSuppliers";
import type { AccessLevel } from "@/lib/access-level";

interface SupplierRowProps {
  supplier: MockSupplier;
  isSelected: boolean;
  isShortlisted: boolean;
  accessLevel: AccessLevel;
  onSelect: (id: string) => void;
  onShortlist: (id: string) => void;
  onPrimaryAction: (supplier: MockSupplier) => void;
}

const responseLabel: Record<ResponseSignal, string> = {
  fast: "Replies within a day",
  normal: "Replies in 1–3 days",
  slow: "Slower replies",
};

const responseTone: Record<ResponseSignal, string> = {
  fast: "text-success",
  normal: "text-foreground/80",
  slow: "text-muted-foreground",
};

const docsLabel: Record<DocumentReadiness, string> = {
  ready: "Documents ready",
  partial: "Some documents on file",
  on_request: "Documents on request",
};

const docsIcon = (r: DocumentReadiness) =>
  r === "ready" ? FileCheck2 : r === "partial" ? FileClock : FileQuestion;

const supplierTypeLabel: Record<MockSupplier["supplierType"], string> = {
  producer: "Producer",
  processor: "Processor",
  exporter: "Exporter",
  distributor: "Distributor",
  trader: "Trader",
};

const primaryCtaCopy = (level: AccessLevel) => {
  if (level === "anonymous_locked") return "Create buyer account";
  if (level === "registered_locked") return "Request supplier access";
  return "Open supplier profile";
};

const SupplierRowImpl = ({
  supplier,
  isSelected,
  isShortlisted,
  accessLevel,
  onSelect,
  onShortlist,
  onPrimaryAction,
}: SupplierRowProps) => {
  const isUnlocked = accessLevel === "qualified_unlocked";
  const isMasked = !isUnlocked;
  const displayName = isMasked ? supplier.maskedName : supplier.companyName;
  const DocIcon = docsIcon(supplier.documentReadiness);
  const flag = countryCodeToFlag(supplier.countryCode);

  const catalogPreview = supplier.productCatalogPreview.slice(0, 3);
  const catalogRest = isUnlocked
    ? Math.max(0, supplier.totalProductsCount - catalogPreview.length)
    : 0;
  const showCatalogTeaser = !isUnlocked && supplier.totalProductsCount > catalogPreview.length;
  const previewDeliveries = supplier.deliveryCountries.slice(0, 3);
  const deliveryRest = isUnlocked
    ? Math.max(0, supplier.deliveryCountriesTotal - previewDeliveries.length)
    : 0;
  const showDeliveryTeaser =
    !isUnlocked && supplier.deliveryCountriesTotal > previewDeliveries.length;

  // Two-line about teaser; full about only at qualified_unlocked.
  const aboutTeaser = supplier.shortDescription;

  const titleId = `supplier-${supplier.id}-title`;
  const metaId = `supplier-${supplier.id}-meta`;
  const aboutId = `supplier-${supplier.id}-about`;
  const certsId = `supplier-${supplier.id}-certs`;

  return (
    <li>
      <article
        data-testid="supplier-row"
        aria-labelledby={titleId}
        aria-describedby={`${metaId} ${aboutId}${supplier.certificationBadges.length > 0 ? ` ${certsId}` : ""}`}
        className={cn(
          "group relative overflow-hidden rounded-lg border bg-card text-left shadow-sm transition",
          isSelected
            ? "border-primary/60 ring-1 ring-primary/30"
            : "border-border hover:border-foreground/20",
        )}
      >
        <div className="flex flex-col gap-0 md:flex-row">
          {/* Left: hero/media block */}
          <div className="relative w-full shrink-0 md:w-[180px]">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted md:aspect-auto md:h-full md:min-h-[220px]">
              <img
                src={supplier.heroImage}
                alt={`${supplier.productFocus[0]?.species ?? "Seafood"} reference image for ${displayName}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                <span aria-hidden className="text-sm leading-none">
                  {flag || "🌐"}
                </span>
                <span>{supplier.country}</span>
              </div>
              {supplier.verificationLevel === "documents_reviewed" && (
                <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded border border-primary/30 bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur-sm">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  Reviewed
                </div>
              )}
              {supplier.logoImage && (
                <div className="absolute right-2 bottom-2 h-9 w-9 overflow-hidden rounded-md border border-border bg-background shadow-sm">
                  <img
                    src={supplier.logoImage}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-contain p-0.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Center + right content */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:flex-row md:gap-5 md:p-5">
            {/* Identity / about — clickable selection area (div role=button so we can nest a real <Link> for the title) */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                // Don't hijack clicks on inner links/buttons.
                const target = e.target as HTMLElement;
                if (target.closest("a, button")) return;
                onSelect(supplier.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const target = e.target as HTMLElement;
                  if (target.closest("a, button")) return;
                  e.preventDefault();
                  onSelect(supplier.id);
                }
              }}
              aria-pressed={isSelected}
              aria-label={`Select ${displayName} to review details`}
              aria-describedby={`${metaId} ${aboutId}`}
              className="flex min-w-0 flex-1 cursor-pointer flex-col rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <h3
                id={titleId}
                className="font-heading text-[17px] font-semibold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere] md:text-lg md:[overflow-wrap:break-word]"
              >
                <Link
                  to={`/suppliers/${supplier.id}`}
                  data-testid="supplier-row-title-link"
                  className="hover:text-primary hover:underline focus:outline-none focus-visible:underline"
                  aria-label={`Open supplier profile: ${displayName}`}
                >
                  {displayName}
                </Link>
              </h3>
              {isMasked && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:mt-2">
                  <Lock className="h-3 w-3" aria-hidden />
                  Supplier identity restricted
                </p>
              )}

              <div
                id={metaId}
                aria-label="Supplier overview"
                className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:mt-2"
              >
                <span className="font-medium text-foreground/80">
                  {supplier.city}, {supplier.country}
                </span>
                <span aria-hidden>·</span>
                <span>{supplierTypeLabel[supplier.supplierType]}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  In business since {supplier.inBusinessSinceYear}
                </span>
              </div>

              <p
                id={aboutId}
                aria-label="About supplier"
                className="mt-2.5 line-clamp-2 min-h-[2.6rem] text-sm leading-relaxed text-foreground/85 md:mt-4"
                title={aboutTeaser}
              >
                {aboutTeaser}
              </p>

              {/* Certificate badge row */}
              {supplier.certificationBadges.length > 0 && (
                <ul
                  id={certsId}
                  className="mt-3 flex flex-wrap gap-1.5 md:mt-5"
                  aria-label={`Certifications (${supplier.certificationBadges.length})`}
                >
                  {supplier.certificationBadges.slice(0, 5).map((c) => (
                    <li
                      key={c.code}
                      className="inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
                      title={c.label}
                    >
                      {c.label}
                    </li>
                  ))}
                  {supplier.certificationBadges.length > 5 && (
                    <li
                      className="text-[11px] text-muted-foreground"
                      aria-label={`${supplier.certificationBadges.length - 5} more certifications`}
                    >
                      +{supplier.certificationBadges.length - 5}
                    </li>
                  )}
                </ul>
              )}

              {/* Bottom signals */}
              <div
                aria-label="Supplier signals"
                className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs md:pt-5"
              >
                <span className="inline-flex items-center gap-1 text-foreground/80">
                  <span className="font-semibold tabular-nums text-foreground">
                    {supplier.activeOffersCount}
                  </span>
                  active offers
                </span>
                <span className="inline-flex items-center gap-1 text-foreground/80">
                  <DocIcon
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  {docsLabel[supplier.documentReadiness]}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    responseTone[supplier.responseSignal],
                  )}
                >
                  <Activity className="h-3.5 w-3.5" aria-hidden />
                  {responseLabel[supplier.responseSignal]}
                </span>
              </div>
            </div>

            {/* Right-middle: catalog + delivery + actions */}
            <div className="flex shrink-0 flex-col gap-4 md:w-[260px]">
              {/* Product catalog preview strip */}
              {catalogPreview.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    aria-hidden
                  >
                    <Package className="h-3 w-3" />
                    Catalog
                  </div>
                  <div
                    className="mt-2 flex items-center gap-2"
                    aria-label="Product catalog preview"
                  >
                    {catalogPreview.map((item, i) => (
                      <img
                        key={`${item.image}-${i}`}
                        src={item.image}
                        alt={`${item.species} (${item.form}) product preview from ${displayName}`}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
                        title={item.name}
                      />
                    ))}
                    {catalogRest > 0 && (
                      <span className="inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 px-1.5 text-[11px] font-semibold text-foreground/80">
                        +{catalogRest} products
                      </span>
                    )}
                  </div>
                  {showCatalogTeaser && (
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                      Full catalog after supplier approval
                      <span className="sr-only"> — More products after access</span>
                    </p>
                  )}
                </div>
              )}

              {/* Delivery markets preview */}
              {previewDeliveries.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    aria-hidden
                  >
                    <Globe2 className="h-3 w-3" />
                    Delivers to
                  </div>
                  <div
                    className="mt-2 flex flex-wrap items-center gap-1.5 text-xs"
                    aria-label="Delivery markets preview"
                  >
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
                        +{deliveryRest} markets
                      </span>
                    )}
                  </div>
                  {showDeliveryTeaser && (
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                      More delivery markets after supplier approval
                      <span className="sr-only"> — More markets after access</span>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-1 flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={() => onPrimaryAction(supplier)}
                >
                  {primaryCtaCopy(accessLevel)}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onShortlist(supplier.id)}
                  aria-pressed={isShortlisted}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      isShortlisted
                        ? "fill-primary text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  {isShortlisted ? "Shortlisted" : "Shortlist"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
};

export const SupplierRow = memo(SupplierRowImpl);
SupplierRow.displayName = "SupplierRow";
