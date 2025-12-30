import { useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useSectorGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard"; // Reutilizando!

export default function SectorGoalsPage() {
  // Pega o ID da rota: /sector/:sectorId/goals
  const { sectorId } = useParams();

  const { data: goals, isLoading } = useSectorGoals(sectorId);

  if (isLoading) {
    return <div className="p-10">Carregando metas do setor...</div>; // Ou use seu Skeleton
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Metas do Setor
          </h2>
          <p className="text-muted-foreground">
            Visão gerencial das metas ativas da sua equipe.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {goals?.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
