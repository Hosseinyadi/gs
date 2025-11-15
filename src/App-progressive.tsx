import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";

// Simple pages for testing
const SimpleHome = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial' }}>
    <h1>🎉 گاراژ سنگین</h1>
    <p>سیستم کامل کار می‌کند!</p>
    <div style={{ marginTop: '20px' }}>
      <a href="/admin" style={{ marginRight: '10px' }}>پنل ادمین</a>
      <a href="/auth" style={{ marginRight: '10px' }}>ورود</a>
    </div>
  </div>
);

const SimpleAdmin = () => (
  <div style={{ padding: '20px' }}>
    <h1>🔐 پنل مدیریت</h1>
    <p>admin / admin123456</p>
    <a href="/">خانه</a>
  </div>
);

const SimpleAuth = () => (
  <div style={{ padding: '20px' }}>
    <h1>🔐 ورود/ثبت نام</h1>
    <p>سیستم OTP فعال است</p>
    <a href="/">خانه</a>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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
                <Route path="/" element={<SimpleHome />} />
                <Route path="/admin" element={<SimpleAdmin />} />
                <Route path="/auth" element={<SimpleAuth />} />
                <Route path="*" element={<SimpleHome />} />
              </Routes>
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