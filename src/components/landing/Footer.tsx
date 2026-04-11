import { Link } from "react-router-dom";
import { Globe, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";

const Footer = () => {
  const { t } = useLanguage();

  const sections = [
    { title: t.footer_platform, links: t.footer_links.platform },
    { title: t.footer_company, links: t.footer_links.company },
    { title: t.footer_legal, links: t.footer_links.legal },
  ];

  const handleFooterClick = (label: string, href: string) => {
    analytics.track("footer_link_click", { label, href });
  };

  return (
    <footer className="border-t border-border bg-accent text-accent-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="font-heading text-xl font-bold">YORSO</Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-accent-foreground/70">{t.footer_desc}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-accent-foreground/60">
                <Globe className="h-4 w-4" />
                <span>{t.footer_worldwide}</span>
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

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        onClick={() => handleFooterClick(link.label, link.href)}
                        className="text-sm text-accent-foreground/60 transition-colors hover:text-accent-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        onClick={() => handleFooterClick(link.label, link.href)}
                        className="text-sm text-accent-foreground/60 transition-colors hover:text-accent-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-accent-foreground/10 pt-6 flex flex-col items-center gap-2 text-xs text-accent-foreground/40 sm:flex-row sm:justify-between">
          <span>{t.footer_copyright}</span>
          <span>{t.footer_registered}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
