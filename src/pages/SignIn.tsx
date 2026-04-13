import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import analytics from "@/lib/analytics";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("signin_submit");
    navigate("/offers");
  };

  const handleWhatsAppLogin = () => {
    if (!whatsAppPhone || whatsAppPhone.replace(/\D/g, "").length < 7) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    analytics.track("signin_whatsapp", { phone: whatsAppPhone });
    toast.success("Код отправлен в WhatsApp", {
      description: "Проверьте сообщения в WhatsApp",
    });
    // Mock: auto-login after delay
    setTimeout(() => {
      navigate("/offers");
    }, 1500);
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">или</span>
            </div>
          </div>

          {/* WhatsApp Login */}
          {!showWhatsApp ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowWhatsApp(true)}
              className="w-full h-12 gap-2 font-semibold border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Войти через WhatsApp
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                type="tel"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value)}
                placeholder="+7 999 123-45-67"
                className="h-12 text-base"
                autoFocus
              />
              <Button
                type="button"
                onClick={handleWhatsAppLogin}
                className="w-full h-12 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Получить код в WhatsApp
              </Button>
            </div>
          )}

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
