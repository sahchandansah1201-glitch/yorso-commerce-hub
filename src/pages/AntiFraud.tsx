import InfoPageLayout from "@/components/InfoPageLayout";

const AntiFraud = () => (
  <InfoPageLayout title="Anti-Fraud Policy" updated="January 2026">
    <p>YORSO takes fraud prevention seriously. Our platform is designed to protect both buyers and suppliers from fraudulent activity.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Supplier Verification</h2>
    <p>Every supplier undergoes multi-step verification before receiving a verified badge. This includes business registration checks, export license verification, facility certification review (HACCP, BRC, MSC), and trade reference validation.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Ongoing Monitoring</h2>
    <p>Verified suppliers are re-assessed annually. Badges can be suspended or revoked based on quality complaints, failed re-verification, or platform rule violations.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Reporting Concerns</h2>
    <p>If you suspect fraudulent activity on the platform, contact us immediately at <a href="mailto:compliance@yorso.com" className="text-primary hover:underline">compliance@yorso.com</a>. All reports are investigated within 48 hours.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Sanctions Screening</h2>
    <p>YORSO conducts trade sanctions screening as part of the supplier verification process, in compliance with EU and international trade regulations.</p>
  </InfoPageLayout>
);

export default AntiFraud;
