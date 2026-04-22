import InfoPageLayout from "@/components/InfoPageLayout";

const Cookies = () => (
  <InfoPageLayout title="Cookie Policy" updated="January 2026">
    <p>YORSO uses cookies and similar technologies to provide, protect, and improve the platform experience.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Essential Cookies</h2>
    <p>Required for the platform to function. These include session management, authentication tokens, and language preferences. Cannot be disabled.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Analytics Cookies</h2>
    <p>Help us understand how users interact with YORSO. We use this data to improve features and user experience. Data is anonymized and never sold.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Managing Cookies</h2>
    <p>You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Contact</h2>
    <p>Questions about our cookie practices? Contact <a href="mailto:privacy@yorso.com" className="text-primary hover:underline">privacy@yorso.com</a>.</p>
  </InfoPageLayout>
);

export default Cookies;
