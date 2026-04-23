import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Cookies = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_cookies_title} updated={t.info_updated_january2026}>
      <p>{t.info_cookies_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_cookies_essential}</h2>
      <p>{t.info_cookies_essentialBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_cookies_analytics}</h2>
      <p>{t.info_cookies_analyticsBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_cookies_managing}</h2>
      <p>{t.info_cookies_managingBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_cookies_contact}</h2>
      <p>{t.info_cookies_contactBody1}<a href="mailto:privacy@yorso.com" className="text-primary hover:underline">privacy@yorso.com</a>{t.info_cookies_contactBody2}</p>
    </InfoPageLayout>
  );
};

export default Cookies;
