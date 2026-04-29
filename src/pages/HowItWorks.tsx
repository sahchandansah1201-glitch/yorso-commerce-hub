import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  KeyRound,
  ShieldCheck,
  FileText,
  Truck,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Network,
  Database,
  GitBranch,
  BadgeCheck,
  LineChart,
  PackageCheck,
  MessagesSquare,
  Scale,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import BuyerJourney from "@/components/how-it-works/BuyerJourney";
import ProcurementDecisionProof from "@/components/how-it-works/ProcurementDecisionProof";
import SupplierJourney from "@/components/how-it-works/SupplierJourney";
import TrustStack from "@/components/how-it-works/TrustStack";
import ValueGrids from "@/components/how-it-works/ValueGrids";
import AccessLevels from "@/components/how-it-works/AccessLevels";
import BusinessOutcomes from "@/components/how-it-works/BusinessOutcomes";
import ProofByNumbers from "@/components/how-it-works/ProofByNumbers";
import FinalCTA from "@/components/how-it-works/FinalCTA";
import { useHowItWorks } from "@/i18n/how-it-works";
import { useLanguage } from "@/i18n/LanguageContext";

const workflowIcons = [Search, KeyRound, ShieldCheck, FileText, Truck, RefreshCw];
const systemIcons = [Database, GitBranch, BadgeCheck, LineChart, PackageCheck, MessagesSquare];

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

const HowItWorks = () => {
  const t = useHowItWorks();
  const { lang } = useLanguage();

  useEffect(() => {
    const prevTitle = document.title;
    const prevDescription =
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute("content") ?? "";
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? "";

    document.title = t.seo_title;

    upsertMeta('meta[name="description"]', { name: "description", content: t.seo_description });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: t.seo_title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: t.seo_description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });

    const canonical =
      typeof window !== "undefined" ? `${window.location.origin}/how-it-works` : "/how-it-works";
    upsertLink("canonical", canonical);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "ld-how-it-works";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: t.seo_title,
      description: t.seo_description,
      inLanguage: lang,
      step: t.bj_steps.map((s) => ({ "@type": "HowToStep", name: s.title })),
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevDescription) {
        upsertMeta('meta[name="description"]', { name: "description", content: prevDescription });
        upsertMeta('meta[property="og:description"]', { property: "og:description", content: prevDescription });
      }
      upsertMeta('meta[property="og:title"]', { property: "og:title", content: prevTitle });
      if (prevCanonical) upsertLink("canonical", prevCanonical);
      document.getElementById("ld-how-it-works")?.remove();
    };
  }, [t, lang]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* HERO */}
        <section
          id="hero"
          className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[hsl(var(--cool-gray))] to-background"
        >
          <div className="container max-w-6xl py-12 md:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t.hero_eyebrow}
              </span>
              <h1 className="mt-4 font-heading text-[28px] font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:mt-5 md:text-5xl md:leading-[1.1] lg:text-6xl">
                {t.hero_titlePrefix}
                <span className="text-primary">{t.hero_titleHighlight}</span>
                {t.hero_titleSuffix}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:mt-5 md:text-lg">
                {t.hero_subtitle}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-8">
                <Button asChild size="lg" className="w-full font-semibold sm:w-auto">
                  <Link to="/offers">
                    {t.hero_ctaFind}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full font-semibold sm:w-auto">
                  <Link to="/offers#request">
                    <FileCheck2 className="mr-1.5 h-4 w-4" />
                    {t.hero_ctaRequestAccess}
                  </Link>
                </Button>
                <a
                  href="#system-map"
                  className="inline-flex h-10 items-center text-sm font-medium text-foreground/70 underline-offset-4 hover:text-primary hover:underline sm:ml-1"
                >
                  {t.hero_ctaScroll}
                </a>
              </div>
              <div className="mt-3 text-sm md:mt-4 md:text-xs">
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center text-foreground/70 underline-offset-4 hover:text-primary hover:underline"
                >
                  {t.hero_ctaSupplier} →
                </Link>
              </div>
            </div>

            {/* Workflow strip */}
            <div className="mt-10 rounded-xl border border-border bg-card p-4 shadow-sm md:mt-16 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.hero_workflow_eyebrow}
                </p>
                <span className="hidden text-xs text-muted-foreground md:inline">
                  {t.hero_workflow_caption}
                </span>
              </div>
              <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-6 md:gap-2">
                {t.hero_workflow_steps.map((label, idx) => {
                  const Icon = workflowIcons[idx] ?? Search;
                  const isLast = idx === t.hero_workflow_steps.length - 1;
                  return (
                    <li
                      key={label}
                      className="relative flex items-start gap-3 rounded-lg border border-border/60 bg-background px-3 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t.hero_workflow_step} {idx + 1}
                        </div>
                        <div className="text-[13px] font-semibold leading-snug text-foreground md:truncate md:text-sm">
                          {label}
                        </div>
                      </div>
                      {!isLast && (
                        <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/50 md:block" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* BUYER DECISION SNAPSHOT */}
        <section
          id="buyer-decision-snapshot"
          className="border-b border-border bg-background py-14 md:py-20"
        >
          <div className="container max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {t.bds_eyebrow}
              </span>
              <h2 className="mt-3 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {t.bds_title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-base">{t.bds_subtitle}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:gap-5 md:mt-12 md:grid-cols-3">
              {t.bds_cards.map((card, idx) => {
                const Icon = [ShieldCheck, Scale, FileCheck2][idx] ?? HelpCircle;
                return (
                  <article
                    key={card.question}
                    className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md md:p-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-heading text-[17px] font-bold leading-snug text-foreground md:text-lg">
                      {card.question}
                    </h3>

                    <div className="mt-4 space-y-4 text-[14px] md:text-sm">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t.bds_yorso}
                        </p>
                        <p className="mt-1.5 leading-relaxed text-foreground/85">{card.yorso}</p>
                      </div>
                      <div className="border-t border-border pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                          {t.bds_proof}
                        </p>
                        <p className="mt-1.5 leading-relaxed text-foreground/85">{card.proof}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="mx-auto mt-8 max-w-3xl text-center text-[13px] leading-relaxed text-muted-foreground">
              {t.bds_supplierNote}
            </p>
          </div>
        </section>

        <ProofByNumbers />

        {/* PROBLEM MAP — buyer-dominant, supplier as trust infrastructure */}
        <section id="problem-map" className="border-b border-border bg-background py-16 md:py-24">
          <div className="container max-w-6xl">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t.problem_eyebrow}
              </span>
              <h2 className="mt-3 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {t.problem_title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-base">
                {t.problem_subtitle}
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
              {/* Buyer pain — dominant column */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                      {t.problem_buyer_eyebrow}
                    </p>
                    <h3 className="mt-1.5 font-heading text-xl font-bold leading-snug text-foreground md:text-2xl">
                      {t.problem_buyer_title}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t.problem_buyer_lead}
                </p>

                <ol className="mt-6 divide-y divide-border">
                  {t.problem_buyer_pains.map((row, idx) => (
                    <li key={row.pain} className="grid gap-3 py-5 md:grid-cols-[28px_1fr] md:gap-5">
                      <div className="font-heading text-sm font-bold tabular-nums text-destructive/80 md:text-base">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="space-y-3">
                        <p className="font-heading text-[16px] font-semibold leading-snug text-foreground md:text-[17px]">
                          {row.pain}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {t.problem_buyer_consequenceLabel}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                              {row.consequence}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                              {t.problem_buyer_mechanismLabel}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                              {row.mechanism}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Supplier mechanism — secondary, trust-supporting column */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start xl:col-span-4">
                <div className="rounded-xl bg-[hsl(var(--cool-gray))] p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--success))]" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.problem_supplier_eyebrow}
                    </p>
                  </div>
                  <h3 className="mt-2 font-heading text-base font-bold leading-snug text-foreground md:text-[17px]">
                    {t.problem_supplier_title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {t.problem_supplier_lead}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {t.problem_supplier_pains.map((item) => (
                      <li key={item} className="flex gap-3 text-[13px] leading-relaxed text-foreground/80">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--success))]/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* SYSTEM MAP */}
        <section
          id="system-map"
          className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24"
        >
          <div className="container max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Network className="h-3.5 w-3.5" />
                {t.system_eyebrow}
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {t.system_title}
              </h2>
              <p className="mt-3 text-muted-foreground">{t.system_subtitle}</p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {t.system_blocks.map((block, idx) => {
                const Icon = systemIcons[idx] ?? Database;
                return (
                  <article
                    key={block.title}
                    className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.system_layer} {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                      {block.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {block.body}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-muted-foreground">
              {t.system_chain.map((label, idx) => (
                <span key={label} className="flex items-center gap-x-3">
                  <span className="rounded-md border border-border bg-card px-2.5 py-1">{label}</span>
                  {idx < t.system_chain.length - 1 && <ArrowRight className="h-3.5 w-3.5" />}
                </span>
              ))}
            </div>
          </div>
        </section>

        <BuyerJourney />
        <ProcurementDecisionProof />
        <SupplierJourney />
        <TrustStack />
        <ValueGrids />
        <AccessLevels />
        <BusinessOutcomes />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
