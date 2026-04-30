/**
 * SupplierProfile — clean-sheet B2B trading dossier for /suppliers/:supplierId.
 *
 * This page is intentionally NOT a stack of cards. Above the fold it presents
 * one integrated trading dossier (media + identity + access action + evidence
 * strip). Below the dossier sit compact procurement-style sections.
 *
 * Access model (3 levels):
 *   anonymous_locked   — masked identity, no contacts, CTA = create buyer account
 *   registered_locked  — masked identity, request price access (status if sent)
 *   qualified_unlocked — real company name, contact channels, exact details
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  ChevronRight,
  Lock,
  Activity,
  FileCheck2,
  FileClock,
  FileQuestion,
  Globe2,
  MessageCircle,
  ExternalLink,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Truck,
  ClipboardList,
  Boxes,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  countryCodeToFlag,
  mockSuppliers,
  type MockSupplier,
} from "@/data/mockSuppliers";
import { useAccessLevel } from "@/lib/access-level";
import {
  createSupplierAccessRequest,
  getSupplierAccessRequest,
  type SupplierAccessRequest,
  type SupplierAccessStatus,
} from "@/lib/supplier-access-requests";

/* ---------------- helpers ---------------- */

const supplierTypeLabel: Record<MockSupplier["supplierType"], string> = {
  producer: "Producer",
  processor: "Processor",
  exporter: "Exporter",
  distributor: "Distributor",
  trader: "Trader",
};

const responseLabel = {
  fast: "Replies within a day",
  normal: "Replies in 1 to 3 days",
  slow: "Slower replies",
} as const;

const docsLabel = {
  ready: "Documents ready",
  partial: "Some documents on file",
  on_request: "Documents on request",
} as const;

const docsIconFor = (r: MockSupplier["documentReadiness"]) =>
  r === "ready" ? FileCheck2 : r === "partial" ? FileClock : FileQuestion;

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
};

/* ---------------- per-page mock fallback (commercial fit etc.) ---------------- */

interface CommercialFit {
  typicalMoq: string;
  tradeTerms: string;
  leadTime: string;
  paymentTerms: string;
  shipmentPorts: string;
  bestFit: string;
}

const commercialFitFor = (s: MockSupplier): CommercialFit => ({
  typicalMoq: s.supplierType === "producer" ? "1 x 20 ft reefer" : "5 to 10 t",
  tradeTerms: "FOB, CFR, CIF",
  leadTime: s.responseSignal === "fast" ? "10 to 14 days" : "14 to 21 days",
  paymentTerms: "30 percent advance, balance against B/L copy",
  shipmentPorts: `${s.city}, ${s.country}`,
  bestFit:
    s.supplierType === "producer"
      ? "Importers and HoReCa distributors with year-round programs"
      : "Importers running private label and retail programs",
});

interface DocStatus {
  label: string;
  available: boolean;
}

const documentChecklistFor = (s: MockSupplier): DocStatus[] => {
  const ready = s.documentReadiness === "ready";
  const partial = s.documentReadiness === "partial";
  return [
    { label: "Health certificate", available: true },
    { label: "HACCP / food safety", available: true },
    { label: "Catch / IUU declaration", available: ready || partial },
    { label: "Sustainability certificate", available: ready },
    { label: "Packing list", available: true },
    { label: "Traceability data", available: ready },
  ];
};

/* ---------------- access panel ---------------- */

const STATUS_LABEL: Record<SupplierAccessStatus, string> = {
  sent: "Request sent",
  pending: "Supplier review pending",
  approved: "Price access approved",
};

const STATUS_TONE: Record<SupplierAccessStatus, string> = {
  sent: "border-border bg-muted/40 text-foreground",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

interface AccessPanelProps {
  supplier: MockSupplier;
  level: ReturnType<typeof useAccessLevel>["level"];
  request: SupplierAccessRequest | null;
  onSent: (req: SupplierAccessRequest) => void;
}

const AccessPanel = ({ supplier, level, request, onSent }: AccessPanelProps) => {
  const handleRequest = () => {
    const saved = createSupplierAccessRequest(supplier.id);
    toast({
      title: "Access request sent",
      description: "Supplier review is pending.",
    });
    onSent(saved);
  };

  return (
    <div
      data-testid="supplier-profile-access-panel"
      className="flex h-full flex-col gap-3 rounded-md border border-border bg-muted/30 p-4"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Buyer access
        </p>
        <h2 className="mt-1 font-heading text-base font-semibold leading-tight text-foreground">
          {level === "qualified_unlocked"
            ? "Supplier contact available"
            : level === "registered_locked"
              ? "Request price access"
              : "Create buyer account"}
        </h2>
      </div>

      {level === "anonymous_locked" && (
        <>
          <p className="text-xs leading-relaxed text-foreground/80">
            Create a buyer account to request supplier identity, exact prices,
            documents, and contacts.
          </p>
          <Button asChild className="w-full gap-2">
            <Link to="/register">
              Create buyer account
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <ul className="mt-1 space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden /> Supplier name hidden until access
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden /> Exact prices unlock with access
            </li>
          </ul>
        </>
      )}

      {level === "registered_locked" && (
        <>
          {request ? (
            <div
              role="status"
              aria-live="polite"
              data-testid="supplier-access-request-status"
              data-status={request.status}
              className={cn("rounded-md border p-3", STATUS_TONE[request.status])}
            >
              <div className="flex items-start gap-2">
                {request.status === "approved" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden />
                ) : request.status === "pending" ? (
                  <Loader2 className="mt-0.5 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Clock className="mt-0.5 h-4 w-4" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {STATUS_LABEL[request.status]}
                  </p>
                  <p className="mt-1 text-[11px] opacity-90">
                    Supplier:{" "}
                    <span className="font-medium">{supplier.maskedName}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-foreground/80">
                The supplier reviews your buyer profile before sharing exact
                prices, contact channel, and full catalog.
              </p>
              <Button
                type="button"
                onClick={handleRequest}
                className="w-full gap-2"
                data-testid="supplier-request-price-access"
              >
                <Send className="h-4 w-4" aria-hidden />
                Request price access
              </Button>
            </>
          )}
          <ul className="mt-auto space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden /> Supplier identity restricted
            </li>
          </ul>
        </>
      )}

      {level === "qualified_unlocked" && (
        <>
          <p className="text-xs leading-relaxed text-foreground/80">
            You can contact this supplier directly. Please reference YORSO in
            your first message.
          </p>
          <div className="space-y-2">
            {supplier.website && (
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="supplier-contact-website"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Visit website
                </a>
              </Button>
            )}
            {supplier.whatsapp && (
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="supplier-contact-whatsapp"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp {supplier.whatsapp}
                </a>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------- compact section primitive ---------------- */

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
    {children}
  </h2>
);

const FactRow = ({
  label,
  value,
  locked,
}: {
  label: string;
  value: string;
  locked?: boolean;
}) => (
  <div className="grid grid-cols-[160px_1fr] items-baseline gap-3 border-b border-border/60 py-2 last:border-b-0 md:grid-cols-[200px_1fr]">
    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd
      className={cn(
        "text-sm",
        locked ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {locked ? (
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3" aria-hidden />
          {value}
        </span>
      ) : (
        value
      )}
    </dd>
  </div>
);

/* ---------------- page ---------------- */

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const { level } = useAccessLevel();
  const supplier = useMemo(
    () => mockSuppliers.find((s) => s.id === supplierId),
    [supplierId],
  );

  const [request, setRequest] = useState<SupplierAccessRequest | null>(() =>
    supplierId ? getSupplierAccessRequest(supplierId) : null,
  );

  useEffect(() => {
    setRequest(supplierId ? getSupplierAccessRequest(supplierId) : null);
  }, [supplierId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.title;
    const name =
      supplier && level === "qualified_unlocked"
        ? supplier.companyName
        : supplier
          ? supplier.maskedName
          : "Supplier";
    document.title = `${name} · Supplier · YORSO`;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content:
        "Seafood supplier profile on YORSO. Review trust evidence, certifications, commercial terms, and request supplier access.",
    });
    return () => {
      document.title = prev;
    };
  }, [supplier, level]);

  if (!supplier) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-body">
        <Header />
        <main className="container flex-1 py-16">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Supplier not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The supplier you are looking for is not available.{" "}
            <Link to="/suppliers" className="text-primary hover:underline">
              Back to suppliers
            </Link>
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const isUnlocked = level === "qualified_unlocked";
  const displayName = isUnlocked ? supplier.companyName : supplier.maskedName;
  const flag = countryCodeToFlag(supplier.countryCode);
  const DocIcon = docsIconFor(supplier.documentReadiness);
  const fit = commercialFitFor(supplier);
  const docs = documentChecklistFor(supplier);

  const productFocusSummary = supplier.productFocus
    .map((p) => p.species)
    .slice(0, 3)
    .join(", ");

  const thumbs = supplier.productCatalogPreview.slice(0, 3);
  const catalog = supplier.productCatalogPreview.slice(0, 3);
  const similar = mockSuppliers
    .filter(
      (s) =>
        s.id !== supplier.id &&
        s.productFocus.some((p) =>
          supplier.productFocus.some((q) =>
            p.species.toLowerCase().includes(q.species.toLowerCase().split(" ")[0]),
          ),
        ),
    )
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background font-body">
      <Header />
      <main id="main" className="flex-1">
        {/* Breadcrumbs */}
        <div className="border-b border-border bg-background">
          <div className="container py-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <Link to="/suppliers" className="hover:text-foreground">
                Suppliers
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">{displayName}</span>
            </nav>
          </div>
        </div>

        <div
          data-testid="supplier-profile-main-content"
          className="container space-y-8 py-6 md:py-8"
        >
          {/* AREA 2 + 3: Trading dossier */}
          <section
            data-testid="supplier-trading-dossier"
            aria-label="Supplier trading dossier"
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)_320px]">
              {/* Left: media */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
                  <img
                    src={supplier.heroImage}
                    alt={`${supplier.productFocus[0]?.species ?? "Seafood"} reference for ${displayName}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
                    <span aria-hidden className="text-sm leading-none">
                      {flag || "🌐"}
                    </span>
                    <span>
                      {supplier.city}, {supplier.country}
                    </span>
                  </div>
                  {supplier.verificationLevel === "documents_reviewed" && (
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded border border-primary/30 bg-background/95 px-2 py-0.5 text-[11px] font-semibold text-primary shadow-sm backdrop-blur-sm">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      Documents reviewed
                    </div>
                  )}
                </div>
                {thumbs.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {thumbs.map((t, i) => (
                      <div
                        key={`${t.image}-${i}`}
                        className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
                      >
                        <img
                          src={t.image}
                          alt={`${t.species} (${t.form}) sample from ${displayName}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Center: identity */}
              <div className="flex min-w-0 flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {supplierTypeLabel[supplier.supplierType]} · since{" "}
                  {supplier.inBusinessSinceYear} · {productFocusSummary}
                </p>
                <h1 className="mt-1.5 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground md:text-[30px]">
                  {displayName}
                </h1>
                {!isUnlocked && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Lock className="h-3 w-3" aria-hidden />
                    Supplier identity restricted
                  </p>
                )}
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/85">
                  {supplier.shortDescription}
                </p>

                {/* Trust row */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-foreground/85">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Documents reviewed
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-foreground/85">
                    <Activity className="h-3.5 w-3.5" aria-hidden />
                    {responseLabel[supplier.responseSignal]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-foreground/85">
                    <DocIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    {docsLabel[supplier.documentReadiness]}
                  </span>
                </div>

                {/* Certifications */}
                {supplier.certificationBadges.length > 0 && (
                  <ul
                    className="mt-3 flex flex-wrap gap-1.5"
                    aria-label="Certifications"
                  >
                    {supplier.certificationBadges.map((c) => (
                      <li
                        key={c.code}
                        className="inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
                      >
                        {c.label}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Product focus summary */}
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">
                    Product focus:
                  </span>{" "}
                  <span className="text-foreground/85">
                    {supplier.productFocus
                      .map((p) => `${p.species} (${p.forms})`)
                      .join(" · ")}
                  </span>
                </div>
              </div>

              {/* Right: access */}
              <AccessPanel
                supplier={supplier}
                level={level}
                request={request}
                onSent={setRequest}
              />
            </div>

            {/* Evidence strip */}
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border md:grid-cols-4">
              {[
                {
                  icon: Boxes,
                  label: "Product focus",
                  value: productFocusSummary,
                },
                {
                  icon: ClipboardList,
                  label: "Commercial terms",
                  value: isUnlocked ? fit.tradeTerms : "After supplier access",
                  locked: !isUnlocked,
                },
                {
                  icon: FileCheck2,
                  label: "Documents",
                  value: docsLabel[supplier.documentReadiness],
                },
                {
                  icon: Truck,
                  label: "Delivery",
                  value: isUnlocked
                    ? `${supplier.deliveryCountriesTotal} markets`
                    : `${supplier.deliveryCountries.length}+ markets`,
                },
              ].map((cell) => {
                const Icon = cell.icon;
                return (
                  <div
                    key={cell.label}
                    className="flex flex-col gap-1 bg-card px-4 py-3"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Icon className="h-3 w-3" aria-hidden />
                      {cell.label}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        cell.locked ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {cell.locked ? (
                        <span className="inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" aria-hidden /> {cell.value}
                        </span>
                      ) : (
                        cell.value
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* AREA 4: Product catalog preview */}
          <section aria-labelledby="catalog-heading" className="space-y-3">
            <SectionHeading>
              <span id="catalog-heading">Product catalog preview</span>
            </SectionHeading>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {catalog.map((item, i) => (
                <li
                  key={`${item.image}-${i}`}
                  className="overflow-hidden rounded-md border border-border bg-card"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={`${item.species} ${item.form} sample from ${displayName}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      style={{ maxHeight: 170 }}
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80">
                        {item.form}
                      </span>
                      {supplier.certificationBadges.slice(0, 1).map((c) => (
                        <span
                          key={c.code}
                          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!isUnlocked && supplier.totalProductsCount > catalog.length && (
              <p className="text-xs text-muted-foreground">
                Full catalog available after supplier approval.
              </p>
            )}
          </section>

          {/* AREA 5: Commercial fit */}
          <section aria-labelledby="fit-heading" className="space-y-3">
            <SectionHeading>
              <span id="fit-heading">Commercial fit</span>
            </SectionHeading>
            <dl className="rounded-md border border-border bg-card px-4 py-2">
              <FactRow label="Typical MOQ" value={fit.typicalMoq} />
              <FactRow label="Trade terms" value={fit.tradeTerms} />
              <FactRow label="Lead time" value={fit.leadTime} />
              <FactRow
                label="Payment terms"
                value={isUnlocked ? fit.paymentTerms : "Available after supplier access"}
                locked={!isUnlocked}
              />
              <FactRow
                label="Shipment ports"
                value={isUnlocked ? fit.shipmentPorts : "Available after supplier access"}
                locked={!isUnlocked}
              />
              <FactRow label="Best fit" value={fit.bestFit} />
            </dl>
          </section>

          {/* AREA 6: Trade and delivery */}
          <section aria-labelledby="trade-heading" className="space-y-3">
            <SectionHeading>
              <span id="trade-heading">Trade and delivery</span>
            </SectionHeading>
            <dl className="rounded-md border border-border bg-card px-4 py-2">
              <FactRow
                label="Supplier type"
                value={supplierTypeLabel[supplier.supplierType]}
              />
              <FactRow
                label="Origin"
                value={`${supplier.city}, ${supplier.country}`}
              />
              <FactRow
                label="Export readiness"
                value={
                  supplier.documentReadiness === "ready"
                    ? "Export-ready facility"
                    : "Export programs in progress"
                }
              />
              <FactRow
                label="Delivery markets"
                value={
                  isUnlocked
                    ? `${supplier.deliveryCountries.map((d) => d.name).join(", ")} (+${Math.max(
                        0,
                        supplier.deliveryCountriesTotal - supplier.deliveryCountries.length,
                      )} more)`
                    : `${supplier.deliveryCountries.length}+ markets, full list after access`
                }
                locked={!isUnlocked}
              />
            </dl>
          </section>

          {/* AREA 7: Documents and certifications */}
          <section aria-labelledby="docs-heading" className="space-y-3">
            <SectionHeading>
              <span id="docs-heading">Documents and certifications</span>
            </SectionHeading>
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {docs.map((d) => {
                const showStatus = isUnlocked || d.available === false;
                return (
                  <li
                    key={d.label}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <FileCheck2
                        className={cn(
                          "h-4 w-4",
                          d.available ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      {d.label}
                    </span>
                    {showStatus ? (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          d.available ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {d.available ? "On file" : "On request"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" aria-hidden />
                        Available after supplier approval
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* AREA 8: Trust evidence */}
          <section aria-labelledby="trust-heading" className="space-y-3">
            <SectionHeading>
              <span id="trust-heading">Trust evidence</span>
            </SectionHeading>
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-card px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification
                </dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
                  {supplier.verificationLevel === "documents_reviewed"
                    ? "Documents reviewed"
                    : supplier.verificationLevel === "basic"
                      ? "Basic verification"
                      : "Pending verification"}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-card px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Active offers on YORSO
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">
                  {supplier.activeOffersCount}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-card px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Certifications
                </dt>
                <dd className="mt-1 text-sm text-foreground/85">
                  {supplier.certifications.join(", ")}
                </dd>
              </div>
            </dl>
          </section>

          {/* AREA 9: Active offers from this supplier */}
          <section aria-labelledby="offers-heading" className="space-y-3">
            <SectionHeading>
              <span id="offers-heading">Active offers from this supplier</span>
            </SectionHeading>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {supplier.productCatalogPreview.slice(0, 3).map((item, i) => (
                <li
                  key={`offer-${item.image}-${i}`}
                  className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
                >
                  <img
                    src={item.image}
                    alt={`${item.species} ${item.form} active offer from ${displayName}`}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isUnlocked ? "Exact price on offer" : "Price on access"}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/offers">View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          {/* AREA 10: Similar suppliers */}
          {similar.length > 0 && (
            <section aria-labelledby="similar-heading" className="space-y-3">
              <SectionHeading>
                <span id="similar-heading">Similar suppliers</span>
              </SectionHeading>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {similar.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md border border-border bg-card p-3"
                  >
                    <Link
                      to={`/suppliers/${s.id}`}
                      className="group flex items-center gap-3"
                    >
                      <img
                        src={s.heroImage}
                        alt={`${s.productFocus[0]?.species ?? "Seafood"} reference for ${s.maskedName}`}
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {level === "qualified_unlocked" ? s.companyName : s.maskedName}
                        </p>
                        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe2 className="h-3 w-3" aria-hidden />
                          {s.city}, {s.country}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierProfile;
