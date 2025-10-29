import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Clientes from "./pages/Clientes";
import Pets from "./pages/Pets";
import Agenda from "./pages/Agenda";
import Atendimentos from "./pages/Atendimentos";
import Vacinas from "./pages/Vacinas";
import Produtos from "./pages/Produtos";
import PDV from "./pages/PDV";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Config from "./pages/Config";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
            <Route path="/pets" element={<ProtectedRoute><Layout><Pets /></Layout></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Layout><Agenda /></Layout></ProtectedRoute>} />
            <Route path="/atendimentos" element={<ProtectedRoute><Layout><Atendimentos /></Layout></ProtectedRoute>} />
            <Route path="/vacinas" element={<ProtectedRoute><Layout><Vacinas /></Layout></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Layout><Produtos /></Layout></ProtectedRoute>} />
            <Route path="/pdv" element={<ProtectedRoute><Layout><PDV /></Layout></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} />
            <Route path="/config" element={<ProtectedRoute><Layout><Config /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
