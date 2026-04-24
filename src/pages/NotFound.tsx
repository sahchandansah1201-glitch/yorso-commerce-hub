import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/landing/Header";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted">
        <div className="text-center">
          <h1 data-testid="page-title" className="mb-4 text-4xl font-bold">
            {t.notFound_title}
          </h1>
          <p data-testid="page-subtitle" className="mb-4 text-xl text-muted-foreground">
            {t.notFound_subtitle}
          </p>
          <a data-testid="page-home-link" href="/" className="text-primary underline hover:text-primary/90">
            {t.notFound_returnHome}
          </a>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
