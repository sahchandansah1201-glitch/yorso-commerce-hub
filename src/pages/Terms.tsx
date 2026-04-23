import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Terms = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_terms_title} updated={t.info_updated_january2026}>
      <p>{t.info_terms_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">1. {t.info_terms_h1}</h2>
      <p>{t.info_terms_p1}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">2. {t.info_terms_h2}</h2>
      <p>{t.info_terms_p2}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">3. {t.info_terms_h3}</h2>
      <p>{t.info_terms_p3}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">4. {t.info_terms_h4}</h2>
      <p>{t.info_terms_p4}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">5. {t.info_terms_h5}</h2>
      <p>{t.info_terms_p5}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">6. {t.info_terms_h6}</h2>
      <p>{t.info_terms_p6}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">7. {t.info_terms_h7}</h2>
      <p>{t.info_terms_p7}</p>
    </InfoPageLayout>
  );
};

export default Terms;
