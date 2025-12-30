import { useParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { useSectorGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard"; // Reutilizando!
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function SectorGoalsPage() {
  // Pega o ID da rota: /sector/:sectorId/goals
  const { sectorId } = useParams();

  const { data: goals, isLoading } = useSectorGoals(sectorId);

  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return <div className="p-10">Carregando metas do setor...</div>; // Ou use seu Skeleton
  }

  const filteredGoals = goals?.filter((goal) =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <div className="relative w-full md:w-75">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pelo título..."
            className="pl-9 bg-background" // pl-9 dá espaço para o ícone
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredGoals?.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
