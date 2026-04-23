import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const GDPR = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_gdpr_title} updated={t.info_updated_january2026}>
      <p>{t.info_gdpr_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_commitment}</h2>
      <ul className="list-disc pl-5 space-y-1">
        {t.info_gdpr_commitmentList.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_rights}</h2>
      <ul className="list-disc pl-5 space-y-1">
        {t.info_gdpr_rightsList.map((r) => (
          <li key={r.term}><strong>{r.term}</strong> — {r.desc}</li>
        ))}
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_dpo}</h2>
      <p>{t.info_gdpr_dpoBody}<a href="mailto:dpo@yorso.com" className="text-primary hover:underline">dpo@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_authority}</h2>
      <p>{t.info_gdpr_authorityBody}</p>
    </InfoPageLayout>
  );
};

export default GDPR;
