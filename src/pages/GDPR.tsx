import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const GDPR = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_gdpr_title} updated="January 2026">
      <p>YORSO B.V. is fully committed to compliance with the General Data Protection Regulation (EU) 2016/679.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_commitment}</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Data minimization: we collect only what's necessary to provide our services</li>
        <li>Purpose limitation: data is used only for stated purposes</li>
        <li>Storage limitation: data is retained only as long as necessary</li>
        <li>EU-based infrastructure: all data stored within the European Union</li>
        <li>Encryption: all data encrypted in transit and at rest</li>
        <li>Regular audits: independent security assessments conducted annually</li>
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_rights}</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Right to Access</strong> — request a copy of your personal data</li>
        <li><strong>Right to Rectification</strong> — correct inaccurate data</li>
        <li><strong>Right to Erasure</strong> — request deletion of your data</li>
        <li><strong>Right to Portability</strong> — receive your data in a structured format</li>
        <li><strong>Right to Object</strong> — object to processing of your data</li>
        <li><strong>Right to Restrict</strong> — limit how we process your data</li>
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_dpo}</h2>
      <p>Contact: <a href="mailto:dpo@yorso.com" className="text-primary hover:underline">dpo@yorso.com</a></p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_gdpr_authority}</h2>
      <p>You have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).</p>
    </InfoPageLayout>
  );
};

export default GDPR;
