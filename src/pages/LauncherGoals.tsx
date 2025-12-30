import { useState } from "react";
import { PenTool, Search } from "lucide-react";
import { useLauncherGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard";
import { GoalDetailsSheet } from "@/components/GoalDetailsSheet";
import type { Goal } from "@/types/goal";
import { Input } from "@/components/ui/input";

export default function LauncherGoalsPage() {
  const { data: goals, isLoading, isError } = useLauncherGoals();

  // Estado para controlar qual meta está selecionada
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // 1. Estado da Busca
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return <div className="p-10">Carregando lançamentos...</div>;
  }

  if (isError) {
    return <div className="p-4 text-destructive">Erro ao carregar dados.</div>;
  }

  // 2. Lógica de Filtragem (Case Insensitive)
  // Se não tiver busca, retorna tudo. Se tiver, filtra pelo título.
  const filteredGoals = goals?.filter((goal) =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Cabeçalho Agora Flexível (Título na esquerda, Busca na direita) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <PenTool className="h-8 w-8 text-primary" />
              Lançamentos
            </h2>
            <p className="text-muted-foreground">
              Metas onde você é responsável por atualizar os dados.
            </p>
          </div>

          {/* 3. Campo de Busca Visual */}
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

        {/* Listagem usando a lista FILTRADA */}
        {!filteredGoals?.length ? (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            {searchTerm
              ? `Nenhuma meta encontrada para "${searchTerm}"`
              : "Nenhuma meta pendente de lançamento."}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredGoals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className="cursor-pointer hover:opacity-90 transition-opacity h-full"
              >
                <GoalCard goal={goal} />
              </div>
            ))}
          </div>
        )}
      </div>

      <GoalDetailsSheet
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        readOnly={false}
      />
    </>
  );
}
