import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ArrowLeft, Lock, ShieldCheck, Users } from "lucide-react";

const STEPS = [
  { path: "/register", label: "Role" },
  { path: "/register/email", label: "Email" },
  { path: "/register/verify", label: "Verify" },
  { path: "/register/details", label: "Details" },
  { path: "/register/onboarding", label: "Profile" },
  { path: "/register/countries", label: "Markets" },
  { path: "/register/ready", label: "Done" },
];

const TRUST_MESSAGES = [
  { icon: Lock, text: "256-bit SSL encryption · Your data is secure" },
  { icon: ShieldCheck, text: "GDPR compliant · We never share your data" },
  { icon: Users, text: "Join 12,000+ seafood professionals worldwide" },
];

interface Props {
  children: ReactNode;
  hideProgress?: boolean;
  trustIndex?: number;
}

const RegistrationLayout = ({ children, hideProgress, trustIndex }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / STEPS.length) * 100 : 0;
  const canGoBack = currentIndex > 0;

  const trust = TRUST_MESSAGES[trustIndex ?? currentIndex % TRUST_MESSAGES.length];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
            Already have an account? <span className="text-primary">Sign in</span>
          </Link>
        </div>
        {/* Progress bar */}
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

      {/* Content */}
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

      {/* Trust strip + Footer */}
      <footer className="border-t border-border/30 py-4">
        <div className="container space-y-3">
          {/* Trust microcopy */}
          {!hideProgress && trust && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <trust.icon className="h-3.5 w-3.5 text-primary/50" />
              <span>{trust.text}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-foreground transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationLayout;
