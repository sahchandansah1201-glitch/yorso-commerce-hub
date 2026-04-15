import { Shield, Users, Lock, Globe, BadgeCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type TrustVariant = "users" | "security" | "verified" | "global" | "growth" | "encryption";

const TRUST_DATA: Record<TrustVariant, { icon: typeof Shield; text: string }> = {
  users: { icon: Users, text: "12,000+ seafood professionals already on YORSO" },
  security: { icon: Shield, text: "Your data is handled according to our Privacy Policy" },
  verified: { icon: BadgeCheck, text: "2,400+ suppliers verified through document and reference checks" },
  global: { icon: Globe, text: "Active deals in 48 countries — zero commission" },
  growth: { icon: TrendingUp, text: "300+ new members joined this week" },
  encryption: { icon: Lock, text: "We follow industry-standard privacy practices · GDPR-aligned" },
};

interface Props {
  variant: TrustVariant;
  delay?: number;
  className?: string;
}

const TrustMicroText = ({ variant, delay = 0.5, className = "" }: Props) => {
  const { icon: Icon, text } = TRUST_DATA[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex items-center justify-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <Icon className="h-3.5 w-3.5 text-primary/50 shrink-0" />
      <span>{text}</span>
    </motion.div>
  );
};

export default TrustMicroText;
