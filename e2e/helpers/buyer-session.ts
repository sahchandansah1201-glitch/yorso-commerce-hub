import type { Page } from "@playwright/test";

export type E2ELang = "en" | "ru" | "es";

export interface BuyerSessionOptions {
  id?: string;
  identifier?: string;
  displayName?: string;
  lang?: E2ELang;
}

export const installBuyerSession = async (
  page: Page,
  {
    id = "b_e2e_buyer",
    identifier = "buyer@example.com",
    displayName = "buyer",
    lang = "en",
  }: BuyerSessionOptions = {},
) => {
  await page.addInitScript(
    ({ sessionId, sessionIdentifier, sessionDisplayName, language }) => {
      try {
        window.localStorage.setItem("yorso-lang", language);
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: sessionId,
            identifier: sessionIdentifier,
            method: "email",
            signedInAt: new Date().toISOString(),
            displayName: sessionDisplayName,
          }),
        );
      } catch {
        /* ignore */
      }
    },
    {
      sessionId: id,
      sessionIdentifier: identifier,
      sessionDisplayName: displayName,
      language: lang,
    },
  );
};
