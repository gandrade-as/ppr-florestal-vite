import { useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useSectorGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";

export default function SectorGoalsPage() {
  const { sectorId } = useParams();
  const { data: goals, isLoading, isError } = useSectorGoals(sectorId);

  return (
    <GoalPageTemplate
      title="Metas do Setor"
      description="Visão gerencial das metas ativas da sua equipe."
      icon={Users}
      goals={goals}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="Nenhuma meta encontrada para este setor."
    />
  );
}
