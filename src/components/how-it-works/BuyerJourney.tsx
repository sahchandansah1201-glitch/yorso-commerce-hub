import {
  Search,
  Layers,
  KeyRound,
  GitCompare,
  FileSignature,
  ClipboardCheck,
  Truck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Buyer Journey
 * 7-step procurement flow. Each step states what the buyer does,
 * what Yorso provides, and the business risk reduced.
 *
 * Mounted on the existing #buyer-journey anchor on /how-it-works.
 */

interface Step {
  icon: LucideIcon;
  title: string;
  buyer: string;
  yorso: string;
  risk: string;
  example: string;
}

const steps: Step[] = [
  {
    icon: Search,
    title: "Search a product or post a request",
    buyer:
      "Looks for a specific species, format and origin — or posts a structured procurement request.",
    yorso:
      "Catalog with species, cut, origin, format, packaging and supplier filters. Optional buyer request to surface matching offers.",
    risk: "Supplier search no longer takes weeks of WhatsApp and email.",
    example: "Mackerel HGT 300–500 g, frozen, origin Norway/Faroe, CFR EU port.",
  },
  {
    icon: Layers,
    title: "See available offers and market context",
    buyer:
      "Scans live offers with format, MOQ, lead time, supplier country, certifications and Incoterms.",
    yorso:
      "Offer rows with price range, market signals, news and benchmark context tied to the species and origin.",
    risk: "Exact market price stops being a black box.",
    example: "Salmon bellies, frozen, MOQ 5 t, FOB Chile vs CFR Rotterdam.",
  },
  {
    icon: KeyRound,
    title: "Request access to exact price or supplier",
    buyer:
      "Creates a buyer account or requests price/supplier access without paying for catalog entry.",
    yorso:
      "Three-state access model: anonymous → registered → qualified. Supplier identity unlocks together with price.",
    risk: "No hard paywall — buyers qualify by intent, not by card on file.",
    example: "Squid loligo 100–300 g, IQF — request exact USD/kg and supplier identity.",
  },
  {
    icon: GitCompare,
    title: "Compare suppliers, terms, documents and risk",
    buyer:
      "Selects 2–4 offers and compares price, MOQ, payment terms, lead time, documents and supplier evidence.",
    yorso:
      "Side-by-side comparison surface with document readiness, certification status and supplier country signals.",
    risk: "Reliability is evaluated before negotiation, not after.",
    example: "Yellowfin tuna loins vs saku — compare 3 suppliers across CFR/CIF.",
  },
  {
    icon: FileSignature,
    title: "Send a structured RFQ or contact the supplier",
    buyer:
      "Sends an RFQ with quantity, packaging, delivery window and Incoterms, or opens direct communication.",
    yorso:
      "Structured RFQ form, message thread tied to the offer, follow-up history per supplier.",
    risk: "Communication stays attached to the deal, not lost across mailboxes.",
    example: "Vannamei shrimp 26/30, IQF, 24 t, CIF Algeciras, payment 30% advance.",
  },
  {
    icon: ClipboardCheck,
    title: "Build a decision-proof record for internal approval",
    buyer:
      "Assembles the procurement file: shortlist, comparison, supplier evidence, landed cost logic and rejected alternatives.",
    yorso:
      "Procurement Decision Proof: a structured, exportable record that travels with the deal.",
    risk: "Procurement managers can defend the choice to finance, quality and leadership.",
    example: "Pollock fillets PBO — defended choice across 4 shortlisted suppliers.",
  },
  {
    icon: Truck,
    title: "Move into order, documents, logistics and repeat trade",
    buyer:
      "Confirms the order, tracks documents and shipment status, then repeats the trade in the next season.",
    yorso:
      "Order status, document/logistics support and CRM history that turns one deal into a recurring relationship.",
    risk: "Repeat purchasing stops starting from zero each season.",
    example: "King crab clusters — second season order with the same qualified supplier.",
  },
];

const BuyerJourney = () => {
  return (
    <section
      id="buyer-journey"
      aria-label="Buyer journey"
      className="border-b border-border bg-background py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Buyer journey
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From a sourcing question to a defensible procurement decision.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Buyers do not just get a list of suppliers. They get enough information to make and
            defend a purchasing decision — internally, in front of finance, quality and leadership.
          </p>
        </div>

        {/* Timeline */}
        <ol className="relative mt-14">
          {/* vertical guide line */}
          <span
            aria-hidden
            className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border md:block lg:left-1/2"
          />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLeft = idx % 2 === 0;
            return (
              <li
                key={step.title}
                className="relative mb-8 last:mb-0 md:pl-14 lg:pl-0"
              >
                {/* Step marker */}
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm md:left-0 lg:left-1/2 lg:-translate-x-1/2">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
                </div>

                {/* Card */}
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
                        Buyer does
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {step.buyer}
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
                        <ShieldCheck className="h-3 w-3" />
                        Risk reduced
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {step.risk}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-start gap-2 border-t border-border/60 pt-3">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs italic text-muted-foreground">
                      Example — {step.example}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default BuyerJourney;
