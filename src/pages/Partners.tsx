import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Partners = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_partners_title}>
      <p>{t.info_partners_intro}</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_partners_types}</h2>
      <ul className="list-disc pl-5 space-y-1">
        {t.info_partners_typesList.map((p) => (
          <li key={p.term}><strong>{p.term}</strong> — {p.desc}</li>
        ))}
      </ul>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">{t.info_partners_contact}</h2>
      <p>{t.info_partners_contactBody1}<a href="mailto:partners@yorso.com" className="text-primary hover:underline">partners@yorso.com</a>{t.info_partners_contactBody2}</p>
    </InfoPageLayout>
  );
};

export default Partners;
