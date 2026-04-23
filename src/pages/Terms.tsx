import InfoPageLayout from "@/components/InfoPageLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const Terms = () => {
  const { t } = useLanguage();
  return (
    <InfoPageLayout title={t.info_terms_title} updated="January 2026">
      <p>These Terms of Service ("Terms") govern your access to and use of the YORSO platform operated by YORSO B.V., a company registered in the Netherlands (KVK 12345678).</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">1. Acceptance of Terms</h2>
      <p>By accessing or using YORSO, you agree to be bound by these Terms. If you do not agree, you may not use the platform.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">2. Platform Description</h2>
      <p>YORSO is a B2B marketplace that connects seafood buyers with verified suppliers. The platform facilitates discovery, comparison, and direct communication between parties. YORSO does not take ownership of goods, handle payments between buyers and suppliers, or guarantee transaction outcomes.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">3. User Accounts</h2>
      <p>You must provide accurate and complete registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">4. Commission Policy</h2>
      <p>YORSO charges 0% commission on deals between buyers and suppliers. Revenue is generated through optional premium services available to suppliers.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">5. Supplier Verification</h2>
      <p>YORSO conducts due diligence on suppliers seeking verified status. Verification does not constitute a warranty or guarantee of supplier performance, product quality, or transaction outcomes.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">6. Limitation of Liability</h2>
      <p>YORSO is not liable for disputes between buyers and suppliers, product quality issues, shipping delays, or financial losses arising from transactions arranged through the platform.</p>
      <h2 className="font-heading text-xl font-bold text-foreground mt-8">7. Governing Law</h2>
      <p>These Terms are governed by the laws of the Netherlands. Any disputes shall be submitted to the competent courts of Amsterdam.</p>
    </InfoPageLayout>
  );
};

export default Terms;
