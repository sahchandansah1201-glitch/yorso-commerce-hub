import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const About = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_about_title}>
      <p>{t.info_about_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_about_mission}</h2>
      <p>{t.info_about_missionBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_about_whatWeDo}</h2>
      <p>{t.info_about_whatWeDoBody}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_about_keyFacts}</h2>
      <ul className="list-disc pl-5 space-y-1">
        {t.info_about_facts.map((f) => <li key={f}>{f}</li>)}
      </ul>
    </InfoPageLayout>
  );
};

export default About;
