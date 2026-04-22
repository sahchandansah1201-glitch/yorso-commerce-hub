import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import salmonImg from "@/assets/species/salmon.jpg";
import codImg from "@/assets/species/cod.jpg";
import haddockImg from "@/assets/species/haddock.jpg";
import hakeImg from "@/assets/species/hake.jpg";
import seabassImg from "@/assets/species/seabass.jpg";
import seabreamImg from "@/assets/species/seabream.jpg";
import tunaImg from "@/assets/species/tuna.jpg";
import mackerelImg from "@/assets/species/mackerel.jpg";

type SpeciesKey =
  | "atlanticSalmon"
  | "cod"
  | "haddock"
  | "hake"
  | "seaBass"
  | "seaBream"
  | "yellowfinTuna"
  | "mackerel";

interface SpeciesCard {
  key: SpeciesKey;
  image: string;
  offers: number;
}

const species: SpeciesCard[] = [
  { key: "atlanticSalmon", image: salmonImg, offers: 184 },
  { key: "cod", image: codImg, offers: 132 },
  { key: "haddock", image: haddockImg, offers: 64 },
  { key: "hake", image: hakeImg, offers: 91 },
  { key: "seaBass", image: seabassImg, offers: 78 },
  { key: "seaBream", image: seabreamImg, offers: 71 },
  { key: "yellowfinTuna", image: tunaImg, offers: 56 },
  { key: "mackerel", image: mackerelImg, offers: 103 },
];

const CategoryAcceleration = () => {
  const { t } = useLanguage();

  return (
    <section id="categories" className="border-t border-border bg-cool-gray py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 data-testid="section-title" data-section="categories" className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {t.cat_title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t.cat_subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {species.map((sp) => {
            const name = t.species_names[sp.key];
            const descriptor = t.species_descriptors[sp.key];
            return (
              <button
                key={sp.key}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={sp.image}
                    alt={name}
                    width={768}
                    height={576}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-foreground">{name}</p>
                    <p className="text-xs leading-snug text-muted-foreground">
                      {descriptor} · {sp.offers} {t.cat_offers}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryAcceleration;
