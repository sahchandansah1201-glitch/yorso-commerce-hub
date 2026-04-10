import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="bg-accent py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-accent-foreground md:text-4xl">
            Start Sourcing Wholesale Seafood Today
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-accent-foreground/70">
            Join 2,100+ buyers already sourcing from verified suppliers across 48 countries.
            Registration is free — no commitment, no credit card.
          </p>
          <Button size="lg" className="mt-8 gap-2 px-10 text-base font-semibold">
            Register and Start Sourcing
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="mt-4 text-xs text-accent-foreground/50">
            Free to join · No hidden fees · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
