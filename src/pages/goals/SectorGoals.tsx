import { useState } from "react";
import { Users } from "lucide-react";
import { useSectorGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet";
import type { HydratedGoal } from "@/types/goal";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function SectorGoalsPage() {
  const { data: user } = useUserProfile();
  const { data: goals, isLoading, isError } = useSectorGoals(user?.sector.id!);
  const [selectedGoal, setSelectedGoal] = useState<HydratedGoal | null>(null);

  return (
    <>
      <GoalPageTemplate
        title="Metas do Setor"
        description="Visão gerencial das metas ativas da sua equipe."
        icon={Users}
        goals={goals}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Nenhuma meta encontrada para este setor."
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
