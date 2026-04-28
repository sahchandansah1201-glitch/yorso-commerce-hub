import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, FileSignature, Search, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHowItWorks } from "@/i18n/how-it-works";

const FinalCTA = () => {
  const t = useHowItWorks();
  return (
    <section id="final-cta" aria-label={t.fc_eyebrow} className="bg-background py-16 md:py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t.fc_eyebrow}</span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t.fc_title}</h2>
          <p className="mt-3 text-muted-foreground">{t.fc_subtitle}</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.fc_buyer_eyebrow}</p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">{t.fc_buyer_title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.fc_buyer_body}</p>
            <ul className="mt-5 space-y-1.5 text-xs text-foreground/85">
              {t.fc_buyer_bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/offers"><Search className="mr-1.5 h-4 w-4" />{t.fc_buyer_cta1}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/offers#request"><FileSignature className="mr-1.5 h-4 w-4" />{t.fc_buyer_cta2}</Link>
              </Button>
            </div>
          </article>

          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.fc_supplier_eyebrow}</p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">{t.fc_supplier_title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.fc_supplier_body}</p>
            <ul className="mt-5 space-y-1.5 text-xs text-foreground/85">
              {t.fc_supplier_bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/register"><ShieldCheck className="mr-1.5 h-4 w-4" />{t.fc_supplier_cta1}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/register"><Eye className="mr-1.5 h-4 w-4" />{t.fc_supplier_cta2}</Link>
              </Button>
            </div>
          </article>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-dashed border-border bg-card/60 p-5 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t.fc_trustNote_label}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{t.fc_trustNote_body}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span className="rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-0.5 text-[hsl(var(--success))]">{t.fc_trustNote_proven}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">{t.fc_trustNote_promoted}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{t.fc_trustNote_unconfirmed}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
