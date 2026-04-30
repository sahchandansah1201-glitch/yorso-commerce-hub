import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import RegisterChoose from "./pages/register/RegisterChoose.tsx";
import RegisterEmail from "./pages/register/RegisterEmail.tsx";
import RegisterVerify from "./pages/register/RegisterVerify.tsx";
import RegisterDetails from "./pages/register/RegisterDetails.tsx";
import RegisterOnboarding from "./pages/register/RegisterOnboarding.tsx";
import RegisterCountries from "./pages/register/RegisterCountries.tsx";
import RegisterReady from "./pages/register/RegisterReady.tsx";
import { RegistrationProvider } from "./contexts/RegistrationContext.tsx";
import SignIn from "./pages/SignIn.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Offers from "./pages/Offers.tsx";
import Suppliers from "./pages/Suppliers.tsx";
import SupplierProfile from "./pages/SupplierProfile.tsx";

import OfferDetail from "./pages/OfferDetail.tsx";
import LegacyOfferRedirect from "./components/routing/LegacyOfferRedirect.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Cookies from "./pages/Cookies.tsx";
import GDPR from "./pages/GDPR.tsx";
import AntiFraud from "./pages/AntiFraud.tsx";
import Careers from "./pages/Careers.tsx";
import Press from "./pages/Press.tsx";
import Partners from "./pages/Partners.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import ForSuppliers from "./pages/ForSuppliers.tsx";
import RegistrationFunnelDashboard from "./pages/dashboard/RegistrationFunnelDashboard.tsx";
import ResendEffectivenessDashboard from "./pages/dashboard/ResendEffectivenessDashboard.tsx";
import TypographyAudit from "./pages/dev/TypographyAudit.tsx";
import { legacyRedirects } from "./lib/legacy-redirects.ts";
import { SupplierApprovalNotifier } from "./components/suppliers/SupplierApprovalNotifier.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BuyerSessionProvider>
            <RegistrationProvider>
              <SupplierApprovalNotifier />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<RegisterChoose />} />
                <Route path="/register/email" element={<RegisterEmail />} />
                <Route path="/register/verify" element={<RegisterVerify />} />
                <Route path="/register/details" element={<RegisterDetails />} />
                <Route path="/register/onboarding" element={<RegisterOnboarding />} />
                <Route path="/register/countries" element={<RegisterCountries />} />
                <Route path="/register/ready" element={<RegisterReady />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/offers/:id" element={<LegacyOfferRedirect><OfferDetail /></LegacyOfferRedirect>} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/gdpr" element={<GDPR />} />
                <Route path="/anti-fraud" element={<AntiFraud />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/press" element={<Press />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/for-suppliers" element={<ForSuppliers />} />
                <Route path="/dashboard/registration-funnel" element={<RegistrationFunnelDashboard />} />
                <Route path="/dashboard/registration-resend" element={<ResendEffectivenessDashboard />} />
                <Route path="/dev/typography" element={<TypographyAudit />} />
                {/* Legacy redirects are declared in src/lib/legacy-redirects.ts. */}
                {legacyRedirects.flatMap(({ from, to }) => [
                  <Route key={from} path={from} element={<Navigate to={to} replace />} />,
                  <Route key={`${from}/*`} path={`${from}/*`} element={<Navigate to={to} replace />} />,
                ])}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RegistrationProvider>
          </BuyerSessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
