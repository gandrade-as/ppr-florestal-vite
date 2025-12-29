import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api"; // O Axios configurado anteriormente

// Tipagem da resposta (ajuste conforme seu backend real)
interface DashboardMetrics {
  revenue: number;
  subscriptions: number;
  sales: number;
  activeNow: number;
}

// Função de fetch isolada
const fetchMetrics = async (): Promise<DashboardMetrics> => {
  // Simulação de delay para você ver o Skeleton Loading funcionando
  // await new Promise(resolve => setTimeout(resolve, 1000));

  const { data } = await api.get("/dashboard/metrics");
  return data;
};

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"], // Chave única do cache
    queryFn: fetchMetrics,
    // Opcional: placeholderData mantém os dados antigos enquanto busca novos (sem piscar tela)
    // placeholderData: keepPreviousData
  });
}
