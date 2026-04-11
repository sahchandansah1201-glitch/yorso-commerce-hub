import { Globe, Mail, MapPin } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Live Offers", href: "#offers" },
    { label: "Categories", href: "#categories" },
    { label: "Verified Suppliers", href: "#how-it-works" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ],
  Company: [
    { label: "About YORSO", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Press & Media", href: "/press" },
    { label: "Partner Program", href: "/partners" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR Compliance", href: "/gdpr" },
    { label: "Anti-Fraud Policy", href: "/anti-fraud" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-accent text-accent-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <span className="font-heading text-xl font-bold">YORSO</span>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-accent-foreground/70">
              The global B2B seafood marketplace. Connecting professional buyers
              with verified suppliers across 48 countries — with transparent pricing,
              direct contacts, and zero commissions.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-accent-foreground/60">
                <Globe className="h-4 w-4" />
                <span>Available worldwide · EN, ES, RU, ZH</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-accent-foreground/60">
                <Mail className="h-4 w-4" />
                <span>info@yorso.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-accent-foreground/60">
                <MapPin className="h-4 w-4" />
                <span>Amsterdam, Netherlands</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-accent-foreground/60 transition-colors hover:text-accent-foreground">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-accent-foreground/10 pt-6 flex flex-col items-center gap-2 text-xs text-accent-foreground/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} YORSO B.V. All rights reserved.</span>
          <span>Registered in the Netherlands · KVK 12345678</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
