import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, Globe, Clock, AlertTriangle } from "lucide-react";

interface Props {
  supplier: {
    name: string;
    country: string;
    countryFlag: string;
    yearsInBusiness: number;
    tradeReadiness: string;
    verifiedFields: string[];
    unverifiedNote: string;
    certifications: string[];
    responseNote: string;
  };
  isLoggedIn: boolean;
}

export const SupplierTrust = ({ supplier, isLoggedIn }: Props) => (
  <section>
    <h2 className="font-heading text-xl font-bold text-foreground mb-4">Supplier Profile</h2>
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* Identity */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">{supplier.name}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> {supplier.countryFlag} {supplier.country}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> {supplier.yearsInBusiness} years in business
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {supplier.responseNote}
          </span>
        </div>
      </div>

      {/* Trade readiness */}
      <p className="text-sm text-muted-foreground">{supplier.tradeReadiness}</p>

      {/* Verified */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Verified by YORSO</h4>
        <ul className="space-y-1.5">
          {supplier.verifiedFields.map((field) => (
            <li key={field} className="flex items-center gap-2 text-sm text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
              {field}
            </li>
          ))}
        </ul>
      </div>

      {/* Unverified note */}
      <div className="flex gap-2 rounded-lg bg-muted/60 p-3">
        <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{supplier.unverifiedNote}</p>
      </div>

      {/* Certifications */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Certifications</h4>
        <div className="flex flex-wrap gap-1.5">
          {supplier.certifications.map((cert) => (
            <span key={cert} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
              {cert}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      {!isLoggedIn && (
        <Link to="/register" className="block">
          <Button variant="outline" className="w-full text-sm font-semibold">
            Register to View Full Supplier Profile
          </Button>
        </Link>
      )}
    </div>
  </section>
);
