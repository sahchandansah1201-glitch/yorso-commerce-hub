import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Privacy = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_privacy_title} updated="January 2026">
      <p>YORSO B.V. ("YORSO", "we", "us") respects your privacy and is committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable Dutch privacy laws.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_dataCollect}</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account information: name, email, company name, role</li>
        <li>Usage data: pages visited, features used, search queries</li>
        <li>Communication data: messages sent through the platform</li>
        <li>Technical data: IP address, browser type, device information</li>
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_use}</h2>
      <p>We use your data to provide and improve our services, facilitate buyer-supplier connections, ensure platform security, and communicate relevant updates. We do not sell your data to third parties.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_storage}</h2>
      <p>All data is stored in EU-based infrastructure. We use encryption in transit (TLS) and at rest. Regular security audits are conducted to maintain data integrity.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_rights}</h2>
      <p>Under GDPR, you have the right to access, rectify, delete, or export your personal data. Contact <a href="mailto:privacy@yorso.com" className="text-primary hover:underline">privacy@yorso.com</a> to exercise your rights.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_privacy_contact}</h2>
      <p>Data Protection Officer: <a href="mailto:dpo@yorso.com" className="text-primary hover:underline">dpo@yorso.com</a></p>
    </InfoPageLayout>
  );
};

export default Privacy;
