/**
 * Supplier Profile v1 (frontend-first prototype).
 *
 * Route: /suppliers/:supplierId
 *
 * Access gating mirrors /suppliers locked users see the masked preview,
 * never the real companyName / website / WhatsApp / exact catalog or
 * delivery counts.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  SupplierAccessRequestPanel,
  SupplierAccessRequestSent,
} from "@/components/suppliers/SupplierAccessRequestPanel";
import {
  getSupplierAccessRequest,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import {
  drainApprovalNotifications,
  processSupplierAccessRequests,
} from "@/lib/supplier-access-approval";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileClock,
  FileQuestion,
  Fish,
  Globe2,
  Lock,
  MessageCircle,
  Package,
  ShieldCheck,
  Ship,
  Star,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  countryCodeToFlag,
  getRelatedSuppliers,
  getSupplierById,
  type DocumentReadiness,
  type MockSupplier,
  type ResponseSignal,
  type SupplierType,
} from "@/data/mockSuppliers";
import { useAccessLevel } from "@/lib/access-level";
import analytics from "@/lib/analytics";
import { savePreviewAttribution } from "@/lib/preview-attribution";
import { getRegistrationAttemptId } from "@/lib/registration-attempt";
import { getOffersForSupplier } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { cn } from "@/lib/utils";

/**
 * Visual class for a product-form badge (HOG, Fillet, IQF, etc.).
 * Form is public product metadata shown at every access level.
 */
function formBadgeClass(form: string): string {
  const f = form.toLowerCase();
  if (f.includes("iqf")) return "bg-sky-100 text-sky-900 border-sky-200";
  if (f.includes("hog") || f.includes("whole")) return "bg-amber-100 text-amber-900 border-amber-200";
  if (f.includes("fillet") || f.includes("loin") || f.includes("saku") || f.includes("portion"))
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (f.includes("hoso") || f.includes("hlso") || f.includes("pd"))
    return "bg-rose-100 text-rose-900 border-rose-200";
  if (f.includes("block")) return "bg-slate-100 text-slate-900 border-slate-200";
  return "bg-muted text-foreground border-border";
}

/**
 * Detects whether a catalog item implies an IQF processing badge,
 * based on the form string ("IQF", "Portions IQF", etc.).
 */
function hasIqfBadge(form: string): boolean {
  return /\biqf\b/i.test(form);
}

/**
 * Picks one headline certification from the supplier's certs list to
 * surface on catalog cards. Only revealed at qualified_unlocked, since
 * locked users already see a Catalog preview teaser, not full evidence.
 */
function pickHeadlineCert(certs: string[]): string | undefined {
  const priority = ["ASC", "MSC", "BAP", "BAP 4★", "BRC", "IFS", "HACCP", "MSC CoC", "EU Approved"];
  for (const p of priority) {
    const hit = certs.find((c) => c.toUpperCase().startsWith(p.toUpperCase()));
    if (hit) return hit;
  }
  return certs[0];
}

const responseLabel: Record<ResponseSignal, string> = {
  fast: "Replies within a day",
  normal: "Replies in 1–3 days",
  slow: "Slower replies",
};

const docsLabel: Record<DocumentReadiness, string> = {
  ready: "Documents ready for review",
  partial: "Some documents on file, rest on request",
  on_request: "Documents available on request",
};

const docsIcon = (r: DocumentReadiness) =>
  r === "ready" ? FileCheck2 : r === "partial" ? FileClock : FileQuestion;

const supplierTypeLabel: Record<SupplierType, string> = {
  producer: "Producer",
  processor: "Processor",
  exporter: "Exporter",
  distributor: "Distributor",
  trader: "Trader",
};

const verificationLabel = (v: MockSupplier["verificationLevel"]) => {
  if (v === "documents_reviewed") return "Documents reviewed by YORSO team";
  if (v === "basic") return "Basic verification";
  return "Unverified";
};

const accessExplainer = (level: AccessLevel) => {
  if (level === "anonymous_locked") {
    return "Create a buyer account to request access to supplier identity, documents, contact channel, and the full product catalog.";
  }
  if (level === "registered_locked") {
    return "Send an access request. The supplier reviews your buyer profile before sharing identity, contact channel, and full catalog.";
  }
  return "Access granted. You can review the full supplier profile, contact channels, and the full product catalog.";
};

const primaryCtaCopy = (level: AccessLevel) => {
  if (level === "anonymous_locked") return "Create buyer account";
  if (level === "registered_locked") return "Request supplier access";
  return "Contact supplier";
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
};

const NotFound = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main id="main" className="container py-16">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Building2 className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Supplier not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not find this supplier. It may have been removed or the link
          is incorrect.
        </p>
        <Button asChild type="button" className="mt-5">
          <Link to="/suppliers">Back to suppliers</Link>
        </Button>
      </div>
    </main>
    <Footer />
  </div>
);

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { level } = useAccessLevel();
  const supplier = useMemo(() => getSupplierById(supplierId), [supplierId]);
  const related = useMemo(
    () => (supplierId ? getRelatedSuppliers(supplierId, 3) : []),
    [supplierId],
  );
  const supplierOffers = useMemo(() => {
    if (!supplier) return [];
    const speciesList = supplier.productFocus.map((p) => p.species);
    return getOffersForSupplier(supplier.country, speciesList, 4);
  }, [supplier]);

  // Persisted access-request state for this specific supplier (localStorage).
  const [accessRequest, setAccessRequest] =
    useState<SupplierAccessRequest | null>(() =>
      getSupplierAccessRequest(supplierId),
    );

  // Re-sync if the route changes between suppliers in-place.
  useEffect(() => {
    setAccessRequest(getSupplierAccessRequest(supplierId));
  }, [supplierId]);

  // Drive the mock approval pipeline whenever the profile mounts or the
  // supplier id changes. If a previously-sent request becomes approved
  // while the buyer is on this page, reflect that immediately.
  useEffect(() => {
    const tick = () => {
      processSupplierAccessRequests();
      drainApprovalNotifications(() => {
        toast({
          title: "Price access approved",
          description:
            "You can now view exact prices and supplier details.",
        });
      });
      setAccessRequest(getSupplierAccessRequest(supplierId));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [supplierId]);

  const isUnlocked = level === "qualified_unlocked";
  const isMasked = !isUnlocked;
  const displayName = supplier
    ? isMasked
      ? supplier.maskedName
      : supplier.companyName
    : "";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.title;
    if (supplier) {
      document.title = `${displayName} · YORSO suppliers`;
      upsertMeta('meta[name="description"]', {
        name: "description",
        content: `Review ${displayName} (${supplier.country} ${supplierTypeLabel[supplier.supplierType].toLowerCase()}): certifications, delivery markets and access options on YORSO.`,
      });
    } else {
      document.title = "Supplier not found · YORSO";
    }
    return () => {
      document.title = prev;
    };
  }, [supplier, displayName]);



  if (!supplier) return <NotFound />;

  const DocIcon = docsIcon(supplier.documentReadiness);
  const flag = countryCodeToFlag(supplier.countryCode);

  const previewDeliveries = supplier.deliveryCountries.slice(0, isUnlocked ? 24 : 4);
  const showDeliveryTeaser = !isUnlocked;

  const catalogVisible = isUnlocked
    ? supplier.productCatalogPreview
    : supplier.productCatalogPreview.slice(0, 3);
  const catalogHidden = isUnlocked
    ? Math.max(0, supplier.totalProductsCount - catalogVisible.length)
    : 0;
  // Headline cert is supplier-level evidence only surface on cards when fully unlocked.
  const headlineCert = isUnlocked ? pickHeadlineCert(supplier.certifications) : undefined;

  /**
   * Resolve a catalog preview card to a destination:
   * - qualified_unlocked: prefer a concrete /offers/:id match by species,
   *   fall back to /offers prefiltered by this supplier id.
   * - locked levels: never reveal supplier identity in the URL use the
   *   broad category from the matched offer (or species), no supplier param.
   */
  const catalogCardHref = (item: { species: string; form: string }): string => {
    const speciesLc = item.species.toLowerCase();
    const speciesMatch = supplierOffers.find(
      (o) => o.species.toLowerCase().includes(speciesLc) || speciesLc.includes(o.species.toLowerCase()),
    );
    if (isUnlocked) {
      if (speciesMatch) return `/offers/${speciesMatch.id}`;
      return supplierId ? `/offers?supplier=${encodeURIComponent(supplierId)}` : "/offers";
    }
    // Locked: route to broad category if known, otherwise to /offers.
    if (speciesMatch?.category) return `/offers?category=${encodeURIComponent(speciesMatch.category)}`;
    return "/offers";
  };
  const handlePrimaryAction = () => {
    if (level === "anonymous_locked") {
      navigate("/register");
      return;
    }
    // registered_locked is now handled inline by the one-click panel.
    toast({
      title: "Contact request shared",
      description: `We notified ${supplier.companyName} about your contact request.`,
    });
  };

  const hasSentRequest = !!accessRequest;

  return (
    <div
      className="min-h-screen bg-background"
      data-component="SupplierProfile"
      data-access-level={level}
    >
      <Header />
      <main id="main">
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
              <span
                className="max-w-[260px] truncate font-medium text-foreground md:max-w-none"
                title={displayName}
              >
                {displayName}
              </span>
            </nav>
          </div>
        </div>

        {/* Supplier dossier hero — banner + logo card + identity + right rail */}
        <section
          data-testid="supplier-profile-dossier-hero"
          className="bg-background"
        >
          <div
            data-testid="supplier-trading-dossier"
            className="relative"
          >
            {/* Panoramic banner */}
            <div className="relative h-[180px] w-full overflow-hidden bg-muted md:h-[220px] lg:h-[260px]">
              <img
                src={supplier.heroImage}
                alt={`${supplier.country} ${supplierTypeLabel[supplier.supplierType].toLowerCase()} reference`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-foreground/55 via-foreground/25 to-transparent"
              />
              <div className="absolute left-0 right-0 top-3 px-4 md:px-6">
                <div className="container flex items-center gap-2 text-[11px] font-medium text-background/90">
                  <span className="inline-flex items-center gap-1 rounded-full bg-background/15 px-2 py-0.5 backdrop-blur-sm">
                    <span aria-hidden className="text-sm leading-none">{flag || "🌐"}</span>
                    {supplier.country} · {supplier.city}
                  </span>
                  {supplier.verificationLevel === "documents_reviewed" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-background">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      Reviewed by YORSO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body — pulled up under banner */}
            <div className="container">
              <div className="-mt-16 grid gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:pb-10">
                {/* Left column: logo card + identity + CTAs */}
                <div className="min-w-0">
                  {/* Logo card overlapping banner */}
                  <div className="inline-flex h-[120px] w-[200px] items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-3 shadow-md md:h-[140px] md:w-[240px]">
                    {supplier.productCatalogPreview[0]?.image ? (
                      <img
                        src={supplier.productCatalogPreview[0].image}
                        alt={`${displayName} logo or hero product`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden />
                    )}
                  </div>

                  <div className="mt-5">
                    <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere] md:text-[32px]">
                      {displayName}
                    </h1>
                    {isMasked && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        <Lock className="h-3 w-3" aria-hidden />
                        Supplier identity restricted
                      </p>
                    )}

                    {/* Identity facts column */}
                    <ul className="mt-4 space-y-1.5 text-[13px] text-foreground/85">
                      <li className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
                        В бизнесе с {supplier.inBusinessSinceYear}
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-primary" aria-hidden />
                        <span aria-hidden className="text-base leading-none">{flag || "🌐"}</span>
                        {supplier.country}, {supplier.city}
                      </li>
                      {isUnlocked && supplier.website && (
                        <li className="inline-flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-primary" aria-hidden />
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {supplier.website.replace(/^https?:\/\//, "")}
                          </a>
                        </li>
                      )}
                      <li className="inline-flex items-center gap-2 text-foreground/75">
                        <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
                        {verificationLabel(supplier.verificationLevel)}
                      </li>
                      <li className="inline-flex items-center gap-2 text-foreground/75">
                        <Activity className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {responseLabel[supplier.responseSignal]}
                      </li>
                    </ul>

                    <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-foreground/85">
                      {isUnlocked ? supplier.about : supplier.shortDescription}
                    </p>

                    {/* Product focus chips */}
                    {supplier.productFocus.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <Fish className="h-3.5 w-3.5" aria-hidden />
                          Фокус
                        </span>
                        {supplier.productFocus.slice(0, 4).map((p) => (
                          <span
                            key={p.species}
                            className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[12px] font-medium text-foreground/85"
                          >
                            {p.species}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right rail: deliveries + certifications + access */}
                <aside
                  aria-label="Access and next action"
                  data-testid="supplier-profile-access-panel"
                  className="lg:mt-2"
                >
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    {/* Delivery countries */}
                    <div>
                      <p className="font-heading text-[15px] font-semibold text-foreground">
                        Страны доставки
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Delivery countries">
                        {previewDeliveries.slice(0, 10).map((d) => (
                          <li
                            key={d.code}
                            title={d.name}
                            className="inline-flex h-6 w-9 items-center justify-center overflow-hidden rounded border border-border bg-background text-base leading-none"
                          >
                            <span aria-hidden>{countryCodeToFlag(d.code) || "🌐"}</span>
                          </li>
                        ))}
                        {isUnlocked && supplier.deliveryCountriesTotal > previewDeliveries.length && (
                          <li className="inline-flex h-6 items-center rounded border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground">
                            и ещё {supplier.deliveryCountriesTotal - previewDeliveries.length}
                          </li>
                        )}
                        {!isUnlocked && (
                          <li className="inline-flex h-6 items-center rounded border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground">
                            <Lock className="mr-1 h-3 w-3" aria-hidden />
                            ещё после доступа
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Certifications */}
                    {supplier.certificationBadges.length > 0 && (
                      <div className="mt-5 border-t border-border pt-4">
                        <p className="font-heading text-[15px] font-semibold text-foreground">
                          Сертификаты
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Certifications">
                          {supplier.certificationBadges.slice(0, 6).map((c) => (
                            <li
                              key={c.code}
                              title={c.label}
                              className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80"
                            >
                              <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
                              {c.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Access state + CTA */}
                    <div className="mt-5 border-t border-border pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          {isUnlocked ? "Access granted" : "Access required"}
                        </div>
                        {isUnlocked && (
                          <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
                            Unlocked
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        {level === "anonymous_locked" ? (
                          <Button asChild type="button" className="w-full gap-2">
                            <Link to="/register">{primaryCtaCopy(level)}</Link>
                          </Button>
                        ) : level === "registered_locked" && !hasSentRequest ? (
                          <SupplierAccessRequestPanel
                            supplierId={supplier.id}
                            supplierMaskedName={supplier.maskedName}
                            onSent={(req) => setAccessRequest(req)}
                          />
                        ) : level === "registered_locked" ? null : (
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              className="w-full gap-2"
                              onClick={handlePrimaryAction}
                            >
                              <MessageCircle className="h-4 w-4" aria-hidden />
                              Отправить сообщение
                            </Button>
                            {supplier.whatsapp && (
                              <Button asChild type="button" variant="outline" className="w-full gap-2">
                                <a
                                  href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageCircle className="h-4 w-4" aria-hidden />
                                  WhatsApp
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                        {hasSentRequest && (
                          <SupplierAccessRequestSent
                            request={accessRequest!}
                            supplierMaskedName={supplier.maskedName}
                          />
                        )}
                      </div>

                      {!isUnlocked && (
                        <ul className="mt-3 space-y-1 text-[12px] leading-snug text-foreground/80">
                          <li className="flex gap-1.5">
                            <span aria-hidden className="text-muted-foreground">·</span>
                            <span>Unlock exact prices and full commercial terms.</span>
                          </li>
                          <li className="flex gap-1.5">
                            <span aria-hidden className="text-muted-foreground">·</span>
                            <span>See supplier identity and contact channels.</span>
                          </li>
                        </ul>
                      )}

                      {isUnlocked ? (
                        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-[11px]">
                          <div>
                            <dt className="text-muted-foreground">Response speed</dt>
                            <dd className="mt-0.5 font-semibold text-foreground">
                              {responseLabel[supplier.responseSignal]}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Active offers</dt>
                            <dd className="mt-0.5 font-semibold text-foreground tabular-nums">
                              {supplier.activeOffersCount}
                            </dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
                          Active offers and supplier response details available after supplier approval.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {/* Evidence strip — kept for IA contract, slim divider band below hero */}
            <div className="border-y border-border bg-muted/30">
              <div className="container">
                <div
                  data-testid="supplier-trading-dossier-evidence"
                  className="grid grid-cols-2 lg:grid-cols-4"
                >
                  <div className="border-r border-border px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Product focus
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-medium text-foreground">
                      {supplier.productFocus.length > 0
                        ? supplier.productFocus
                            .slice(0, 2)
                            .map((p) => `${p.species} (${p.forms})`)
                            .join(" · ")
                        : "Seafood procurement"}
                    </p>
                  </div>
                  <div className="px-4 py-3 lg:border-r lg:border-border">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Commercial terms
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-medium text-foreground">
                      {isUnlocked
                        ? (() => {
                            const incoterms = Array.from(
                              new Set(
                                supplierOffers
                                  .map((o) => o.commercial?.incoterm)
                                  .filter((x): x is string => !!x),
                              ),
                            );
                            return incoterms.length > 0
                              ? incoterms.slice(0, 3).join(", ")
                              : "Confirmed with supplier";
                          })()
                        : "Terms after access"}
                    </p>
                  </div>
                  <div className="border-r border-border border-t border-t-border px-4 py-3 lg:border-t-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Documents
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-medium text-foreground">
                      {isUnlocked
                        ? docsLabel[supplier.documentReadiness]
                        : "Documents available after approval"}
                    </p>
                  </div>
                  <div className="border-t border-border px-4 py-3 lg:border-t-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Delivery
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-medium text-foreground">
                      {previewDeliveries.length > 0
                        ? previewDeliveries.slice(0, 4).map((d) => d.name).join(", ")
                        : "On request"}
                      {!isUnlocked && (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          Full geography after approval
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Area 3: Main Procurement Content */}
        <section
          data-testid="supplier-profile-main-content"
          className="bg-cool-gray/40"
        >
          <div className="container space-y-4 py-4 md:space-y-5 md:py-5">
            {/* 1. Product catalog preview */}
            <article
              aria-labelledby="profile-catalog"
              className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="profile-catalog"
                  className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
                >
                  <Package
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  Product catalog preview
                </h2>
                {isUnlocked ? (
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                      {supplier.totalProductsCount}
                    </span>{" "}
                    products
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Preview only
                  </span>
                )}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {catalogVisible.slice(0, 3).map((item, i) => {
                  const href = catalogCardHref(item);
                  return (
                  <li
                    key={`${item.image}-${i}`}
                    className="overflow-hidden rounded-md border border-border bg-background transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40"
                  >
                    <Link
                      to={href}
                      onClick={() => {
                        const attribution = {
                          supplier_id: supplier.id,
                          species: item.species,
                          form: item.form,
                          href,
                          access_level: level,
                        };
                        const attempt_id = getRegistrationAttemptId();
                        analytics.track("preview_card_click", {
                          ...attribution,
                          attempt_id,
                        });
                        savePreviewAttribution(attribution);
                      }}
                      aria-label={
                        isUnlocked
                          ? `View ${item.name} (${item.form}) offers from ${displayName}`
                          : `Browse ${item.species} offers in catalog`
                      }
                      className="block focus:outline-none"
                    >
                      <div className="relative h-[140px] w-full overflow-hidden bg-muted sm:h-[160px]">
                        <img
                          src={item.image}
                          alt={`${item.species} (${item.form}) product preview from ${displayName}`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                        />
                      </div>
                      <div className="p-2">
                        <p
                          className="truncate text-xs font-medium text-foreground"
                          title={item.name}
                        >
                          {item.name}
                        </p>
                        <div
                          className="mt-1 flex flex-wrap items-center gap-1"
                          aria-label={`Product attributes: ${item.form}${
                            isUnlocked && headlineCert ? `, ${headlineCert}` : ""
                          }`}
                        >
                          <span
                            className={cn(
                              "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              formBadgeClass(item.form),
                            )}
                          >
                            {item.form}
                          </span>
                          {hasIqfBadge(item.name) && !hasIqfBadge(item.form) && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                formBadgeClass("IQF"),
                              )}
                            >
                              IQF
                            </span>
                          )}
                          {isUnlocked && headlineCert && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                              title={`Supplier certification: ${headlineCert}`}
                            >
                              <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
                              {headlineCert}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                  );
                })}
              </ul>
              {isUnlocked
                ? catalogHidden > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      +{catalogHidden} more products in supplier catalog
                    </p>
                  )
                : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Full catalog available after supplier approval
                  </p>
                )}
            </article>

            {/* 2. Commercial fit */}
            <article
              aria-labelledby="profile-commercial-fit"
              data-testid="supplier-profile-commercial-fit"
              className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <h2
                id="profile-commercial-fit"
                className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
              >
                <Ship className="h-4 w-4 text-muted-foreground" aria-hidden />
                Commercial fit
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Commercial fit is derived from current frontend offer data. Final terms are confirmed with the supplier.
              </p>
              {(() => {
                const uniq = (arr: (string | undefined)[]) =>
                  Array.from(
                    new Set(
                      arr
                        .filter((x): x is string => !!x && x.trim().length > 0)
                        .map((x) => x.trim()),
                    ),
                  );

                const moqValues = supplierOffers
                  .map((o) => o.moqValue)
                  .filter((v): v is number => typeof v === "number" && v > 0);
                const incoterms = uniq(
                  supplierOffers.flatMap((o) => [
                    o.commercial?.incoterm,
                    ...(o.deliveryBasisOptions?.map((d) => d.code) ?? []),
                  ]),
                );
                const leadTimes = uniq(supplierOffers.map((o) => o.commercial?.leadTime));
                const paymentTerms = uniq(supplierOffers.map((o) => o.commercial?.paymentTerms));
                const ports = uniq(
                  supplierOffers.flatMap((o) => [
                    o.commercial?.shipmentPort,
                    ...(o.deliveryBasisOptions?.map((d) => d.shipmentPort) ?? []),
                  ]),
                );

                const focusList = supplier.productFocus.map((p) => p.species);
                const typeLc = supplierTypeLabel[supplier.supplierType].toLowerCase();
                const focusSummary =
                  focusList.length === 0
                    ? "seafood procurement"
                    : focusList.slice(0, 2).join(" and ");
                const bestFitUnlocked = `Buyers sourcing ${focusSummary} from ${supplier.country}, working with a ${typeLc}.`;
                const bestFitLocked = "Product focus preview available. Detailed fit unlocks after supplier access.";

                const fmtMoqRange = () => {
                  if (moqValues.length === 0) return null;
                  const min = Math.min(...moqValues);
                  const max = Math.max(...moqValues);
                  const fmt = (n: number) => `${n.toLocaleString("en-US")} kg`;
                  return min === max ? fmt(min) : `${fmt(min)} to ${fmt(max)}`;
                };

                const lockedValue = "Available after supplier access";

                const cards: { key: string; label: string; value: ReactNode }[] = [
                  {
                    key: "moq",
                    label: "Typical MOQ",
                    value: isUnlocked ? (fmtMoqRange() ?? lockedValue) : lockedValue,
                  },
                  {
                    key: "incoterms",
                    label: "Trade terms",
                    value: isUnlocked
                      ? incoterms.length > 0
                        ? incoterms.join(", ")
                        : lockedValue
                      : "Request access to review supported Incoterms",
                  },
                  {
                    key: "lead",
                    label: "Lead time",
                    value: isUnlocked
                      ? leadTimes.length > 0
                        ? leadTimes.join(", ")
                        : lockedValue
                      : "Lead time available after supplier access",
                  },
                  {
                    key: "payment",
                    label: "Payment terms",
                    value: isUnlocked
                      ? paymentTerms.length > 0
                        ? paymentTerms.join(" · ")
                        : lockedValue
                      : "Request access to review payment terms",
                  },
                  {
                    key: "ports",
                    label: "Shipment ports",
                    value: isUnlocked
                      ? ports.length > 0
                        ? ports.join(", ")
                        : lockedValue
                      : "Shipment details available after supplier access",
                  },
                  {
                    key: "fit",
                    label: "Best fit",
                    value: isUnlocked ? bestFitUnlocked : bestFitLocked,
                  },
                ];

                return (
                  <dl className="mt-3 grid grid-cols-1 overflow-hidden rounded-md border border-border bg-background sm:grid-cols-2 sm:divide-x sm:divide-border">
                    {cards.map((c, idx) => (
                      <div
                        key={c.key}
                        className={cn(
                          "flex items-baseline justify-between gap-4 px-3 py-2.5",
                          idx >= 2 && "sm:border-t sm:border-border",
                          idx > 0 && idx < 2 && "border-t border-border sm:border-t-0",
                          idx >= 2 && "border-t border-border",
                        )}
                      >
                        <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {c.label}
                        </dt>
                        <dd className="text-right text-[13px] font-semibold text-foreground break-words [overflow-wrap:anywhere]">
                          {c.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                );
              })()}
              {!isUnlocked && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Commercial terms available after supplier access.
                </p>
              )}
            </article>

            {/* 3. Trade and delivery */}
            <article
              aria-labelledby="profile-trade"
              className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="profile-trade"
                  className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
                >
                  <Ship
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  Trade and delivery
                </h2>
                {isUnlocked ? (
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                      {supplier.deliveryCountriesTotal}
                    </span>{" "}
                    export markets
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Delivery preview
                  </span>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-1 overflow-hidden rounded-md border border-border bg-background sm:grid-cols-3 sm:divide-x sm:divide-border">
                <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Supplier type
                  </dt>
                  <dd className="text-right text-[13px] font-semibold text-foreground">
                    {supplierTypeLabel[supplier.supplierType]}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-border px-3 py-2.5 sm:border-t-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Origin
                  </dt>
                  <dd className="inline-flex items-center gap-1 text-right text-[13px] font-semibold text-foreground">
                    <span aria-hidden className="text-base leading-none">
                      {flag || "🌐"}
                    </span>
                    {supplier.country} · {supplier.city}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-border px-3 py-2.5 sm:border-t-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Export readiness
                  </dt>
                  <dd className="text-right text-[13px] font-semibold text-foreground">
                    {supplier.documentReadiness === "ready"
                      ? "Export documents on file"
                      : supplier.documentReadiness === "partial"
                        ? "Partial export documents"
                        : "Export documents on request"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Globe2 className="h-3 w-3" aria-hidden />
                  {isUnlocked ? "Delivery markets" : "Delivery preview"}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {previewDeliveries.map((d) => (
                    <li
                      key={d.code}
                      className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-foreground/85"
                      title={d.name}
                    >
                      <span aria-hidden className="text-sm leading-none">
                        {countryCodeToFlag(d.code) || "🌐"}
                      </span>
                      <span>{d.name}</span>
                    </li>
                  ))}
                </ul>
                {showDeliveryTeaser && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Full delivery geography after supplier approval
                  </p>
                )}
              </div>
            </article>

            {/* 4. Documents and certifications */}
            <article
              aria-labelledby="profile-documents"
              data-testid="supplier-profile-documents"
              className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <h2
                id="profile-documents"
                className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
              >
                <FileCheck2
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                Documents and certifications
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Document availability is indicative. Exact files are shared
                after the supplier approves your access.
              </p>
              <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-background">
                {(() => {
                  type DocStatus =
                    | "ready"
                    | "partial"
                    | "on_request"
                    | "after_approval";
                  const statusLabel: Record<DocStatus, string> = {
                    ready: "Ready for review",
                    partial: "Partial",
                    on_request: "Available on request",
                    after_approval: "Available after supplier approval",
                  };
                  const statusTone: Record<DocStatus, string> = {
                    ready:
                      "border-emerald-200 bg-emerald-50 text-emerald-900",
                    partial:
                      "border-amber-200 bg-amber-50 text-amber-900",
                    on_request:
                      "border-slate-200 bg-slate-50 text-slate-900",
                    after_approval:
                      "border-border bg-muted text-muted-foreground",
                  };

                  const baseFor = (
                    kind:
                      | "health"
                      | "haccp"
                      | "iuu"
                      | "sustainability"
                      | "packing"
                      | "traceability",
                  ): DocStatus => {
                    if (!isUnlocked) return "after_approval";
                    const r = supplier.documentReadiness;
                    if (r === "ready") {
                      if (kind === "sustainability") {
                        const hasSus = supplier.certifications.some((c) =>
                          /asc|msc|bap|iceland responsible/i.test(c),
                        );
                        return hasSus ? "ready" : "on_request";
                      }
                      return "ready";
                    }
                    if (r === "partial") {
                      if (kind === "health" || kind === "haccp")
                        return "ready";
                      return "partial";
                    }
                    return "on_request";
                  };

                  const items: {
                    key: string;
                    label: string;
                    status: DocStatus;
                  }[] = [
                    {
                      key: "health",
                      label: "Health certificate",
                      status: baseFor("health"),
                    },
                    {
                      key: "haccp",
                      label: "HACCP / food safety",
                      status: baseFor("haccp"),
                    },
                    {
                      key: "iuu",
                      label: "Catch / IUU declaration",
                      status: baseFor("iuu"),
                    },
                    {
                      key: "sustainability",
                      label: "Sustainability certificate",
                      status: baseFor("sustainability"),
                    },
                    {
                      key: "packing",
                      label: "Packing list",
                      status: baseFor("packing"),
                    },
                    {
                      key: "traceability",
                      label: "Traceability data",
                      status: baseFor("traceability"),
                    },
                  ];

                  return items.map((it) => (
                    <li
                      key={it.key}
                      data-testid={`doc-row-${it.key}`}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2 text-sm text-foreground">
                        <FileCheck2
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-hidden
                        />
                        {it.label}
                      </span>
                      <span
                        data-testid={`doc-status-${it.key}`}
                        className={cn(
                          "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          statusTone[it.status],
                        )}
                      >
                        {statusLabel[it.status]}
                      </span>
                    </li>
                  ));
                })()}
              </ul>
              {!isUnlocked && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Document files and identifiers are not exposed in the
                  preview. They become available after the supplier
                  approves your buyer access.
                </p>
              )}
            </article>

            {/* 5. Trust evidence */}
            <article
              aria-labelledby="profile-trust"
              className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <h2
                id="profile-trust"
                className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
              >
                <ShieldCheck
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                Trust evidence
              </h2>
              <dl className="mt-3 grid grid-cols-1 overflow-hidden rounded-md border border-border bg-background sm:grid-cols-2 sm:divide-x sm:divide-border">
                <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Verification
                  </dt>
                  <dd className="inline-flex items-center gap-1.5 text-right text-[13px] font-semibold text-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {verificationLabel(supplier.verificationLevel)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-border px-3 py-2.5 sm:border-t-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Active offers on YORSO
                  </dt>
                  <dd className="text-right text-[13px] font-semibold text-foreground tabular-nums">
                    {isUnlocked
                      ? supplier.activeOffersCount
                      : "Available after approval"}
                  </dd>
                </div>
              </dl>

              {supplier.certificationBadges.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Certifications
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {supplier.certificationBadges.map((c) => (
                      <li
                        key={c.code}
                        className="inline-flex items-center rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
                        title={c.label}
                      >
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

        {/* 6. Active offers from this supplier */}
        {supplierOffers.length > 0 && (
          <article
            aria-labelledby="profile-active-offers"
            className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="profile-active-offers"
                  className="font-heading text-base font-semibold text-foreground"
                >
                  Active offers from this supplier
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isUnlocked
                    ? `${supplier.activeOffersCount} active offers in total. Recent listings below.`
                    : "Recent listings matching this supplier's product focus and origin."}
                </p>
              </div>
              <Link
                to="/offers"
                className="hidden text-sm font-medium text-primary hover:underline md:inline"
              >
                All offers →
              </Link>
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {supplierOffers.slice(0, 3).map((o) => {
                const priceVisible = isUnlocked;
                return (
                  <li key={o.id}>
                    <Link
                      to={`/offers/${o.id}`}
                      aria-label={`Open offer: ${o.productName}`}
                      className="group block h-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-foreground/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        <img
                          src={o.image}
                          alt={`${o.productName} product image`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                          <span aria-hidden className="text-sm leading-none">
                            {o.originFlag}
                          </span>
                          <span>{o.origin}</span>
                        </div>
                        <div className="absolute right-2 top-2 inline-flex items-center rounded border border-border bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm">
                          {o.format}
                        </div>
                      </div>
                      <div className="p-3.5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {o.species} · {o.cutType}
                        </p>
                        <h3
                          className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground"
                          title={o.productName}
                        >
                          {o.productName}
                        </h3>
                        <div className="mt-3 flex items-baseline justify-between gap-2 text-xs">
                          {priceVisible ? (
                            <span className="font-semibold text-foreground tabular-nums">
                              {o.priceRange}
                              <span className="ml-1 font-normal text-muted-foreground">
                                {o.priceUnit}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Lock className="h-3 w-3" aria-hidden />
                              Price after access
                            </span>
                          )}
                          <span className="text-muted-foreground">{o.moq}</span>
                        </div>
                        <div className="mt-2 text-[11px] font-medium text-primary group-hover:underline">
                          View offer →
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!isUnlocked && (
              <p className="mt-4 text-xs text-muted-foreground">
                Exact prices and full offer terms become visible after the
                supplier approves your buyer access.
              </p>
            )}
          </article>
        )}

        {/* 7. Similar suppliers */}
        {related.length > 0 && (
          <article
            aria-labelledby="profile-related"
            className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="profile-related"
                  className="font-heading text-base font-semibold text-foreground"
                >
                  Similar suppliers
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Other suppliers with overlapping product focus or origin.
                </p>
              </div>
              <Link
                to="/suppliers"
                className="hidden text-sm font-medium text-primary hover:underline md:inline"
              >
                All suppliers →
              </Link>
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const rName = isMasked ? r.maskedName : r.companyName;
                const rFlag = countryCodeToFlag(r.countryCode);
                return (
                  <li key={r.id}>
                    <Link
                      to={`/suppliers/${r.id}`}
                      aria-label={`Open supplier profile: ${rName}`}
                      className="group block h-full overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-foreground/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                        <img
                          src={r.heroImage}
                          alt={`${r.productFocus[0]?.species ?? "Seafood"} reference image for ${rName}`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                          <span aria-hidden className="text-sm leading-none">
                            {rFlag || "🌐"}
                          </span>
                          <span>{r.country}</span>
                        </div>
                        {r.verificationLevel === "documents_reviewed" && (
                          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-primary/30 bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur-sm">
                            <BadgeCheck className="h-3 w-3" aria-hidden />
                            Reviewed
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {supplierTypeLabel[r.supplierType]} · {r.city}
                        </p>
                        <h3 className="mt-1.5 font-heading text-base font-semibold leading-snug text-foreground break-words [overflow-wrap:anywhere]">
                          {rName}
                        </h3>
                        {isMasked && (
                          <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            <Lock className="h-3 w-3" aria-hidden />
                            Identity restricted
                          </p>
                        )}
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/80">
                          {r.shortDescription}
                        </p>
                        {r.certificationBadges.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-1">
                            {r.certificationBadges.slice(0, 4).map((c) => (
                              <li
                                key={c.code}
                                className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-foreground/75"
                              >
                                {c.label}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3 w-3" aria-hidden />
                            {r.productFocus[0]?.species}
                          </span>
                          <span className="font-medium text-primary group-hover:underline">
                            Open profile →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierProfile;
