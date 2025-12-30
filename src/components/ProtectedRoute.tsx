import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { type UserRole } from "@/types/user";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // NOVA LÓGICA DE VERIFICAÇÃO
  if (allowedRoles && profile) {
    // Verifica se existe INTERSEÇÃO entre os arrays
    // "O usuário tem ALGUM cargo que está na lista de allowedRoles?"
    const hasPermission = profile.roles.some((userRole) =>
      allowedRoles.includes(userRole)
    );

    if (!hasPermission) {
      // Se não tiver permissão, manda pro dashboard padrão
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
