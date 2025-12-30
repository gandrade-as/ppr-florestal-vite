import { useQuery } from "@tanstack/react-query";
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
