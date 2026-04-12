import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mackerelProduct as product } from "@/data/mackerelProduct";
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
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ProductPage = () => {
  const [isLoggedIn] = useState(false);

  useEffect(() => {
    document.title = product.seo.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", product.seo.description);
  }, []);

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
            YORSO
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/signin">
              <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="font-semibold text-sm">Register Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/offers" className="hover:text-foreground transition-colors">Products</Link>
          <span>/</span>
          <span className="text-foreground">Mackerel HGT 50+</span>
        </nav>
      </div>

      <main className="container pb-16">
        {/* Hero + Commercial Card — above the fold */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <ProductHero product={product} isLoggedIn={isLoggedIn} />
          <div className="space-y-4">
            <CommercialCard product={product} isLoggedIn={isLoggedIn} />
            <RetentionHooks isLoggedIn={isLoggedIn} />
          </div>
        </div>

        {/* Registration conversion layer for anonymous */}
        {!isLoggedIn && <RegistrationLayer />}

        {/* Content sections */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <div className="space-y-12">
            <ProductOverview product={product} />
            <TechnicalSpecs specs={product.specs} />
            <SupplyLogistics logistics={product.logistics} />
            <SupplierTrust supplier={product.supplier} isLoggedIn={isLoggedIn} />
            <DocumentsCompliance documents={product.documents} isLoggedIn={isLoggedIn} />
            <RelatedProducts products={product.related} />
          </div>

          {/* Sticky sidebar on desktop */}
          <div className="hidden lg:block">
            <StickyActionRail isLoggedIn={isLoggedIn} product={product} />
          </div>
        </div>
      </main>

      {/* Mobile sticky bottom bar */}
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
