import InfoPageLayout from "@/components/InfoPageLayout";

const Partners = () => (
  <InfoPageLayout title="Partner Program">
    <p>YORSO partners with industry organizations, trade associations, logistics providers, and technology companies to strengthen the global seafood supply chain.</p>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Partnership Types</h2>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Trade Associations</strong> — co-promotion, member benefits, industry data sharing</li>
      <li><strong>Logistics Partners</strong> — integrated shipping and cold chain solutions</li>
      <li><strong>Technology Partners</strong> — API integrations, traceability solutions</li>
      <li><strong>Certification Bodies</strong> — streamlined verification for certified suppliers</li>
    </ul>
    <h2 className="font-heading text-xl font-bold text-foreground mt-8">Get in Touch</h2>
    <p>Interested in partnering with YORSO? Contact <a href="mailto:partners@yorso.com" className="text-primary hover:underline">partners@yorso.com</a>.</p>
  </InfoPageLayout>
);

export default Partners;
