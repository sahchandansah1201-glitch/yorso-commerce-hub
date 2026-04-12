import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, ShieldCheck, MapPin, Clock, Snowflake, Leaf, Thermometer,
  Bookmark, GitCompareArrows, FileCheck, Globe, Package, Truck, ChevronDown, ChevronUp,
  Building2, Timer, BadgeCheck, FileText, Anchor, Scale,
} from "lucide-react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import analytics from "@/lib/analytics";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

/* ---------- Photo Gallery ---------- */
const PhotoGallery = ({ images, alt }: { images: string[]; alt: string }) => {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <img
          src={images[active]}
          alt={alt}
          className="h-full w-full object-cover aspect-[4/3]"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${i === active ? "border-primary" : "border-border"}`}
              style={{ width: 72, height: 54 }}
            >
              <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Offer Summary ---------- */
const OfferSummary = ({ offer }: { offer: SeafoodOffer }) => {
  const FormatIcon = formatIcon[offer.format];
  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <FormatIcon className="h-3 w-3" /> {offer.format}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {offer.freshness}
          </span>
          <StockBadge status={offer.commercial.stockStatus} />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground md:text-2xl leading-tight">{offer.productName}</h1>
        <p className="mt-1 text-sm italic text-muted-foreground">{offer.latinName}</p>
      </div>

      {/* Price */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-2xl font-bold text-foreground">{offer.priceRange}</span>
          <span className="text-sm text-muted-foreground">{offer.priceUnit}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{offer.moq}</p>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Cut type" value={offer.cutType} />
        <SpecRow icon={<MapPin className="h-3.5 w-3.5" />} label="Origin" value={`${offer.originFlag} ${offer.origin}`} />
        <SpecRow icon={<Globe className="h-3.5 w-3.5" />} label="Incoterm" value={offer.commercial.incoterm} />
        <SpecRow icon={<Scale className="h-3.5 w-3.5" />} label="Available" value={offer.commercial.availableVolume} />
        <SpecRow icon={<FileText className="h-3.5 w-3.5" />} label="Payment" value={offer.commercial.paymentTerms} />
        <SpecRow icon={<Truck className="h-3.5 w-3.5" />} label="Lead time" value={offer.commercial.leadTime} />
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Packaging" value={offer.packaging} />
      </div>
    </div>
  );
};

const SpecRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 py-1">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const StockBadge = ({ status }: { status: string }) => {
  const colors = {
    "In Stock": "bg-success/10 text-success",
    Limited: "bg-orange-100 text-orange-700",
    "Pre-order": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[status as keyof typeof colors] || colors["In Stock"]}`}>
      {status}
    </span>
  );
};

/* ---------- Supplier Trust Panel ---------- */
const SupplierTrustPanel = ({ offer }: { offer: SeafoodOffer }) => {
  const s = offer.supplier;
  const yearsInBusiness = new Date().getFullYear() - s.inBusinessSince;
  return (
    <div className="space-y-4">
      {/* Supplier card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-heading font-bold text-foreground">
            {s.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-semibold text-foreground truncate">{s.name}</span>
              {s.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-success" />}
            </div>
            <p className="text-xs text-muted-foreground">{s.countryFlag} {s.country}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <MiniStat icon={<Building2 className="h-3.5 w-3.5" />} label="In business" value={`${yearsInBusiness} years`} />
          <MiniStat icon={<Timer className="h-3.5 w-3.5" />} label="Response" value={s.responseTime} />
        </div>

        {s.certifications.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Certifications</p>
            <div className="flex flex-wrap gap-1.5">
              {s.certifications.map((c) => (
                <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
        )}

        {s.documentsReviewed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Reviewed documents</p>
            <ul className="space-y-1">
              {s.documentsReviewed.map((d) => (
                <li key={d} className="flex items-center gap-1.5 text-xs text-foreground">
                  <BadgeCheck className="h-3 w-3 text-success shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full text-xs">
          View Supplier Profile
        </Button>
      </div>

      {/* CTA stack */}
      <div className="space-y-2.5">
        <Link to="/register" className="block">
          <Button className="w-full gap-2 font-semibold" size="lg"
            onClick={() => analytics.track("register_cta_offer_detail", { offerId: offer.id })}>
            Register to Contact Supplier <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" className="w-full gap-2" size="sm">
          <Bookmark className="h-4 w-4" /> Save to Shortlist
        </Button>
        <Button variant="ghost" className="w-full gap-2 text-muted-foreground" size="sm">
          <GitCompareArrows className="h-4 w-4" /> Compare Similar Offers
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">Free registration · No credit card · Direct supplier contact</p>
      </div>
    </div>
  );
};

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

/* ---------- Trust Section ---------- */
const trustPoints = [
  { icon: ShieldCheck, title: "Verified Supplier", desc: "Multi-step verification: business license, export permits, facility certifications, and trade references reviewed by YORSO's compliance team." },
  { icon: FileCheck, title: "Export & Compliance Ready", desc: "Supplier meets EU, US, and international food safety import requirements. Health certificates, catch certificates, and origin documentation are verified." },
  { icon: Anchor, title: "Full Traceability", desc: "Product origin, fishing area, catching method, and processing facility are documented and traceable back to source." },
  { icon: Building2, title: "Direct Supplier Relationship", desc: "No intermediaries. You communicate directly with the producing or exporting company. YORSO never hides supplier identity." },
];

const TrustSection = () => (
  <section className="py-10 border-t border-border">
    <h2 className="font-heading text-lg font-bold text-foreground mb-6">Why this offer is safe</h2>
    <div className="grid gap-5 sm:grid-cols-2">
      {trustPoints.map((tp) => (
        <div key={tp.title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
          <tp.icon className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">{tp.title}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tp.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ---------- Full Specifications ---------- */
const FullSpecifications = ({ offer }: { offer: SeafoodOffer }) => {
  const [open, setOpen] = useState(false);
  const sp = offer.specs;
  const rows = [
    ["Catching method", sp.catchingMethod],
    ["Freezing process", sp.freezingProcess],
    ["Glazing", sp.glazing],
    ["Storage temperature", sp.storageTemperature],
    ["Fishing area", sp.fishingArea],
    ["Ingredients", sp.ingredients],
    ["Calories", sp.nutritionPer100g.calories],
    ["Protein", sp.nutritionPer100g.protein],
    ["Fat", sp.nutritionPer100g.fat],
    ["Carbohydrates", sp.nutritionPer100g.carbs],
    ["Packing weight", sp.packingWeight],
    ["Shelf life", sp.shelfLife],
  ];

  return (
    <section className="py-10 border-t border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground">Full Specifications</h2>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                  <td className="px-4 py-2.5 font-medium text-muted-foreground w-1/3">{label}</td>
                  <td className="px-4 py-2.5 text-foreground">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

/* ---------- Similar Offers ---------- */
const SimilarOffers = ({ current }: { current: SeafoodOffer }) => {
  const similar = mockOffers
    .filter((o) => o.id !== current.id && (o.category === current.category || o.species === current.species))
    .slice(0, 3);

  if (similar.length === 0) return null;

  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">Similar Offers</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {similar.map((o) => {
          const FIcon = formatIcon[o.format];
          return (
            <Link key={o.id} to={`/offers/${o.id}`} className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="overflow-hidden rounded-lg mb-3">
                <img src={o.image} alt={o.productName} className="aspect-[16/10] w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} />
              </div>
              <p className="font-heading text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">{o.productName}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <FIcon className="h-3 w-3" /> {o.format} · {o.originFlag} {o.origin}
              </div>
              <p className="mt-2 font-heading text-sm font-bold text-foreground">{o.priceRange} <span className="font-normal text-muted-foreground">{o.priceUnit}</span></p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

/* ---------- Decision FAQ ---------- */
const decisionFaq = [
  { q: "How do I contact this supplier?", a: "Register for a free YORSO account (takes 2 minutes), then click 'Request Quote' on the offer page. Your message goes directly to the supplier — no intermediaries, no hidden fees." },
  { q: "Can I request a sample before ordering?", a: "Yes. After registration, you can request a commercial sample directly from the supplier. Sample costs and shipping are arranged between you and the supplier." },
  { q: "What if the product doesn't match the listing?", a: "YORSO's verified suppliers agree to our accuracy policy. If a product doesn't match the listing, our dispute resolution team assists. We also recommend pre-shipment inspection for large orders." },
  { q: "How are prices determined?", a: "Prices shown are indicative ranges based on current market conditions. Final pricing depends on volume, delivery terms, and negotiation with the supplier." },
];

const DecisionFAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {decisionFaq.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="text-sm font-medium text-foreground">{item.q}</span>
              {openIdx === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
            {openIdx === i && <p className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

/* ---------- Main Page ---------- */
const OfferDetail = () => {
  const { id } = useParams();
  const offer = mockOffers.find((o) => o.id === id);

  useEffect(() => {
    if (offer) analytics.track("offer_detail_view", { offerId: offer.id, product: offer.productName });
  }, [offer]);

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Offer not found</h1>
          <Link to="/offers"><Button className="mt-4">Browse all offers</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">YORSO</Link>
          <div className="flex items-center gap-2">
            <Link to="/signin"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm" className="font-semibold">Register Free</Button></Link>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-10">
        <Link to="/offers">
          <Button variant="ghost" size="sm" className="mb-5 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> All offers
          </Button>
        </Link>

        {/* Above-the-fold: 3-column desktop / stacked mobile */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr_320px]">
          {/* Left: Photo gallery */}
          <PhotoGallery images={offer.images} alt={offer.productName} />

          {/* Center: Offer summary */}
          <OfferSummary offer={offer} />

          {/* Right: Supplier trust + CTAs */}
          <SupplierTrustPanel offer={offer} />
        </div>

        {/* Below-the-fold sections */}
        <TrustSection />
        <FullSpecifications offer={offer} />
        <SimilarOffers current={offer} />
        <DecisionFAQ />
      </main>
    </div>
  );
};

export default OfferDetail;
