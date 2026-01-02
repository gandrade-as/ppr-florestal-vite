import { useState } from "react";
import { Target } from "lucide-react";
import { useMyGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet";
import type { HydratedGoal } from "@/types/goal";

export default function MyGoalsPage() {
  const { data: goals, isLoading, isError } = useMyGoals();
  const [selectedGoal, setSelectedGoal] = useState<HydratedGoal | null>(null);

  return (
    <>
      <GoalPageTemplate
        title="Minhas Metas"
        description="Acompanhe o progresso das metas sob sua responsabilidade."
        icon={Target}
        goals={goals}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Você ainda não possui metas vinculadas."
        onGoalClick={setSelectedGoal}
      />

      <GoalDetailsSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        mode="readonly"
      />
    </>
  );
}
