import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search, Clock, Calendar } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { blogPosts, blogCategories, type BlogPost } from "@/data/blogPosts";
import { cn } from "@/lib/utils";

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

const Blog = () => {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.title;
    document.title = `${t.blog_pageTitle} · YORSO`;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: t.blog_pageSubtitle,
    });
    return () => {
      document.title = prev;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts.filter((p) => {
      if (category && p.category !== category) return false;
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
  }, [query, category]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [lang],
  );

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

        <section className="border-b border-border bg-gradient-to-b from-background to-cool-gray/30">
          <div className="container py-10 md:py-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              YORSO Insights
            </p>
            <h1 className="mt-3 max-w-3xl font-heading text-[34px] font-bold leading-tight tracking-tight text-foreground md:text-[44px]">
              {t.blog_pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {t.blog_pageSubtitle}
            </p>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-md">
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

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Categories">
              <button
                type="button"
                onClick={() => setCategory(null)}
                aria-pressed={category === null}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  category === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground/80 hover:border-foreground/30",
                )}
              >
                {t.blog_allCategories}
              </button>
              {blogCategories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(active ? null : c)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/80 hover:border-foreground/30",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container py-8 md:py-12">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm font-medium text-foreground">{t.blog_emptyTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.blog_emptyBody}</p>
              </div>
            ) : (
              <ul
                className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                data-testid="blog-list"
              >
                {filtered.map((p) => (
                  <li key={p.id}>
                    <article
                      data-testid="blog-card"
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
                            {p.category}
                          </span>
                          <span>{audienceLabel(t, p.audience)}</span>
                        </div>
                        <h2 className="font-heading text-lg font-semibold leading-snug tracking-tight text-foreground">
                          <Link
                            to={`/blog/${p.slug}`}
                            className="hover:text-primary hover:underline"
                          >
                            {p.title}
                          </Link>
                        </h2>
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {p.excerpt}
                        </p>
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
                          {(p.speciesTags ?? []).slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="pt-1">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link to={`/blog/${p.slug}`}>{t.blog_readMore}</Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
