import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import BatchDashboard from "./pages/BatchDashboard";
import Integrations from "./pages/Integrations";
import PricingPage from "./pages/PricingPage";
import UseCasesPage from "./pages/UseCasesPage";
import AboutPage from "./pages/AboutPage";
import RoadmapPage from "./pages/RoadmapPage";
import SecurityPage from "./pages/SecurityPage";
import NotFound from "./pages/NotFound";
import WaitlistPage from "./pages/WaitlistPage";
import WaitlistAdmin from "./pages/WaitlistAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<Index />} />
          <Route path="/batch" element={<BatchDashboard />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/use-cases" element={<UseCasesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/admin/waitlist" element={<WaitlistAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
