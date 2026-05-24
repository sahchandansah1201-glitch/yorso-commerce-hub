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
import { useLanguage } from "@/i18n/LanguageContext";
import {
  absoluteUrl,
  applyRouteSeo,
  removeJsonLd,
  restoreCanonical,
  restoreGlobalSeo,
  upsertJsonLd,
} from "@/lib/seo";
import {
  PUBLIC_ROUTE_OG_IMAGE_PATH,
  ogLocaleByLang,
  publicRouteOgImageAlt,
} from "@/lib/public-route-seo";

const Index = () => {
  const location = useLocation();
  const { t, lang } = useLanguage();

  useEffect(() => {
    return initScrollDepthTracking();
  }, []);

  useEffect(() => {
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? null;
    const canonical = absoluteUrl("/");
    const image = absoluteUrl(PUBLIC_ROUTE_OG_IMAGE_PATH);
    const title = t.meta_siteTitle;
    const description = t.meta_siteDescription;
    const imageAlt = publicRouteOgImageAlt[lang];

    applyRouteSeo({
      title,
      description,
      canonical,
      og: {
        type: "website",
        title,
        description,
        url: canonical,
        image,
        imageAlt,
        locale: ogLocaleByLang[lang],
        siteName: "YORSO",
      },
      twitter: {
        title,
        description,
        image,
        imageAlt,
      },
    });

    upsertJsonLd("home-webpage", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${canonical}#organization`,
          name: "YORSO",
          url: canonical,
          logo: image,
        },
        {
          "@type": "WebSite",
          "@id": `${canonical}#website`,
          url: canonical,
          name: "YORSO",
          description,
          inLanguage: lang,
          publisher: { "@id": `${canonical}#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl("/offers")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: title,
          description,
          inLanguage: lang,
          isPartOf: { "@id": `${canonical}#website` },
          about: { "@id": `${canonical}#organization` },
        },
      ],
    });

    return () => {
      removeJsonLd("home-webpage");
      restoreGlobalSeo({
        title: t.meta_siteTitle,
        description: t.meta_siteDescription,
      });
      restoreCanonical(prevCanonical);
    };
  }, [lang, t]);

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
    <div className="min-h-screen overflow-x-hidden">
      <Header showSkipLink />
      <main id="main">
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
