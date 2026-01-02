import { Target } from "lucide-react";
import { useMyGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";

export default function MyGoalsPage() {
  const { data: goals, isLoading, isError } = useMyGoals();

  return (
    <GoalPageTemplate
      title="Minhas Metas"
      description="Acompanhe o progresso das metas sob sua responsabilidade."
      icon={Target}
      goals={goals}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="Você ainda não possui metas vinculadas."
    />
  );
}
