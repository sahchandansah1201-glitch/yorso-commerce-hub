import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Cookies = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.cookies_title} updated={t.cookies_updated}>
      <p>{t.cookies_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.cookies_essentialTitle}</h2>
      <p>{t.cookies_essentialBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.cookies_analyticsTitle}</h2>
      <p>{t.cookies_analyticsBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.cookies_manageTitle}</h2>
      <p>{t.cookies_manageBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.cookies_contactTitle}</h2>
      <p>{t.cookies_contactBody}</p>
    </InfoPageLayout>
  );
};

export default Cookies;
