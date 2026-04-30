import { Link, useNavigate } from "react-router-dom";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useRegistrationGuard } from "@/hooks/use-registration-guard";
import RegistrationLayout from "@/components/registration/RegistrationLayout";
import TrustMicroText from "@/components/registration/TrustMicroText";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, Sparkles, Package, Globe, Award,
  Building, MapPin, Mail, Phone, ShieldCheck, BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import analytics from "@/lib/analytics";
import { authApi, isApiError } from "@/lib/api-contracts";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import {
  readPendingPreviewAttribution,
  clearPendingPreviewAttribution,
} from "@/lib/preview-attribution";

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const RegisterReady = () => {
  const { data, setField } = useRegistration();
  const guardPassed = useRegistrationGuard("/register/ready");
  const { t } = useLanguage();
  const { signIn, isSignedIn } = useBuyerSession();
  const navigate = useNavigate();
  const isSupplier = data.role === "supplier";
  const firstName = data.fullName?.split(" ")[0] || "there";

  // Returning buyers (already signed in on a repeat visit) skip the celebratory
  // animations entirely and jump straight to the catalog — no flicker, no rerun.
  const isReturningBuyer = guardPassed && data.role === "buyer" && isSignedIn && data.completed === true;
  const REDIRECT_SECONDS = 5;
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const completionRan = useRef(false);

  useEffect(() => {
    if (!guardPassed) return;
    if (completionRan.current) return;
    completionRan.current = true;

    // Finalize registration through the contract.
    (async () => {
      const result = await authApi.completeRegistration({ sessionId: data.sessionId });
      if (isApiError(result)) {
        analytics.track("api_error", { endpoint: "auth/register/complete", code: result.code });
        // Soft-fail: still show the success screen so the user is not blocked.
      }
      setField("completed", true);
      const funnelDurationMs = data.startedAt > 0 ? Date.now() - data.startedAt : null;
      const pendingAttr = readPendingPreviewAttribution();
      const completePayload = {
        role: data.role || "unknown",
        step: 7 as const,
        sessionId: data.sessionId,
        country: data.country,
        categories: data.categories.length,
        countries: data.countries.length,
        funnelDurationMs,
        ...(pendingAttr
          ? {
              source: "supplier_preview" as const,
              supplier_id: pendingAttr.supplier_id,
              species: pendingAttr.species,
              form: pendingAttr.form,
              href: pendingAttr.href,
              access_level: pendingAttr.access_level,
            }
          : { source: "direct" as const }),
      };

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(
          `[debug] registration_complete (${completePayload.source})`,
        );
        // eslint-disable-next-line no-console
        console.log("pending_preview_attribution:", pendingAttr);
        // eslint-disable-next-line no-console
        console.log("registration_complete payload:", completePayload);
        // eslint-disable-next-line no-console
        console.groupEnd();
      }

      analytics.track("registration_complete", completePayload);
      if (pendingAttr) clearPendingPreviewAttribution();

      // Buyers came here to find products fast — sign them in and route to /offers.
      if (data.role === "buyer" && data.email && !isSignedIn) {
        signIn({ identifier: data.email, method: "email" });
        analytics.track("workspace_session_started", { method: "email" });
      }
    })();
    // One-shot completion analytics; re-running on data changes would double-fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardPassed]);

  // Returning buyers go straight to the catalog without showing the success screen again.
  useEffect(() => {
    if (isReturningBuyer) navigate("/offers", { replace: true });
  }, [isReturningBuyer, navigate]);

  // Auto-redirect verified buyers to the procurement workspace with a visible countdown.
  useEffect(() => {
    if (!guardPassed) return;
    if (data.role !== "buyer") return;
    if (isReturningBuyer) return;

    // Banner shown — captures impression for conversion + time-to-catalog measurement.
    const shownAt = Date.now();
    analytics.track("buyer_auto_redirect_banner_shown", {
      sessionId: data.sessionId,
      countdownSeconds: REDIRECT_SECONDS,
    });

    const tick = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const redirect = window.setTimeout(() => {
      analytics.track("buyer_auto_redirect_fired", {
        sessionId: data.sessionId,
        destination: "/offers",
        trigger: "timeout",
        waitMs: Date.now() - shownAt,
      });
      navigate("/offers");
    }, REDIRECT_SECONDS * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [guardPassed, data.role, data.sessionId, isReturningBuyer, navigate]);

  if (!guardPassed) return null;
  if (isReturningBuyer) return null;

  const categoriesCount = data.categories.length;
  const countriesCount = data.countries.length;
  const certsCount = data.certifications.length;
  const matchCount = Math.max(12, categoriesCount * 15 + countriesCount * 8);

  const getWelcomeEmoji = () => {
    const map: Record<string, string> = {
      "Russia": "🇷🇺", "United States": "🇺🇸", "Germany": "🇩🇪", "Norway": "🇳🇴",
      "Japan": "🇯🇵", "China": "🇨🇳", "France": "🇫🇷", "Spain": "🇪🇸",
      "Netherlands": "🇳🇱", "United Kingdom": "🇬🇧", "Brazil": "🇧🇷", "India": "🇮🇳",
      "South Korea": "🇰🇷", "Iceland": "🇮🇸", "Chile": "🇨🇱", "Thailand": "🇹🇭",
    };
    return data.country ? map[data.country] || "🌊" : "🌊";
  };

  return (
    <RegistrationLayout hideProgress>
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          {/* Soft pulsating glow */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-success/20 blur-xl"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.4, 1.2] }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
          {/* Expanding celebratory rings */}
          {[0, 0.25, 0.5].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-success/40"
              initial={{ opacity: 0.7, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 1.4, delay, ease: "easeOut" }}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
          >
            <CheckCircle2 className="h-10 w-10 text-success" />
          </motion.div>
        </div>

        <motion.h1 {...anim(0.25)} className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {getWelcomeEmoji()} {t.reg_welcome.replace("{name}", firstName)}
        </motion.h1>

        <motion.p {...anim(0.35)} className="mt-3 text-lg text-muted-foreground">
          {t.reg_profileComplete
            .replace("{role}", isSupplier ? t.reg_supplier.toLowerCase() : t.reg_buyer.toLowerCase())
            .replace("{company}", data.company ? ` for ${data.company}` : "")}
        </motion.p>

        <motion.div {...anim(0.4)} className="mt-6 rounded-2xl border border-border bg-card p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="h-4.5 w-4.5 text-primary" />
            <p className="text-sm font-semibold text-foreground">{t.reg_yourProfile}</p>
          </div>
          <div className="space-y-2">
            {data.company && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Building className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.company}</span>
                <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {isSupplier ? t.reg_supplier : t.reg_buyer}
                </span>
              </div>
            )}
            {data.country && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.country}</span>
              </div>
            )}
            {data.email && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.email}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-success ml-auto shrink-0" />
              </div>
            )}
            {data.phone && data.phoneVerified && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span>{data.phone}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-success ml-auto shrink-0" />
              </div>
            )}
          </div>
        </motion.div>

        {(categoriesCount > 0 || countriesCount > 0) && (
          <motion.div {...anim(0.48)} className="mt-4 grid grid-cols-3 gap-3">
            {categoriesCount > 0 && (
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <Package className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{categoriesCount}</p>
                <p className="text-xs text-muted-foreground">{categoriesCount === 1 ? t.reg_category : t.reg_categories}</p>
              </div>
            )}
            {countriesCount > 0 && (
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <Globe className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{countriesCount}</p>
                <p className="text-xs text-muted-foreground">{countriesCount === 1 ? t.reg_market : t.reg_markets}</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              {isSupplier && certsCount > 0 ? (
                <>
                  <Award className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{certsCount}</p>
                  <p className="text-xs text-muted-foreground">{certsCount === 1 ? t.reg_certification : t.reg_certificationsLabel}</p>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{matchCount}+</p>
                  <p className="text-xs text-muted-foreground">{t.reg_matchingOffers}</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        <motion.div {...anim(0.55)} className="mt-4 rounded-2xl border border-border bg-card p-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-heading font-bold text-foreground">{t.reg_whatsNext}</p>
          </div>
        </motion.div>

        {!isSupplier && (
          <motion.div
            {...anim(0.6)}
            role="status"
            aria-live="polite"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-left text-sm text-foreground"
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary"
            />
            <span>{t.reg_buyerAutoRedirect.replace("{seconds}", String(secondsLeft))}</span>
          </motion.div>
        )}

        <motion.div {...anim(0.65)} className="mt-6">
          <Link to="/offers">
            <Button size="lg" className="w-full h-14 text-base font-semibold rounded-xl gap-2">
              {isSupplier ? t.reg_createFirstOffer : t.reg_exploreOffers}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        <TrustMicroText variant="users" delay={0.75} className="mt-5" />
      </div>
    </RegistrationLayout>
  );
};

export default RegisterReady;
