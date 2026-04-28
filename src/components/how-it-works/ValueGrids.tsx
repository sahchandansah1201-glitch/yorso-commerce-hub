import {
  Search,
  ShieldCheck,
  FileSignature,
  GitCompare,
  LineChart,
  FileBadge,
  Truck,
  Users,
  ClipboardCheck,
  Box,
  Globe2,
  Inbox,
  Activity,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Buyer & Supplier Value Grids
 *
 * Two parallel, balanced grids showing what Yorso delivers to each side.
 * Trust separation enforced in the supplier grid:
 *   Verified  = evidence-backed
 *   Sponsored = paid visibility (Featured)
 *   Premium   = presentation & conversion support, not a trust shortcut
 */

interface ValueItem {
  icon: LucideIcon;
  title: string;
  body: string;
  tag?: { label: string; tone: "verified" | "sponsored" | "premium" };
}

const buyerItems: ValueItem[] = [
  {
    icon: Search,
    title: "Seafood product discovery",
    body: "Search by species, format, origin, certifications and supplier country.",
  },
  {
    icon: ShieldCheck,
    title: "Verified supplier evidence",
    body: "Registration, plant approval and certifications presented in a structured trust pack.",
  },
  {
    icon: FileSignature,
    title: "RFQ / request workflow",
    body: "Send a structured RFQ with quantity, packaging, Incoterms and delivery window.",
  },
  {
    icon: GitCompare,
    title: "Offer comparison",
    body: "Side-by-side comparison of price, MOQ, lead time, payment terms and documents.",
  },
  {
    icon: LineChart,
    title: "Price and market context",
    body: "Indicative price range, trend direction and origin-country news tied to the offer.",
  },
  {
    icon: FileBadge,
    title: "Document readiness",
    body: "Visibility into which certificates and shipping documents are already on file.",
  },
  {
    icon: Truck,
    title: "Landed cost and logistics context",
    body: "Estimated freight, duties and cold-chain risk surfaced before commitment.",
  },
  {
    icon: Users,
    title: "Team decision support",
    body: "Shared shortlist, comparison and notes for procurement, finance and quality teams.",
  },
  {
    icon: ClipboardCheck,
    title: "Procurement decision report",
    body: "Exportable record of price benchmark, evidence, alternatives and audit trail.",
  },
];

const supplierItems: ValueItem[] = [
  {
    icon: Box,
    title: "Product and company profile",
    body: "Structured product content with species, format, packaging, capacity and origin.",
  },
  {
    icon: ShieldCheck,
    title: "Supplier verification & evidence blocks",
    body: "Registration, plant approval, export licence and certificates in a standard trust pack.",
    tag: { label: "Verified · evidence-backed", tone: "verified" },
  },
  {
    icon: Globe2,
    title: "SEO / profile visibility",
    body: "Indexed supplier profile and product pages tuned for organic B2B seafood search.",
  },
  {
    icon: Inbox,
    title: "Qualified buyer requests",
    body: "RFQ inbox filtered by category, country, volume and Incoterms relevance.",
  },
  {
    icon: Activity,
    title: "Buyer intent signals",
    body: "What buyers are searching, requesting and shortlisting in your categories and origins.",
  },
  {
    icon: Sparkles,
    title: "Product storytelling & merchandising",
    body: "Origin story, plant photos and capacity narrative attached to listings.",
  },
  {
    icon: TrendingUp,
    title: "Inquiry conversion support",
    body: "Structured offer responses, comparable to other shortlisted suppliers.",
  },
  {
    icon: RefreshCw,
    title: "CRM, follow-up and repeat demand",
    body: "Per-buyer thread, follow-up history and repeat-order workflow.",
  },
  {
    icon: Sparkles,
    title: "Premium trust & visibility upgrade path",
    body: "Stronger presentation, merchandising emphasis and discovery placement. Visibility — not verification.",
    tag: { label: "Premium · paid presentation", tone: "premium" },
  },
];

const tagClass = (tone: "verified" | "sponsored" | "premium") => {
  if (tone === "verified") return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]";
  if (tone === "premium") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
};

const Grid = ({ items }: { items: ValueItem[] }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {items.map((it) => {
      const Icon = it.icon;
      return (
        <article
          key={it.title}
          className="flex h-full flex-col rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-heading text-sm font-bold leading-snug text-foreground">
              {it.title}
            </h4>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{it.body}</p>
          {it.tag && (
            <span
              className={`mt-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tagClass(
                it.tag.tone
              )}`}
            >
              {it.tag.label}
            </span>
          )}
        </article>
      );
    })}
  </div>
);

const ValueGrids = () => {
  return (
    <section
      id="outcomes"
      aria-label="What Yorso provides for buyers and suppliers"
      className="border-b border-border bg-background py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            What Yorso provides
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Balanced value for buyers and suppliers.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Buyers get decision-grade evidence. Suppliers get qualified demand and a place to prove
            it. Verified, Sponsored and Premium are kept visually separate — paid placement is
            never sold as trust.
          </p>
        </div>

        {/* Buyer grid */}
        <div className="mt-12">
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                For buyers
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                Procurement-grade decisions, defended internally.
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              9 capabilities · evidence-led
            </span>
          </header>
          <Grid items={buyerItems} />
        </div>

        {/* Supplier grid */}
        <div className="mt-14">
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                For suppliers
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                Qualified demand, structured evidence, repeat trade.
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              9 capabilities · verification ≠ paid placement
            </span>
          </header>
          <Grid items={supplierItems} />

          {/* Trust separation reminder */}
          <div className="mt-6 grid gap-2 rounded-xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground sm:grid-cols-3">
            <p>
              <strong className="text-[hsl(var(--success))]">Verified</strong> — evidence on file.
              Not a quality guarantee.
            </p>
            <p>
              <strong className="text-foreground">Sponsored / Featured</strong> — paid visibility.
              Does not affect verification status.
            </p>
            <p>
              <strong className="text-primary">Premium</strong> — stronger presentation and
              conversion support. Visibility, not trust.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueGrids;
