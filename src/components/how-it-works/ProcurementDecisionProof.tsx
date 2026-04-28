import {
  LineChart,
  ShieldCheck,
  GitCompare,
  Calculator,
  AlertTriangle,
  ListChecks,
  History,
  FileDown,
  CheckCircle2,
  Minus,
  TrendingUp,
} from "lucide-react";

/**
 * Procurement Decision Proof
 *
 * A dashboard-style component that visualises the procurement record a
 * buyer can build inside Yorso to defend a purchasing decision internally.
 *
 * All numbers are static, mock and clearly framed as illustrative — no
 * fake guarantees, no fabricated certificates, no claim of full automation.
 */

const benchmark = {
  product: "Mackerel HGT, frozen, 300–500 g",
  origin: "Norway",
  incoterms: "CFR Rotterdam",
  selectedPrice: 1.92,
  marketLow: 1.78,
  marketAvg: 1.95,
  marketHigh: 2.18,
};

const evidence = [
  { label: "Company registration", state: "verified" as const },
  { label: "Export licence on file", state: "verified" as const },
  { label: "Plant approval number", state: "verified" as const },
  { label: "Certifications uploaded", state: "partial" as const },
  { label: "Trade history with platform", state: "partial" as const },
];

const offers = [
  {
    supplier: "Supplier A",
    country: "Norway",
    price: "1.92",
    moq: "24 t",
    lead: "14 d",
    payment: "30% adv / 70% CAD",
    incoterms: "CFR Rotterdam",
    selected: true,
  },
  {
    supplier: "Supplier B",
    country: "Faroe Islands",
    price: "1.88",
    moq: "20 t",
    lead: "21 d",
    payment: "Letter of credit",
    incoterms: "CFR Rotterdam",
    selected: false,
  },
  {
    supplier: "Supplier C",
    country: "Iceland",
    price: "2.04",
    moq: "12 t",
    lead: "10 d",
    payment: "30% adv / 70% CAD",
    incoterms: "CIF Rotterdam",
    selected: false,
  },
];

const landedCost = [
  { label: "FOB / origin price", value: "1.78 USD/kg" },
  { label: "Sea freight (est.)", value: "0.09 USD/kg" },
  { label: "Insurance (est.)", value: "0.02 USD/kg" },
  { label: "Duties & clearance (est.)", value: "0.03 USD/kg" },
  { label: "Estimated landed cost", value: "1.92 USD/kg", highlight: true },
];

const risks = [
  { label: "Origin country signal", level: "stable" as const, note: "No active trade alerts." },
  { label: "Cold-chain risk", level: "low" as const, note: "Direct reefer route, 14 d transit." },
  { label: "Payment terms", level: "medium" as const, note: "30% advance — buyer exposure on prepayment." },
  { label: "Document readiness", level: "low" as const, note: "Health cert + CoO confirmed pre-shipment." },
];

const alternatives = [
  { label: "Supplier B (Faroe)", reason: "Longer lead time conflicts with promotional window." },
  { label: "Supplier C (Iceland)", reason: "Above benchmark price, lower MOQ not required this cycle." },
  { label: "Substitute: Atlantic herring", reason: "Different end-customer spec — kept on watchlist only." },
];

const audit = [
  { date: "12 Mar", event: "Buyer request created — mackerel HGT 300–500 g, 24 t, CFR." },
  { date: "13 Mar", event: "5 offers received, 3 shortlisted." },
  { date: "14 Mar", event: "Access to exact price + supplier identity granted." },
  { date: "15 Mar", event: "Documents requested from 3 suppliers." },
  { date: "17 Mar", event: "Comparison + landed cost confirmed." },
  { date: "18 Mar", event: "Decision recorded — Supplier A selected." },
];

const stateBadge = (state: "verified" | "partial") => {
  if (state === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--success))]">
        <CheckCircle2 className="h-3 w-3" /> verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <Minus className="h-3 w-3" /> partial
    </span>
  );
};

const riskColor = (level: "low" | "medium" | "stable") => {
  if (level === "low") return "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10";
  if (level === "stable") return "text-foreground/70 bg-muted";
  return "text-primary bg-primary/10";
};

const ProcurementDecisionProof = () => {
  // benchmark slider position
  const range = benchmark.marketHigh - benchmark.marketLow;
  const pos = ((benchmark.selectedPrice - benchmark.marketLow) / range) * 100;
  const avgPos = ((benchmark.marketAvg - benchmark.marketLow) / range) * 100;

  return (
    <section
      aria-label="Procurement decision proof"
      className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Procurement Decision Proof
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Enough evidence to defend the deal — internally.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Yorso assembles a structured record around every shortlisted offer: price benchmark,
            supplier evidence, comparison, landed cost logic, risk summary, alternatives considered
            and an audit trail. Illustrative example below.
          </p>
        </div>

        {/* Dashboard */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header bar */}
          <div className="flex flex-col gap-3 border-b border-border bg-background/60 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Procurement file · illustrative example
              </p>
              <h3 className="mt-1 font-heading text-base font-bold text-foreground md:text-lg">
                {benchmark.product} · {benchmark.origin} · {benchmark.incoterms}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                Decision recorded
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80">
                <FileDown className="h-3.5 w-3.5" />
                Exportable report
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
            {/* Price benchmark */}
            <article className="bg-card p-5 md:p-6">
              <header className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Price benchmark
                </h4>
              </header>
              <p className="mt-3 text-2xl font-bold text-foreground">
                {benchmark.selectedPrice.toFixed(2)}{" "}
                <span className="text-sm font-medium text-muted-foreground">USD/kg, CFR</span>
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                <TrendingUp className="h-3 w-3 rotate-180" />
                {(((benchmark.marketAvg - benchmark.selectedPrice) / benchmark.marketAvg) * 100).toFixed(1)}
                % below market average
              </p>
              <div className="mt-5">
                <div className="relative h-1.5 rounded-full bg-muted">
                  <span
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-foreground/40"
                    style={{ left: `${avgPos}%` }}
                    aria-hidden
                  />
                  <span
                    className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-card bg-primary shadow"
                    style={{ left: `${pos}%` }}
                    aria-label="Selected price"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>low {benchmark.marketLow.toFixed(2)}</span>
                  <span>avg {benchmark.marketAvg.toFixed(2)}</span>
                  <span>high {benchmark.marketHigh.toFixed(2)}</span>
                </div>
              </div>
            </article>

            {/* Supplier evidence */}
            <article className="bg-card p-5 md:p-6">
              <header className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Supplier evidence
                </h4>
              </header>
              <ul className="mt-3 space-y-2">
                {evidence.map((e) => (
                  <li
                    key={e.label}
                    className="flex items-center justify-between gap-2 text-xs text-foreground/85"
                  >
                    <span>{e.label}</span>
                    {stateBadge(e.state)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] italic text-muted-foreground">
                Status reflects what the supplier has submitted — not a quality guarantee.
              </p>
            </article>

            {/* Risk summary */}
            <article className="bg-card p-5 md:p-6">
              <header className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Risk summary
                </h4>
              </header>
              <ul className="mt-3 space-y-2.5">
                {risks.map((r) => (
                  <li key={r.label} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{r.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${riskColor(r.level)}`}
                      >
                        {r.level}
                      </span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{r.note}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* Offer comparison — wide */}
            <article className="bg-card p-5 md:p-6 lg:col-span-2">
              <header className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Offer comparison
                </h4>
              </header>
              <div className="mt-3 -mx-1 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-2">Supplier</th>
                      <th className="px-2 py-2">Country</th>
                      <th className="px-2 py-2">Price USD/kg</th>
                      <th className="px-2 py-2">MOQ</th>
                      <th className="px-2 py-2">Lead</th>
                      <th className="px-2 py-2">Payment</th>
                      <th className="px-2 py-2">Incoterms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o) => (
                      <tr
                        key={o.supplier}
                        className={`border-b border-border/60 last:border-0 ${
                          o.selected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="px-2 py-2 font-semibold text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            {o.selected && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            )}
                            {o.supplier}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-foreground/80">{o.country}</td>
                        <td className="px-2 py-2 font-mono text-foreground">{o.price}</td>
                        <td className="px-2 py-2 text-foreground/80">{o.moq}</td>
                        <td className="px-2 py-2 text-foreground/80">{o.lead}</td>
                        <td className="px-2 py-2 text-foreground/80">{o.payment}</td>
                        <td className="px-2 py-2 text-foreground/80">{o.incoterms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            {/* Landed cost */}
            <article className="bg-card p-5 md:p-6">
              <header className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Landed cost logic
                </h4>
              </header>
              <ul className="mt-3 divide-y divide-border/60">
                {landedCost.map((row) => (
                  <li
                    key={row.label}
                    className={`flex items-center justify-between py-2 text-xs ${
                      row.highlight
                        ? "font-bold text-foreground"
                        : "text-foreground/80"
                    }`}
                  >
                    <span>{row.label}</span>
                    <span className="font-mono">{row.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] italic text-muted-foreground">
                Estimates only — confirmed against actual freight quote before order.
              </p>
            </article>

            {/* Alternatives considered */}
            <article className="bg-card p-5 md:p-6">
              <header className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Alternatives considered
                </h4>
              </header>
              <ul className="mt-3 space-y-2.5">
                {alternatives.map((a) => (
                  <li key={a.label} className="text-xs">
                    <p className="font-semibold text-foreground">{a.label}</p>
                    <p className="text-muted-foreground">{a.reason}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* Audit trail */}
            <article className="bg-card p-5 md:p-6 lg:col-span-2">
              <header className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  Audit trail
                </h4>
              </header>
              <ol className="mt-3 space-y-2">
                {audit.map((a) => (
                  <li
                    key={a.date + a.event}
                    className="flex gap-3 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs"
                  >
                    <span className="w-12 shrink-0 font-mono font-semibold text-muted-foreground">
                      {a.date}
                    </span>
                    <span className="text-foreground/85">{a.event}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 border-t border-border bg-background/60 px-5 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
            <p>
              Decision proof is buyer-controlled. Yorso structures the record — it does not approve
              the deal for you.
            </p>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
              <FileDown className="h-3.5 w-3.5" />
              Export as PDF for internal approval
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcurementDecisionProof;
