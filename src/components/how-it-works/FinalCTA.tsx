import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, FileSignature, Search, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Final dual CTA — buyer + supplier.
 * Tone: calm, procurement-grade, no aggression.
 * Trust note clarifies separation between Verified, Promoted and unconfirmed.
 */

const FinalCTA = () => {
  return (
    <section
      id="final-cta"
      aria-label="Get started with Yorso"
      className="bg-background py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Get started
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Two clear paths into the workflow.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Whether you are sourcing seafood or selling it, Yorso is the same operating system —
            entered from different sides.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {/* Buyer */}
          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              For buyers
            </p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">
              Source seafood with evidence, not guesswork.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Discover products and verified suppliers, request access to exact price and supplier
              identity, and build a defensible procurement file.
            </p>
            <ul className="mt-5 space-y-1.5 text-xs text-foreground/85">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                Search by species, format, origin and certifications
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                Compare offers and document readiness side-by-side
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                Export a Procurement Decision Proof for internal approval
              </li>
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/offers">
                  <Search className="mr-1.5 h-4 w-4" />
                  Find products and suppliers
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/offers#request">
                  <FileSignature className="mr-1.5 h-4 w-4" />
                  Create a request
                </Link>
              </Button>
            </div>
          </article>

          {/* Supplier */}
          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              For suppliers
            </p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">
              Reach qualified buyers with structured evidence.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Build a verified profile, expose products to organic B2B seafood search, and convert
              qualified RFQs with structured offer responses.
            </p>
            <ul className="mt-5 space-y-1.5 text-xs text-foreground/85">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                Verified Supplier Trust Pack — evidence, not badges
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                Qualified RFQ inbox with buyer intent signals
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                Premium presentation upgrade path — visibility, not trust
              </li>
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/register">
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Become a verified supplier
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/register">
                  <Eye className="mr-1.5 h-4 w-4" />
                  Show your products to qualified buyers
                </Link>
              </Button>
            </div>
          </article>
        </div>

        {/* Trust note */}
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-dashed border-border bg-card/60 p-5 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Trust note
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Yorso separates verified evidence from paid visibility. Buyers see what is proven, what
            is promoted, and what still needs confirmation.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span className="rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-0.5 text-[hsl(var(--success))]">
              Verified · proven
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
              Promoted · paid visibility
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
              Not provided yet · needs confirmation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
