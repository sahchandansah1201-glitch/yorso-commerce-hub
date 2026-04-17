import { categories } from "@/data/mockOffers";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const CategoryAcceleration = () => {
  const { t } = useLanguage();

  return (
    <section id="categories" className="border-t border-border bg-cool-gray py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t.cat_title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t.cat_subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{t.cat_names[cat.name] || cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.count} {t.cat_offers}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryAcceleration;
