import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldOff, Eye, BarChart3, AlertTriangle, Globe, Users, TrendingUp, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";
import { saveRegistrationSource } from "@/lib/preview-attribution";

const buyerIcons = [AlertTriangle, Eye, ShieldOff, BarChart3];
const supplierIcons = [Globe, Users, TrendingUp, ShieldCheck];

const ValueSplit = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t.value_title}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{t.value_subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">{t.value_forBuyers}</div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">{t.value_buyerHeadline}</h3>
            <div className="mt-6 space-y-5">
              {t.value_buyerBenefits.map((b, i) => {
                const Icon = buyerIcons[i];
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/register" onClick={() => analytics.track("value_register_buyer_click")}>
              <Button className="mt-8 w-full gap-2 font-semibold">
                {t.value_registerBuyer}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="inline-flex rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">{t.value_forSuppliers}</div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">{t.value_supplierHeadline}</h3>
            <div className="mt-6 space-y-5">
              {t.value_supplierBenefits.map((b, i) => {
                const Icon = supplierIcons[i];
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <Icon className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/register" onClick={() => analytics.track("value_register_supplier_click")}>
              <Button variant="outline" className="mt-8 w-full gap-2 font-semibold">
                {t.value_registerSupplier}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueSplit;
