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

interface SelectedSupplierPanelProps {
  supplier: MockSupplier | null;
  accessLevel: AccessLevel;
  isShortlisted: boolean;
  onShortlist: (id: string) => void;
  onPrimaryAction: (supplier: MockSupplier) => void;
}

const docsLabel: Record<DocumentReadiness, string> = {
  ready: "Documents ready for review",
  partial: "Some documents on file, rest on request",
  on_request: "Documents available on request",
};

const docsIcon = (r: DocumentReadiness) =>
  r === "ready" ? FileCheck2 : r === "partial" ? FileClock : FileQuestion;

const accessExplainer = (level: AccessLevel) => {
  if (level === "anonymous_locked") {
    return "Create a buyer account to request access to supplier identity, documents, contact channel, and the full product catalog.";
  }
  if (level === "registered_locked") {
    return "Send an access request — the supplier reviews your buyer profile before sharing identity, contact channel, and full catalog.";
  }
  return "Access granted. You can review the full supplier profile, contact channels, and full product catalog.";
};

const primaryCtaCopy = (level: AccessLevel) => {
  if (level === "anonymous_locked") return "Create buyer account";
  if (level === "registered_locked") return "Request supplier access";
  return "Open supplier profile";
};

const EmptyState = () => (
  <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Building2 className="h-4 w-4" aria-hidden />
    </div>
    <p className="text-foreground">Select a supplier to review details</p>
    <p className="mt-1.5 text-xs leading-relaxed">
      Select a supplier to review product focus, trust evidence, and access options.
    </p>
  </div>
);

export const SelectedSupplierPanel = ({
  supplier,
  accessLevel,
  isShortlisted,
  onShortlist,
  onPrimaryAction,
}: SelectedSupplierPanelProps) => {
  if (!supplier) return <EmptyState />;

  const isUnlocked = accessLevel === "qualified_unlocked";
  const isMasked = !isUnlocked;
  const displayName = isMasked ? supplier.maskedName : supplier.companyName;
  const DocIcon = docsIcon(supplier.documentReadiness);
  const flag = countryCodeToFlag(supplier.countryCode);

  const previewDeliveries = supplier.deliveryCountries.slice(0, 6);
  const deliveryRest = Math.max(
    0,
    supplier.deliveryCountriesTotal - previewDeliveries.length,
  );

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
            Reviewed
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Supplier summary */}
        <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere]">
          {displayName}
        </h2>
        {isMasked && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden />
            Supplier identity restricted
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="capitalize">{supplier.supplierType}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden />
            In business since {supplier.inBusinessSinceYear}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          {isUnlocked ? supplier.about : supplier.shortDescription}
        </p>

        {/* Stats grid */}
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Active offers
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {supplier.activeOffersCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {isUnlocked ? "Catalog size" : "Catalog preview"}
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {isUnlocked
                ? `${supplier.totalProductsCount} products`
                : "Preview only"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Markets
            </dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {supplier.deliveryCountriesTotal} countries
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Activity
            </dt>
            <dd className="mt-1 inline-flex items-center gap-1 font-medium text-foreground">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <span className="capitalize">{supplier.responseSignal}</span>
            </dd>
          </div>
        </dl>

        {/* Trust evidence */}
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Trust evidence
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
            <DocIcon
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="text-foreground/85">
              {docsLabel[supplier.documentReadiness]}
            </span>
          </div>
        </div>

        {/* Delivery markets */}
        <div className="mt-4">
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
            <Globe2 className="h-3 w-3" aria-hidden />
            Delivery markets
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
                +{deliveryRest} markets
              </span>
            )}
          </div>
        </div>

        {/* Product catalog preview */}
        <div className="mt-4">
          <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
            <Package className="h-3 w-3" aria-hidden />
            Product catalog preview
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
                  <p
                    className="truncate text-[11px] font-medium text-foreground"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {isUnlocked ? (
            catalogHidden > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                +{catalogHidden} more products in supplier profile
              </p>
            )
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Full catalog available after supplier approval
            </p>
          )}
        </div>

        {/* Access / next action */}
        <div className="mt-5 rounded-md border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Access
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {accessExplainer(accessLevel)}
          </p>

          {/* Contact channels — qualified_unlocked only */}
          {isUnlocked && (supplier.website || supplier.whatsapp) && (
            <div
              className="mt-3 flex flex-wrap gap-2"
              aria-label="Supplier contact channels"
            >
              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:border-foreground/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Website
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
                  WhatsApp
                </a>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2">
            {accessLevel === "anonymous_locked" ? (
              <Link to="/register" className="block">
                <Button type="button" className="w-full gap-2">
                  {primaryCtaCopy(accessLevel)}
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => onPrimaryAction(supplier)}
              >
                {primaryCtaCopy(accessLevel)}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
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
              {isShortlisted ? "Shortlisted" : "Shortlist supplier"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
