import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Contact = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_contact_title}>
      <p>We'd love to hear from you. Whether you're a buyer looking for sourcing support, a supplier interested in joining, or a partner exploring collaboration — reach out and we'll respond within one business day.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_general}</h2>
      <p>Email: <a href="mailto:info@yorso.com" className="text-primary hover:underline">info@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_buyer}</h2>
      <p>Email: <a href="mailto:buyers@yorso.com" className="text-primary hover:underline">buyers@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_supplier}</h2>
      <p>Email: <a href="mailto:suppliers@yorso.com" className="text-primary hover:underline">suppliers@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_contact_office}</h2>
      <p>YORSO B.V.<br/>Amsterdam, Netherlands<br/>KVK: 12345678</p>
    </InfoPageLayout>
  );
};

export default Contact;
