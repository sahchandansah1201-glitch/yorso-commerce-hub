import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, BriefcaseBusiness, ExternalLink, LogIn, RefreshCw } from "lucide-react";
import Header from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { createCrmApiClient, CrmAccessError, type CrmAccessResponse } from "@/lib/crm-api";

type CrmState =
  | { status: "loading" }
  | { status: "ready"; value: CrmAccessResponse }
  | { status: "error"; code: "crm_access_denied" | "crm_session_required" | "crm_unavailable" };

const Crm = () => {
  const navigate = useNavigate();
  const { isSignedIn, session, signOut } = useBuyerSession();
  const { t } = useLanguage();
  const [state, setState] = useState<CrmState>({ status: "loading" });

  const loadAccess = useCallback(async (refresh = false) => {
    setState({ status: "loading" });
    try {
      const value = await createCrmApiClient({ session }).getFullUiAccess({ refresh });
      setState({ status: "ready", value });
    } catch (error) {
      const code = error instanceof CrmAccessError
        && (error.code === "crm_access_denied" || error.code === "crm_session_required")
        ? error.code
        : "crm_unavailable";
      setState({ status: "error", code });
    }
  }, [session]);

  useEffect(() => {
    if (isSignedIn) void loadAccess();
  }, [isSignedIn, loadAccess]);

  if (!isSignedIn) return <Navigate to="/signin?redirect=%2Fcrm" replace />;

  const signInAgain = () => {
    signOut();
    navigate("/signin?redirect=%2Fcrm", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="crm-page">
      <Header showSkipLink />
      <main id="main" className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="flex items-start gap-4 border-b border-border pb-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t.crm_pageTitle}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.crm_pageDescription}</p>
            </div>
          </div>

          <section className="py-8" aria-live="polite" data-testid="crm-status">
            {state.status === "loading" && (
              <p className="text-sm text-muted-foreground">{t.crm_loading}</p>
            )}

            {state.status === "ready" && (
              <div className="space-y-5">
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t.crm_separateLoginHint}</p>
                <Button asChild className="min-h-11 gap-2">
                  <a href={state.value.crmUrl} target="_blank" rel="noreferrer" data-testid="crm-open-link">
                    {t.crm_open}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            )}

            {state.status === "error" && (
              <div className="space-y-5">
                <div className="flex max-w-2xl items-start gap-3 text-sm text-foreground">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  <p>
                    {state.code === "crm_access_denied"
                      ? t.crm_accessDenied
                      : state.code === "crm_session_required"
                        ? t.crm_signInRequired
                        : t.crm_unavailable}
                  </p>
                </div>
                {state.code === "crm_session_required" && (
                  <Button className="min-h-11 gap-2" onClick={signInAgain} data-testid="crm-signin-again">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    {t.crm_signInAgain}
                  </Button>
                )}
                {state.code === "crm_unavailable" && (
                  <Button variant="outline" className="min-h-11 gap-2" onClick={() => void loadAccess(true)} data-testid="crm-retry">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t.crm_retry}
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Crm;
