import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import analytics from "@/lib/analytics";

const Register = () => {
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [role, setRole] = useState<"buyer" | "supplier">("buyer");
  const navigate = useNavigate();

  const handleChoose = (r: "buyer" | "supplier") => {
    setRole(r);
    setStep("form");
    analytics.track("registration_start", { role: r });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("registration_complete_mock", { role });
    navigate("/offers");
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
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>

          {step === "choose" ? (
            <>
              <h1 className="font-heading text-2xl font-bold text-foreground">Create your YORSO account</h1>
              <p className="mt-2 text-sm text-muted-foreground">Choose your role to get started. It takes less than 5 minutes.</p>
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => handleChoose("buyer")}
                  className="w-full rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <p className="font-heading text-lg font-bold text-foreground">I'm a Buyer</p>
                  <p className="mt-1 text-sm text-muted-foreground">Source seafood from verified suppliers worldwide. Compare prices, find alternatives, contact directly.</p>
                </button>
                <button
                  onClick={() => handleChoose("supplier")}
                  className="w-full rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <p className="font-heading text-lg font-bold text-foreground">I'm a Supplier</p>
                  <p className="mt-1 text-sm text-muted-foreground">Reach qualified buyers from 48+ countries. Zero commission, direct contacts, year-round visibility.</p>
                </button>
              </div>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Register as {role === "buyer" ? "Buyer" : "Supplier"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Fill in your details to create your account.</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input className="mt-1" placeholder="John Smith" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Company</label>
                  <Input className="mt-1" placeholder="Acme Seafood Ltd." required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Business Email</label>
                  <Input className="mt-1" type="email" placeholder="john@company.com" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input className="mt-1" type="password" placeholder="Min 8 characters" required minLength={8} />
                </div>
                <Button type="submit" className="w-full gap-2 font-semibold" size="lg">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By registering you agree to our{" "}
                  <Link to="/terms" className="underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline">Privacy Policy</Link>.
                </p>
              </form>
              <button onClick={() => setStep("choose")} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                ← Change role
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Register;
