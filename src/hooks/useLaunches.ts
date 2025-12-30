import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { EvaluatePayload, Launch, PendingLaunch } from "@/types/goal";

// Fetch
const fetchLaunches = async (goalId: string): Promise<Launch[]> => {
  const { data } = await api.get(`/goals/${goalId}/launches`);
  return data;
};

// Create
const createLaunch = async ({
  goalId,
  data,
}: {
  goalId: string;
  data: Partial<Launch>;
}) => {
  const { data: res } = await api.post(`/goals/${goalId}/launches`, data);
  return res;
};

const updateLaunch = async ({
  goalId,
  launchId,
  data,
}: {
  goalId: string;
  launchId: string;
  data: Partial<Launch>;
}) => {
  const { data: res } = await api.put(
    `/goals/${goalId}/launches/${launchId}`,
    data
  );
  return res;
};

// HOOK 1: Listar
export function useGoalLaunches(goalId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["launches", goalId],
    queryFn: () => fetchLaunches(goalId),
    enabled: enabled && !!goalId,
  });
}

// HOOK 2: Criar (com invalidação de cache)
export function useCreateLaunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLaunch,
    onSuccess: (_, variables) => {
      // Atualiza a lista de lançamentos imediatamente
      queryClient.invalidateQueries({
        queryKey: ["launches", variables.goalId],
      });
      // Opcional: Atualizar também o progresso da meta na lista pai?
      queryClient.invalidateQueries({ queryKey: ["launcher-goals"] });
    },
  });
}

export function useUpdateLaunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLaunch,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["launches", variables.goalId],
      });
    },
  });
}

// Fetch Pending
const fetchPendingLaunches = async (): Promise<PendingLaunch[]> => {
  const { data } = await api.get("/launches/pending");
  return data;
};

// Evaluate Action
const evaluateLaunch = async (payload: EvaluatePayload) => {
  const { data } = await api.patch("/launches/evaluate", payload);
  return data;
};

// --- HOOKS ---

export function usePendingLaunches() {
  return useQuery({
    queryKey: ["launches-pending"],
    queryFn: fetchPendingLaunches,
  });
}

export function useEvaluateLaunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: evaluateLaunch,
    onSuccess: () => {
      // Invalida a lista de pendentes (para sumir da tela)
      queryClient.invalidateQueries({ queryKey: ["launches-pending"] });
      // Invalida listas específicas de metas se estiverem abertas
      queryClient.invalidateQueries({ queryKey: ["launches"] });
      queryClient.invalidateQueries({ queryKey: ["launcher-goals"] });
    },
  });
}