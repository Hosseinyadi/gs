import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
// import PerformanceMonitor from "./components/PerformanceMonitor";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Search from "./pages/Search";
import RentAds from "./pages/RentAds";
import SaleAds from "./pages/SaleAds";
import Admin from "./pages/Admin";
import PostAd from "./pages/PostAd";
import Auth from "./pages/Auth";
import SellerDashboard from "./pages/SellerDashboard";
import UserDashboard from "./pages/UserDashboard";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import ListingDetail from "./pages/ListingDetail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import DevTools from "./pages/DevTools";
import AdminLogin from "./pages/AdminLogin";
import TestAPI from "./pages/TestAPI";
import Register from "./pages/Register";
import MakeFeatured from "./pages/MakeFeatured";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import CardTransfer from "./pages/CardTransfer";
import PaymentPending from "./pages/PaymentPending";
import PaymentHistory from "./pages/PaymentHistory";
import AdminAnalyticsDashboard from "./components/admin/AdminAnalyticsDashboard";
import AdminManagement from "./components/admin/AdminManagement";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/search" element={<Search />} />
            <Route path="/rent" element={<RentAds />} />
            <Route path="/sale" element={<SaleAds />} />
            <Route path="/rent/:id" element={<ListingDetail />} />
            <Route path="/sale/:id" element={<ListingDetail />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalyticsDashboard /></ProtectedRoute>} />
            <Route path="/admin/management" element={<ProtectedRoute requireAdmin><AdminManagement /></ProtectedRoute>} />
            <Route path="/post-ad" element={<ProtectedRoute><PostAd /></ProtectedRoute>} />
            <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/make-featured" element={<ProtectedRoute><MakeFeatured /></ProtectedRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/payment/card-transfer" element={<ProtectedRoute><CardTransfer /></ProtectedRoute>} />
            <Route path="/payment/pending" element={<PaymentPending />} />
            <Route path="/payment/history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/parts-services" element={<Search />} />
            <Route path="/blog" element={<Search />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/dev-tools" element={<DevTools />} />
            <Route path="/test-api" element={<TestAPI />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <CookieConsent />
        {/* <PerformanceMonitor /> */}
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;