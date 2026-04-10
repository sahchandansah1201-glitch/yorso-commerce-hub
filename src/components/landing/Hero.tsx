import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Eye, Ban, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-accent pb-12 pt-20 md:pb-16 md:pt-28">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            380 verified suppliers. Zero hidden fees.
          </div>

          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-accent-foreground md:text-5xl lg:text-6xl">
            Stop Gambling on
            <span className="block text-primary"> Unknown Suppliers</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-accent-foreground/70 md:text-lg">
            Your competitors already lost $50K on bait-and-switch containers.
            YORSO gives you verified suppliers with open contacts, real prices,
            and zero commissions — so you stay in control.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full gap-2 font-semibold sm:w-auto">
              Get Free Access
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="w-full gap-2 border-accent-foreground/20 bg-transparent text-accent-foreground hover:bg-accent-foreground/5 sm:w-auto">
              Explore Live Offers
            </Button>
          </div>

          {/* Anti-objection proof strip — hits top fears */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-accent-foreground/10 bg-accent-foreground/5 p-4 text-left">
              <Eye className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-accent-foreground">Open Contacts</p>
                <p className="mt-0.5 text-xs text-accent-foreground/60">Direct supplier emails & phones. We never hide contacts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-accent-foreground/10 bg-accent-foreground/5 p-4 text-left">
              <Ban className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-accent-foreground">0% Commission</p>
                <p className="mt-0.5 text-xs text-accent-foreground/60">No hidden fees. No % from your deals. Your margin stays yours.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-accent-foreground/10 bg-accent-foreground/5 p-4 text-left">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-accent-foreground">15-Minute Setup</p>
                <p className="mt-0.5 text-xs text-accent-foreground/60">Register today, source tomorrow. No IT department needed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
