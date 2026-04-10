import { Button } from "@/components/ui/button";
import { ShieldCheck, FileSearch, BadgeCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    step: "01",
    title: "Application Review",
    desc: "Suppliers submit business documents, export licenses, and facility certifications for review.",
  },
  {
    icon: ShieldCheck,
    step: "02",
    title: "Due Diligence",
    desc: "Our team verifies company registration, trade references, and production capabilities.",
  },
  {
    icon: BadgeCheck,
    step: "03",
    title: "Verification Badge",
    desc: "Approved suppliers receive a verified badge, visible on all their offers and profile.",
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
            Every verified supplier on YORSO passes a structured review process.
            Trade with confidence — here's how it works.
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
            </div>
          ))}
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
