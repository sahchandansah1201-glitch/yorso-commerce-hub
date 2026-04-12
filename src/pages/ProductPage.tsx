import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { productCatalog } from "@/data/productCatalog";
import { ProductHero } from "@/components/product/ProductHero";
import { CommercialCard } from "@/components/product/CommercialCard";
import { ProductOverview } from "@/components/product/ProductOverview";
import { TechnicalSpecs } from "@/components/product/TechnicalSpecs";
import { SupplyLogistics } from "@/components/product/SupplyLogistics";
import { SupplierTrust } from "@/components/product/SupplierTrust";
import { DocumentsCompliance } from "@/components/product/DocumentsCompliance";
import { RetentionHooks } from "@/components/product/RetentionHooks";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { StickyActionRail } from "@/components/product/StickyActionRail";
import { RegistrationLayer } from "@/components/product/RegistrationLayer";
import { ProductJsonLd } from "@/components/product/ProductJsonLd";
import { ProductFAQ } from "@/components/product/ProductFAQ";
import { Button } from "@/components/ui/button";

const ProductPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const product = slug ? productCatalog[slug] : undefined;
  const [isLoggedIn] = useState(false);

  useEffect(() => {
    if (product) {
      document.title = product.seo.title;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", product.seo.description);
    }
    window.scrollTo(0, 0);
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Product not found</h1>
          <Link to="/offers"><Button className="mt-4">Browse all offers</Button></Link>
        </div>
      </div>
    );
  }

  const breadcrumbName = product.name.length > 40 ? product.name.slice(0, 40) + "…" : product.name;
  const currentUrl = `${window.location.origin}${location.pathname}`;

  return (
    <div className="min-h-screen bg-background font-body">
      <ProductJsonLd product={product} url={currentUrl} />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">YORSO</Link>
          <div className="flex items-center gap-2">
            <Link to="/signin"><Button variant="ghost" size="sm" className="text-sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm" className="font-semibold text-sm">Register Free</Button></Link>
          </div>
        </div>
      </header>

      <div className="container pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/offers" className="hover:text-foreground transition-colors">Products</Link>
          <span>/</span>
          <span className="text-foreground">{breadcrumbName}</span>
        </nav>
      </div>

      <main className="container pb-16">
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <ProductHero product={product} isLoggedIn={isLoggedIn} />
          <div className="space-y-4">
            <CommercialCard product={product} isLoggedIn={isLoggedIn} />
            <RetentionHooks isLoggedIn={isLoggedIn} />
          </div>
        </div>

        {!isLoggedIn && <RegistrationLayer />}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <div className="space-y-12">
            <ProductOverview product={product} />
            <TechnicalSpecs specs={product.specs} />
            <SupplyLogistics logistics={product.logistics} />
            <SupplierTrust supplier={product.supplier} isLoggedIn={isLoggedIn} />
            <DocumentsCompliance documents={product.documents} isLoggedIn={isLoggedIn} />
            {product.faq && <ProductFAQ faq={product.faq} />}
            <RelatedProducts products={product.related} />
          </div>
          <div className="hidden lg:block">
            <StickyActionRail isLoggedIn={isLoggedIn} product={product} />
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card p-3 lg:hidden">
        <div className="flex gap-2">
          <Link to="/register" className="flex-1">
            <Button className="w-full font-semibold text-sm" size="sm">
              {isLoggedIn ? "Request Quote" : "Register to Get Quote"}
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-sm">Save</Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
