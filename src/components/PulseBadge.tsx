import { useLanguage } from "@/i18n/LanguageContext";
import { pulseInt } from "@/lib/pulse-seed";

interface Props {
  offerId: string;
  variant?: "viewing" | "requests";
  className?: string;
}

/**
 * Small "live activity" chip rendered on offer cards. Numbers are deterministic
 * per offer ID (so the same offer always shows the same number within a render)
 * and explicitly marked as estimates — no real backend signal yet.
 */
const PulseBadge = ({ offerId, variant = "viewing", className }: Props) => {
  const { t } = useLanguage();
  const n =
    variant === "viewing"
      ? pulseInt(offerId, "view", 2, 9)
      : pulseInt(offerId, "req", 1, 5);
  const tpl = variant === "viewing" ? t.pulse_viewing : t.pulse_requests;
  const label = tpl.replace("{n}", String(n));

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success ${className ?? ""}`}
      data-testid="pulse-badge"
      title={t.pulse_estimate}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      <span>{label}</span>
    </span>
  );
};

export default PulseBadge;
