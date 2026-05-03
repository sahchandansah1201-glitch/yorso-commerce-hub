import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search, Clock, Calendar, ArrowRight, Compass, Sparkles } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { blogPosts, type BlogPost, type BlogContentType } from "@/data/blogPosts";
import { cn } from "@/lib/utils";
import {
  applyRouteSeo,
  upsertJsonLd,
  removeJsonLd,
  clearRouteSeoMarker,
  absoluteUrl,
} from "@/lib/seo";

const interpolate = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));


const audienceLabel = (
  t: ReturnType<typeof useLanguage>["t"],
  a: BlogPost["audience"],
) =>
  a === "buyer"
    ? t.blog_audienceBuyer
    : a === "supplier"
      ? t.blog_audienceSupplier
      : t.blog_audienceBoth;

type FilterKey = "all" | BlogContentType;

type Translator = ReturnType<typeof useLanguage>["t"];

const filterLabel = (t: Translator, key: FilterKey): string => {
  switch (key) {
    case "all":
      return t.blog_filter_all;
    case "market_intelligence":
      return t.blog_filter_marketIntelligence;
    case "buyer_guide":
      return t.blog_filter_buyerGuides;
    case "supplier_guide":
      return t.blog_filter_supplierGuides;
    case "product_update":
      return t.blog_filter_productUpdates;
    case "glossary":
      return t.blog_filter_glossary;
  }
};

const FILTER_KEYS: FilterKey[] = [
  "all",
  "market_intelligence",
  "buyer_guide",
  "supplier_guide",
  "product_update",
  "glossary",
];

const popularTopics = (t: Translator): string[] => [
  t.blog_topic_salmonPrices,
  t.blog_topic_shrimpImports,
  t.blog_topic_supplierVerification,
  t.blog_topic_rfq,
  t.blog_topic_priceAccess,
  t.blog_topic_landedCost,
  t.blog_topic_documentation,
];

const startHere = (
  t: Translator,
): { to: string; label: string; desc: string }[] => [
  { to: "/offers", label: t.blog_startHere_catalog_label, desc: t.blog_startHere_catalog_desc },
  { to: "/suppliers", label: t.blog_startHere_suppliers_label, desc: t.blog_startHere_suppliers_desc },
  { to: "/for-suppliers", label: t.blog_startHere_forSuppliers_label, desc: t.blog_startHere_forSuppliers_desc },
  { to: "/how-it-works", label: t.blog_startHere_howItWorks_label, desc: t.blog_startHere_howItWorks_desc },
];

const contentTypeLabel = (t: Translator, ct: BlogContentType): string =>
  filterLabel(t, ct);

const Blog = () => {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const TOPICS = useMemo(() => popularTopics(t), [t]);
  const START = useMemo(() => startHere(t), [t]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const canonical = absoluteUrl("/blog");
    const title = `${t.blog_pageTitle} · YORSO`;
    applyRouteSeo({
      title,
      description: t.blog_pageSubtitle,
      canonical,
      og: {
        type: "website",
        title,
        description: t.blog_pageSubtitle,
        url: canonical,
      },
    });
    return () => {
      removeJsonLd("blog-collection");
      clearRouteSeoMarker();
    };
  }, [t]);

  const sortedPosts = useMemo(
    () =>
      [...blogPosts].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [],
  );

  const featured = useMemo(
    () =>
      sortedPosts.find((p) => p.contentType === "market_intelligence") ?? sortedPosts[0],
    [sortedPosts],
  );

  const latestUpdates = useMemo(
    () => sortedPosts.filter((p) => p.contentType === "product_update").slice(0, 3),
    [sortedPosts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedPosts.filter((p) => {
      if (filter !== "all" && p.contentType !== filter) return false;
      if (!q) return true;
      const hay = [
        p.title,
        p.excerpt,
        p.category,
        p.authorName,
        ...(p.speciesTags ?? []),
        ...(p.countryTags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, filter, sortedPosts]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [lang],
  );

  const onTopicClick = (topic: string) => {
    setQuery(topic);
    setFilter("all");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main">
        <div className="border-b border-border bg-background">
          <div className="container py-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link to="/" className="hover:text-foreground">
                {t.supplier_breadcrumb_home}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">{t.blog_breadcrumb}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-background to-cool-gray/30">
          <div className="container py-10 md:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              YORSO Insights
            </p>
            <h1 className="mt-3 max-w-3xl font-heading text-[34px] font-bold leading-tight tracking-tight text-foreground md:text-[48px]">
              {t.blog_pageTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
              {t.blog_heroSubtitleLong}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => setFilter("market_intelligence")}
                className="h-11 px-5"
              >
                {t.blog_heroPrimaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilter("product_update")}
                className="h-11 px-5"
              >
                {t.blog_heroSecondaryCta}
              </Button>
            </div>
          </div>
        </section>

        {/* Featured */}
        {featured ? (
          <section className="border-b border-border bg-background">
            <div className="container py-10 md:py-14">
              <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                {t.blog_featuredEyebrow}
              </div>
              <article
                data-testid="blog-featured"
                className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-2"
              >
                <Link
                  to={`/blog/${featured.slug}`}
                  className="block aspect-[16/10] w-full overflow-hidden bg-muted md:aspect-auto md:h-full"
                  aria-label={featured.title}
                >
                  <img
                    src={featured.heroImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </Link>
                <div className="flex flex-col gap-4 p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
                      {featured.category}
                    </span>
                    <span>{audienceLabel(t, featured.audience)}</span>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-[28px]">
                    <Link
                      to={`/blog/${featured.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {dateFmt.format(new Date(featured.publishedAt))}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {interpolate(t.blog_minutesRead, { n: featured.readingTimeMinutes })}
                    </span>
                  </div>
                  {(featured.speciesTags?.length || featured.countryTags?.length) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(featured.speciesTags ?? []).map((s) => (
                        <span
                          key={`s-${s}`}
                          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
                        >
                          {s}
                        </span>
                      ))}
                      {(featured.countryTags ?? []).slice(0, 4).map((c) => (
                        <span
                          key={`c-${c}`}
                          className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div>
                    <Button asChild className="h-10">
                      <Link to={`/blog/${featured.slug}`}>
                        {t.blog_readMore}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </section>
        ) : null}

        {/* Filters + Search */}
        <section className="border-b border-border bg-background">
          <div className="container py-6 md:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t.blog_filter_aria}
              >
                {FILTER_KEYS.map((key) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground/80 hover:border-foreground/30",
                      )}
                    >
                      {filterLabel(t, key)}
                    </button>
                  );
                })}
              </div>
              <div className="relative w-full md:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.blog_searchPlaceholder}
                  aria-label={t.blog_searchAria}
                  className="h-11 pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Grid + sidebar */}
        <section className="bg-background">
          <div className="container py-8 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <div className="min-w-0">
                {filtered.length === 0 ? (
                  <div
                    data-testid="blog-empty"
                    className="rounded-lg border border-dashed border-border bg-card p-8 text-center"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {t.blog_emptyTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.blog_emptyBody}
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery("");
                          setFilter("all");
                        }}
                      >
                        {t.blog_browseAll}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul
                    className="grid gap-5 sm:grid-cols-2"
                    data-testid="blog-list"
                  >
                    {filtered.map((p) => {
                      const isMI = p.contentType === "market_intelligence";
                      const isPU = p.contentType === "product_update";
                      return (
                        <li key={p.id}>
                          <article
                            data-testid="blog-card"
                            data-content-type={p.contentType}
                            className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-foreground/20"
                          >
                            <Link
                              to={`/blog/${p.slug}`}
                              className="block aspect-[16/9] w-full overflow-hidden bg-muted"
                              aria-label={p.title}
                            >
                              <img
                                src={p.heroImage}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </Link>
                            <div className="flex flex-1 flex-col gap-3 p-5">
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                                  {contentTypeLabel(t, p.contentType)}
                                </span>
                                <span>{audienceLabel(t, p.audience)}</span>
                              </div>
                              <h3 className="font-heading text-lg font-semibold leading-snug tracking-tight text-foreground">
                                <Link
                                  to={`/blog/${p.slug}`}
                                  className="hover:text-primary hover:underline"
                                >
                                  {p.title}
                                </Link>
                              </h3>
                              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                                {p.excerpt}
                              </p>

                              {isMI && ((p.speciesTags?.length ?? 0) + (p.countryTags?.length ?? 0) > 0) ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {(p.speciesTags ?? []).map((s) => (
                                    <span
                                      key={s}
                                      className="rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[11px] font-semibold text-primary"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                  {(p.countryTags ?? []).slice(0, 4).map((c) => (
                                    <span
                                      key={c}
                                      className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              ) : null}

                              {isPU ? (
                                <div className="space-y-2">
                                  {p.productUpdate ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                        {p.productUpdate.updateType}
                                      </span>
                                      <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {p.productUpdate.affectedArea}
                                      </span>
                                      {p.productUpdate.prototype ? (
                                        <span className="rounded-full border border-dashed border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                                          {t.blog_pu_prototypeBadge}
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] leading-relaxed text-foreground/80">
                                    <span className="font-semibold text-foreground">{t.blog_pu_whatChanged}:</span>{" "}
                                    {p.excerpt.split(".")[0]}.
                                  </div>
                                  {p.productUpdate?.userBenefit ? (
                                    <div className="rounded-md border border-border bg-background px-3 py-2 text-[12px] leading-relaxed text-foreground/80">
                                      <span className="font-semibold text-foreground">{t.blog_pu_whoBenefits}:</span>{" "}
                                      {p.productUpdate.userBenefit}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" aria-hidden />
                                  {dateFmt.format(new Date(p.publishedAt))}
                                </span>
                                <span aria-hidden>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" aria-hidden />
                                  {interpolate(t.blog_minutesRead, { n: p.readingTimeMinutes })}
                                </span>
                              </div>
                              <div className="pt-1">
                                <Link
                                  to={`/blog/${p.slug}`}
                                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                                >
                                  {t.blog_readMore}
                                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                </Link>
                              </div>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                    {t.blog_popularTopics}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => onTopicClick(topic)}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition hover:border-primary hover:text-primary"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-primary" aria-hidden />
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                      {t.blog_startHere}
                    </h2>
                  </div>
                  <ul className="mt-3 space-y-3">
                    {START.map((s) => (
                      <li key={s.to}>
                        <Link
                          to={s.to}
                          className="group block rounded-md border border-transparent p-2 transition hover:border-border hover:bg-muted/40"
                        >
                          <div className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground group-hover:text-primary">
                            {s.label}
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {s.desc}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {latestUpdates.length > 0 && (
          <section
            data-testid="blog-latest-updates"
            className="border-t border-border bg-cool-gray/30"
          >
            <div className="container py-10 md:py-14">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {t.blog_pu_changelogEyebrow}
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
                    {t.blog_pu_latestUpdates}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("product_update");
                    setQuery("");
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {t.blog_pu_seeAllUpdates}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {latestUpdates.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/blog/${p.slug}`}
                      data-testid="blog-latest-update-link"
                      className="group flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-4 transition hover:border-primary"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {p.productUpdate ? (
                          <>
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                              {p.productUpdate.updateType}
                            </span>
                            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {p.productUpdate.affectedArea}
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t.blog_pu_genericBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                        {p.title}
                      </p>
                      <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                        {p.productUpdate?.userBenefit ?? p.excerpt}
                      </p>
                      <p className="mt-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" aria-hidden />
                        {dateFmt.format(new Date(p.publishedAt))}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
