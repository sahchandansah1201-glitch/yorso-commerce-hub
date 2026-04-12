import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Bookmark, Bell, GitCompare, Share2 } from "lucide-react";

interface Props {
  isLoggedIn: boolean;
  product: {
    commercial: { pricePerKg: string; stockStatus: string };
  };
}

export const StickyActionRail = ({ isLoggedIn, product }: Props) => (
  <div className="sticky top-20">
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <div>
        <span className="font-heading text-xl font-bold text-foreground">{product.commercial.pricePerKg}</span>
        <span className="text-sm text-muted-foreground"> / kg</span>
      </div>
      <p className="text-xs font-medium text-success">{product.commercial.stockStatus}</p>

      {isLoggedIn ? (
        <>
          <Button className="w-full gap-2 font-semibold" size="default">
            Request Quote <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full font-semibold">Contact Supplier</Button>
        </>
      ) : (
        <>
          <Link to="/register" className="block">
            <Button className="w-full gap-2 font-semibold" size="default">
              Register to Get Quote <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/register" className="block">
            <Button variant="outline" className="w-full gap-2 text-sm font-semibold">
              <Lock className="h-3.5 w-3.5" /> Contact Supplier
            </Button>
          </Link>
        </>
      )}

      <div className="border-t border-border pt-3 flex flex-wrap gap-2">
        <ActionBtn icon={Bookmark} label="Save" />
        <ActionBtn icon={Bell} label="Track Price" />
        <ActionBtn icon={GitCompare} label="Compare" />
        <ActionBtn icon={Share2} label="Share" />
      </div>
    </div>
  </div>
);

const ActionBtn = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <button className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
    <Icon className="h-3.5 w-3.5" />
    {label}
  </button>
);
