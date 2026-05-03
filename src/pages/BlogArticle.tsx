import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Calendar, Clock, ArrowLeft, AlertCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { getBlogPostBySlug, type BlogPost } from "@/data/blogPosts";

const interpolate = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

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

const audienceLabel = (
  t: ReturnType<typeof useLanguage>["t"],
  a: BlogPost["audience"],
) =>
  a === "buyer"
    ? t.blog_audienceBuyer
    : a === "supplier"
      ? t.blog_audienceSupplier
      : t.blog_audienceBoth;

const ctaLabel = (
  t: ReturnType<typeof useLanguage>["t"],
  cta: NonNullable<BlogPost["relatedCta"]>,
) => {
  switch (cta) {
    case "/offers":
      return t.blog_relatedCtaOffers;
    case "/suppliers":
      return t.blog_relatedCtaSuppliers;
    case "/for-suppliers":
      return t.blog_relatedCtaForSuppliers;
    case "/register":
      return t.blog_relatedCtaRegister;
  }
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [lang],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.title;
    if (post) {
      document.title = `${post.seoTitle} · YORSO`;
      upsertMeta('meta[name="description"]', {
        name: "description",
        content: post.seoDescription,
      });
    } else {
      document.title = `${t.blog_notFoundTitle} · YORSO`;
    }
    return () => {
      document.title = prev;
    };
  }, [post, t]);

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
              <ChevronRight className="h-3 w-3" aria-hidden />
              <Link to="/blog" className="hover:text-foreground">
                {t.blog_breadcrumb}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="line-clamp-1 font-medium text-foreground">{post.title}</span>
            </nav>
          </div>
        </div>

        <article data-testid="blog-article" className="bg-background">
          <header className="border-b border-border bg-gradient-to-b from-background to-cool-gray/30">
            <div className="container py-10 md:py-14">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {post.category}
                </span>
                <span>{audienceLabel(t, post.audience)}</span>
              </div>
              <h1 className="mt-3 max-w-3xl font-heading text-[30px] font-bold leading-tight tracking-tight text-foreground md:text-[40px]">
                {post.title}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  {interpolate(t.blog_publishedOn, { date: dateFmt.format(new Date(post.publishedAt)) })}
                </span>
                {post.updatedAt && post.updatedAt !== post.publishedAt && (
                  <span>
                    {interpolate(t.blog_updatedOn, { date: dateFmt.format(new Date(post.updatedAt)) })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {interpolate(t.blog_minutesRead, { n: post.readingTimeMinutes })}
                </span>
                <span>{interpolate(t.blog_byAuthor, { name: post.authorName })}</span>
              </div>
            </div>
          </header>

          <div className="container py-8 md:py-12">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t.blog_mockNotice}
                </p>

                {post.heroImage && (
                  <img
                    src={post.heroImage}
                    alt=""
                    className="mt-6 aspect-[16/9] w-full rounded-lg border border-border object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                )}

                <div className="mt-8 space-y-8">
                  {post.sections.map((s, i) => (
                    <section key={i}>
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
                  ))}
                </div>

                {post.relatedCta && (
                  <div className="mt-10 rounded-lg border border-border bg-card p-5">
                    <Button asChild className="gap-2">
                      <Link to={post.relatedCta}>{ctaLabel(t, post.relatedCta)}</Link>
                    </Button>
                  </div>
                )}

                <div className="mt-10">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/blog">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t.blog_backToIndex}
                    </Link>
                  </Button>
                </div>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                {(post.speciesTags?.length || post.countryTags?.length) && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    {post.speciesTags && post.speciesTags.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Species
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.speciesTags.map((s) => (
                            <span
                              key={s}
                              className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold text-foreground/80"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {post.countryTags && post.countryTags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Countries
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.countryTags.map((c) => (
                            <span
                              key={c}
                              className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold text-foreground/80"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
