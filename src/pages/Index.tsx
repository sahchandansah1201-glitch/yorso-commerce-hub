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

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <AnimatedSection>
        <LiveOffers />
      </AnimatedSection>
      <AnimatedSection>
        <TrustStrip />
      </AnimatedSection>
      <AnimatedSection>
        <ValueSplit />
      </AnimatedSection>
      <AnimatedSection>
        <CategoryAcceleration />
      </AnimatedSection>
      <AnimatedSection>
        <SupplierVerification />
      </AnimatedSection>
      <AnimatedSection>
        <MarketplaceActivity />
      </AnimatedSection>
      <AnimatedSection>
        <SocialProof />
      </AnimatedSection>
      <AnimatedSection>
        <FAQ />
      </AnimatedSection>
      <AnimatedSection>
        <FinalCTA />
      </AnimatedSection>
      <Footer />
    </div>
  );
};

export default Index;
