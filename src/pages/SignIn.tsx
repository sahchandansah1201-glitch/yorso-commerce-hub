import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Mail, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import CountryPhoneInput from "@/components/registration/CountryPhoneInput";
import analytics from "@/lib/analytics";
import { toast } from "sonner";

type LoginMethod = "email" | "phone";
type View = "login" | "forgot";

const SignIn = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<LoginMethod>("email");
  const [view, setView] = useState<View>("login");

  // Email fields
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Phone fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("");

  // WhatsApp
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !emailPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    analytics.track("signin_email", { email });
    toast.success("Signed in", { description: "Welcome back!" });
    navigate("/offers");
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/[\s\-()]/g, "");
    if (digits.length < 5 || !phonePassword) {
      toast.error("Please enter your phone number and password");
      return;
    }
    analytics.track("signin_phone", { phone: phoneNumber });
    toast.success("Signed in", { description: "Welcome back!" });
    navigate("/offers");
  };

  const handleWhatsAppLogin = () => {
    if (!whatsAppPhone || whatsAppPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    analytics.track("signin_whatsapp", { phone: whatsAppPhone });
    toast.success("Code sent via WhatsApp", {
      description: "Check your WhatsApp messages",
    });
    setTimeout(() => navigate("/offers"), 1500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    analytics.track("forgot_password", { email: forgotEmail });
    setForgotSent(true);
    toast.success("Email sent", {
      description: "Check your inbox for password reset instructions",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-background/95">
        <div className="container flex h-16 items-center">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">YORSO</Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {view === "login" ? (
            <>
              <Link to="/">
                <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </Link>

              <h1 className="font-heading text-2xl font-bold text-foreground">Sign in to YORSO</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the email or phone number you registered with.
              </p>

              {/* Method Tabs */}
              <div className="mt-6 flex rounded-xl border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    method === "email"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    method === "phone"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </button>
              </div>

              {/* Email Login */}
              {method === "email" && (
                <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      className="mt-1 h-12 text-base rounded-xl"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Password</label>
                      <button
                        type="button"
                        onClick={() => { setForgotEmail(email); setView("forgot"); }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      className="mt-1 h-12 text-base rounded-xl"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 gap-2 font-semibold rounded-xl" size="lg">
                    Sign In <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>
              )}

              {/* Phone Login */}
              {method === "phone" && (
                <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone number</label>
                    <div className="mt-1">
                      <CountryPhoneInput
                        phone={phoneNumber}
                        onPhoneChange={setPhoneNumber}
                        onCountryChange={setPhoneCountry}
                        countryName={phoneCountry}
                        disabled={false}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <Input
                      className="mt-1 h-12 text-base rounded-xl"
                      type="password"
                      value={phonePassword}
                      onChange={(e) => setPhonePassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 gap-2 font-semibold rounded-xl" size="lg">
                    Sign In <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* WhatsApp Login */}
              {!showWhatsApp ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWhatsApp(true)}
                  className="w-full h-12 gap-2 font-semibold border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 rounded-xl"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Sign in via WhatsApp
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    type="tel"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="+1 555 123-4567"
                    className="h-12 text-base rounded-xl"
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleWhatsAppLogin}
                    className="w-full h-12 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Get code via WhatsApp
                  </Button>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
              </p>
            </>
          ) : (
            /* Forgot Password View */
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mb-6 gap-1.5 text-muted-foreground"
                onClick={() => { setView("login"); setForgotSent(false); }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Button>

              <h1 className="font-heading text-2xl font-bold text-foreground">Reset password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email you used to register. We'll send a link to reset your password.
              </p>

              {forgotSent ? (
                <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-foreground">Email sent</h2>
                  <p className="text-sm text-muted-foreground">
                    Check <span className="font-medium text-foreground">{forgotEmail}</span> and follow the instructions in the email.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 rounded-xl"
                    onClick={() => { setView("login"); setForgotSent(false); }}
                  >
                    Back to sign in
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      className="mt-1 h-12 text-base rounded-xl"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="john@company.com"
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 gap-2 font-semibold rounded-xl" size="lg">
                    Send reset link <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignIn;
