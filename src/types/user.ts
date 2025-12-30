export type UserRole = "superuser" | "admin" | "gestor" | "avaliador" | "colaborador";

export interface Setor {
    id: string;
    acronym: string;
    name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  avatarUrl?: string;
  setor: Setor;
}
