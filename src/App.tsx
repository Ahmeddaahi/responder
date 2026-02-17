import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load route components for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const WebChat = lazy(() => import("./pages/WebChat"));

const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const PaymentVerification = lazy(() => import("./pages/PaymentVerification"));
const Messages = lazy(() => import("./pages/Messages"));
const Bookings = lazy(() => import("./pages/Bookings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Demo = lazy(() => import("./pages/Demo"));
const WhatsAppGuide = lazy(() => import("./pages/WhatsAppGuide"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const CryptoPayments = lazy(() => import("./pages/CryptoPayments"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyCode = lazy(() => import("./pages/VerifyCode"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailVerificationSent = lazy(() => import("./pages/EmailVerificationSent"));
const EmailVerificationRequired = lazy(() => import("./pages/EmailVerificationRequired"));


const AdminPromoCodes = lazy(() => import("./pages/AdminPromoCodes"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
            <Route path="/chat/:userId" element={<WebChat />} />

            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/promo-codes" element={<ProtectedRoute><AdminPromoCodes /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute><PaymentVerification /></ProtectedRoute>} />
            <Route path="/admin/crypto-payments" element={<ProtectedRoute><CryptoPayments /></ProtectedRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/whatsapp-guide" element={<WhatsAppGuide />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-code" element={<VerifyCode />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/email-verification-sent" element={<EmailVerificationSent />} />
            <Route path="/email-verification-required" element={<EmailVerificationRequired />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
