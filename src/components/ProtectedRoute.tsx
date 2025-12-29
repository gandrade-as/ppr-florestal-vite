import { Navigate, Outlet} from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";

export function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            {/* Simples spinner usando classes do Tailwind/shadcn */}
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // 3. Se tem usuário, renderiza as rotas filhas (O Dashboard, Perfil, etc).
    return <Outlet />;
}