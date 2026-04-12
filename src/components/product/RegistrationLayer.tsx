import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, BarChart3, Bookmark, GitCompare, Bell, FileText } from "lucide-react";

const benefits = [
  { icon: MessageSquare, text: "Contact suppliers directly" },
  { icon: FileText, text: "Request quotes & documents" },
  { icon: Bookmark, text: "Save products to shortlist" },
  { icon: GitCompare, text: "Compare offers side-by-side" },
  { icon: Bell, text: "Track price changes & restocks" },
  { icon: BarChart3, text: "Access full logistics details" },
];

export const RegistrationLayer = () => (
  <section className="mt-10 rounded-xl border border-primary/20 bg-primary/[0.03] p-6 md:p-8">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
        Continue your sourcing workflow
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Register for free to unlock full commercial details, supplier contact, and professional procurement tools.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-3 max-w-lg mx-auto">
        {benefits.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2">
            <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-xs text-foreground leading-snug">{text}</span>
          </div>
        ))}
      </div>

      <Link to="/register" className="inline-block mt-6">
        <Button size="lg" className="gap-2 font-semibold px-8">
          Register Free — Start Sourcing <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <p className="mt-2 text-[11px] text-muted-foreground">No credit card · 5 min setup · Join 2,100+ active buyers</p>
    </div>
  </section>
);
