import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import api from "@/lib/api";
import type { FirestoreGoal } from "@/types/goal";
import { useAuth } from "@/context/AuthContext";
import { createGoalInFirestore, fetchGoalFromFirestore, fetchGoalsByCreatorFromFirestore, fetchGoalsByLauncherFromFirestore, fetchGoalsByResponsibleFromFirestore, fetchGoalsBySectorFromFirestore, fetchPendingGoalsFromFirestore } from "@/services/goalService";

// const fetchUserGoals = async (uid: string): Promise<Goal[]> => {
//   const { data } = await api.get(`/goals/${uid}`);
//   return data;
// };

export function useMyGoals() {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: ["my-goals"],
    queryFn: () => fetchGoalsByResponsibleFromFirestore(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });

  const isWaitingForUser = loading || !user?.uid;

  return {
    ...query,
    isLoading: isWaitingForUser || query.isLoading,
    data: query.data ?? [],
  };
}

// const fetchSectorGoals = async (sectorId: string): Promise<Goal[]> => {
//   const { data } = await api.get(`/sector/${sectorId}/goals`);
//   return data;
// };

export function useSectorGoals(sectorId?: string) {
  return useQuery({
    queryKey: ["sector-goals", sectorId],
    queryFn: () => fetchGoalsBySectorFromFirestore(sectorId!),
    enabled: !!sectorId,
  });
}

// const fetchLauncherGoals = async (uid: string): Promise<Goal[]> => {
//   const { data } = await api.get(`/goals/launcher/${uid}`);
//   return data;
// };

export function useLauncherGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["launcher-goals", user?.uid],
    queryFn: () => fetchGoalsByLauncherFromFirestore(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });
}

// const fetchCreatedGoals = async (uid: string): Promise<Goal[]> => {
//   const { data } = await api.get(`/goals/created/${uid}`);
//   return data;
// };

export function useCreatedGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["created-goals", user?.uid],
    queryFn: () => fetchGoalsByCreatorFromFirestore(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePendingGoals() {
  return useQuery({
    queryKey: ["pending-goals"],
    queryFn: () => fetchPendingGoalsFromFirestore(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGoal(goalId?: string) {
  return useQuery({
    queryKey: ["goal", goalId],
    queryFn:() => fetchGoalFromFirestore(goalId!),
    enabled: !!goalId,
    staleTime: 1000 * 60 * 5
  })
}

// const createGoal = async (data: Partial<Goal>) => {
//   const { data: res } = await api.post("/goals", data);
//   return res;
// };

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: FirestoreGoal) =>
      createGoalInFirestore({ ...data, creator_id: user!.uid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["created-goals"] });
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
      queryClient.invalidateQueries({ queryKey: ["sector-goals"] });
      queryClient.invalidateQueries({ queryKey: ["launcher-goals"] });
    },
  });
}
