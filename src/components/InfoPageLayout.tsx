import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  title: string;
  children: ReactNode;
  updated?: string;
}

const InfoPageLayout = ({ title, children, updated }: Props) => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/">
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">YORSO</span>
          </Link>
        </div>
      </header>
      <main className="container max-w-3xl py-12 md:py-16">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> {t.info_backToHome}
          </Button>
        </Link>
        <h1
          data-testid="page-title"
          className="font-heading text-3xl font-bold tracking-tight text-foreground"
        >
          {title}
        </h1>
        {updated && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t.info_lastUpdated}: {updated}
          </p>
        )}
        <div
          data-testid="info-content"
          className="mt-8 prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-4"
        >
          {children}
        </div>
      </main>
      <footer className="border-t border-border bg-accent py-6">
        <div className="container text-center text-xs text-accent-foreground/40">
          © {new Date().getFullYear()} YORSO B.V. All rights reserved. · Amsterdam, Netherlands
        </div>
      </footer>
    </div>
  );
};

export default InfoPageLayout;
