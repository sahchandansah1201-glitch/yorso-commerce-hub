import { ShieldCheck, Eye, Ban, Clock, Smartphone } from "lucide-react";

const points = [
  {
    icon: Ban,
    myth: "\"All B2B marketplaces take hidden commissions\"",
    reality: "YORSO charges 0% commission on your deals. We monetize through optional premium tools — never from your margin.",
    proof: "Your invoices go directly between you and the supplier.",
  },
  {
    icon: Eye,
    myth: "\"Platforms hide supplier contacts to keep you locked in\"",
    reality: "Every verified supplier's email and phone are visible once you're approved. We never gate contacts behind a paywall.",
    proof: "Unlike Faire or Alibaba, you own the relationship from day one.",
  },
  {
    icon: ShieldCheck,
    myth: "\"Online sourcing = Russian roulette with quality\"",
    reality: "Our verification team reviews business licenses, export docs, facility certifications, and trade references before a supplier gets listed.",
    proof: "380 suppliers passed. Thousands were rejected.",
  },
  {
    icon: Clock,
    myth: "\"It takes months to onboard a new platform\"",
    reality: "Register in 5 minutes, get verified in 24 hours, send your first RFQ the same day. No IT team. No training manuals.",
    proof: "Average time from signup to first supplier contact: 47 minutes.",
  },
  {
    icon: Smartphone,
    myth: "\"Software can't replace in-person quality checks\"",
    reality: "We agree. YORSO doesn't replace your QC process — it helps you find, compare, and shortlist suppliers faster. You still inspect and decide.",
    proof: "Think of it as pre-qualifying leads, not blind ordering.",
  },
];

const AntiObjection = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Why YORSO Is Different
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We've heard every objection from procurement pros who've been burned before.
            Here's why this isn't "just another marketplace."
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-6">
          {points.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold italic text-destructive/80">{p.myth}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{p.reality}</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    → {p.proof}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AntiObjection;
