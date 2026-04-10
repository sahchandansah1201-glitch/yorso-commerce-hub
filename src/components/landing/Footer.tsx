import { Globe } from "lucide-react";

const footerLinks = {
  Platform: ["Live Offers", "Categories", "Verified Suppliers", "How It Works"],
  Company: ["About YORSO", "Contact", "Careers", "Press"],
  Support: ["Help Center", "FAQ", "Terms of Service", "Privacy Policy"],
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="font-heading text-xl font-bold text-foreground">YORSO</span>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The global B2B seafood marketplace. Connecting buyers and verified suppliers across 48 countries.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Available worldwide</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} YORSO. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
