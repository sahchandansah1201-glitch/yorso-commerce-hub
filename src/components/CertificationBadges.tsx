import { useState } from "react";
import { Award, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCertificationInfo, type CertificationInfo } from "@/data/certifications";
import { cn } from "@/lib/utils";

interface CertificationBadgesProps {
  certifications: string[];
  /** Visual size variant */
  size?: "xs" | "sm";
  /** Limit how many badges to display */
  limit?: number;
  className?: string;
}

const sizeClasses = {
  xs: "px-1.5 py-0.5 text-[10px] gap-1",
  sm: "px-2 py-0.5 text-[11px] gap-1.5",
};

const iconSize = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
};

const CertificationBadges = ({
  certifications,
  size = "xs",
  limit,
  className,
}: CertificationBadgesProps) => {
  const [activeCert, setActiveCert] = useState<CertificationInfo | null>(null);

  if (!certifications || certifications.length === 0) return null;

  const items = limit ? certifications.slice(0, limit) : certifications;

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-1", className)}>
        {items.map((cert) => (
          <button
            key={cert}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveCert(getCertificationInfo(cert));
            }}
            className={cn(
              "inline-flex items-center rounded border border-border bg-muted/50 font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              sizeClasses[size],
            )}
            aria-label={`View details for ${cert} certification`}
          >
            <Award className={cn(iconSize[size], "text-primary")} />
            {cert}
          </button>
        ))}
      </div>

      <Dialog open={!!activeCert} onOpenChange={(open) => !open && setActiveCert(null)}>
        <DialogContent className="sm:max-w-md">
          {activeCert && (
            <>
              <DialogHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="font-heading text-lg">
                  {activeCert.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs uppercase tracking-wide text-primary">
                  {activeCert.code}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-foreground">
                {activeCert.description}
              </p>
              <div className="mt-2 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Issuer: </span>
                  {activeCert.issuer}
                </div>
                {activeCert.website && (
                  <a
                    href={activeCert.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Official website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificationBadges;
