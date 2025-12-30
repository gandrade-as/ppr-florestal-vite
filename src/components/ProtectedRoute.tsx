import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Agora aceita roles opcionais
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // 1. Carregando Auth ou Perfil
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  // 2. Não logado no Firebase
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se a rota exige roles específicos e o usuário não tem o role necessário
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redireciona para o Dashboard ou uma página de "Sem Permissão"
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
