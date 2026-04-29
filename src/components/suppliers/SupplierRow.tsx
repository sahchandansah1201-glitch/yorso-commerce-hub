import { memo } from "react";
import {
  BadgeCheck,
  FileCheck2,
  FileClock,
  FileQuestion,
  Lock,
  Star,
  Activity,
  ChevronRight,
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
  if (level === "registered_locked") return "Request supplier details";
  return "View supplier profile";
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
  const isMasked = accessLevel !== "qualified_unlocked";
  const displayName = isMasked ? supplier.maskedName : supplier.companyName;
  const DocIcon = docsIcon(supplier.documentReadiness);
  const flag = countryCodeToFlag(supplier.countryCode);
  const previews = supplier.productPreviewImages.slice(0, 3);
  const primarySpecies = supplier.productFocus[0]?.species ?? "seafood";

  return (
    <li>
      <article
        data-testid="supplier-row"
        aria-label={`Supplier: ${displayName}`}
        className={cn(
          "group relative rounded-lg border bg-card p-4 text-left shadow-sm transition md:p-5",
          isSelected
            ? "border-primary/60 ring-1 ring-primary/30"
            : "border-border hover:border-foreground/20",
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
          {/* Country / type column */}
          <div className="flex shrink-0 items-start gap-3 md:w-44 md:flex-col md:items-start md:gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="text-xl leading-none"
                title={supplier.country}
              >
                {flag || "🌐"}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {supplier.country}
                </div>
                <div className="text-xs text-muted-foreground">{supplier.city}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:mt-1">
              <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80">
                {supplierTypeLabel[supplier.supplierType]}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {supplier.yearsInBusiness}+ yrs
              </span>
            </div>
          </div>

          {/* Identity + product focus — clickable area for selection */}
          <button
            type="button"
            onClick={() => onSelect(supplier.id)}
            aria-pressed={isSelected}
            aria-label={`Select ${displayName} to review details`}
            className="min-w-0 flex-1 cursor-pointer rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-heading text-[17px] font-semibold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere] md:text-lg md:[overflow-wrap:break-word]">
                  {displayName}
                </h3>
                {isMasked && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Lock className="h-3 w-3" aria-hidden />
                    Supplier identity restricted
                  </p>
                )}
              </div>
              {supplier.verificationLevel === "documents_reviewed" && (
                <span className="hidden shrink-0 items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary md:inline-flex">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Documents reviewed
                </span>
              )}
            </div>

            {previews.length > 0 && (
              <div className="mt-3 flex gap-1.5" aria-label="Product previews">
                {previews.map((src, i) => {
                  const species =
                    supplier.productFocus[i]?.species ?? primarySpecies;
                  return (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`${species} product preview from ${displayName}`}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-md border border-border object-cover md:h-16 md:w-16"
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {supplier.productFocus.slice(0, 3).map((p) => (
                <span
                  key={p.species}
                  className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground/85"
                  title={p.forms}
                >
                  {p.species}
                </span>
              ))}
              {supplier.productFocus.length > 3 && (
                <span className="rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                  +{supplier.productFocus.length - 3} more
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {supplier.certifications.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
                >
                  {c}
                </span>
              ))}
              {supplier.certifications.length > 4 && (
                <span className="text-[11px] text-muted-foreground">
                  +{supplier.certifications.length - 4}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <span className="font-semibold tabular-nums text-foreground">
                  {supplier.activeOffersCount}
                </span>
                active offers
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <DocIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
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
          </button>

          {/* Actions column */}
          <div className="flex shrink-0 flex-row items-center gap-2 md:w-48 md:flex-col md:items-stretch">
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
                  isShortlisted ? "fill-primary text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              {isShortlisted ? "Shortlisted" : "Shortlist"}
            </Button>
          </div>
        </div>
      </article>
    </li>
  );
};

export const SupplierRow = memo(SupplierRowImpl);
SupplierRow.displayName = "SupplierRow";
