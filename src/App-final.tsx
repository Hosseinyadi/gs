import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";

// Import actual pages
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import Search from "./pages/Search";
import RentAds from "./pages/RentAds";
import SaleAds from "./pages/SaleAds";
import PostAd from "./pages/PostAd";
import UserDashboard from "./pages/UserDashboard";
import ListingDetail from "./pages/ListingDetail";
import MakeFeatured from "./pages/MakeFeatured";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import PaymentPending from "./pages/PaymentPending";
import PaymentHistory from "./pages/PaymentHistory";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/search" element={<Search />} />
                <Route path="/rent" element={<RentAds />} />
                <Route path="/sale" element={<SaleAds />} />
                <Route path="/post-ad" element={<PostAd />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/make-featured" element={<MakeFeatured />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />
                <Route path="/payment/pending" element={<PaymentPending />} />
                <Route path="/payment-history" element={<PaymentHistory />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/parts" element={<Shop />} />
                <Route path="/services" element={<Shop />} />
                <Route path="/قطعات" element={<Shop />} />
                <Route path="/خدمات" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieConsent />
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;