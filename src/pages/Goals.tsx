import { useState } from "react";
import { Search, Target } from "lucide-react";

import { useMyGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard";
import { Input } from "@/components/ui/input";
import GoalsSkeleton from "@/components/GoalSkeleton";

export default function GoalsPage() {
  const { data: goals, isLoading, isError } = useMyGoals();
  const [searchTerm, setSearchTerm] = useState("");

  // --- SOLUÇÃO DO PROBLEMA (Vite 7 / React Query Optimization) ---
  // Verifica se está carregando OU se os dados ainda não chegaram (undefined).
  // Isso cobre o "limbo" onde a query está desabilitada esperando o usuário.
  const shouldShowSkeleton = isLoading || goals === undefined;

  // 1. Prioridade Máxima: Loading State
  if (shouldShowSkeleton) {
    return <GoalsSkeleton />;
  }

  // 2. Tratamento de Erro
  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 bg-red-50 rounded-lg border border-red-200">
        Erro ao carregar suas metas. Tente recarregar a página.
      </div>
    );
  }

  // --- LÓGICA DE FILTRAGEM ---
  // Como passamos pelo "shouldShowSkeleton", o TypeScript sabe que 'goals' existe aqui.
  const filteredGoals = goals.filter((goal) =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasGoalsRegistered = goals.length > 0;
  const hasSearchResults = filteredGoals.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minhas Metas</h2>
          <p className="text-muted-foreground">
            Acompanhe o progresso das metas sob sua responsabilidade.
          </p>
        </div>

        <div className="relative w-full md:w-75">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pelo título..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!hasGoalsRegistered} // UX: Desabilita busca se não houver metas no sistema
          />
        </div>
      </div>

      {/* Renderização Condicional Inteligente */}
      {!hasGoalsRegistered ? (
        // Cenário A: O usuário não possui NENHUMA meta cadastrada
        <EmptyState message="Você ainda não tem metas vinculadas ao seu perfil." />
      ) : !hasSearchResults ? (
        // Cenário B: O usuário tem metas, mas a busca não retornou nada
        <EmptyState message={`Nenhuma meta encontrada para "${searchTerm}".`} />
      ) : (
        // Cenário C: Exibição da Grid
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente EmptyState Reutilizável
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/10 animate-in fade-in duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Target className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Nenhuma meta encontrada</h3>
      <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
        {message}
      </p>
    </div>
  );
}
