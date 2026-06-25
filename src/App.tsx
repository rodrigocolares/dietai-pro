import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ClientArea from "./pages/ClientArea";
import Questionnaire from "./pages/Questionnaire";
import CheckIn from "./pages/CheckIn";
import Chat from "./pages/Chat";
import DietView from "./pages/DietView";
import NutriDashboard from "./pages/NutriDashboard";
import NutriClients from "./pages/NutriClients";
import NutriDiets from "./pages/NutriDiets";
import NutriEmails from "./pages/NutriEmails";
import NutriFoods from "./pages/NutriFoods";
import NutriStats from "./pages/NutriStats";
import DietReview from "./pages/DietReview";
import Plans from "./pages/Plans";
import NutriSubscription from "./pages/NutriSubscription";
import AdminSaaS from "./pages/AdminSaaS";
import AdminTests from "./pages/AdminTests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Home() {
  const { user, roles, loading, rolesLoading } = useAuth();
  if (loading || (user && rolesLoading))
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Landing />;
  if (roles.includes("super_admin")) return <Navigate to="/admin/saas" replace />;
  if (roles.includes("nutricionista") || roles.includes("admin")) return <Navigate to="/nutri" replace />;
  return <Navigate to="/area" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/area" element={<ProtectedRoute allow={["cliente", "admin"]}><ClientArea /></ProtectedRoute>} />
              <Route path="/questionario" element={<ProtectedRoute allow={["cliente", "admin"]}><Questionnaire /></ProtectedRoute>} />
              <Route path="/check-in" element={<ProtectedRoute allow={["cliente", "admin"]}><CheckIn /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute allow={["cliente", "admin"]}><Chat /></ProtectedRoute>} />
              <Route path="/dieta/:id" element={<ProtectedRoute><DietView /></ProtectedRoute>} />
              <Route path="/nutri" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriDashboard /></ProtectedRoute>} />
              <Route path="/nutri/clientes" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriClients /></ProtectedRoute>} />
              <Route path="/nutri/dietas" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriDiets /></ProtectedRoute>} />
              <Route path="/nutri/revisar/:id" element={<ProtectedRoute allow={["nutricionista", "admin"]}><DietReview /></ProtectedRoute>} />
              <Route path="/nutri/emails" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriEmails /></ProtectedRoute>} />
              <Route path="/nutri/alimentos" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriFoods /></ProtectedRoute>} />
              <Route path="/nutri/indicadores" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriStats /></ProtectedRoute>} />
              <Route path="/planos" element={<Plans />} />
              <Route path="/nutri/assinatura" element={<ProtectedRoute allow={["nutricionista", "admin"]}><NutriSubscription /></ProtectedRoute>} />
              <Route path="/admin/saas" element={<ProtectedRoute allow={["admin", "super_admin"]}><AdminSaaS /></ProtectedRoute>} />
              <Route path="/admin/testes" element={<ProtectedRoute allow={["admin", "super_admin", "nutricionista"]}><AdminTests /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
