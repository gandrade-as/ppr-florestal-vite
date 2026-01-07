import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { createUserInFirestore, fecthUsersFromfirestore, fetchUserProfileFromFirestore, fetchUsersBySectorFromFirestore } from "@/services/userService";
import type { FirestoreUserProfile } from "@/types/user";
// import api from "@/lib/api";
// import type { UserProfile } from "@/types/user";

// const fetchUserProfile = async (uid: string): Promise<UserProfile> => {
//   const { data } = await api.get(`/users/${uid}`);
//   return data;
// };

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.uid],
    queryFn: () => fetchUserProfileFromFirestore(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 30,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fecthUsersFromfirestore(),
    staleTime: 1000 * 60 * 30
  })
}

export function useSectorUsers(sectorId?: string) {
  return useQuery({
    queryKey: ["sector-users", sectorId],
    queryFn: () => fetchUsersBySectorFromFirestore(sectorId!),
    enabled: !!sectorId,
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<FirestoreUserProfile, "uid">) =>
      createUserInFirestore(data),
    onSuccess: () => {
      // Atualiza a lista de usuários automaticamente após criar
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Se necessário, invalida caches de setores específicos
      queryClient.invalidateQueries({ queryKey: ["sector-users"] });
    },
  });
}