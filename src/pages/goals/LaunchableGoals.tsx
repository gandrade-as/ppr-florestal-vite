import { useState } from "react";
import { PenTool } from "lucide-react";
import { useLauncherGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet";
import type { HydratedGoal } from "@/types/goal";

export default function LaunchableGoalsPage() {
  const { data: goals, isLoading, isError } = useLauncherGoals();
  const [selectedGoal, setSelectedGoal] = useState<HydratedGoal | null>(null);

  return (
    <>
      <GoalPageTemplate
        title="Meus Lançamentos"
        description="Metas onde você é responsável por inserir os resultados."
        icon={PenTool}
        goals={goals}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Nenhuma meta pendente de lançamento."
        onGoalClick={setSelectedGoal}
      />

      <GoalDetailsSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        mode="launcher"
      />
    </>
  );
}
