import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { resolveSupplierCompanyName } from "@/lib/supplier-approval";

/**
 * Demo control to switch through the 3 access levels without going through
 * the real flow. Not part of real authorization. Always visible in catalog.
 */
export const AccessLevelSwitcher = () => {
  const { t } = useLanguage();
  const { level, setQualified } = useAccessLevel();
  const { isSignedIn, signIn, signOut } = useBuyerSession();

  const setAnon = () => {
    setQualified(false);
    if (isSignedIn) signOut();
  };
  const setReg = () => {
    setQualified(false);
    if (!isSignedIn) signIn({ identifier: "demo@yorso.test", method: "email" });
  };
  const setQual = () => {
    if (!isSignedIn) signIn({ identifier: "demo@yorso.test", method: "email" });
    setQualified(true, resolveSupplierCompanyName());
  };

  const baseBtn = "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors";
  const activeBtn = "bg-primary text-primary-foreground";
  const idleBtn = "bg-muted text-muted-foreground hover:bg-muted/80";

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-card/60 px-3 py-2"
      data-testid="catalog-dev-access-switcher"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t.catalog_access_devSwitcher_label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`${baseBtn} ${level === "anonymous_locked" ? activeBtn : idleBtn}`}
          onClick={setAnon}
          data-testid="set-access-anon"
        >
          {t.catalog_access_devSwitcher_anon}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${level === "registered_locked" ? activeBtn : idleBtn}`}
          onClick={setReg}
          data-testid="set-access-reg"
        >
          {t.catalog_access_devSwitcher_reg}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${level === "qualified_unlocked" ? activeBtn : idleBtn}`}
          onClick={setQual}
          data-testid="set-access-qual"
        >
          {t.catalog_access_devSwitcher_qual}
        </button>
      </div>
      <span className="text-[10px] italic text-muted-foreground">{t.catalog_access_devSwitcher_note}</span>
    </div>
  );
};

export default AccessLevelSwitcher;
