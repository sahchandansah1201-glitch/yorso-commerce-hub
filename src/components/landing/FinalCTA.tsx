import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Eye, Ban } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const FinalCTA = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-accent py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-accent-foreground md:text-4xl">
            {t.cta_title1}
            <span className="text-primary"> {t.cta_title2}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-accent-foreground/70">{t.cta_subtitle}</p>

          <Button size="lg" className="mt-8 gap-2 px-10 text-base font-semibold">
            {t.cta_registerFree}
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="mt-4 text-xs text-accent-foreground/50">{t.cta_freeNote}</p>

          <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-6 text-xs text-accent-foreground/50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary/60" />
              <span>{t.cta_verifiedSuppliers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ban className="h-4 w-4 text-primary/60" />
              <span>{t.cta_zeroCommission}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary/60" />
              <span>{t.cta_directContacts}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
