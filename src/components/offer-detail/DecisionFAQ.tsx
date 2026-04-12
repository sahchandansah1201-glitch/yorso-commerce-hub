import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const decisionFaq = [
  {
    q: "How do I contact this supplier?",
    a: "Register for a free YORSO account (takes 2 minutes), then click 'Request Quote' on the offer page. Your message goes directly to the supplier — no intermediaries, no hidden fees. You'll also get access to the supplier's direct email and phone.",
  },
  {
    q: "What documents can I request after registration?",
    a: "Registered buyers can request product spec sheets, certificates of analysis (CoA), catch certificates, health certificates, packing lists, and any compliance documentation relevant to their import requirements.",
  },
  {
    q: "Can I request a sample or arrange pre-shipment inspection?",
    a: "Yes. After registration, you can request commercial samples directly from the supplier. For large orders, you can arrange third-party pre-shipment inspection. Sample costs and logistics are agreed directly with the supplier.",
  },
  {
    q: "How does YORSO verification work?",
    a: "Verified suppliers pass a multi-step review: business registration, export licenses, facility certifications (HACCP, BRC, MSC, etc.), and trade references from existing buyers. YORSO may also conduct virtual or on-site facility inspections. Verification is earned, not purchased.",
  },
  {
    q: "What if the product specs differ from the listing?",
    a: "YORSO's verified suppliers agree to listing accuracy standards. If a delivered product materially differs from the listing, our dispute resolution team assists. We recommend requesting a Certificate of Analysis and arranging pre-shipment inspection for first orders.",
  },
  {
    q: "Can I compare multiple suppliers before contacting any?",
    a: "Yes. Browse and compare offers without registering. Save offers to your shortlist and use the comparison view. Registration is only needed when you're ready to contact a supplier directly.",
  },
  {
    q: "How does delivery basis (Incoterm) affect price?",
    a: "Different delivery terms include different costs. FOB covers product cost to the loading port. CIF includes insurance and freight to destination. The same product may have different prices depending on the delivery basis selected. Use the delivery basis selector on each offer to compare.",
  },
];

const DecisionFAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {decisionFaq.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="text-sm font-medium text-foreground">{item.q}</span>
              {openIdx === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
            {openIdx === i && <p className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DecisionFAQ;
