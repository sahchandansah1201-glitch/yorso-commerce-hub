import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Eye, Ban } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="bg-accent py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-accent-foreground md:text-4xl">
            Start Sourcing with
            <span className="text-primary"> Confidence</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-accent-foreground/70">
            Join thousands of procurement professionals who source seafood through
            verified suppliers, transparent pricing, and direct contacts — with zero
            commissions and no lock-in.
          </p>

          <Button size="lg" className="mt-8 gap-2 px-10 text-base font-semibold">
            Register Free
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="mt-4 text-xs text-accent-foreground/50">
            Free for buyers · No credit card required · Setup in 5 minutes
          </p>

          {/* Trust reinforcement */}
          <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-6 text-xs text-accent-foreground/50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary/60" />
              <span>380 verified suppliers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ban className="h-4 w-4 text-primary/60" />
              <span>0% commission</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary/60" />
              <span>Direct contacts always</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
