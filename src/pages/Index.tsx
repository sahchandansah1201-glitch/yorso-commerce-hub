import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import LiveOffers from "@/components/landing/LiveOffers";
import TrustStrip from "@/components/landing/TrustStrip";
import ValueSplit from "@/components/landing/ValueSplit";
import CategoryAcceleration from "@/components/landing/CategoryAcceleration";
import SupplierVerification from "@/components/landing/SupplierVerification";
import MarketplaceActivity from "@/components/landing/MarketplaceActivity";
import SocialProof from "@/components/landing/SocialProof";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import AnimatedSection from "@/components/landing/AnimatedSection";
import { initScrollDepthTracking } from "@/lib/analytics";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    return initScrollDepthTracking();
  }, []);

  // Scroll to anchor when arriving with a hash (e.g. /#offers from another route)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // Defer to allow sections to mount
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <AnimatedSection>
        <LiveOffers />
      </AnimatedSection>
      <AnimatedSection preset="scale" delay={0.05}>
        <TrustStrip />
      </AnimatedSection>
      <AnimatedSection preset="fade-left">
        <ValueSplit />
      </AnimatedSection>
      <AnimatedSection preset="fade-right" delay={0.1}>
        <CategoryAcceleration />
      </AnimatedSection>
      <AnimatedSection preset="blur">
        <SupplierVerification />
      </AnimatedSection>
      <AnimatedSection preset="fade-up" delay={0.05}>
        <MarketplaceActivity />
      </AnimatedSection>
      <AnimatedSection preset="scale">
        <SocialProof />
      </AnimatedSection>
      <AnimatedSection preset="fade-up">
        <FAQ />
      </AnimatedSection>
      <AnimatedSection preset="blur" delay={0.1}>
        <FinalCTA />
      </AnimatedSection>
      <Footer />
    </div>
  );
};

export default Index;
