import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Careers = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_careers_title}>
      <p>{t.info_careers_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_careers_why}</h2>
      <ul className="list-disc pl-5 space-y-1">
        {t.info_careers_whyList.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_careers_openPositions}</h2>
      <p>{t.info_careers_openPositionsBody1}<a href="mailto:careers@yorso.com" className="text-primary hover:underline">careers@yorso.com</a>{t.info_careers_openPositionsBody2}</p>
    </InfoPageLayout>
  );
};

export default Careers;
