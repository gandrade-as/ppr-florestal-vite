import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  updateLaunchInFirestore,
  createLaunchInFirestore,
} from "@/services/launchService";

// --- FETCHERS ---

const fetchLaunches = async (goalId: string): Promise<any[]> => {
  const { data } = await api.get(`/goals/${goalId}/launches`);
  return data;
};

const fetchPendingLaunches = async (): Promise<any[]> => {
  const { data } = await api.get("/launches/pending");
  return data;
};

// --- FUNÇÃO AUXILIAR DE INVALIDAÇÃO ---
// Centraliza a lógica para não esquecer nenhuma lista
const invalidateAllGoalQueries = (queryClient: any, goalId: string) => {
  // 1. Dados da meta individual e seus lançamentos (para o Sheet aberto)
  queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
  queryClient.invalidateQueries({ queryKey: ["launches", goalId] });

  // 2. Listas de Metas (para atualizar barra de progresso nos Cards)
  queryClient.invalidateQueries({ queryKey: ["my-goals"] });
  queryClient.invalidateQueries({ queryKey: ["launcher-goals"] });
  queryClient.invalidateQueries({ queryKey: ["created-goals"] });
  queryClient.invalidateQueries({ queryKey: ["sector-goals"] });
  queryClient.invalidateQueries({ queryKey: ["pending-goals"] });

  // 3. Listas de Auditoria (para avaliadores)
  queryClient.invalidateQueries({ queryKey: ["launches-pending"] });
};

// --- HOOKS ---

export function useGoalLaunches(goalId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["launches", goalId],
    queryFn: () => fetchLaunches(goalId),
    enabled: enabled && !!goalId,
  });
}

export function useCreateLaunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      data,
    }: {
      goalId: string;
      data: {
        seq: number;
        value: string | number;
        note?: string;
        status: "pending" | "approved" | "rejected";
        updated_by: string;
      };
    }) => {
      return await createLaunchInFirestore(goalId, data);
    },
    onSuccess: (_, variables) => {
      // Usa a função centralizada para garantir que TUDO atualize
      invalidateAllGoalQueries(queryClient, variables.goalId);
    },
  });
}

export function useUpdateLaunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      launchId,
      data,
    }: {
      goalId: string;
      launchId: string;
      data: {
        value?: string | number;
        note?: string;
        status: "pending" | "approved" | "rejected";
        rejection_reason?: string;
      };
    }) => {
      return await updateLaunchInFirestore(goalId, launchId, data);
    },
    onSuccess: (_, variables) => {
      invalidateAllGoalQueries(queryClient, variables.goalId);
    },
  });
}

export function usePendingLaunches() {
  return useQuery({
    queryKey: ["launches-pending"],
    queryFn: fetchPendingLaunches,
  });
}
