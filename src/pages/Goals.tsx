import { Target } from "lucide-react";
import { useMyGoals } from "@/hooks/useGoals";

// UI Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalCard } from "@/components/GoalCard";

export default function GoalsPage() {
  const { data: goals, isLoading, isError } = useMyGoals();

  if (isLoading) {
    return <GoalsSkeleton />;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Erro ao carregar suas metas.</div>;
  }

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
      </div>

      {/* Grid de Metas */}
      {goals?.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals?.map((goal) => (
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
        Você ainda não tem metas vinculadas ao seu perfil. Crie uma nova meta
        para começar a acompanhar.
      </p>
      <Button variant="outline">Criar Primeira Meta</Button>
    </div>
  );
}
