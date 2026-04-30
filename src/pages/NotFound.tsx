import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Compass, Home, LogIn, UserPlus } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";

type Suggestion = {
  to: string;
  icon: typeof Compass;
  title: string;
  desc: string;
};

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const referrer = useMemo(
    () => (typeof document !== "undefined" && document.referrer ? document.referrer : ""),
    [],
  );

  useEffect(() => {
    // Console + analytics so we can debug broken links and measure 404 frequency.
    console.error("404 Error: User attempted to access non-existent route:", {
      path: location.pathname,
      search: location.search,
      referrer: referrer || "(direct or unknown)",
    });
    analytics.track("page_not_found", {
      path: location.pathname,
      search: location.search,
      referrer: referrer || "direct",
    });
  }, [location.pathname, location.search, referrer]);

  const suggestions: Suggestion[] = [
    {
      to: "/offers",
      icon: Compass,
      title: t.notFound_suggestion_offers_title,
      desc: t.notFound_suggestion_offers_desc,
    },
    {
      to: "/register",
      icon: UserPlus,
      title: t.notFound_suggestion_register_title,
      desc: t.notFound_suggestion_register_desc,
    },
    {
      to: "/signin",
      icon: LogIn,
      title: t.notFound_suggestion_signin_title,
      desc: t.notFound_suggestion_signin_desc,
    },
    {
      to: "/",
      icon: Home,
      title: t.notFound_suggestion_home_title,
      desc: t.notFound_suggestion_home_desc,
    },
  ];

  const attemptedPath = `${location.pathname}${location.search}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted px-4 py-16">
        <div className="w-full max-w-3xl">
          <div className="text-center">
            <p className="font-heading text-6xl font-extrabold tracking-tight text-primary">
              {t.notFound_title}
            </p>
            <h1
              data-testid="page-title"
              className="mt-3 font-heading text-2xl font-bold text-foreground md:text-3xl"
            >
              {t.notFound_subtitle}
            </h1>

            <div className="mx-auto mt-5 max-w-xl rounded-xl border border-border bg-card px-4 py-3 text-left text-sm">
              <p className="text-muted-foreground">{t.notFound_attemptedPath}</p>
              <p
                data-testid="page-attempted-path"
                className="mt-1 break-all font-mono text-foreground"
              >
                {attemptedPath}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{t.notFound_referrerLabel}:</span>{" "}
                <span data-testid="page-referrer" className="break-all">
                  {referrer || t.notFound_referrerDirect}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-center text-sm font-semibold text-foreground">
              {t.notFound_suggestionsHeading}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {suggestions.map(({ to, icon: Icon, title, desc }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        {title}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t.notFound_reportHint}
          </p>

          <div className="mt-4 text-center">
            <Link
              data-testid="page-home-link"
              to="/"
              className="text-sm text-primary underline hover:text-primary/90"
            >
              {t.notFound_returnHome}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
