import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Careers = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_careers_title}>
      <p>We're building the future of B2B seafood trade. YORSO is a growing team based in Amsterdam, working to make international seafood sourcing transparent, efficient, and trustworthy.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_careers_why}</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Meaningful impact: transforming a $150B+ industry</li>
        <li>International team with deep industry expertise</li>
        <li>Remote-friendly culture with Amsterdam HQ</li>
        <li>Competitive compensation and equity participation</li>
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_careers_openPositions}</h2>
      <p>We're always looking for talented people in product, engineering, sales, and operations. Send your CV and a brief intro to <a href="mailto:careers@yorso.com" className="text-primary hover:underline">careers@yorso.com</a>.</p>
    </InfoPageLayout>
  );
};

export default Careers;
