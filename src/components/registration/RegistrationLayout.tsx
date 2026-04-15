import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ArrowLeft, Lock, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const STEPS = [
  { path: "/register", label: "Role" },
  { path: "/register/email", label: "Email" },
  { path: "/register/verify", label: "Verify" },
  { path: "/register/details", label: "Details" },
  { path: "/register/onboarding", label: "Profile" },
  { path: "/register/countries", label: "Markets" },
  { path: "/register/ready", label: "Done" },
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
    t.trustMicro_encryption,
    t.trustMicro_security,
    t.trustMicro_users,
  ];
  const idx = trustIndex ?? currentIndex % TRUST_ICONS.length;
  const TrustIcon = TRUST_ICONS[idx];
  const trustText = trustTexts[idx];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative z-10 border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
              YORSO
            </Link>
          </div>
          <Link
            to="/signin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.reg_alreadyHaveAccount} <span className="text-primary">{t.reg_signIn}</span>
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

      <main className="flex flex-1 items-center justify-center px-4 py-12 md:py-20">
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
            <Link to="/terms" className="hover:text-foreground transition-colors">{t.reg_terms}</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t.reg_privacyPolicy}</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-foreground transition-colors">{t.reg_help}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationLayout;
