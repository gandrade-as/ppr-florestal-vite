import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Exemplo de imports (supondo que você já tenha criado as páginas)
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
// import ProfilePage from "@/pages/Profile";

// ... imports anteriores
import DashboardLayout from "@/layouts/DashboardLayout"; // Importe o novo layout

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
            <Route element={<ProtectedRoute />}>
              {/* Camada de Layout Visual */}
              <Route element={<DashboardLayout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* <Route path="/perfil" element={<ProfilePage />} /> */}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}