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
import { useLanguage } from "@/i18n/LanguageContext";

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
  const { lang, t } = useLanguage();
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
              setActiveCert(getCertificationInfo(cert, lang));
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
                <div className="flex items-start gap-3">
                  {activeCert.logo ? (
                    <img
                      src={activeCert.logo}
                      alt={`${activeCert.code} logo`}
                      loading="lazy"
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-md border border-border bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-left">
                    <DialogTitle className="font-heading text-lg leading-tight">
                      {activeCert.fullName}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-xs uppercase tracking-wide text-primary">
                      {activeCert.code}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-foreground">
                {activeCert.description}
              </p>
              <div className="mt-2 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">{t.cert_issuer}: </span>
                  {activeCert.issuer}
                </div>
                {activeCert.website && (
                  <a
                    href={activeCert.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {t.cert_officialWebsite}
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
