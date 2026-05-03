import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Mail,
  ListTree,
  Sparkles,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { blogPosts, getBlogPostBySlug, type BlogPost } from "@/data/blogPosts";
import { getLocalizedPost, localizedCategoryLabel } from "@/data/blogPostsI18n";
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

interface ResolvedCta {
  to: string;
  label: string;
}

type Translator = ReturnType<typeof useLanguage>["t"];

const resolveCta = (t: Translator, post: BlogPost): ResolvedCta => {
  switch (post.contentType) {
    case "market_intelligence":
      return { to: "/offers", label: t.blog_cta_marketIntel };
    case "buyer_guide":
      return { to: "/offers", label: t.blog_cta_buyerGuide };
    case "supplier_guide":
      return { to: "/for-suppliers", label: t.blog_cta_supplierGuide };
    case "product_update":
      return {
        to: post.productUpdate?.relatedRoute ?? post.relatedCta ?? "/offers",
        label: t.blog_cta_productUpdate,
      };
    case "glossary":
      return { to: "/blog", label: t.blog_cta_glossary };
    default:
      return { to: post.relatedCta ?? "/offers", label: t.blog_cta_default };
  }
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const stripPunct = (s: string) => s.replace(/[.!?]+$/g, "");

const buildAnswerCapsule = (post: BlogPost): string => {
  const first = post.sections[0]?.paragraphs[0] ?? post.excerpt;
  const words = first.split(/\s+/);
  if (words.length <= 70) return first;
  return words.slice(0, 60).join(" ") + ".";
};

const buildKeyTakeaways = (post: BlogPost): string[] => {
  const out: string[] = [];
  for (const s of post.sections) {
    if (s.bullets && s.bullets.length) {
      for (const b of s.bullets) {
        if (out.length < 4) out.push(b);
      }
    }
  }
  if (out.length < 3) {
    for (const s of post.sections) {
      const first = s.paragraphs[0];
      if (first) {
        const sentence = first.split(/(?<=[.!?])\s+/)[0];
        if (sentence && !out.includes(sentence) && out.length < 4) out.push(sentence);
      }
    }
  }
  return out.slice(0, 4);
};

const buildFaq = (post: BlogPost): { q: string; a: string }[] => {
  const useFaq =
    post.contentType === "buyer_guide" ||
    post.contentType === "supplier_guide" ||
    post.contentType === "glossary";
  if (!useFaq) return [];
  return post.sections.slice(0, 3).map((s) => ({
    q: stripPunct(s.heading).endsWith("?") ? s.heading : `${stripPunct(s.heading)}?`,
    a: s.paragraphs[0] ?? "",
  }));
};

interface CompactTableRow {
  k: string;
  v: string;
}

const buildCompactTable = (post: BlogPost): { caption: string; rows: CompactTableRow[] } | null => {
  const wantTable =
    post.contentType === "market_intelligence" ||
    post.contentType === "buyer_guide" ||
    post.contentType === "supplier_guide";
  if (!wantTable) return null;

  const sectionWithBullets = post.sections.find((s) => s.bullets && s.bullets.length >= 3);
  if (!sectionWithBullets || !sectionWithBullets.bullets) return null;

  const rows: CompactTableRow[] = sectionWithBullets.bullets.slice(0, 6).map((b) => {
    const idx = b.indexOf(":");
    if (idx > 0) {
      return { k: b.slice(0, idx).trim(), v: b.slice(idx + 1).trim() };
    }
    return { k: b, v: "—" };
  });
  return { caption: sectionWithBullets.heading, rows };
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const rawPost = slug ? getBlogPostBySlug(slug) : undefined;
  const post = useMemo(
    () => (rawPost ? getLocalizedPost(rawPost, lang) : undefined),
    [rawPost, lang],
  );

  const [emailDraft, setEmailDraft] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [lang],
  );

  const toc = useMemo(() => {
    if (!post) return [] as { id: string; heading: string }[];
    return post.sections.map((s) => ({ id: slugify(s.heading), heading: s.heading }));
  }, [post]);

  const related = useMemo(() => {
    if (!post) return [] as BlogPost[];
    const localized = blogPosts.map((p) => getLocalizedPost(p, lang));
    const sameSpecies = localized.filter(
      (p) =>
        p.id !== post.id &&
        (p.speciesTags ?? []).some((s) => (post.speciesTags ?? []).includes(s)),
    );
    const sameType = localized.filter(
      (p) => p.id !== post.id && p.contentType === post.contentType,
    );
    const merged: BlogPost[] = [];
    for (const p of [...sameSpecies, ...sameType]) {
      if (!merged.find((m) => m.id === p.id)) merged.push(p);
      if (merged.length >= 3) break;
    }
    if (merged.length < 3) {
      for (const p of localized) {
        if (p.id === post.id) continue;
        if (!merged.find((m) => m.id === p.id)) merged.push(p);
        if (merged.length >= 3) break;
      }
    }
    return merged.slice(0, 3);
  }, [post, lang]);

  const cta = useMemo(() => (post ? resolveCta(t, post) : null), [post, t]);
  const answerCapsule = useMemo(() => (post ? buildAnswerCapsule(post) : ""), [post]);
  const takeaways = useMemo(() => (post ? buildKeyTakeaways(post) : []), [post]);
  const faq = useMemo(() => (post ? buildFaq(post) : []), [post]);
  const table = useMemo(() => (post ? buildCompactTable(post) : null), [post]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const canonicalHref = absoluteUrl(`/blog/${slug ?? ""}`);

    if (post) {
      const title = `${post.seoTitle} · YORSO`;
      const ogImage = post.heroImage ? absoluteUrl(post.heroImage) : undefined;
      applyRouteSeo({
        title,
        description: post.seoDescription,
        canonical: canonicalHref,
        og: {
          type: "article",
          title: post.seoTitle,
          description: post.seoDescription,
          url: canonicalHref,
          image: ogImage,
        },
      });

      // JSON-LD: BlogPosting
      upsertJsonLd("article", {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.seoDescription,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: { "@type": "Organization", name: post.authorName },
        publisher: { "@type": "Organization", name: "YORSO" },
        image: ogImage ? [ogImage] : undefined,
        mainEntityOfPage: canonicalHref,
        articleSection: post.category,
        keywords: [...(post.speciesTags ?? []), ...(post.countryTags ?? [])].join(", "),
      });

      // JSON-LD: BreadcrumbList
      upsertJsonLd("breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.supplier_breadcrumb_home, item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: t.blog_breadcrumb, item: absoluteUrl("/blog") },
          { "@type": "ListItem", position: 3, name: post.title, item: canonicalHref },
        ],
      });

      if (faq.length) {
        upsertJsonLd("faq", {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        });
      } else {
        removeJsonLd("faq");
      }
    } else {
      applyRouteSeo({
        title: `${t.blog_notFoundTitle} · YORSO`,
        description: t.blog_notFoundBody,
        canonical: canonicalHref,
      });
    }

    return () => {
      removeJsonLd("article");
      removeJsonLd("faq");
      removeJsonLd("breadcrumb");
      clearRouteSeoMarker();
    };
  }, [post, slug, t, faq]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main">
          <div className="container py-16">
            <div
              data-testid="blog-not-found"
              className="mx-auto max-w-xl rounded-lg border border-dashed border-border bg-card p-8 text-center"
            >
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
              <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">
                {t.blog_notFoundTitle}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.blog_notFoundBody}</p>
              <Button asChild className="mt-5">
                <Link to="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.blog_backToIndex}
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitted(true);
  };

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
                {t.supplier_breadcrumb_home}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
              <Link to="/blog" className="hover:text-foreground">
                {t.blog_breadcrumb}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
              <span className="line-clamp-1 min-w-0 font-medium text-foreground">
                {post.title}
              </span>
            </nav>
          </div>
        </div>

        <article data-testid="blog-article" className="bg-background">
          {/* Header */}
          <header className="border-b border-border bg-gradient-to-b from-background to-cool-gray/30">
            <div className="container py-10 md:py-14">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {localizedCategoryLabel(t, post.contentType)}
                </span>
                <span>{audienceLabel(t, post.audience)}</span>
              </div>
              <h1 className="mt-3 max-w-3xl font-heading text-[30px] font-bold leading-tight tracking-tight text-foreground md:text-[42px]">
                {post.title}
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  {interpolate(t.blog_publishedOn, {
                    date: dateFmt.format(new Date(post.publishedAt)),
                  })}
                </span>
                {post.updatedAt && post.updatedAt !== post.publishedAt && (
                  <span>
                    {interpolate(t.blog_updatedOn, {
                      date: dateFmt.format(new Date(post.updatedAt)),
                    })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {interpolate(t.blog_minutesRead, { n: post.readingTimeMinutes })}
                </span>
                <span>{interpolate(t.blog_byAuthor, { name: post.authorName })}</span>
              </div>

              {(post.speciesTags?.length || post.countryTags?.length) ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(post.speciesTags ?? []).map((s) => (
                    <span
                      key={`s-${s}`}
                      className="rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary"
                    >
                      {s}
                    </span>
                  ))}
                  {(post.countryTags ?? []).map((c) => (
                    <span
                      key={`c-${c}`}
                      className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-foreground/80"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}

              {cta && (
                <div className="mt-6">
                  <Button asChild className="h-11 px-5">
                    <Link to={cta.to} data-testid="blog-header-cta">
                      {cta.label}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </header>

          {/* Body */}
          <div className="container py-8 md:py-12">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t.blog_mockNotice}
                </p>

                {/* Mobile TOC */}
                {toc.length > 0 && (
                  <details
                    data-testid="blog-toc-mobile"
                    className="mt-5 rounded-lg border border-border bg-card p-4 lg:hidden"
                  >
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
                      <ListTree className="h-4 w-4 text-primary" aria-hidden />
                      {t.blog_onThisPage}
                    </summary>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            {item.heading}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Answer capsule */}
                <div
                  data-testid="blog-answer-capsule"
                  className="mt-6 rounded-lg border border-border bg-card p-5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {t.blog_quickAnswer}
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
                    {answerCapsule}
                  </p>
                </div>

                {post.heroImage && (
                  <img
                    src={post.heroImage}
                    alt={post.heroImageAlt}
                    className="mt-6 aspect-[16/9] w-full rounded-lg border border-border object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                )}

                {/* Product update structured block */}
                {post.contentType === "product_update" && post.productUpdate && (
                  <div
                    data-testid="blog-product-update"
                    className="mt-8 overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-5 py-3">
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {post.productUpdate.updateType}
                      </span>
                      <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {post.productUpdate.affectedArea}
                      </span>
                      {post.productUpdate.prototype && (
                        <span className="rounded-full border border-dashed border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                          {t.blog_pu_prototypeBadge}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-5 p-5 md:grid-cols-2">
                      <div>
                        <h2 className="font-heading text-base font-semibold text-foreground">
                          {t.blog_pu_whatChanged}
                        </h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">
                          {post.sections[0]?.paragraphs[0] ?? post.excerpt}
                        </p>
                      </div>
                      <div>
                        <h2 className="font-heading text-base font-semibold text-foreground">
                          {t.blog_pu_whoBenefits}
                        </h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">
                          {post.productUpdate.userBenefit}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h2 className="font-heading text-base font-semibold text-foreground">
                          {t.blog_pu_howToUse}
                        </h2>
                        <ol className="mt-2 space-y-1.5 pl-5 text-[14px] leading-relaxed text-foreground/85 list-decimal">
                          {post.productUpdate.howToUse.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 p-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t.blog_pu_relatedWorkflow}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">
                            {post.productUpdate.relatedRoute}
                          </p>
                        </div>
                        <Button asChild>
                          <Link
                            to={post.productUpdate.relatedRoute}
                            data-testid="blog-product-update-cta"
                          >
                            {t.blog_pu_tryWorkflow}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sections */}
                <div className="mt-8 space-y-10">
                  {post.sections.map((s, i) => {
                    const id = slugify(s.heading);
                    return (
                      <section key={i} id={id} className="scroll-mt-24">
                        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                          {s.heading}
                        </h2>
                        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/90">
                          {s.paragraphs.map((p, j) => (
                            <p key={j}>{p}</p>
                          ))}
                        </div>
                        {s.bullets && s.bullets.length > 0 && (
                          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground/90">
                            {s.bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </div>

                {/* Compact table */}
                {table && (
                  <div
                    data-testid="blog-compact-table"
                    className="mt-10 overflow-hidden rounded-lg border border-border"
                  >
                    <div className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {table.caption}
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {table.rows.map((r, i) => (
                          <tr
                            key={i}
                            className={cn(
                              "border-b border-border last:border-b-0",
                              i % 2 === 0 ? "bg-background" : "bg-muted/20",
                            )}
                          >
                            <th
                              scope="row"
                              className="w-1/3 px-4 py-2.5 text-left align-top font-semibold text-foreground"
                            >
                              {r.k}
                            </th>
                            <td className="px-4 py-2.5 align-top text-foreground/80">{r.v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Key takeaways */}
                {takeaways.length > 0 && (
                  <div
                    data-testid="blog-takeaways"
                    className="mt-10 rounded-lg border border-primary/30 bg-primary/5 p-5"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                      <h2 className="font-heading text-base font-semibold text-foreground">
                        {t.blog_keyTakeaways}
                      </h2>
                    </div>
                    <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground/90">
                      {takeaways.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* FAQ */}
                {faq.length > 0 && (
                  <div className="mt-10" data-testid="blog-faq">
                    <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {t.blog_frequentlyAsked}
                    </h2>
                    <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
                      {faq.map((f, i) => (
                        <details key={i} className="group p-4">
                          <summary className="flex cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold text-foreground">
                            {f.q}
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" aria-hidden />
                          </summary>
                          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                            {f.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related YORSO links */}
                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  {cta && (
                    <Link
                      to={cta.to}
                      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary"
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t.blog_continueOnYorso}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
                          {cta.label}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                    </Link>
                  )}
                  <Link
                    to="/how-it-works"
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.blog_learnMore}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
                        {t.nav_howItWorks}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                  </Link>
                </div>

                <div className="mt-10">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/blog">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t.blog_backToIndex}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right rail */}
              <aside className="hidden space-y-5 lg:block lg:sticky lg:top-24 lg:self-start">
                {toc.length > 0 && (
                  <nav
                    aria-label={t.blog_onThisPage}
                    data-testid="blog-toc"
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <ListTree className="h-4 w-4 text-primary" aria-hidden />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                        {t.blog_onThisPage}
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="block text-muted-foreground hover:text-primary"
                          >
                            {item.heading}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                {related.length > 0 && (
                  <div
                    data-testid="blog-related"
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {t.blog_relatedArticles}
                    </p>
                    <ul className="mt-3 space-y-3">
                      {related.map((r) => (
                        <li key={r.id}>
                          <Link
                            to={`/blog/${r.slug}`}
                            className="group block"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                              {localizedCategoryLabel(t, r.contentType)}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                              {r.title}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {interpolate(t.blog_minutesRead, { n: r.readingTimeMinutes })}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cta && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {t.blog_takeAction}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{cta.label}</p>
                    <Button asChild size="sm" className="mt-3 w-full">
                      <Link to={cta.to}>
                        {t.blog_open}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                )}

                <form
                  onSubmit={handleSubmitEmail}
                  data-testid="blog-newsletter"
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" aria-hidden />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {t.blog_newsletterTitle}
                    </p>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {t.blog_newsletterBody}
                  </p>
                  {emailSubmitted ? (
                    <p className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                      {t.blog_newsletterSuccess}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <label htmlFor="blog-newsletter-email" className="sr-only">
                        {t.blog_newsletterEmailLabel}
                      </label>
                      <Input
                        id="blog-newsletter-email"
                        type="email"
                        required
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        placeholder={t.blog_newsletterEmailPlaceholder}
                        className="h-9"
                      />
                      <Button type="submit" size="sm" className="w-full">
                        {t.blog_newsletterSubmit}
                      </Button>
                    </div>
                  )}
                </form>
              </aside>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogArticle;
