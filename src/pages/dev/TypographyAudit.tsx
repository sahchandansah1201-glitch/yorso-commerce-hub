/**
 * Dev-only typography audit page.
 *
 * Goal: give designers/devs a single visual reference of the type scale
 * defined in src/index.css, plus a quick legend showing which classes
 * are SEMANTIC (preferred, stable API) versus LEGACY (hard-coded
 * text-[NNpx] sprinkles still surviving in the codebase).
 *
 * This page is wired at /dev/typography. It is not linked from the
 * public site and is safe to keep around — it has no side effects,
 * no API calls, and reads no app state.
 */
import { Link } from "react-router-dom";

type Row = {
  /** the actual visual sample */
  sample: React.ReactNode;
  /** class string applied to the sample */
  className: string;
  /** when to use it */
  usage: string;
  /** semantic = preferred token; base = global tag default; legacy = avoid */
  kind: "semantic" | "base" | "legacy";
};

const KindBadge = ({ kind }: { kind: Row["kind"] }) => {
  const map = {
    semantic: { label: "semantic", cls: "bg-success/15 text-success border-success/30" },
    base: { label: "base tag", cls: "bg-accent/10 text-accent border-accent/30" },
    legacy: { label: "legacy", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  } as const;
  const v = map[kind];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${v.cls}`}
    >
      {v.label}
    </span>
  );
};

const Section = ({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Row[];
}) => (
  <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <header className="mb-5 border-b border-border pb-3">
      <h2 className="text-section-title">{title}</h2>
      <p className="text-meta mt-1">{description}</p>
    </header>
    <div className="divide-y divide-border">
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[1fr_280px] md:gap-6"
        >
          <div className="min-w-0">{r.sample}</div>
          <div className="flex flex-col gap-1.5">
            <KindBadge kind={r.kind} />
            <code className="text-micro break-all rounded bg-muted px-2 py-1 font-mono text-foreground">
              {r.className}
            </code>
            <p className="text-meta">{r.usage}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const TypographyAudit = () => {
  const baseRows: Row[] = [
    {
      sample: <h1>H1 — Page title (Plus Jakarta Sans)</h1>,
      className: "h1 (global) → text-3xl md:text-4xl font-bold",
      usage: "Top of any page. One per route.",
      kind: "base",
    },
    {
      sample: <h2>H2 — Section title</h2>,
      className: "h2 (global) → text-2xl md:text-[28px] font-semibold",
      usage: "Top of a major section inside a page.",
      kind: "base",
    },
    {
      sample: <h3>H3 — Subsection / card heading</h3>,
      className: "h3 (global) → text-lg md:text-xl font-semibold",
      usage: "Card titles, subsections, panels.",
      kind: "base",
    },
    {
      sample: <h4>H4 — Small heading</h4>,
      className: "h4 (global) → text-base md:text-[17px] font-semibold",
      usage: "Group labels inside a card.",
      kind: "base",
    },
    {
      sample: <h5>H5 — Label heading</h5>,
      className: "h5 (global) → text-sm font-semibold",
      usage: "Dense form/field group labels.",
      kind: "base",
    },
    {
      sample: <h6>H6 — UPPERCASE MICRO LABEL</h6>,
      className: "h6 (global) → text-xs uppercase tracking-wide",
      usage: "Eyebrow labels above a section title.",
      kind: "base",
    },
    {
      sample: (
        <p>
          Body paragraph baseline (14px / text-sm). Inherits from <code>body</code>{" "}
          and from the <code>p</code> base rule. This is the catalog flow size.
        </p>
      ),
      className: "p / body (global) → text-sm leading-relaxed",
      usage: "Default paragraph copy across the site.",
      kind: "base",
    },
    {
      sample: <small>Small — secondary metadata text in muted color.</small>,
      className: "small (global) → text-xs text-muted-foreground",
      usage: "Inline secondary info next to body text.",
      kind: "base",
    },
  ];

  const semanticRows: Row[] = [
    {
      sample: <div className="text-display">Display 5xl — landing hero</div>,
      className: ".text-display",
      usage: "Hero numbers, landing display copy.",
      kind: "semantic",
    },
    {
      sample: <div className="text-page-title">Page title token</div>,
      className: ".text-page-title",
      usage: "Use on non-h1 elements that should look like h1.",
      kind: "semantic",
    },
    {
      sample: <div className="text-section-title">Section title token</div>,
      className: ".text-section-title",
      usage: "Use on non-h2 elements that should look like h2.",
      kind: "semantic",
    },
    {
      sample: <div className="text-card-title">Card title (17→18px)</div>,
      className: ".text-card-title",
      usage: "Catalog product name, offer card heading.",
      kind: "semantic",
    },
    {
      sample: <div className="text-body">Body token — same as p baseline.</div>,
      className: ".text-body",
      usage: "Apply to non-p containers needing body size.",
      kind: "semantic",
    },
    {
      sample: <div className="text-body-lg">Body-lg — slightly larger reading body.</div>,
      className: ".text-body-lg",
      usage: "Marketing/long-form paragraphs (15–16px).",
      kind: "semantic",
    },
    {
      sample: <div className="text-meta">Meta — 12px muted secondary info.</div>,
      className: ".text-meta",
      usage: "Captions, MOQ labels, supplier metadata.",
      kind: "semantic",
    },
    {
      sample: <div className="text-micro">Micro — 11→12px signal chips.</div>,
      className: ".text-micro",
      usage: "Trust chips, micro signals, tag pills.",
      kind: "semantic",
    },
    {
      sample: <div className="text-numeric">€ 12 450,00</div>,
      className: ".text-numeric",
      usage: "Prices, KPI numbers — tabular-nums included.",
      kind: "semantic",
    },
  ];

  const legacyRows: Row[] = [
    {
      sample: <div className="text-[17px]">Hard-coded text-[17px]</div>,
      className: 'className="text-[17px]"',
      usage: "Replace with .text-card-title.",
      kind: "legacy",
    },
    {
      sample: <div className="text-[19px] font-bold tabular-nums">€ 12 450,00</div>,
      className: 'className="text-[19px] font-bold tabular-nums"',
      usage: "Replace with .text-numeric.",
      kind: "legacy",
    },
    {
      sample: <div className="text-[11px] text-muted-foreground">text-[11px]</div>,
      className: 'className="text-[11px] text-muted-foreground"',
      usage: "Replace with .text-micro (+ muted token if needed).",
      kind: "legacy",
    },
    {
      sample: <div className="text-[13px]">text-[13px]</div>,
      className: 'className="text-[13px]"',
      usage: "Decide: .text-body (14) or .text-meta (12). No 13px.",
      kind: "legacy",
    },
  ];

  // Files known to still contain hard-coded text-[NNpx] usages.
  // Source: rg "text-\[1[0-9]px\]|text-\[2[0-9]px\]" (collected manually,
  // recorded here so the audit page surfaces remaining migration debt
  // without needing build-time tooling).
  const legacyFiles = [
    "src/components/CertificationBadges.tsx",
    "src/components/alerts/AlertsPanel.tsx",
    "src/components/catalog/AccessLevelSwitcher.tsx",
    "src/components/catalog/CatalogFilters.tsx",
    "src/components/catalog/CatalogOfferCard.tsx",
    "src/components/catalog/CatalogOfferRow.tsx",
    "src/components/catalog/CatalogRequestForm.tsx",
    "src/components/catalog/CompareTray.tsx",
    "src/components/catalog/IntelligenceRail.tsx",
    "src/components/catalog/RelatedRequests.tsx",
    "src/components/catalog/SelectedOfferPanel.tsx",
    "src/components/catalog/TrustProofStrip.tsx",
    "src/components/landing/Header.tsx",
    "src/components/landing/OfferCard.tsx",
    "src/components/landing/SocialProof.tsx",
    "src/components/offer-detail/OfferSummary.tsx",
    "src/components/offer-detail/RelatedArticles.tsx",
    "src/components/offer-detail/SimilarOffers.tsx",
    "src/components/offer-detail/SimilarProducts.tsx",
    "src/components/offer-detail/SupplierTrustPanel.tsx",
    "src/pages/OfferDetail.tsx",
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="text-meta mb-2 flex items-center gap-2">
            <Link to="/" className="hover:text-foreground hover:underline">
              ← Home
            </Link>
            <span>/ dev / typography</span>
          </div>
          <h1 className="text-page-title">Typography audit</h1>
          <p className="text-body-lg mt-2 max-w-2xl text-muted-foreground">
            Single source of truth for the YORSO type scale. Use this page to
            verify that every text element on the site comes from the same
            contract defined in <code>src/index.css</code> and pinned by{" "}
            <code>src/lib/typography-tokens.test.ts</code>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <KindBadge kind="base" />
            <span className="text-meta">
              Global tag default — applied automatically to every <code>h1..h6</code>,{" "}
              <code>p</code>, <code>small</code>.
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <KindBadge kind="semantic" />
            <span className="text-meta">
              Preferred reusable token — use on <code>div</code>/<code>span</code>{" "}
              when you need the same look without the semantic tag.
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <KindBadge kind="legacy" />
            <span className="text-meta">
              Hard-coded <code>text-[NNpx]</code> sprinkle — migrate to a
              semantic token.
            </span>
          </div>
        </div>
      </header>

      <div className="container space-y-8 py-10">
        <Section
          title="Global base styles"
          description="These are applied automatically to every semantic tag — no class needed."
          rows={baseRows}
        />

        <Section
          title="Semantic component tokens"
          description="Reusable classes defined in @layer components. Prefer these over arbitrary text-[NNpx]."
          rows={semanticRows}
        />

        <Section
          title="Legacy patterns to migrate"
          description="Anti-patterns that still appear in the codebase. Each one has a one-to-one semantic replacement."
          rows={legacyRows}
        />

        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-section-title text-destructive">
            Migration debt — files still using text-[NNpx]
          </h2>
          <p className="text-meta mt-1 mb-4">
            {legacyFiles.length} files contain hard-coded pixel sizes. Replace
            them with the semantic tokens above as you touch each file.
          </p>
          <ul className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {legacyFiles.map((f) => (
              <li
                key={f}
                className="text-micro rounded bg-card px-2 py-1 font-mono text-foreground"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
};

export default TypographyAudit;
