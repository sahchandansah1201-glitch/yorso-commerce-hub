import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const AntiFraud = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_antifraud_title} updated={t.info_updated_january2026}>
      <p>{t.info_antifraud_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_antifraud_supplierVerification}</h2>
      <p>{t.info_antifraud_supplierVerificationBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_antifraud_ongoingMonitoring}</h2>
      <p>{t.info_antifraud_ongoingMonitoringBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_antifraud_reportingConcerns}</h2>
      <p>{t.info_antifraud_reportingConcernsBody1}<a href="mailto:compliance@yorso.com" className="text-primary hover:underline">compliance@yorso.com</a>{t.info_antifraud_reportingConcernsBody2}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_antifraud_sanctions}</h2>
      <p>{t.info_antifraud_sanctionsBody}</p>
    </InfoPageLayout>
  );
};

export default AntiFraud;
