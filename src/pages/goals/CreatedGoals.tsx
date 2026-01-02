import { useState } from "react";
import { Briefcase, PlusCircle } from "lucide-react";
import { useCreatedGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { CreateGoalSheet } from "@/components/CreateGoalSheet";
import { Button } from "@/components/ui/button";

export default function CreatedGoalsPage() {
  const { data: goals, isLoading, isError } = useCreatedGoals();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    </>
  );
}
