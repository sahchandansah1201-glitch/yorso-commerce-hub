import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Press = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_press_title}>
      <p>For media inquiries, interview requests, or press materials, please contact our communications team.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_press_contact}</h2>
      <p>Email: <a href="mailto:press@yorso.com" className="text-primary hover:underline">press@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_press_about}</h2>
      <p>YORSO is a B2B seafood marketplace connecting professional buyers with 380+ verified suppliers across 48 countries. Headquartered in Amsterdam, the platform offers transparent pricing, direct supplier contacts, and zero commission — serving over 2,100 active buyers worldwide.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_press_brand}</h2>
      <p>Logo files, brand guidelines, and product screenshots are available upon request. Contact <a href="mailto:press@yorso.com" className="text-primary hover:underline">press@yorso.com</a>.</p>
    </InfoPageLayout>
  );
};

export default Press;
