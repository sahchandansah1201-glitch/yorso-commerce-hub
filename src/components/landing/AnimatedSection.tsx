import { motion, type Variant } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimationPreset = "fade-up" | "fade-left" | "fade-right" | "scale" | "blur";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  preset?: AnimationPreset;
  once?: boolean;
  amount?: number;
}

const presets: Record<AnimationPreset, { hidden: Variant; visible: Variant }> = {
  "fade-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(8px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

const AnimatedSection = ({
  children,
  className,
  delay = 0,
  preset = "fade-up",
  once = true,
  amount = 0.15,
}: AnimatedSectionProps) => {
  const { hidden, visible } = presets[preset];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden,
        visible: {
          ...visible,
          transition: {
            duration: 0.7,
            ease: [0.25, 0.4, 0.25, 1],
            delay,
          },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
