import { Link } from "react-router-dom";
import { ArrowRight, Inbox, ShieldAlert, Eye, LayoutGrid, Lock, BadgeCheck, FileBadge, Package, LineChart, UserSquare2, ListChecks, KeyRound, MessagesSquare } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useForSuppliers } from "@/i18n/for-suppliers";
import { useEffect } from "react";

const painIcons = [Inbox, ShieldAlert, Eye, LayoutGrid];
const helpIcons = [Lock, BadgeCheck, FileBadge, Package, LineChart];
const getsIcons = [UserSquare2, Package, Inbox, KeyRound, MessagesSquare];

const ForSuppliers = () => {
  const t = useForSuppliers();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevTitle = document.title;
    document.title = t.seo_title;
    let descTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = descTag?.getAttribute("content") ?? null;
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", t.seo_description);
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) descTag?.setAttribute("content", prevDesc);
    };
  }, [t.seo_title, t.seo_description]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="border-b border-border bg-accent">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.hero_eyebrow}
            </p>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight text-accent-foreground md:text-5xl">
              {t.hero_title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-accent-foreground/75 md:text-lg">
              {t.hero_subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg" className="gap-2 px-7 text-base font-semibold">
                  {t.hero_ctaPrimary}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/offers">
                <Button size="lg" variant="outline" className="gap-2 px-7 text-base font-semibold">
                  {t.hero_ctaSecondary}
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-accent-foreground/55">{t.hero_note}</p>
          </div>
        </div>
      </section>

      {/* Pain map */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.pain_eyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t.pain_title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t.pain_subtitle}
            </p>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {t.pain_items.map((item, i) => {
              const Icon = painIcons[i] ?? Inbox;
              return (
                <div key={item.title} className="flex gap-4 border-l-2 border-border pl-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How YORSO helps */}
      <section className="border-b border-border bg-accent/40">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.help_eyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t.help_title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t.help_subtitle}
            </p>
          </div>
          <ul className="mt-10 divide-y divide-border border-y border-border">
            {t.help_items.map((item, i) => {
              const Icon = helpIcons[i] ?? Lock;
              return (
                <li key={item.title} className="grid gap-2 py-6 md:grid-cols-[280px_1fr] md:gap-10">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <h3 className="font-heading text-lg font-semibold text-foreground">
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
      <section className="border-b border-border">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t.gets_eyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t.gets_title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t.gets_subtitle}
            </p>
          </div>
          <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {t.gets_items.map((item, i) => {
              const Icon = getsIcons[i] ?? ListChecks;
              return (
                <li key={item.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="font-heading text-sm font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon className="mt-2 h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
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

      {/* Final CTA */}
      <section className="bg-accent py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-accent-foreground md:text-4xl">
              {t.cta_title}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-accent-foreground/70">
              {t.cta_subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="gap-2 px-8 text-base font-semibold">
                  {t.cta_primary}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/offers">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base font-semibold">
                  {t.cta_secondary}
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-accent-foreground/55">{t.cta_note}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForSuppliers;
