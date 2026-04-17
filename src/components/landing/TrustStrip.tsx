import { ShieldCheck, Ban, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const TrustStrip = () => {
  const { t } = useLanguage();

  const differentiators = [
    { icon: Ban, text: t.trust_zeroCommission },
    { icon: Eye, text: t.trust_directContacts },
    { icon: ShieldCheck, text: t.trust_verificationEarned },
  ];

  return (
    <section className="border-y border-border bg-cool-gray py-6">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.trust_differentiatorIntro}
          </span>
          {differentiators.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground">
              <d.icon className="h-4 w-4 text-primary" />
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
