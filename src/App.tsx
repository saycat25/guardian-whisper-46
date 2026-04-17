import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AI from "./pages/AI";
import Memory from "./pages/Memory";
import Conversations from "./pages/Conversations";
import Tickets from "./pages/Tickets";
import Moderation from "./pages/Moderation";
import Analytics from "./pages/Analytics";
import Research from "./pages/Research";
import Multimodal from "./pages/Multimodal";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ai" element={<AI />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/research" element={<Research />} />
              <Route path="/multimodal" element={<Multimodal />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
