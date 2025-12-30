import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Goal } from "@/types/goal";
import { useAuth } from "@/lib/context/AuthContext";

const fetchUserGoals = async (uid: string): Promise<Goal[]> => {
  const { data } = await api.get(`/goals/${uid}`);
  return data;
};

export function useMyGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-goals"], // Chave única
    queryFn: () => fetchUserGoals(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}

const fetchSectorGoals = async (sectorId: string): Promise<Goal[]> => {
  const { data } = await api.get(`/sector/${sectorId}/goals`);
  return data;
};

export function useSectorGoals(sectorId?: string) {
  return useQuery({
    queryKey: ["sector-goals", sectorId],
    queryFn: () => fetchSectorGoals(sectorId!),
    // Só busca se tivermos o ID do setor
    enabled: !!sectorId,
  });
}

const fetchLauncherGoals = async (uid: string): Promise<Goal[]> => {
  const { data } = await api.get(`/goals/launcher/${uid}`);
  return data;
};

export function useLauncherGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["launcher-goals", user?.uid],
    queryFn: () => fetchLauncherGoals(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });
}

const fetchCreatedGoals = async (uid: string): Promise<Goal[]> => {
  const { data } = await api.get(`/goals/created/${uid}`);
  return data;
};

// --- NOVO: Hook ---
export function useCreatedGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["created-goals", user?.uid],
    queryFn: () => fetchCreatedGoals(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });
}

const createGoal = async (data: Partial<Goal>) => {
  const { data: res } = await api.post("/goals", data);
  return res;
};

// Hook
export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Partial<Goal>) =>
      createGoal({ ...data, creatorId: user?.uid }),
    onSuccess: () => {
      // Invalida todas as listas possíveis para garantir atualização
      queryClient.invalidateQueries({ queryKey: ["created-goals"] });
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
      queryClient.invalidateQueries({ queryKey: ["sector-goals"] });
    },
  });
}