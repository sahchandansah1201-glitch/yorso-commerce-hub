import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Privacy = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_privacy_title} updated={t.info_updated_january2026}>
      <p>{t.info_privacy_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_dataCollect}</h2>
      <ul className="list-disc pl-5 space-y-1">
        {t.info_privacy_dataCollectList.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_use}</h2>
      <p>{t.info_privacy_useBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_storage}</h2>
      <p>{t.info_privacy_storageBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_rights}</h2>
      <p>{t.info_privacy_rightsBody1}<a href="mailto:privacy@yorso.com" className="text-primary hover:underline">privacy@yorso.com</a>{t.info_privacy_rightsBody2}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_contact}</h2>
      <p>{t.info_privacy_contactBody}<a href="mailto:dpo@yorso.com" className="text-primary hover:underline">dpo@yorso.com</a></p>
    </InfoPageLayout>
  );
};

export default Privacy;
