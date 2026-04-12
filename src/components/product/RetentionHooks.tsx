import { Bookmark, Bell, BarChart3, GitCompare, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  isLoggedIn: boolean;
}

const hooks = [
  { icon: Bookmark, label: "Save Product", desc: "Add to sourcing shortlist", why: "Revisit and compare later" },
  { icon: Bell, label: "Track Price", desc: "Get notified on price changes", why: "Never miss a better deal" },
  { icon: GitCompare, label: "Compare", desc: "Compare with alternatives", why: "Make confident decisions" },
  { icon: Eye, label: "Follow Supplier", desc: "Monitor new offers & updates", why: "Stay ahead of supply changes" },
];

export const RetentionHooks = ({ isLoggedIn }: Props) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-heading text-sm font-semibold text-foreground">Buyer Tools</h3>
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <RotateCcw className="h-3 w-3" />
        Come back anytime
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {hooks.map(({ icon: Icon, label, desc, why }) => (
        <button
          key={label}
          className="flex flex-col items-center gap-1 rounded-lg border border-border p-2.5 text-center hover:bg-muted/50 transition-colors group"
        >
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
          <span className="text-[9px] text-primary/70 leading-tight font-medium">{why}</span>
        </button>
      ))}
    </div>
    {!isLoggedIn && (
      <Link to="/register" className="block mt-3">
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
          Register to unlock all buyer tools
        </Button>
      </Link>
    )}
  </div>
);
