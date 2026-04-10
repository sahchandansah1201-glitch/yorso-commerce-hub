import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
            YORSO
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#offers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Live Offers
          </a>
          <a href="#categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Categories
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <Globe className="h-4 w-4" />
            EN
          </button>
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm" className="font-semibold">
            Register Free
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a href="#offers" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Live Offers
            </a>
            <a href="#categories" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Categories
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              How It Works
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              FAQ
            </a>
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="outline" className="w-full">Sign In</Button>
            <Button className="w-full font-semibold">Register Free</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
