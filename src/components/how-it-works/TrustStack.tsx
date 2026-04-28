import {
  Building2,
  Box,
  Globe2,
  FileBadge,
  FileText,
  LineChart,
  MessageSquare,
  ListChecks,
  CheckCircle2,
  MinusCircle,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Trust Stack
 *
 * Layered diagram of evidence sources that make a supplier
 * decision defensible. Honest empty-state logic:
 *  - missing certificate => "not provided yet"
 *  - paid placement      => "promoted"
 *  - verified item       => named evidence backing it
 *
 * No invented certificates, no fake guarantees, no implication
 * that promoted suppliers are safer.
 */

type EvidenceState = "verified" | "missing" | "promoted" | "neutral";

interface Layer {
  icon: LucideIcon;
  title: string;
  body: string;
  evidence: string;
  state: EvidenceState;
}

// Ordered from company-level identity at the bottom up to the live trade trail at the top.
const layers: Layer[] = [
  {
    icon: Building2,
    title: "Company identity",
    body: "Legal entity, registration country, plant approval number, export licence reference.",
    evidence: "Verified — registration document and plant approval on file.",
    state: "verified",
  },
  {
    icon: Box,
    title: "Product specification",
    body: "Species (Latin name), format/cut, size grade, packaging, glaze, shelf life.",
    evidence: "Verified — supplier-declared spec with structured fields.",
    state: "verified",
  },
  {
    icon: Globe2,
    title: "Origin & supplier country",
    body: "Catch / farm origin and the country the supplier ships from.",
    evidence: "Verified — origin declared per SKU; supplier country from registration.",
    state: "verified",
  },
  {
    icon: FileBadge,
    title: "Certificates & documents",
    body: "Health certificates, MSC/ASC where applicable, IUU compliance, lab tests.",
    evidence: "Not provided yet for this supplier — buyer can request before RFQ.",
    state: "missing",
  },
  {
    icon: FileText,
    title: "Incoterms, MOQ, payment, lead time",
    body: "Commercial terms attached to the offer, not buried in chat.",
    evidence: "Verified — declared per offer, comparable across suppliers.",
    state: "verified",
  },
  {
    icon: LineChart,
    title: "Price history & market signals",
    body: "Indicative price range, trend direction, origin-country news context.",
    evidence: "Neutral — directional context, not a market data feed.",
    state: "neutral",
  },
  {
    icon: ListChecks,
    title: "Supplier readiness & response quality",
    body: "Document readiness, average response time, RFQ completion rate.",
    evidence: "Verified — measured from on-platform behaviour over time.",
    state: "verified",
  },
  {
    icon: MessageSquare,
    title: "Communication & order trail",
    body: "Structured RFQ thread, follow-up history, document exchange log.",
    evidence: "Verified — recorded inside the deal, exportable with the procurement file.",
    state: "verified",
  },
];

const stateMeta: Record<
  EvidenceState,
  { label: string; icon: LucideIcon; cls: string; ringCls: string }
> = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    cls: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10",
    ringCls: "ring-[hsl(var(--success))]/20",
  },
  missing: {
    label: "Not provided yet",
    icon: MinusCircle,
    cls: "text-muted-foreground bg-muted",
    ringCls: "ring-border",
  },
  promoted: {
    label: "Promoted",
    icon: Megaphone,
    cls: "text-primary bg-primary/10",
    ringCls: "ring-primary/15",
  },
  neutral: {
    label: "Context",
    icon: ListChecks,
    cls: "text-foreground/70 bg-background",
    ringCls: "ring-border",
  },
};

const TrustStack = () => {
  return (
    <section
      id="trust-layer"
      aria-label="Trust layer"
      className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <FileBadge className="h-3.5 w-3.5" />
            Trust stack
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Trust on Yorso is a stack of evidence, not a badge.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each layer is shown honestly. Verified means evidence is on file. Missing items are
            labelled <em>not provided yet</em>. Paid placements are labelled <em>promoted</em>.
            Promoted suppliers are not safer — they are more visible.
          </p>
        </div>

        {/* Stack diagram */}
        <ol className="mx-auto mt-12 max-w-4xl space-y-2">
          {layers
            .slice()
            .reverse()
            .map((layer, idx) => {
              const Icon = layer.icon;
              const meta = stateMeta[layer.state];
              const StateIcon = meta.icon;
              const layerNumber = layers.length - idx;
              return (
                <li
                  key={layer.title}
                  className={`group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 ring-1 ${meta.ringCls} md:flex-row md:items-center md:gap-5 md:p-5`}
                >
                  <div className="flex items-center gap-3 md:w-1/3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Layer {String(layerNumber).padStart(2, "0")}
                      </div>
                      <h3 className="font-heading text-sm font-bold text-foreground md:text-base">
                        {layer.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-foreground/80 md:flex-1">
                    {layer.body}
                  </p>

                  <div className="md:w-[260px] md:shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}
                    >
                      <StateIcon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {layer.evidence}
                    </p>
                  </div>
                </li>
              );
            })}
        </ol>

        {/* Honest legend */}
        <div className="mx-auto mt-8 grid max-w-4xl gap-2 rounded-xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground sm:grid-cols-3">
          <p>
            <strong className="text-foreground">Verified</strong> = evidence on file. Not a quality
            guarantee.
          </p>
          <p>
            <strong className="text-foreground">Not provided yet</strong> = missing item. Buyers can
            request it before RFQ.
          </p>
          <p>
            <strong className="text-foreground">Promoted</strong> = paid visibility, separate from
            verification.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustStack;
