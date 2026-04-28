import {
  UserPlus,
  ShieldCheck,
  Search,
  Inbox,
  FileSignature,
  Sparkles,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Supplier Journey
 *
 * 7-step supplier flow on /how-it-works.
 * Each step states what the supplier does, what Yorso provides,
 * and the business outcome that improves.
 *
 * Trust rule (enforced in copy):
 *   Verified = evidence-backed.
 *   Featured / Sponsored = paid visibility.
 *   Premium = stronger presentation & conversion support.
 * Paid visibility is never described as "safer" or "better".
 */

interface Step {
  icon: LucideIcon;
  title: string;
  supplier: string;
  yorso: string;
  outcome: string;
  concept?: string;
}

const steps: Step[] = [
  {
    icon: UserPlus,
    title: "Create supplier profile and product listings",
    supplier:
      "Sets up the company profile and lists products with species, format, packaging, origin and capacity.",
    yorso:
      "Product Content Workspace with structured fields, draft state and reusable specifications across SKUs.",
    outcome: "Listings are searchable in the right categories from day one.",
    concept: "Product Content Workspace",
  },
  {
    icon: ShieldCheck,
    title: "Add verification evidence and export readiness",
    supplier:
      "Uploads company registration, plant approval, export licence, certificates and reference documents.",
    yorso:
      "Verified Supplier Trust Pack — a structured evidence block. Verified means evidence-backed, not a quality guarantee.",
    outcome: "Buyers can pre-qualify the supplier before opening a conversation.",
    concept: "Verified Supplier Trust Pack",
  },
  {
    icon: Search,
    title: "Get visibility in relevant product and category searches",
    supplier:
      "Publishes the profile and exposes products to buyer search, filters and category pages.",
    yorso:
      "SEO Supplier Profile with structured product, origin and certification metadata for organic discovery.",
    outcome: "Inbound discovery instead of outbound cold outreach.",
    concept: "SEO Supplier Profile",
  },
  {
    icon: Inbox,
    title: "Receive qualified RFQs and buyer intent signals",
    supplier:
      "Reviews incoming requests filtered by category, country, volume and Incoterms relevance.",
    yorso:
      "Qualified RFQ inbox + Buyer Intent signals — what buyers are searching, requesting and shortlisting.",
    outcome: "Sales time spent on real demand, not on noise.",
    concept: "Qualified RFQ / Buyer Intent",
  },
  {
    icon: FileSignature,
    title: "Respond with structured offer details",
    supplier:
      "Replies with price, MOQ, lead time, payment terms, Incoterms and document readiness in a standard format.",
    yorso:
      "Structured response template attached to the RFQ thread, comparable side-by-side by the buyer.",
    outcome: "Higher response-to-shortlist rate; fewer back-and-forth emails.",
  },
  {
    icon: Sparkles,
    title: "Improve conversion with better trust and storytelling",
    supplier:
      "Strengthens product storytelling: origin story, plant photos, packaging detail, capacity narrative.",
    yorso:
      "Product storytelling fields and merchandising blocks. Optional Premium presentation upgrades layout and discovery emphasis.",
    outcome: "Better inquiry-to-shortlist conversion, especially for new buyers.",
    concept: "Premium Visibility · paid presentation, separate from verification",
  },
  {
    icon: RefreshCw,
    title: "Build repeat demand through CRM and analytics",
    supplier:
      "Follows up on past inquiries, tracks repeat buyers and reads which formats and countries are pulling demand.",
    yorso:
      "CRM thread per buyer, follow-up history and Buyer Intent Analytics on category, country and format demand.",
    outcome: "Year-round pipeline instead of season-only spikes.",
    concept: "Buyer Intent Analytics",
  },
];

const SupplierJourney = () => {
  return (
    <section
      id="supplier-journey"
      aria-label="Supplier journey"
      className="border-b border-border bg-background py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            Supplier journey
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From a listed supplier to a year-round demand pipeline.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Suppliers do not buy trust on Yorso. They build it through evidence, structured product
            content and consistent response quality. Premium visibility is presentation — not a
            verification shortcut.
          </p>
        </div>

        {/* Definitions strip — non-negotiable trust separation */}
        <div className="mx-auto mt-8 grid max-w-4xl gap-2 rounded-xl border border-border bg-card p-3 text-xs sm:grid-cols-3">
          <div className="rounded-md bg-[hsl(var(--success))]/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--success))]">
              Verified
            </div>
            <div className="mt-0.5 text-foreground/80">Evidence-backed.</div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Featured / Sponsored
            </div>
            <div className="mt-0.5 text-foreground/80">Paid visibility.</div>
          </div>
          <div className="rounded-md bg-primary/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Premium
            </div>
            <div className="mt-0.5 text-foreground/80">
              Stronger presentation & conversion support.
            </div>
          </div>
        </div>

        {/* Timeline (mirrors buyer journey style for symmetry) */}
        <ol className="relative mt-12">
          <span
            aria-hidden
            className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border md:block lg:left-1/2"
          />
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLeft = idx % 2 === 0;
            return (
              <li key={step.title} className="relative mb-8 last:mb-0 md:pl-14 lg:pl-0">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm md:left-0 lg:left-1/2 lg:-translate-x-1/2">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
                </div>

                <div
                  className={[
                    "rounded-xl border border-border bg-card p-5 md:p-6",
                    "lg:w-[calc(50%-2.5rem)]",
                    isLeft ? "lg:mr-auto lg:pr-7" : "lg:ml-auto lg:pl-7",
                  ].join(" ")}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Step {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-lg font-bold leading-snug text-foreground md:text-xl">
                      {step.title}
                    </h3>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-background/60 p-3 ring-1 ring-border/60">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Supplier does
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {step.supplier}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3 ring-1 ring-primary/15">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Yorso provides
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {step.yorso}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-[hsl(var(--success))]/5 p-3 ring-1 ring-[hsl(var(--success))]/20">
                      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                        <TrendingUp className="h-3 w-3" />
                        Outcome
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {step.outcome}
                      </dd>
                    </div>
                  </dl>

                  {step.concept && (
                    <div className="mt-4 flex items-start gap-2 border-t border-border/60 pt-3">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs italic text-muted-foreground">{step.concept}</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default SupplierJourney;
