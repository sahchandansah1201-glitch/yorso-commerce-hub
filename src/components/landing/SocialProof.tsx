import { Quote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const SocialProof = () => {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border bg-cool-gray py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t.social_title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.social_subtitle}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {t.social_testimonials.map((te) => (
            <div key={te.name} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="mb-3 inline-flex self-start rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {te.painTag}
              </div>
              <Quote className="h-5 w-5 text-primary/40" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">"{te.quote}"</p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground">{te.name}</p>
                <p className="text-xs text-muted-foreground">{te.role}, {te.company}</p>
                <p className="text-xs text-muted-foreground">{te.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
