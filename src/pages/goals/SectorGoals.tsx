import { useState, useEffect } from "react";
import { Users, AlertCircle } from "lucide-react";
import { useSectorGoals } from "@/hooks/useGoals";
import { GoalPageTemplate } from "@/components/goals/GoalPageTemplate";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet";
import type { HydratedGoal } from "@/types/goal";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SectorGoalsPage() {
  const { data: user, isLoading: isUserLoading } = useUserProfile();
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<HydratedGoal | null>(null);

  // 1. Efeito para selecionar automaticamente o primeiro setor responsável
  useEffect(() => {
    if (
      user?.responsible_sectors &&
      user.responsible_sectors.length > 0 &&
      !selectedSectorId
    ) {
      // Define o padrão como o primeiro setor da lista de responsabilidade
      setSelectedSectorId(user.responsible_sectors[0].id);
    }
  }, [user, selectedSectorId]);

  // 2. Busca metas baseadas APENAS no setor selecionado no Dropdown
  const {
    data: goals,
    isLoading: isGoalsLoading,
    isError,
  } = useSectorGoals(selectedSectorId);

  // Verifica se o usuário tem setores responsáveis para exibir
  const hasResponsibleSectors =
    user?.responsible_sectors && user.responsible_sectors.length > 0;

  // Estado de carregamento unificado
  const isLoading = isUserLoading || (!!selectedSectorId && isGoalsLoading);

  // Caso o usuário não tenha setores responsáveis vinculados
  if (!isUserLoading && !hasResponsibleSectors) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12 opacity-20" />
        <h2 className="text-lg font-semibold">Sem permissão de visualização</h2>
        <p className="text-sm">
          Você não possui setores vinculados à sua responsabilidade.
        </p>
      </div>
    );
  }

  return (
    <>
      <GoalPageTemplate
        title="Metas do Setor"
        description="Visão gerencial das metas dos setores sob sua responsabilidade."
        icon={Users}
        goals={goals}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          selectedSectorId
            ? "Nenhuma meta encontrada para este setor."
            : "Selecione um setor para visualizar."
        }
        onGoalClick={setSelectedGoal}
        extraFilters={
          hasResponsibleSectors && (
            <div className="w-full md:w-70">
              <Select
                value={selectedSectorId}
                onValueChange={setSelectedSectorId}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-background h-10">
                  <SelectValue placeholder="Selecione um setor..." />
                </SelectTrigger>
                <SelectContent>
                  {user?.responsible_sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name} ({sector.acronym})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      <GoalDetailsSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        mode="readonly" // Gestores aqui apenas visualizam o status
      />
    </>
  );
}
