import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Press = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_press_title}>
      <p>{t.info_press_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_press_contact}</h2>
      <p>{t.info_press_emailLabel}: <a href="mailto:press@yorso.com" className="text-primary hover:underline">press@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_press_about}</h2>
      <p>{t.info_press_aboutBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_press_brand}</h2>
      <p>{t.info_press_brandBody1}<a href="mailto:press@yorso.com" className="text-primary hover:underline">press@yorso.com</a>{t.info_press_brandBody2}</p>
    </InfoPageLayout>
  );
};

export default Press;
