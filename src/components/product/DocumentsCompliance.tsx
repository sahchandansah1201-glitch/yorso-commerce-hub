import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Lock, AlertCircle, Download } from "lucide-react";

interface Props {
  documents: {
    available: { name: string; type: string; gated: boolean }[];
    missing: { name: string; note: string }[];
  };
  isLoggedIn: boolean;
}

export const DocumentsCompliance = ({ documents, isLoggedIn }: Props) => (
  <section>
    <h2 className="font-heading text-xl font-bold text-foreground mb-4">Documents & Compliance</h2>
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Available */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Available Documents</h4>
        <ul className="space-y-2">
          {documents.available.map((doc) => (
            <li key={doc.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {doc.name}
              </span>
              {doc.gated && !isLoggedIn ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Register to access
                </span>
              ) : (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <Download className="h-3 w-3" /> View
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Missing */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Not Yet Provided</h4>
        <ul className="space-y-2">
          {documents.missing.map((doc) => (
            <li key={doc.name} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {!isLoggedIn && (
        <Link to="/register" className="block pt-2">
          <Button variant="outline" className="w-full text-sm font-semibold">
            Register to Request Documents
          </Button>
        </Link>
      )}
    </div>
  </section>
);
