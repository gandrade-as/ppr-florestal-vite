import { useState } from "react";
import { Scale } from "lucide-react";
import { usePendingGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet";
import type { HydratedGoal } from "@/types/goal";

export default function EvaluationPage() {
  const { data: goals, isLoading, isError } = usePendingGoals();
  const [selectedGoal, setSelectedGoal] = useState<HydratedGoal | null>(null);

  return (
    <>
      <GoalPageTemplate
        title="Painel de Avaliação"
        description="Visualize e audite as metas pendentes de aprovação."
        icon={Scale}
        goals={goals}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Nenhuma meta pendente de avaliação no momento."
        onGoalClick={setSelectedGoal}
      />

      <GoalDetailsSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        mode="evaluator"
      />
    </>
  );
}
