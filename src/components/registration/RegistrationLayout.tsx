import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactNode } from "react";

const STEPS = [
  { path: "/register", label: "Role" },
  { path: "/register/email", label: "Email" },
  { path: "/register/verify", label: "Verify" },
  { path: "/register/details", label: "Details" },
  { path: "/register/onboarding", label: "Profile" },
  { path: "/register/ready", label: "Done" },
];

interface Props {
  children: ReactNode;
  hideProgress?: boolean;
}

const RegistrationLayout = ({ children, hideProgress }: Props) => {
  const { pathname } = useLocation();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / STEPS.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="relative z-10 border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
            YORSO
          </Link>
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

      {/* Footer */}
      <footer className="border-t border-border/30 py-4">
        <div className="container flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <span>·</span>
          <Link to="/contact" className="hover:text-foreground transition-colors">Help</Link>
        </div>
      </footer>
    </div>
  );
};

export default RegistrationLayout;
