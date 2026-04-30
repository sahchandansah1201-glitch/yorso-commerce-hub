/**
 * Supplier Profile v1 (frontend-first prototype).
 *
 * Route: /suppliers/:supplierId
 *
 * Access gating mirrors /suppliers — locked users see the masked preview,
 * never the real companyName / website / WhatsApp / exact catalog or
 * delivery counts.
 */
import { useEffect, useMemo, useState } from "react";
import {
  SupplierAccessRequestPanel,
  SupplierAccessRequestSent,
} from "@/components/suppliers/SupplierAccessRequestPanel";
import {
  getSupplierAccessRequest,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useRegistration } from "@/contexts/RegistrationContext";
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
  Globe2,
  Lock,
  MessageCircle,
  Package,
  ShieldCheck,
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
import { getOffersForSupplier } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { cn } from "@/lib/utils";

/**
 * Visual class for a product-form badge (HOG, Fillet, IQF, etc.).
 * Form is public product metadata — shown at every access level.
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
    return "Send an access request — the supplier reviews your buyer profile before sharing identity, contact channel, and full catalog.";
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
        <Link to="/suppliers" className="mt-5 inline-block">
          <Button type="button">Back to suppliers</Button>
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { level } = useAccessLevel();
  const { session: buyerSessionState } = useBuyerSession();
  const { data: registrationData } = useRegistration();
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

  // Persisted access-request state for this specific supplier (sessionStorage).
  const [accessRequest, setAccessRequest] =
    useState<SupplierAccessRequest | null>(() =>
      getSupplierAccessRequest(supplierId),
    );
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Re-sync if the route changes between suppliers in-place.
  useEffect(() => {
    setAccessRequest(getSupplierAccessRequest(supplierId));
    setShowRequestForm(false);
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
        content: `Review ${displayName} — ${supplier.country} ${supplierTypeLabel[supplier.supplierType].toLowerCase()}, certifications, delivery markets and access options on YORSO.`,
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
  // Headline cert is supplier-level evidence — only surface on cards when fully unlocked.
  const headlineCert = isUnlocked ? pickHeadlineCert(supplier.certifications) : undefined;

  /**
   * Resolve a catalog preview card to a destination:
   * - qualified_unlocked: prefer a concrete /offers/:id match by species,
   *   fall back to /offers prefiltered by this supplier id.
   * - locked levels: never reveal supplier identity in the URL — use the
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
    if (level === "registered_locked") {
      setShowRequestForm(true);
      return;
    }
    toast({
      title: "Contact request shared",
      description: `We notified ${supplier.companyName} about your contact request.`,
    });
  };

  const buyerSummary = {
    identifier:
      buyerSessionState?.identifier || registrationData.email || undefined,
    company: registrationData.company || undefined,
    country: registrationData.country || undefined,
  };
  const hasSentRequest = !!accessRequest;

  return (
    <div className="min-h-screen bg-background">
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

        {/* Profile header */}
        <section className="border-b border-border bg-background">
          <div className="container py-6 md:py-8">
            <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted md:aspect-auto md:h-[200px]">
                <img
                  src={supplier.heroImage}
                  alt={`${supplier.productFocus[0]?.species ?? "Seafood"} reference image for ${displayName}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                  <span aria-hidden className="text-sm leading-none">
                    {flag || "🌐"}
                  </span>
                  <span>
                    {supplier.country} · {supplier.city}
                  </span>
                </div>
                {supplier.verificationLevel === "documents_reviewed" && (
                  <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-primary/30 bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur-sm">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                    Reviewed
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-[0.14em]">
                    {supplierTypeLabel[supplier.supplierType]}
                  </span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" aria-hidden />
                    In business since {supplier.inBusinessSinceYear}
                  </span>
                </div>
                <h1
                  className="mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground break-words [overflow-wrap:anywhere] md:text-[32px]"
                >
                  {displayName}
                </h1>
                {isMasked && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Lock className="h-3 w-3" aria-hidden />
                    Supplier identity restricted
                  </p>
                )}
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/85 md:text-[15px]">
                  {isUnlocked ? supplier.about : supplier.shortDescription}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-foreground/85">
                    <BadgeCheck
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden
                    />
                    {verificationLabel(supplier.verificationLevel)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-foreground/85">
                    <Activity
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    {responseLabel[supplier.responseSignal]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-foreground/85">
                    <DocIcon
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    {docsLabel[supplier.documentReadiness]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace */}
        <section className="bg-cool-gray/40">
          <div className="container py-6 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              {/* Main column */}
              <div className="space-y-6">
                {/* Product focus */}
                <article
                  aria-labelledby="profile-focus"
                  className="rounded-lg border border-border bg-card p-5 shadow-sm"
                >
                  <h2
                    id="profile-focus"
                    className="font-heading text-base font-semibold text-foreground"
                  >
                    Product focus
                  </h2>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {supplier.productFocus.map((p) => (
                      <li
                        key={p.species}
                        className="rounded-md border border-border bg-background p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {p.species}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.forms}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>

                {/* Catalog preview */}
                <article
                  aria-labelledby="profile-catalog"
                  className="rounded-lg border border-border bg-card p-5 shadow-sm"
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
                      {isUnlocked ? "Product catalog" : "Catalog preview"}
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
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {catalogVisible.map((item, i) => {
                      const href = catalogCardHref(item);
                      return (
                      <li
                        key={`${item.image}-${i}`}
                        className="overflow-hidden rounded-md border border-border bg-background transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40"
                      >
                        <Link
                          to={href}
                          onClick={() =>
                            analytics.track("preview_card_click", {
                              supplier_id: supplier.id,
                              species: item.species,
                              form: item.form,
                              href,
                              access_level: level,
                            })
                          }
                          aria-label={
                            isUnlocked
                              ? `View ${item.name} (${item.form}) offers from ${displayName}`
                              : `Browse ${item.species} offers in catalog`
                          }
                          className="block focus:outline-none"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-muted">
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

                {/* Trust evidence */}
                <article
                  aria-labelledby="profile-trust"
                  className="rounded-lg border border-border bg-card p-5 shadow-sm"
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
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border bg-background p-3">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Verification
                      </dt>
                      <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <BadgeCheck
                          className="h-4 w-4 text-primary"
                          aria-hidden
                        />
                        {verificationLabel(supplier.verificationLevel)}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Document readiness
                      </dt>
                      <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <DocIcon
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                        {docsLabel[supplier.documentReadiness]}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Response speed
                      </dt>
                      <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Activity
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                        {responseLabel[supplier.responseSignal]}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Active offers on YORSO
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                        {supplier.activeOffersCount}
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

                {/* Delivery geography */}
                <article
                  aria-labelledby="profile-delivery"
                  className="rounded-lg border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      id="profile-delivery"
                      className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
                    >
                      <Globe2
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden
                      />
                      Delivery geography
                    </h2>
                    {isUnlocked ? (
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">
                          {supplier.deliveryCountriesTotal}
                        </span>{" "}
                        markets
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Delivery preview
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
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
                </article>
              </div>

              {/* Decision panel */}
              <aside
                aria-label="Access and next action"
                className="lg:sticky lg:top-20 lg:self-start"
              >
                <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      Access
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                      {accessExplainer(level)}
                    </p>
                  </div>

                  {/* Contact channels — qualified only */}
                  {isUnlocked && (supplier.website || supplier.whatsapp) ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Contact channels
                      </p>
                      <div
                        className="mt-2 flex flex-wrap gap-2"
                        aria-label="Supplier contact channels"
                      >
                        {supplier.website && (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30"
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
                            className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30"
                          >
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Contact channels
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Website and messaging channel become visible after the
                        supplier approves your buyer access.
                      </p>
                    </div>
                  )}

                  {level === "registered_locked" && hasSentRequest && (
                    <SupplierAccessRequestSent
                      request={accessRequest!}
                      supplierMaskedName={supplier.maskedName}
                    />
                  )}

                  {level === "registered_locked" &&
                    !hasSentRequest &&
                    showRequestForm && (
                      <SupplierAccessRequestPanel
                        supplierId={supplier.id}
                        supplierMaskedName={supplier.maskedName}
                        buyer={buyerSummary}
                        onSent={(req) => {
                          setAccessRequest(req);
                          setShowRequestForm(false);
                        }}
                        onCancel={() => setShowRequestForm(false)}
                      />
                    )}

                  <div className="flex flex-col gap-2">
                    {level === "anonymous_locked" ? (
                      <Link to="/register" className="block">
                        <Button type="button" className="w-full gap-2">
                          {primaryCtaCopy(level)}
                        </Button>
                      </Link>
                    ) : level === "registered_locked" ? (
                      !hasSentRequest && !showRequestForm ? (
                        <Button
                          type="button"
                          className="w-full gap-2"
                          onClick={handlePrimaryAction}
                        >
                          {primaryCtaCopy(level)}
                        </Button>
                      ) : null
                    ) : (
                      <Button
                        type="button"
                        className="w-full gap-2"
                        onClick={handlePrimaryAction}
                      >
                        {primaryCtaCopy(level)}
                      </Button>
                    )}
                    <Link to="/suppliers" className="block">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Star
                          className={cn("h-4 w-4 text-muted-foreground")}
                          aria-hidden
                        />
                        Back to suppliers
                      </Button>
                    </Link>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Response speed</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {responseLabel[supplier.responseSignal]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Active offers</dt>
                      <dd className="mt-1 font-medium text-foreground tabular-nums">
                        {supplier.activeOffersCount}
                      </dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Active offers from this supplier */}
        {supplierOffers.length > 0 && (
          <section
            aria-labelledby="profile-active-offers"
            className="border-t border-border bg-cool-gray/30"
          >
            <div className="container py-8 md:py-10">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    id="profile-active-offers"
                    className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl"
                  >
                    Active offers from this supplier
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isUnlocked
                      ? `${supplier.activeOffersCount} active offers in total — recent listings below.`
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

              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {supplierOffers.map((o) => {
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
                            alt={`${o.productName} — product image`}
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
            </div>
          </section>
        )}

        {/* Related suppliers */}
        {related.length > 0 && (
          <section
            aria-labelledby="profile-related"
            className="border-t border-border bg-background"
          >
            <div className="container py-8 md:py-10">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    id="profile-related"
                    className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl"
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

              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SupplierProfile;
