import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const About = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_about_title}>
      <p>YORSO is the global B2B seafood marketplace, headquartered in Amsterdam, Netherlands. We connect professional buyers with verified suppliers across 48 countries — with transparent pricing, direct contacts, and zero commissions.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_about_mission}</h2>
      <p>To make international seafood trade transparent, efficient, and trustworthy. We believe that every buyer deserves access to verified suppliers, real prices, and direct contacts — without paying middleman fees or relying on outdated sourcing methods.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_about_whatWeDo}</h2>
      <p>YORSO provides a curated marketplace where seafood suppliers are verified through a rigorous multi-step process. Buyers can search, compare, and contact suppliers directly — with full transparency on pricing, certifications, and company credentials.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_about_keyFacts}</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>380+ verified suppliers from 48 countries</li>
        <li>2,100+ active professional buyers</li>
        <li>0% commission on all transactions</li>
        <li>GDPR-compliant, EU-based infrastructure</li>
        <li>Multi-language platform (EN, RU, ES)</li>
      </ul>
    </InfoPageLayout>
  );
};

export default About;
