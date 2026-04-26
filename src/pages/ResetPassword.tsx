import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/landing/Header";

/**
 * /reset-password
 *
 * Public route reached via the link in the password-recovery email.
 * Supabase puts the recovery tokens in the URL hash and emits a
 * `PASSWORD_RECOVERY` auth event, after which `auth.updateUser({ password })`
 * is allowed to set a new password for the recovered user.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Subscribe BEFORE checking session, so we don't miss the recovery event.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    // If the page was opened directly with a hash already parsed by the SDK,
    // there will be a session — treat that as recovery-ready as well.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoveryReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t.signin_passwordTooShort ?? "Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t.signin_passwordsDoNotMatch ?? "Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(t.signin_couldNotResetPassword ?? "Could not reset password", {
        description: error.message,
      });
      return;
    }
    setDone(true);
    toast.success(t.signin_passwordUpdated ?? "Password updated");
    // Sign the recovery session out so the user logs in with the new password.
    await supabase.auth.signOut();
    setTimeout(() => navigate("/signin", { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex flex-1 justify-center px-4 pt-8 pb-12 md:pt-16">
        <div className="w-full max-w-md">
          <Link to="/signin">
            <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> {t.signin_backToSignIn ?? "Back to sign in"}
            </Button>
          </Link>

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t.signin_setNewPassword ?? "Set a new password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.signin_setNewPasswordSubtitle ??
              "Enter a new password for your account. You'll be signed in with it next time."}
          </p>

          {done ? (
            <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {t.signin_passwordUpdated ?? "Password updated"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t.signin_redirectingToSignIn ?? "Redirecting you to sign in…"}
              </p>
            </div>
          ) : !recoveryReady ? (
            <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t.signin_resetLinkInvalid ??
                "This password reset link is invalid or has expired. Please request a new one from the sign-in page."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.signin_newPassword ?? "New password"}
                </label>
                <Input
                  className="mt-1 h-12 text-base rounded-xl"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.signin_confirmPassword ?? "Confirm new password"}
                </label>
                <Input
                  className="mt-1 h-12 text-base rounded-xl"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 gap-2 font-semibold rounded-xl"
                size="lg"
              >
                {t.signin_updatePassword ?? "Update password"} <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
