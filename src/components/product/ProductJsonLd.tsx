import { ProductData } from "@/data/productCatalog";

interface Props {
  product: ProductData;
  url: string;
}

export const ProductJsonLd = ({ product, url }: Props) => {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${new URL(url).origin}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${new URL(url).origin}/offers` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortSummary,
    image: product.image,
    url,
    sku: product.slug,
    brand: {
      "@type": "Organization",
      name: product.supplier.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.commercial.currency,
      price: product.commercial.pricePerKg.replace(/[^0-9.]/g, ""),
      availability: product.commercial.stockStatus.toLowerCase().includes("in stock")
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      seller: {
        "@type": "Organization",
        name: product.supplier.name,
      },
    },
    additionalProperty: product.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.label,
      value: s.value,
    })),
  };

  const faqSchema = product.faq && product.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: product.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
};
