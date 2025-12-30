import { Search, Target } from "lucide-react";
import { useMyGoals } from "@/hooks/useGoals";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { GoalCard } from "@/components/GoalCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function GoalsPage() {
  const { data: goals, isLoading, isError } = useMyGoals();

  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return <GoalsSkeleton />;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Erro ao carregar suas metas.</div>;
  }

  const filteredGoals = goals?.filter((goal) =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            className="pl-9 bg-background" // pl-9 dá espaço para o ícone
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Metas */}
      {filteredGoals?.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

// Skeleton para Loading State
function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Estado Vazio
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-100 border-2 border-dashed rounded-lg bg-muted/10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Target className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Nenhuma meta encontrada</h3>
      <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
        Você ainda não tem esse tipo de meta vinculada ao seu perfil.
      </p>
    </div>
  );
}
