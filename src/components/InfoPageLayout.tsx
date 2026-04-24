import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/landing/Header";

interface Props {
  title: string;
  children: ReactNode;
  updated?: string;
}

const InfoPageLayout = ({ title, children, updated }: Props) => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-12 md:py-16">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> {t.info_backToHome}
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted-foreground">{t.info_lastUpdated}: {updated}</p>}
        <div className="mt-8 prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-4">
          {children}
        </div>
      </main>
      <footer className="border-t border-border bg-accent py-6">
        <div className="container text-center text-xs text-accent-foreground/40">
          © {new Date().getFullYear()} YORSO B.V. {t.info_footer_rights}. · {t.info_contact_officeAddress}
        </div>
      </footer>
    </div>
  );
};

export default InfoPageLayout;
