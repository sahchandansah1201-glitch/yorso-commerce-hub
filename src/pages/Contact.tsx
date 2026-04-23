import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Contact = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_contact_title}>
      <p>{t.info_contact_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_general}</h2>
      <p>{t.info_contact_emailLabel}: <a href="mailto:info@yorso.com" className="text-primary hover:underline">info@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_buyer}</h2>
      <p>{t.info_contact_emailLabel}: <a href="mailto:buyers@yorso.com" className="text-primary hover:underline">buyers@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_supplier}</h2>
      <p>{t.info_contact_emailLabel}: <a href="mailto:suppliers@yorso.com" className="text-primary hover:underline">suppliers@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_office}</h2>
      <p>{t.info_contact_officeAddress}<br/>{t.info_contact_kvk}</p>
    </InfoPageLayout>
  );
};

export default Contact;
