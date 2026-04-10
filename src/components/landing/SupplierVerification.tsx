import { Button } from "@/components/ui/button";
import { ShieldCheck, FileSearch, BadgeCheck, ArrowRight, XCircle, AlertTriangle } from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    step: "01",
    title: "Application Review",
    desc: "Suppliers submit business registration, export licenses, and facility certifications (HACCP, BRC, MSC). Self-certification is not accepted.",
    unlike: "Unlike Alibaba's \"Gold Supplier\" that anyone can buy for $5K/year.",
  },
  {
    icon: ShieldCheck,
    step: "02",
    title: "Due Diligence",
    desc: "Our team verifies company registration, checks trade references with real buyers, and confirms production capabilities and export history.",
    unlike: "Unlike directories where suppliers list themselves without any checks.",
  },
  {
    icon: BadgeCheck,
    step: "03",
    title: "Verification Badge",
    desc: "Approved suppliers earn a verified badge visible on all offers. The badge is re-validated annually — it can be revoked if standards slip.",
    unlike: "Unlike pay-to-play badges that never expire regardless of performance.",
  },
];

const SupplierVerification = () => {
  return (
    <section id="how-it-works" className="bg-accent py-16 text-accent-foreground md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            How Suppliers Are Verified
          </h2>
          <p className="mt-2 text-sm text-accent-foreground/70">
            Our verification is earned, not bought. Here's exactly what we check —
            and how it differs from what you've seen before.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="rounded-xl border border-accent-foreground/10 bg-accent-foreground/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-heading text-sm font-bold text-accent-foreground/50">{s.step}</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-accent-foreground/70">{s.desc}</p>
              <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-primary/80">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {s.unlike}
              </p>
            </div>
          ))}
        </div>

        {/* What happens when suppliers fail */}
        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive/70" />
            <div>
              <p className="text-sm font-bold text-accent-foreground">What happens if a supplier fails?</p>
              <p className="mt-1 text-sm leading-relaxed text-accent-foreground/70">
                Verified badges can be suspended or revoked. If a supplier receives quality complaints,
                fails annual re-verification, or breaches platform rules, their badge is removed and
                buyers are notified. We've rejected thousands of applications and suspended dozens of
                previously-verified suppliers.
              </p>
            </div>
          </div>
        </div>

        {/* Mid-page CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-accent-foreground/60">
            Register to see full supplier profiles, certifications, and verification status.
          </p>
          <Button size="lg" className="mt-4 gap-2 font-semibold">
            Register to Unlock Supplier Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SupplierVerification;
