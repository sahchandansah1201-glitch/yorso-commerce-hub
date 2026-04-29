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
    return "Create a buyer account to request access to supplier identity, documents, and contact channel.";
  }
  if (level === "registered_locked") {
    return "Send an access request — supplier reviews your buyer profile before sharing identity and documents.";
  }
  return "Access granted. You can review the full supplier profile and reach out directly.";
};

const primaryCtaCopy = (level: AccessLevel) => {
  if (level === "anonymous_locked") return "Create buyer account";
  if (level === "registered_locked") return "Request supplier details";
  return "View supplier profile";
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

  const isMasked = accessLevel !== "qualified_unlocked";
  const displayName = isMasked ? supplier.maskedName : supplier.companyName;
  const DocIcon = docsIcon(supplier.documentReadiness);
  const flag = countryCodeToFlag(supplier.countryCode);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="text-base leading-none">
              {flag || "🌐"}
            </span>
            <span>
              {supplier.country} · {supplier.city}
            </span>
          </div>
          <h2 className="mt-1.5 font-heading text-lg font-semibold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere]">
            {displayName}
          </h2>
          {isMasked && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              Supplier identity restricted
            </p>
          )}
        </div>
        {supplier.verificationLevel === "documents_reviewed" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Reviewed
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {supplier.shortDescription}
      </p>

      {supplier.productPreviewImages.length > 0 && (
        <div className="mt-3 flex gap-1.5" aria-label="Product previews">
          {supplier.productPreviewImages.slice(0, 3).map((src, i) => {
            const species =
              supplier.productFocus[i]?.species ??
              supplier.productFocus[0]?.species ??
              "seafood";
            return (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`${species} product preview from ${displayName}`}
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
              />
            );
          })}
        </div>
      )}

      {/* Stats grid */}
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Type
          </dt>
          <dd className="mt-1 font-medium capitalize text-foreground">
            {supplier.supplierType}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            In business
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {supplier.yearsInBusiness}+ years
          </dd>
        </div>
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
            Activity
          </dt>
          <dd className="mt-1 inline-flex items-center gap-1 font-medium text-foreground">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="capitalize">{supplier.responseSignal}</span>
          </dd>
        </div>
      </dl>

      {/* Product focus */}
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Product focus
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {supplier.productFocus.map((p) => (
            <li key={p.species} className="flex flex-col">
              <span className="font-medium text-foreground">{p.species}</span>
              <span className="text-xs text-muted-foreground">{p.forms}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Certifications */}
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Certifications
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {supplier.certifications.map((c) => (
            <span
              key={c}
              className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Document readiness */}
      <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
        <DocIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-foreground/85">
          {docsLabel[supplier.documentReadiness]}
        </span>
      </div>

      {/* Access block */}
      <div className="mt-4 rounded-md border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Access
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          {accessExplainer(accessLevel)}
        </p>
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
  );
};
