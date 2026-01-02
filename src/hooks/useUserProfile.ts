import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchUserProfileFromFirestore } from "@/services/userService";
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
