import { type ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserRole } from "@/types/user";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[]; // Ex: ["superuser", "gestor"]
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { data: profile, isLoading } = useUserProfile();

  // 1. Loading state
  if (isLoading) {
    return null;
  }

  // 2. Verificação de Segurança Atualizada
  // Usamos .some() para ver se ALGUM (some) cargo do usuário está incluso nos permitidos
  const hasPermission = profile?.roles.some((userRole) =>
    allowedRoles.includes(userRole)
  );

  // Se não tem perfil carregado OU não tem permissão
  if (!profile || !hasPermission) {
    return <>{fallback}</>;
  }

  // 3. Acesso permitido
  return <>{children}</>;
}
