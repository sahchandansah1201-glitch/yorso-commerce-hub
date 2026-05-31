import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "./contexts/RegistrationContext.tsx";
import LegacyOfferRedirect from "./components/routing/LegacyOfferRedirect.tsx";
import { RouteChunkErrorBoundary } from "./components/routing/RouteChunkErrorBoundary.tsx";
import { legacyRedirects } from "./lib/legacy-redirects.ts";
import { SupplierApprovalNotifier } from "./components/suppliers/SupplierApprovalNotifier.tsx";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const RegisterChoose = lazy(() => import("./pages/register/RegisterChoose.tsx"));
const RegisterEmail = lazy(() => import("./pages/register/RegisterEmail.tsx"));
const RegisterVerify = lazy(() => import("./pages/register/RegisterVerify.tsx"));
const RegisterDetails = lazy(() => import("./pages/register/RegisterDetails.tsx"));
const RegisterOnboarding = lazy(() => import("./pages/register/RegisterOnboarding.tsx"));
const RegisterCountries = lazy(() => import("./pages/register/RegisterCountries.tsx"));
const RegisterReady = lazy(() => import("./pages/register/RegisterReady.tsx"));
const SignIn = lazy(() => import("./pages/SignIn.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Offers = lazy(() => import("./pages/Offers.tsx"));
const Suppliers = lazy(() => import("./pages/Suppliers.tsx"));
const SupplierProfile = lazy(() => import("./pages/SupplierProfile.tsx"));
const OfferDetail = lazy(() => import("./pages/OfferDetail.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Cookies = lazy(() => import("./pages/Cookies.tsx"));
const GDPR = lazy(() => import("./pages/GDPR.tsx"));
const AntiFraud = lazy(() => import("./pages/AntiFraud.tsx"));
const Careers = lazy(() => import("./pages/Careers.tsx"));
const Press = lazy(() => import("./pages/Press.tsx"));
const Partners = lazy(() => import("./pages/Partners.tsx"));
const HowItWorks = lazy(() => import("./pages/HowItWorks.tsx"));
const ForSuppliers = lazy(() => import("./pages/ForSuppliers.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogArticle = lazy(() => import("./pages/BlogArticle.tsx"));
const Account = lazy(() => import("./pages/account/Account.tsx"));
const RegistrationFunnelDashboard = lazy(() => import("./pages/dashboard/RegistrationFunnelDashboard.tsx"));
const ResendEffectivenessDashboard = lazy(() => import("./pages/dashboard/ResendEffectivenessDashboard.tsx"));
const TypographyAudit = lazy(() => import("./pages/dev/TypographyAudit.tsx"));
const AdminRuntimeStatus = lazy(() => import("./pages/admin/AdminRuntimeStatus.tsx"));
const AdminAccessRequests = lazy(() => import("./pages/admin/AdminAccessRequests.tsx"));
const AdminAccessGrants = lazy(() => import("./pages/admin/AdminAccessGrants.tsx"));
const AdminOperations = lazy(() => import("./pages/admin/AdminOperations.tsx"));
const AdminAuditEvents = lazy(() => import("./pages/admin/AdminAuditEvents.tsx"));
const AdminSupplierDocumentAudit = lazy(() => import("./pages/admin/AdminSupplierDocumentAudit.tsx"));
const AdminIncidents = lazy(() => import("./pages/admin/AdminIncidents.tsx"));
const AdminIncidentDetail = lazy(() => import("./pages/admin/AdminIncidentDetail.tsx"));
const AdminIncidentExecutionQueue = lazy(() => import("./pages/admin/AdminIncidentExecutionQueue.tsx"));
const AdminIncidentWorkload = lazy(() => import("./pages/admin/AdminIncidentWorkload.tsx"));
const AdminIncidentTrendActions = lazy(() => import("./pages/admin/AdminIncidentTrendActions.tsx"));
const AdminIncidentTrends = lazy(() => import("./pages/admin/AdminIncidentTrends.tsx"));

const RouteFallback = () => (
  <div className="min-h-screen bg-background">
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-sm space-y-3" aria-label="Loading page">
        <div className="h-3 w-28 rounded-full bg-muted" />
        <div className="h-7 w-4/5 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted" />
        <div className="h-3 w-2/3 rounded-full bg-muted" />
      </div>
    </div>
  </div>
);

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
              <RouteChunkErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
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
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogArticle />} />
                    <Route path="/account" element={<Navigate to="/account/personal" replace />} />
                    <Route path="/account/:section" element={<Account />} />
                    <Route path="/profile" element={<Navigate to="/account/personal" replace />} />
                    <Route path="/profile/personal" element={<Navigate to="/account/personal" replace />} />
                    <Route path="/profile/company" element={<Navigate to="/account/company" replace />} />
                    <Route path="/profile/company-addresses" element={<Navigate to="/account/branches" replace />} />
                    <Route path="/profile/classify" element={<Navigate to="/account/products" replace />} />
                    <Route path="/profile/meta-regions" element={<Navigate to="/account/meta-regions" replace />} />
                    <Route path="/profile/company-spam" element={<Navigate to="/account/notifications" replace />} />
                    <Route path="/dashboard/registration-funnel" element={<RegistrationFunnelDashboard />} />
                    <Route path="/dashboard/registration-resend" element={<ResendEffectivenessDashboard />} />
                    <Route path="/admin" element={<AdminOperations />} />
                    <Route path="/admin/access-requests" element={<AdminAccessRequests />} />
                    <Route path="/admin/access-grants" element={<AdminAccessGrants />} />
                    <Route path="/admin/runtime" element={<AdminRuntimeStatus />} />
                    <Route path="/admin/audit" element={<AdminAuditEvents />} />
                    <Route path="/admin/supplier-document-audit" element={<AdminSupplierDocumentAudit />} />
                    <Route path="/admin/incidents" element={<AdminIncidents />} />
                    <Route path="/admin/incidents/:incidentId" element={<AdminIncidentDetail />} />
                    <Route path="/admin/incident-execution" element={<AdminIncidentExecutionQueue />} />
                    <Route path="/admin/incident-workload" element={<AdminIncidentWorkload />} />
                    <Route path="/admin/incident-trends" element={<AdminIncidentTrends />} />
                    <Route path="/admin/incident-trend-actions" element={<AdminIncidentTrendActions />} />
                    <Route path="/dev/typography" element={<TypographyAudit />} />
                    {/* Legacy redirects are declared in src/lib/legacy-redirects.ts. */}
                    {legacyRedirects.flatMap(({ from, to }) => [
                      <Route key={from} path={from} element={<Navigate to={to} replace />} />,
                      <Route key={`${from}/*`} path={`${from}/*`} element={<Navigate to={to} replace />} />,
                    ])}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </RouteChunkErrorBoundary>
            </RegistrationProvider>
          </BuyerSessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
