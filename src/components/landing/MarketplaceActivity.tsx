import { useEffect, useState, useRef } from "react";
import { activityFeed } from "@/data/mockOffers";
import { Plus, UserPlus, TrendingUp } from "lucide-react";

const iconMap = {
  new_listing: Plus,
  new_supplier: UserPlus,
  price_update: TrendingUp,
};

const colorMap = {
  new_listing: "bg-primary/10 text-primary",
  new_supplier: "bg-success/10 text-success",
  price_update: "bg-orange-glow/10 text-primary",
};

const MarketplaceActivity = () => {
  const [visibleItems, setVisibleItems] = useState(activityFeed.slice(0, 5));
  const [currentIndex, setCurrentIndex] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setVisibleItems((prev) => {
          const nextIndex = currentIndex % activityFeed.length;
          const newItem = activityFeed[nextIndex];
          setCurrentIndex((ci) => ci + 1);
          return [newItem, ...prev.slice(0, 4)];
        });
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex]);

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-semibold text-success">Live</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Marketplace Activity
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time updates — new listings, price changes, and supplier activity happening now.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {visibleItems.map((item, i) => {
              const Icon = iconMap[item.type];
              const colors = colorMap[item.type];
              return (
                <div
                  key={`${item.text}-${i}`}
                  className={`flex items-center gap-3 border-b border-border px-5 py-3.5 transition-all duration-300 ${
                    i === 0 && isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                  } ${i === 0 && !isAnimating ? "animate-fade-in" : ""}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="flex-1 text-sm text-foreground">{item.text}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Updates refresh automatically · Showing latest activity across all categories
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceActivity;
