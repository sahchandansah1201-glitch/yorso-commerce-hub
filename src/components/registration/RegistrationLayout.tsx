import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { ArrowLeft, Lock, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const STEPS = [
  { path: "/register", labelKey: "reg_step_role" as const },
  { path: "/register/email", labelKey: "reg_step_email" as const },
  { path: "/register/verify", labelKey: "reg_step_verify" as const },
  { path: "/register/details", labelKey: "reg_step_details" as const },
  { path: "/register/onboarding", labelKey: "reg_step_profile" as const },
  { path: "/register/countries", labelKey: "reg_step_markets" as const },
  { path: "/register/ready", labelKey: "reg_step_done" as const },
];

const TRUST_ICONS = [Lock, ShieldCheck, Users];

interface Props {
  children: ReactNode;
  hideProgress?: boolean;
  trustIndex?: number;
}

const RegistrationLayout = ({ children, hideProgress, trustIndex }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / STEPS.length) * 100 : 0;
  const canGoBack = currentIndex > 0;

  const trustTexts = [
    t.trustMicro_privacy,
    t.trustMicro_security,
    t.trustMicro_users,
  ];
  const idx = trustIndex ?? currentIndex % TRUST_ICONS.length;
  const TrustIcon = TRUST_ICONS[idx];
  const trustText = trustTexts[idx];

  const skipToMain = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("main");
    if (!target) return;

    event.preventDefault();
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#main`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative z-10 border-b border-border/40">
        <a
          href="#main"
          onClick={skipToMain}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {t.aria_skipToMain}
        </a>
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={() => navigate(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label={t.aria_goBack}
                data-registration-mobile-target="layout-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded px-1 font-heading text-2xl font-bold tracking-tight text-foreground"
              data-registration-mobile-target="layout-logo"
            >
              YORSO
            </Link>
          </div>
          <Link
            to="/signin"
            className="inline-flex min-h-11 min-w-11 items-center justify-end rounded px-2 text-right text-sm font-medium text-muted-foreground transition-colors hover:text-foreground shrink-0"
            data-registration-mobile-target="layout-signin"
          >
            <span className="hidden sm:inline">{t.reg_alreadyHaveAccount} </span><span className="text-primary">{t.reg_signIn}</span>
          </Link>
        </div>
        {!hideProgress && currentIndex >= 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border/30">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}
      </header>

      <main id="main" className="flex flex-1 justify-center px-4 pt-8 pb-12 md:pt-16">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-border/30 py-4">
        <div className="container space-y-3">
          {!hideProgress && TrustIcon && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <TrustIcon className="h-3.5 w-3.5 text-primary/50" />
              <span>{trustText}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 transition-colors hover:text-foreground" data-registration-mobile-target="layout-footer-link">{t.reg_terms}</Link>
            <span>·</span>
            <Link to="/privacy" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 transition-colors hover:text-foreground" data-registration-mobile-target="layout-footer-link">{t.reg_privacyPolicy}</Link>
            <span>·</span>
            <Link to="/contact" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 transition-colors hover:text-foreground" data-registration-mobile-target="layout-footer-link">{t.reg_help}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationLayout;
