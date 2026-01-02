import { useState } from "react";
import { Briefcase, PlusCircle } from "lucide-react";
import { useCreatedGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { CreateGoalSheet } from "@/components/CreateGoalSheet";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet"; // Importar
import { Button } from "@/components/ui/button";
import type { HydratedGoal } from "@/types/goal";

export default function CreatedGoalsPage() {
  const { data: goals, isLoading, isError } = useCreatedGoals();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<HydratedGoal | null>(null);

  return (
    <>
      <GoalPageTemplate
        title="Metas Criadas por Mim"
        description="Gerencie as metas que você definiu para sua equipe."
        icon={Briefcase}
        goals={goals}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Você ainda não criou nenhuma meta."
        onGoalClick={setSelectedGoal}
        headerAction={
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Meta
          </Button>
        }
      />

      <CreateGoalSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Adicionar o Sheet de Detalhes em modo Evaluator */}
      <GoalDetailsSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        mode="evaluator"
      />
    </>
  );
}
