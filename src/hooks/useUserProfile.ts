import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserProfile } from "@/types/user";

// Função de busca (Fetch)
const fetchUserProfile = async (uid: string): Promise<UserProfile> => {
  const { data } = await api.get(`/users/${uid}`);
  return data;
};

export function useUserProfile() {
  const { user } = useAuth(); // Pega o usuário do Firebase

  return useQuery({
    // A chave do cache inclui o UID. Se mudar de usuário, muda o cache.
    queryKey: ["user-profile", user?.uid],

    queryFn: () => fetchUserProfile(user!.uid),

    // TRUQUE DE MESTRE:
    // A query só roda se 'user.uid' existir.
    // Assim que o Firebase logar, isso vira 'true' e a API é chamada.
    enabled: !!user?.uid,

    // Cache de 30 minutos (dados de perfil mudam pouco)
    staleTime: 1000 * 60 * 30,
  });
}
