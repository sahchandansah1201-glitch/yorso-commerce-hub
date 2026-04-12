import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Package, DollarSign, Ship, MapPin, CheckCircle2 } from "lucide-react";

interface Props {
  product: {
    commercial: {
      pricePerKg: string;
      currency: string;
      moq: string;
      paymentTerms: string;
      incoterm: string;
      port: string;
      stockStatus: string;
      priceNote: string;
    };
  };
  isLoggedIn: boolean;
}

export const CommercialCard = ({ product, isLoggedIn }: Props) => {
  const c = product.commercial;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">Commercial Terms</h2>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-heading text-2xl font-bold text-foreground">{c.pricePerKg}</span>
        <span className="text-sm text-muted-foreground">/ kg ({c.currency})</span>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        <span className="text-xs font-medium text-success">{c.stockStatus}</span>
      </div>

      {/* Terms grid */}
      <div className="space-y-2.5 text-sm">
        <Row icon={Package} label="MOQ" value={c.moq} />
        <Row icon={DollarSign} label="Payment" value={c.paymentTerms} />
        <Row icon={Ship} label="Incoterm" value={c.incoterm} />
        <Row icon={MapPin} label="Port" value={c.port} />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground border-t border-border pt-3">
        {c.priceNote}
      </p>

      {/* CTAs */}
      <div className="mt-4 space-y-2">
        {isLoggedIn ? (
          <>
            <Button className="w-full gap-2 font-semibold" size="default">
              Request Quote <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full gap-2 font-semibold" size="default">
              Contact Supplier
            </Button>
          </>
        ) : (
          <>
            <Link to="/register" className="block">
              <Button className="w-full gap-2 font-semibold" size="default">
                Register to Request Quote <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register" className="block">
              <Button variant="outline" className="w-full gap-2 font-semibold text-sm" size="default">
                <Lock className="h-3.5 w-3.5" /> Register to Contact Supplier
              </Button>
            </Link>
          </>
        )}
      </div>

      {!isLoggedIn && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Free registration · No credit card · Unlock full supplier details
        </p>
      )}
    </div>
  );
};

const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium text-foreground">{value}</span>
    </div>
  </div>
);
