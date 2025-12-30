import { type ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserRole } from "@/types/user"; // Importando do arquivo centralizado

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[]; // Ex: ["superuser", "gestor"]
  fallback?: ReactNode; // Opcional: O que mostrar se negado (ex: mensagem de erro)
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { data: profile, isLoading } = useUserProfile();

  // 1. Enquanto carrega, não mostramos nada (ou poderia ser um Skeleton)
  // Isso evita que o botão "pisque" na tela antes de saber o cargo
  if (isLoading) {
    return null;
  }

  // 2. Se não tem perfil ou o cargo não está na lista permitida
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <>{fallback}</>;
  }

  // 3. Acesso permitido
  return <>{children}</>;
}
