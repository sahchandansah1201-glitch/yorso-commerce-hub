import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/landing/Header";
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
  seoTitleWithBrand,
} from "@/lib/public-route-seo";

interface Props {
  title: string;
  description: string;
  canonicalPath: string;
  children: ReactNode;
  updated?: string;
  schemaType?: "AboutPage" | "ContactPage" | "WebPage";
}

const jsonLdIdForPath = (path: string) =>
  `info-page-${path.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]+/gi, "-") || "home"}`;

const InfoPageLayout = ({
  title,
  description,
  canonicalPath,
  children,
  updated,
  schemaType = "WebPage",
}: Props) => {
  const { t, lang } = useLanguage();

  useEffect(() => {
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? null;
    const canonical = absoluteUrl(canonicalPath);
    const image = absoluteUrl(PUBLIC_ROUTE_OG_IMAGE_PATH);
    const imageAlt = publicRouteOgImageAlt[lang];
    const seoTitle = seoTitleWithBrand(title);
    const jsonLdId = jsonLdIdForPath(canonicalPath);

    applyRouteSeo({
      title: seoTitle,
      description,
      canonical,
      og: {
        type: "website",
        title: seoTitle,
        description,
        url: canonical,
        image,
        imageAlt,
        locale: ogLocaleByLang[lang],
        siteName: "YORSO",
      },
      twitter: {
        title: seoTitle,
        description,
        image,
        imageAlt,
      },
    });

    upsertJsonLd(jsonLdId, {
      "@context": "https://schema.org",
      "@type": schemaType,
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: seoTitle,
      description,
      inLanguage: lang,
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      publisher: {
        "@type": "Organization",
        name: "YORSO",
        url: absoluteUrl("/"),
      },
    });

    return () => {
      removeJsonLd(jsonLdId);
      restoreGlobalSeo({
        title: t.meta_siteTitle,
        description: t.meta_siteDescription,
      });
      restoreCanonical(prevCanonical);
    };
  }, [canonicalPath, description, lang, schemaType, t, title]);

  return (
    <div className="min-h-screen bg-background">
      <Header showSkipLink />
      <main id="main" className="container max-w-3xl py-12 md:py-16">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> {t.info_backToHome}
          </Link>
        </Button>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted-foreground">{t.info_lastUpdated}: {updated}</p>}
        <div className="mt-8 prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-4">
          {children}
        </div>
      </main>
      <footer className="border-t border-border bg-accent py-6">
        <div className="container text-center text-xs text-accent-foreground/40">
          © {new Date().getFullYear()} YORSO B.V. {t.info_footer_rights}. · {t.info_contact_officeAddress}
        </div>
      </footer>
    </div>
  );
};

export default InfoPageLayout;
