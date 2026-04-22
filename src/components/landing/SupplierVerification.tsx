import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileSearch, BadgeCheck, ArrowRight, XCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics, { trackSectionImpression } from "@/lib/analytics";

const stepIcons = [FileSearch, ShieldCheck, BadgeCheck];

const SupplierVerification = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return trackSectionImpression(sectionRef.current, "supplier_verification");
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="bg-accent py-16 text-accent-foreground md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 data-testid="section-title" data-section="how-it-works" className="font-heading text-2xl font-bold tracking-tight md:text-3xl">{t.verify_title}</h2>
          <p className="mt-2 text-sm text-accent-foreground/70">{t.verify_subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.verify_steps.map((s, i) => {
            const Icon = stepIcons[i];
            const step = `0${i + 1}`;
            return (
              <div key={i} className="rounded-xl border border-accent-foreground/10 bg-accent-foreground/5 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-heading text-sm font-bold text-accent-foreground/50">{step}</span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-accent-foreground/70">{s.desc}</p>
                <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-primary/80">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {s.unlike}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive/70" />
            <div>
              <p className="text-sm font-bold text-accent-foreground">{t.verify_failTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-accent-foreground/70">{t.verify_failDesc}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-accent-foreground/60">{t.verify_ctaHint}</p>
          <Link to="/register" onClick={() => analytics.track("register_cta_midpage_click", { section: "supplier_verification" })}>
            <Button size="lg" className="mt-4 gap-2 font-semibold">
              {t.verify_ctaBtn}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SupplierVerification;
