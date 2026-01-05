import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  updateLaunchInFirestore,
  createLaunchInFirestore,
} from "@/services/launchService";

// ... (Mantenha os fetchers como estão ou migre-os depois se quiser abandonar o api.get)
const fetchLaunches = async (goalId: string): Promise<any[]> => {
  const { data } = await api.get(`/goals/${goalId}/launches`);
  return data;
};

const fetchPendingLaunches = async (): Promise<any[]> => {
  const { data } = await api.get("/launches/pending");
  return data;
};

// ... (useGoalLaunches permanece igual)
export function useGoalLaunches(goalId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["launches", goalId],
    queryFn: () => fetchLaunches(goalId),
    enabled: enabled && !!goalId,
  });
}

/**
 * Hook refatorado para criar lançamentos diretamente no Firestore.
 */
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
      // Agora chama o serviço do Firestore
      return await createLaunchInFirestore(goalId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidações importantes para atualizar a tela
      queryClient.invalidateQueries({
        queryKey: ["launches", variables.goalId],
      });
      queryClient.invalidateQueries({ queryKey: ["goal", variables.goalId] }); // Atualiza o progresso da meta
      queryClient.invalidateQueries({ queryKey: ["launcher-goals"] });
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
    },
  });
}

// ... (useUpdateLaunch e usePendingLaunches permanecem iguais à última refatoração)
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
      queryClient.invalidateQueries({
        queryKey: ["launches", variables.goalId],
      });
      queryClient.invalidateQueries({ queryKey: ["goal", variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ["launches-pending"] });
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
      queryClient.invalidateQueries({ queryKey: ["launcher-goals"] });
    },
  });
}

export function usePendingLaunches() {
  return useQuery({
    queryKey: ["launches-pending"],
    queryFn: fetchPendingLaunches,
  });
}
