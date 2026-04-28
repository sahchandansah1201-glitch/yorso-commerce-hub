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
  EyeOff,
  Network,
  Database,
  GitBranch,
  BadgeCheck,
  LineChart,
  PackageCheck,
  MessagesSquare,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import BuyerJourney from "@/components/how-it-works/BuyerJourney";
import ProcurementDecisionProof from "@/components/how-it-works/ProcurementDecisionProof";
import SupplierJourney from "@/components/how-it-works/SupplierJourney";
import TrustStack from "@/components/how-it-works/TrustStack";
import ValueGrids from "@/components/how-it-works/ValueGrids";

/**
 * /how-it-works
 *
 * Foundation page: Hero + Problem Map + System Map + placeholder anchors.
 * Detailed buyer/supplier journeys, trust matrix and final QA come in
 * follow-up prompts.
 */

const workflowSteps = [
  { icon: Search, label: "Search" },
  { icon: KeyRound, label: "Access request" },
  { icon: ShieldCheck, label: "Supplier evidence" },
  { icon: FileText, label: "RFQ / negotiation" },
  { icon: Truck, label: "Order / documents" },
  { icon: RefreshCw, label: "Repeat trade" },
];

const buyerPains = [
  "Prices scattered across WhatsApp, email, PDFs and outdated price lists.",
  "Supplier reliability is hard to verify before committing to a deal.",
  "Certificates, traceability, Incoterms, payment terms and documents are checked too late.",
  "Communication is fragmented across email, messengers, calls and spreadsheets.",
  "Landed cost is unclear without logistics, duties, delays and cold-chain risk.",
  "Procurement managers must justify supplier choice to owners, finance, logistics and quality teams.",
];

const supplierPains = [
  "Qualified buyer demand is inconsistent and seasonal.",
  "Trade shows and cold outreach do not create year-round pipeline.",
  "Buyers do not trust claims without documents and verifiable evidence.",
  "Product content, certificates and supplier profiles become outdated quickly.",
  "Strong suppliers get lost in generic, undifferentiated listings.",
  "Sales teams do not know which products, countries and formats buyers are actively searching for.",
];

const systemBlocks = [
  {
    icon: Database,
    title: "Catalog & Supply Graph",
    body: "Products, species, origin, specs, availability and structured supplier profiles in one normalized graph.",
  },
  {
    icon: GitBranch,
    title: "Demand & Matching",
    body: "Buyer requests, RFQs, shortlists, substitutes and matching against live supplier capacity.",
  },
  {
    icon: BadgeCheck,
    title: "Identity & Trust",
    body: "Verification, documents, certificates and supplier evidence assembled into procurement-ready profiles.",
  },
  {
    icon: LineChart,
    title: "Pricing & Market Signals",
    body: "Price history, country news, trend direction and benchmark context tied to the offer in front of you.",
  },
  {
    icon: PackageCheck,
    title: "Orders & Logistics",
    body: "Order status, shipment risk and document/logistics support from confirmation to delivery.",
  },
  {
    icon: MessagesSquare,
    title: "CRM & Communication",
    body: "Structured communication, follow-up history and repeat-order workflows for ongoing trade.",
  },
];

const placeholderAnchors: { id: string; title: string; note: string }[] = [
  // #buyer-journey, #supplier-journey, #trust-layer and #outcomes are real sections now.
  {
    id: "access-levels",
    title: "Access levels",
    note: "How price and supplier visibility unlock across the three access states.",
  },
  {
    id: "final-cta",
    title: "Get started",
    note: "Final conversion section for buyers and suppliers.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* ───────────────────────── HERO ───────────────────────── */}
        <section
          id="hero"
          className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[hsl(var(--cool-gray))] to-background"
        >
          <div className="container max-w-6xl py-16 md:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                How Yorso works
              </span>
              <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Yorso turns seafood sourcing into a controlled{" "}
                <span className="text-primary">B2B trade workflow</span>.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Find seafood products and suppliers, request access, compare offers, verify
                evidence, and move from inquiry to a defensible procurement decision — inside one
                operating system built for B2B seafood trade.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="font-semibold">
                  <Link to="/offers">
                    Find seafood suppliers
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold">
                  <Link to="/register">Become a verified supplier</Link>
                </Button>
                <a
                  href="#system-map"
                  className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-primary hover:underline"
                >
                  See how it works ↓
                </a>
              </div>
            </div>

            {/* Workflow strip */}
            <div className="mt-12 rounded-xl border border-border bg-card p-4 shadow-sm md:mt-16 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End-to-end trade workflow
                </p>
                <span className="hidden text-xs text-muted-foreground md:inline">
                  Repeatable, evidence-based, documented
                </span>
              </div>
              <ol className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-2">
                {workflowSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isLast = idx === workflowSteps.length - 1;
                  return (
                    <li
                      key={step.label}
                      className="relative flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Step {idx + 1}
                        </div>
                        <div className="truncate text-sm font-semibold text-foreground">
                          {step.label}
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

        {/* ─────────────────────── PROBLEM MAP ─────────────────────── */}
        <section id="problem-map" className="border-b border-border bg-background py-16 md:py-24">
          <div className="container max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Problem map
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Seafood trade fails in two predictable ways.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Yorso is built around the two structural risks that decide every B2B seafood deal —
                a wrong purchasing decision on the buyer side, and invisible value on the supplier
                side.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Buyer pains */}
              <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Buyer side
                    </p>
                    <h3 className="mt-1 font-heading text-xl font-bold text-foreground md:text-2xl">
                      For buyers, the risk is a wrong purchasing decision.
                    </h3>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {buyerPains.map((pain) => (
                    <li
                      key={pain}
                      className="flex gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground/85"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/70" />
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </article>

              {/* Supplier pains */}
              <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <EyeOff className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Supplier side
                    </p>
                    <h3 className="mt-1 font-heading text-xl font-bold text-foreground md:text-2xl">
                      For suppliers, the risk is invisible value and low-quality demand.
                    </h3>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {supplierPains.map((pain) => (
                    <li
                      key={pain}
                      className="flex gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground/85"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ─────────────────────── SYSTEM MAP ─────────────────────── */}
        <section
          id="system-map"
          className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24"
        >
          <div className="container max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Network className="h-3.5 w-3.5" />
                Yorso system map
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                One connected operating system, not six disconnected tools.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Each block feeds the next. Catalog and demand drive matching; identity and pricing
                drive trust; orders and CRM turn a single deal into a repeatable trade
                relationship.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systemBlocks.map((block, idx) => {
                const Icon = block.icon;
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
                        Layer {String(idx + 1).padStart(2, "0")}
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

            {/* Connection caption */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-md border border-border bg-card px-2.5 py-1">Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-md border border-border bg-card px-2.5 py-1">Matching</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-md border border-border bg-card px-2.5 py-1">Trust</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-md border border-border bg-card px-2.5 py-1">Pricing</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-md border border-border bg-card px-2.5 py-1">Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-md border border-border bg-card px-2.5 py-1">CRM</span>
            </div>
          </div>
        </section>

        {/* ─────────────────────── BUYER JOURNEY ─────────────────────── */}
        <BuyerJourney />

        {/* ─────────────── PROCUREMENT DECISION PROOF ─────────────── */}
        <ProcurementDecisionProof />

        {/* ─────────────────────── SUPPLIER JOURNEY ─────────────────────── */}
        <SupplierJourney />

        {/* ─────────────────────── TRUST STACK ─────────────────────── */}
        <TrustStack />

        {/* ─────────────────────── VALUE GRIDS (buyer + supplier) ─────────────────────── */}
        <ValueGrids />

        {/* ────────────── PLACEHOLDER ANCHORS (next prompts) ────────────── */}
        <section className="bg-background py-16 md:py-20">
          <div className="container max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Coming next on this page
              </span>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                The rest of the workflow.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Reserved anchors for the detailed sections that follow in the next iterations.
              </p>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {placeholderAnchors.map((a) => (
                <section
                  key={a.id}
                  id={a.id}
                  aria-label={a.title}
                  className="rounded-lg border border-dashed border-border bg-card/60 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-sm font-bold text-foreground">{a.title}</h3>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      #{a.id}
                    </code>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.note}</p>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
