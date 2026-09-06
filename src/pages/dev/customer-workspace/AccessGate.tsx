/**
 * Sign-in / safe-return demo and the closed-access screen.
 * There is no separate route and no credential form: both are states of the
 * requested section, kept in React state only. No storage, session or network.
 */
import { Loader2, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProtoLang } from "./copy";
import { protoAccessCopy } from "./copy-access";
import { CONTROL } from "./ui";

export type SignInStage = "signedOut" | "checking";

export const AccessClosedScreen = ({
  lang,
  onReturnToSignIn,
}: {
  lang: ProtoLang;
  onReturnToSignIn: () => void;
}) => {
  const a = protoAccessCopy[lang];
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-5" data-testid="proto-access-closed">
      <div className="flex items-center gap-2">
        <Lock aria-hidden className="h-5 w-5 text-muted-foreground" />
        <span className="text-[10.5px] uppercase text-muted-foreground" data-testid="proto-access-closed-status">
          {a.accessClosedShort}
        </span>
      </div>
      <h1 className="mt-2 font-heading text-xl font-semibold">{a.accessClosedTitle}</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{a.accessClosedBody}</p>
      <div className="mt-4">
        <Button className={CONTROL} onClick={onReturnToSignIn} data-testid="proto-return-to-signin">
          {a.returnToSignIn}
        </Button>
      </div>
    </div>
  );
};

export const SignInScreen = ({
  lang,
  stage,
  requestedSectionLabel,
  onSignIn,
  onContinue,
}: {
  lang: ProtoLang;
  stage: SignInStage;
  requestedSectionLabel: string;
  onSignIn: () => void;
  onContinue: () => void;
}) => {
  const a = protoAccessCopy[lang];
  const destination = a.returnToSectionTemplate.replace("{section}", requestedSectionLabel);

  if (stage === "checking") {
    return (
      <div
        className="min-w-0 rounded-lg border border-border bg-card p-5"
        data-testid="proto-signin-checking"
        aria-busy="true"
      >
        <div className="flex items-center gap-2 text-sm">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
          <span>{a.checkingAccess}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground" data-testid="proto-signin-destination">
          {destination}
        </p>
        <div className="mt-4">
          <Button className={CONTROL} onClick={onContinue} data-testid="proto-signin-continue">
            {a.continueLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-5" data-testid="proto-signin">
      <LogIn aria-hidden className="h-5 w-5 text-primary" />
      <h1 className="mt-2 font-heading text-xl font-semibold">{a.signInTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground" data-testid="proto-signin-session-ended">
        {a.sessionEnded}
      </p>
      <p className="mt-1 text-sm" data-testid="proto-signin-return-hint">
        {destination}
      </p>
      <div className="mt-4">
        <Button className={CONTROL} onClick={onSignIn} data-testid="proto-signin-action">
          {a.signInAction}
        </Button>
      </div>
    </div>
  );
};
