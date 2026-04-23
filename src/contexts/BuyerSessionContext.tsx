/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { buyerSession, type BuyerSession, type SignInMethod } from "@/lib/buyer-session";

interface BuyerSessionContextValue {
  session: BuyerSession | null;
  isSignedIn: boolean;
  signIn: (input: { identifier: string; method: SignInMethod }) => BuyerSession;
  signOut: () => void;
}

const BuyerSessionContext = createContext<BuyerSessionContextValue>({
  session: null,
  isSignedIn: false,
  signIn: () => {
    throw new Error("BuyerSessionContext not mounted");
  },
  signOut: () => {},
});

export const BuyerSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<BuyerSession | null>(() => buyerSession.getSession());

  useEffect(() => {
    const unsub = buyerSession.subscribe(setSession);
    // Sync if another tab/test cleared storage between mount and subscribe.
    const current = buyerSession.getSession();
    if (current?.id !== session?.id) setSession(current);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BuyerSessionContext.Provider
      value={{
        session,
        isSignedIn: !!session,
        signIn: (input) => buyerSession.signIn(input),
        signOut: () => buyerSession.signOut(),
      }}
    >
      {children}
    </BuyerSessionContext.Provider>
  );
};

export const useBuyerSession = () => useContext(BuyerSessionContext);
