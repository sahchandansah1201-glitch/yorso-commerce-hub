import { Shield, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";

const PROOFS = [
  { icon: Users, text: "12,000+ seafood professionals onboard" },
  { icon: Shield, text: "2,400+ verified suppliers across 48 countries" },
  { icon: Globe, text: "Zero commission — direct deals, always" },
];

interface Props {
  variant?: "inline" | "strip";
}

const SocialProofBanner = ({ variant = "inline" }: Props) => {
  if (variant === "strip") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
      >
        {PROOFS.map(({ icon: Icon, text }) => (
          <span key={text} className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-primary/60" />
            {text}
          </span>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-6 rounded-xl border border-border/50 bg-muted/30 px-5 py-3.5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Trusted by 12,000+ professionals</p>
          <p className="text-xs text-muted-foreground">2,400+ verified suppliers · 48 countries · Zero commission</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialProofBanner;
