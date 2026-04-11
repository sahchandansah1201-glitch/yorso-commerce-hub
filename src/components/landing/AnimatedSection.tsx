import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: "none" | "sm" | "md" | "lg";
}

const delayClass = {
  none: "",
  sm: "delay-100",
  md: "delay-200",
  lg: "delay-300",
};

const AnimatedSection = ({ children, className, delay = "none" }: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        delayClass[delay],
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
