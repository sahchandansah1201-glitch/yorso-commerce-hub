import { activityFeed } from "@/data/mockOffers";
import { Plus, UserPlus, TrendingUp } from "lucide-react";

const iconMap = {
  new_listing: Plus,
  new_supplier: UserPlus,
  price_update: TrendingUp,
};

const MarketplaceActivity = () => {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Marketplace Activity
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time updates — new listings, price changes, and supplier activity happening now.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <div className="space-y-0 divide-y divide-border rounded-xl border border-border bg-card">
            {activityFeed.map((item, i) => {
              const Icon = iconMap[item.type];
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="flex-1 text-sm text-foreground">{item.text}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceActivity;
