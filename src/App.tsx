import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Exemplo de imports (supondo que você já tenha criado as páginas)
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
// import ProfilePage from "@/pages/Profile";

// ... imports anteriores
import DashboardLayout from "@/layouts/DashboardLayout"; // Importe o novo layout
import SectorGoalsPage from "./pages/goals/SectorGoals";
import EvaluationPage from "./pages/evaluation/EvaluationPage";
import CreatedGoalsPage from "./pages/goals/CreatedGoals";
import MyGoalsPage from "./pages/goals/MyGoals";
import LaunchableGoalsPage from "./pages/goals/LaunchableGoals";

// 1. Instância do Cliente (Configuração Otimizada)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Tenta apenas 1 vez se der erro (padrão é 3)
      staleTime: 1000 * 60 * 5, // Dados são considerados "frescos" por 5 minutos (cache)
      refetchOnWindowFocus: false, // Não recarrega ao trocar de aba (bom para dashboards)
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Camada de Segurança */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["superuser", "admin", "gestor"]}
                />
              }
            >
              {/* Camada de Layout Visual */}
              <Route element={<DashboardLayout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/metas" element={<MyGoalsPage />} />
                <Route path="/lancamentos" element={<LaunchableGoalsPage />} />
                {/* <Route path="/perfil" element={<ProfilePage />} /> */}

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["superuser", "avaliador"]} />
                  }
                >
                  <Route path="/auditoria" element={<EvaluationPage />} />
                </Route>

                {/* ÁREA DE GESTÃO (Setor) */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["superuser", "gestor"]} />
                  }
                >
                  {/* O :sectorId é dinâmico */}
                  <Route
                    path="/sector/:sectorId/goals"
                    element={<SectorGoalsPage />}
                  />
                  <Route path="/created-goals" element={<CreatedGoalsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
