import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import analytics from "@/lib/analytics";

const SignIn = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("signin_submit");
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Sign in to YORSO</h1>
          <p className="mt-2 text-sm text-muted-foreground">Access your marketplace account.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input className="mt-1" type="email" placeholder="john@company.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input className="mt-1" type="password" placeholder="Enter your password" required />
            </div>
            <Button type="submit" className="w-full gap-2 font-semibold" size="lg">
              Sign In <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">Register free</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
