import { Shield, Users, Lock, Globe, BadgeCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

type TrustVariant = "users" | "security" | "verified" | "global" | "growth" | "encryption";

interface Props {
  variant: TrustVariant;
  delay?: number;
  className?: string;
}

const ICONS: Record<TrustVariant, typeof Shield> = {
  users: Users,
  security: Shield,
  verified: BadgeCheck,
  global: Globe,
  growth: TrendingUp,
  encryption: Lock,
};

const TrustMicroText = ({ variant, delay = 0.5, className = "" }: Props) => {
  const { t } = useLanguage();
  const Icon = ICONS[variant];

  const TEXT_MAP: Record<TrustVariant, string> = {
    users: t.trustMicro_users,
    security: t.trustMicro_security,
    verified: t.trustMicro_verified,
    global: t.trustMicro_global,
    growth: t.trustMicro_growth,
    encryption: t.trustMicro_encryption,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex items-center justify-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <Icon className="h-3.5 w-3.5 text-primary/50 shrink-0" />
      <span>{TEXT_MAP[variant]}</span>
    </motion.div>
  );
};

export default TrustMicroText;
