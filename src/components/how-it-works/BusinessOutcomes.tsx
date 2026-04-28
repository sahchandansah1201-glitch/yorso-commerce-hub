import {
  Clock,
  ShieldX,
  ClipboardCheck,
  LineChart,
  PackageCheck,
  Inbox,
  ThumbsUp,
  Sparkles,
  Eye,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Repeat,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Business Outcomes
 *
 * Serious procurement-grade outcomes — NOT vanity metrics, NOT
 * fabricated published results. Goal-oriented intents are clearly
 * labelled as design intents.
 */

interface Outcome {
  icon: LucideIcon;
  title: string;
  body: string;
}

const buyerOutcomes: Outcome[] = [
  {
    icon: Clock,
    title: "Less time wasted on supplier search",
    body: "Inbound discovery and structured filters replace days of WhatsApp and PDF chasing.",
  },
  {
    icon: ShieldX,
    title: "Fewer unreliable supplier conversations",
    body: "Evidence-led shortlisting filters out suppliers who cannot back up their claims.",
  },
  {
    icon: ClipboardCheck,
    title: "Better internal approval evidence",
    body: "A defensible procurement file: price benchmark, alternatives, audit trail.",
  },
  {
    icon: LineChart,
    title: "Clearer price and landed cost context",
    body: "Indicative ranges, market signals and landed-cost logic — not a single quoted number.",
  },
  {
    icon: PackageCheck,
    title: "Reduced document and logistics risk",
    body: "Document readiness, Incoterms and lead-time visibility before commitment.",
  },
];

const supplierOutcomes: Outcome[] = [
  {
    icon: Inbox,
    title: "More qualified inquiries",
    body: "RFQs filtered by category, country, volume and Incoterms relevance.",
  },
  {
    icon: ThumbsUp,
    title: "Stronger buyer confidence",
    body: "Verified evidence blocks help buyers pre-qualify before opening a conversation.",
  },
  {
    icon: Sparkles,
    title: "Better product presentation",
    body: "Structured product content, storytelling and merchandising in one workspace.",
  },
  {
    icon: Eye,
    title: "More useful visibility",
    body: "SEO supplier profile and category surfacing — visible to buyers actively searching.",
  },
  {
    icon: RefreshCw,
    title: "Repeatable sales workflow",
    body: "CRM, follow-up history and intent analytics turn one deal into a recurring relationship.",
  },
];

interface Goal {
  icon: LucideIcon;
  label: string;
  body: string;
}

const goals: Goal[] = [
  {
    icon: TrendingUp,
    label: "Supports traffic growth",
    body: "Structured product, supplier and category content for organic B2B seafood search.",
  },
  {
    icon: UserPlus,
    label: "Supports registration conversion",
    body: "Value visible before signup; account unlocks workspace, not basic context.",
  },
  {
    icon: Repeat,
    label: "Supports retention",
    body: "Workspace, CRM and decision proof reward repeat procurement cycles.",
  },
  {
    icon: ShieldCheck,
    label: "Supports trust growth",
    body: "Evidence-led trust stack with strict separation from paid placement.",
  },
];

const Card = ({ items, accent }: { items: Outcome[]; accent: "buyer" | "supplier" }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
    {items.map((o) => {
      const Icon = o.icon;
      return (
        <article
          key={o.title}
          className="flex gap-4 rounded-xl border border-border bg-card p-4 md:p-5"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              accent === "buyer"
                ? "bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold leading-snug text-foreground">
              {o.title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.body}</p>
          </div>
        </article>
      );
    })}
  </div>
);

const BusinessOutcomes = () => {
  return (
    <section
      id="business-outcomes"
      aria-label="Business outcomes"
      className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Business outcomes
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Outcomes the workflow is built to produce.
          </h2>
          <p className="mt-3 text-muted-foreground">
            These are the operational outcomes Yorso is designed to deliver across a procurement
            cycle — not vanity metrics, not fabricated results, not guarantees.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Buyer outcomes */}
          <div>
            <header className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                For buyers
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                Less risk per purchasing decision.
              </h3>
            </header>
            <Card items={buyerOutcomes} accent="buyer" />
          </div>

          {/* Supplier outcomes */}
          <div>
            <header className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                For suppliers
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                More qualified demand, less noise.
              </h3>
            </header>
            <Card items={supplierOutcomes} accent="supplier" />
          </div>
        </div>

        {/* Design intents — clearly labelled */}
        <div className="mt-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Design intents
            </p>
            <h3 className="mt-1 font-heading text-lg font-bold text-foreground md:text-xl">
              What this workflow is built to support
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              These are product goals — directional intents that guide design decisions, not
              published performance claims.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.label}
                  className="rounded-xl border border-dashed border-border bg-card/60 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-heading text-sm font-bold text-foreground">{g.label}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{g.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessOutcomes;
