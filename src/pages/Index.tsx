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

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <LiveOffers />
      <TrustStrip />
      <ValueSplit />
      <CategoryAcceleration />
      <SupplierVerification />
      <MarketplaceActivity />
      <SocialProof />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
