import { Link } from "react-router-dom";
import {
  ArrowRight,
  Inbox,
  ShieldAlert,
  Eye,
  LayoutGrid,
  Lock,
  BadgeCheck,
  FileBadge,
  Package,
  LineChart,
  UserSquare2,
  ListChecks,
  KeyRound,
  MessagesSquare,
  Check,
  X,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useForSuppliers } from "@/i18n/for-suppliers";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";
import { useEffect } from "react";
import ogImage from "@/assets/og-for-suppliers.jpg";

const painIcons = [Inbox, ShieldAlert, Eye, LayoutGrid];
const helpIcons = [Lock, BadgeCheck, FileBadge, Package, LineChart];
const getsIcons = [UserSquare2, Package, Inbox, KeyRound, MessagesSquare];

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

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const ForSuppliers = () => {
  const t = useForSuppliers();
  const { lang, t: tCommon } = useLanguage();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevTitle = document.title;
    const prevDescription =
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute("content") ?? "";
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? "";

    document.title = t.seo_title;
    document.documentElement.setAttribute("lang", lang);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonical = `${origin}/for-suppliers`;
    const ogImageUrl = `${origin}${ogImage}`;

    // Standard SEO
    upsertMeta('meta[name="description"]', { name: "description", content: t.seo_description });

    // Open Graph
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: t.seo_title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: t.seo_description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "YORSO" });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: t.seo_ogLocale });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: ogImageUrl });
    upsertMeta('meta[property="og:image:secure_url"]', { property: "og:image:secure_url", content: ogImageUrl });
    upsertMeta('meta[property="og:image:type"]', { property: "og:image:type", content: "image/jpeg" });
    upsertMeta('meta[property="og:image:width"]', { property: "og:image:width", content: "1200" });
    upsertMeta('meta[property="og:image:height"]', { property: "og:image:height", content: "630" });
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: t.seo_ogImageAlt });

    // Twitter Card
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: t.seo_title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: t.seo_description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImageUrl });
    upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: t.seo_ogImageAlt });

    upsertLink("canonical", canonical);

    // JSON-LD structured data: Organization + WebPage + BreadcrumbList
    const ldId = "ld-for-suppliers";
    const existingLd = document.getElementById(ldId);
    if (existingLd) existingLd.remove();

    const ldGraph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${origin}/#organization`,
          name: "YORSO",
          url: origin || "/",
          logo: ogImageUrl,
        },
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: t.seo_title,
          description: t.seo_description,
          inLanguage: t.seo_ogLocale.replace("_", "-"),
          isPartOf: { "@id": `${origin}/#organization` },
          primaryImageOfPage: { "@type": "ImageObject", url: ogImageUrl },
          breadcrumb: { "@id": `${canonical}#breadcrumbs` },
          about: { "@id": `${origin}/#organization` },
          audience: {
            "@type": "BusinessAudience",
            audienceType: tCommon.nav_forSuppliers,
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonical}#breadcrumbs`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: tCommon.catalog_breadcrumbHome,
              item: origin || "/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: tCommon.nav_forSuppliers,
              item: canonical,
            },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${canonical}#faq`,
          mainEntity: t.faq_items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        },
        {
          "@type": "Article",
          "@id": `${canonical}#article`,
          headline: t.seo_title,
          description: t.seo_description,
          inLanguage: t.seo_ogLocale.replace("_", "-"),
          image: [ogImageUrl],
          mainEntityOfPage: { "@id": `${canonical}#webpage` },
          isPartOf: { "@id": `${canonical}#webpage` },
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          about: { "@id": `${origin}/#organization` },
          audience: {
            "@type": "BusinessAudience",
            audienceType: tCommon.nav_forSuppliers,
          },
          articleSection: tCommon.nav_forSuppliers,
        },
        {
          "@type": "Service",
          "@id": `${canonical}#service`,
          name: t.seo_title,
          description: t.seo_description,
          serviceType: tCommon.nav_forSuppliers,
          provider: { "@id": `${origin}/#organization` },
          areaServed: "Worldwide",
          audience: {
            "@type": "BusinessAudience",
            audienceType: tCommon.nav_forSuppliers,
          },
        },
      ],
    };

    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.id = ldId;
    ldScript.text = JSON.stringify(ldGraph);
    document.head.appendChild(ldScript);

    analytics.track("supplier_page_view", { surface: "for_suppliers" });

    return () => {
      document.title = prevTitle;
      if (prevDescription) {
        upsertMeta('meta[name="description"]', { name: "description", content: prevDescription });
        upsertMeta('meta[property="og:description"]', { property: "og:description", content: prevDescription });
        upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: prevDescription });
      }
      upsertMeta('meta[property="og:title"]', { property: "og:title", content: prevTitle });
      upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: prevTitle });
      if (prevCanonical) upsertLink("canonical", prevCanonical);
      document.getElementById(ldId)?.remove();
    };
  }, [
    t.seo_title,
    t.seo_description,
    t.seo_ogImageAlt,
    t.seo_ogLocale,
    tCommon.catalog_breadcrumbHome,
    tCommon.nav_forSuppliers,
    t.faq_items,
    lang,
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main">

      {/* Breadcrumbs */}
      <div className="border-b border-border bg-background">
        <div className="container py-3">
          <nav
            aria-label={tCommon.aria_breadcrumb}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              {tCommon.catalog_breadcrumbHome}
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="font-medium text-foreground">{tCommon.nav_forSuppliers}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-border/60 bg-warm-bg">
        <div className="container py-12 md:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.hero_eyebrow}
            </p>
            <h1 className="mt-3 font-heading text-[34px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:mt-5 md:text-[52px] md:leading-[1.05]">
              {t.hero_title}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-5 md:text-[17px] md:leading-[1.6]">
              {t.hero_subtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">
              <Link
                to="/register"
                onClick={() => analytics.track("supplier_page_cta_register_click", { surface: "hero" })}
              >
                <Button size="lg" className="gap-2 px-7 text-base font-semibold shadow-sm">
                  {t.hero_ctaPrimary}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link
                to="/offers"
                onClick={() => analytics.track("supplier_page_cta_requests_click", { surface: "hero" })}
              >
                <Button size="lg" variant="outline" className="gap-2 px-7 text-base font-semibold">
                  {t.hero_ctaSecondary}
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground md:mt-4">{t.hero_note}</p>
          </div>
        </div>
      </section>

      {/* Workflow: 4 steps */}
      <section className="border-b border-border/50">
        <div className="container py-10 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.flow_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.flow_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.flow_subtitle}
            </p>
          </div>
          <ol className="mt-6 grid gap-px md:mt-10 overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
            {t.flow_steps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col gap-3 bg-background p-5">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-2xl font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t.flow_stepLabel}
                  </span>
                </div>
                <h3 className="font-heading text-[15px] font-semibold leading-[1.35] tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                {i < t.flow_steps.length - 1 && (
                  <ChevronRight
                    aria-hidden
                    className="absolute -right-2 top-7 hidden h-4 w-4 text-muted-foreground/40 md:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pain map */}
      <section className="border-b border-border/50">
        <div className="container py-10 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.pain_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.pain_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.pain_subtitle}
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:mt-10 md:gap-x-10 md:gap-y-8 md:grid-cols-2">
            {t.pain_items.map((item, i) => {
              const Icon = painIcons[i] ?? Inbox;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:rounded-none md:border-0 md:border-l-2 md:bg-transparent md:p-0 md:pl-5 md:shadow-none"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary md:h-auto md:w-auto md:bg-transparent">
                    <Icon className="h-5 w-5 md:mt-0.5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-[17px] font-semibold leading-[1.3] tracking-tight text-foreground md:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.today}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/80">
                      {item.cost}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What buyers see — UI mock preview */}
      <section className="border-b border-border/50 bg-cool-gray">
        <div className="container py-10 md:py-20">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-16">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t.preview_eyebrow}
              </p>
              <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
                {t.preview_title}
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
                {t.preview_subtitle}
              </p>
            </div>

            {/* Mock offer card */}
            <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>yorso.com / offer</span>
                <span className="flex items-center gap-1 text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified supplier
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-[17px] font-semibold leading-[1.3] tracking-tight text-foreground md:text-lg">
                  {t.preview_product}
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t.preview_origin}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{t.preview_originValue}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t.preview_format}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{t.preview_formatValue}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t.preview_certifications}
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {["MSC", "ASC", "BRC", "IFS", "HACCP"].map((c) => (
                        <span
                          key={c}
                          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80"
                        >
                          {c}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t.preview_priceRange}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">€8.40 – €9.20 / kg</dd>
                  </div>
                </dl>

                {/* Gated rows */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded border border-dashed border-border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{t.preview_priceLocked}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.preview_priceLockedHint}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded border border-dashed border-border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{t.preview_supplierLocked}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.preview_supplierLockedHint}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-90"
                >
                  {t.preview_ctaRequest}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 text-[11px] italic text-muted-foreground">{t.preview_caption}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Control over price visibility — 3 access states + flow */}
      <section className="border-b border-border/50">
        <div className="container py-10 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.access_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.access_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.access_subtitle}
            </p>
          </div>

          <div className="mt-6 grid gap-px md:mt-10 overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
            {t.access_states.map((state, i) => {
              const isApproved = i === t.access_states.length - 1;
              return (
                <div key={state.label} className="flex flex-col bg-background p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        isApproved
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="font-heading text-[15px] font-semibold leading-[1.35] tracking-tight text-foreground">
                      {state.label}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {state.who}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {state.sees.map((line, idx) => {
                      const Symbol = line.hidden ? Lock : Check;
                      return (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Symbol
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              line.hidden ? "text-muted-foreground" : "text-primary"
                            }`}
                            aria-hidden
                          />
                          <span className={line.hidden ? "text-muted-foreground" : "text-foreground/85"}>
                            {line.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Access flow */}
          <div className="mt-6 rounded-md border border-border bg-cool-gray p-5 md:mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t.access_flowTitle}
            </p>
            <ol className="mt-4 grid gap-3 md:grid-cols-4">
              {t.access_flowSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[11px] font-bold text-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* How YORSO helps */}
      <section className="border-b border-border/50 bg-cool-gray">
        <div className="container py-10 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.help_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.help_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.help_subtitle}
            </p>
          </div>
          <ul className="mt-6 grid gap-3 md:mt-10 md:block md:gap-0 md:divide-y md:divide-border md:border-y md:border-border">
            {t.help_items.map((item, i) => {
              const Icon = helpIcons[i] ?? Lock;
              return (
                <li
                  key={item.title}
                  className="grid gap-2 rounded-lg border border-border border-l-4 border-l-primary bg-card p-4 shadow-sm md:gap-10 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:py-6 md:shadow-none md:grid-cols-[280px_1fr]"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <h3 className="font-heading text-[17px] font-semibold leading-[1.3] tracking-tight text-foreground md:text-lg">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* What supplier gets */}
      <section className="border-b border-border/50">
        <div className="container py-10 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.gets_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.gets_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.gets_subtitle}
            </p>
          </div>
          <ol className="mt-6 grid gap-3 md:mt-10 md:gap-x-10 md:gap-y-8 md:grid-cols-2">
            {t.gets_items.map((item, i) => {
              const Icon = getsIcons[i] ?? ListChecks;
              return (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
                >
                  <div className="flex flex-col items-center gap-1 md:gap-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground md:h-auto md:w-auto md:rounded-none md:bg-transparent md:font-heading md:text-sm md:text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground md:mt-2 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-[17px] font-semibold leading-[1.3] tracking-tight text-foreground md:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Less noise — before / after */}
      <section className="border-b border-border/50 bg-cool-gray">
        <div className="container py-10 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.noise_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.noise_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.noise_subtitle}
            </p>
          </div>
          <div className="mt-6 grid gap-px md:mt-10 overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
            {/* Before */}
            <div className="bg-background p-6">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t.noise_beforeLabel}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {t.noise_before.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground line-through decoration-muted-foreground/40"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* After */}
            <div className="bg-background p-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {t.noise_afterLabel}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {t.noise_after.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-border/50 bg-background py-12 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.faq_eyebrow}
            </p>
            <h2 className="mt-3 md:mt-4 font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.faq_title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.faq_subtitle}
            </p>
            <Accordion type="single" collapsible className="mt-6 w-full md:mt-10">
              {t.faq_items.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-warm-bg py-12 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card px-6 py-10 text-center shadow-sm md:px-12 md:py-14">
            <h2 className="font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[36px] md:leading-[1.1]">
              {t.cta_title}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-[1.65] text-muted-foreground md:mt-4 md:text-base md:leading-[1.7]">
              {t.cta_subtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8">
              <Link
                to="/register"
                onClick={() => analytics.track("supplier_page_cta_register_click", { surface: "final" })}
              >
                <Button size="lg" className="gap-2 px-8 text-base font-semibold shadow-sm">
                  {t.cta_primary}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link
                to="/offers"
                onClick={() => analytics.track("supplier_page_cta_requests_click", { surface: "final" })}
              >
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base font-semibold">
                  {t.cta_secondary}
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground md:mt-4">{t.cta_note}</p>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default ForSuppliers;
