import { useState } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GoalCard } from "@/components/GoalCard";
import GoalsSkeleton from "@/components/GoalSkeleton";
import type { HydratedGoal } from "@/types/goal";

interface GoalPageTemplateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  goals: HydratedGoal[] | undefined;
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
  headerAction?: React.ReactNode; // Para botões extras (ex: Nova Meta)
  onGoalClick?: (goal: HydratedGoal) => void; // Para abrir detalhes
}

export function GoalPageTemplate({
  title,
  description,
  icon: Icon,
  goals,
  isLoading,
  isError,
  emptyMessage = "Nenhuma meta encontrada.",
  headerAction,
  onGoalClick,
}: GoalPageTemplateProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Lógica de Loading / Erro
  if (isLoading) return <GoalsSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        Erro ao carregar metas. Por favor, tente novamente.
      </div>
    );
  }

  // Filtragem local
  const filteredGoals =
    goals?.filter((goal) =>
      goal.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const hasGoals = goals && goals.length > 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cabeçalho Unificado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Icon className="h-8 w-8 text-primary" />
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Barra de Busca */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pelo título..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!hasGoals}
            />
          </div>

          {/* Ação Extra (Botão Nova Meta) */}
          {headerAction}
        </div>
      </div>

      {/* Estados de Lista */}
      {!hasGoals ? (
        <EmptyState message={emptyMessage} icon={Icon} />
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          message={`Nenhuma meta encontrada para "${searchTerm}".`}
          icon={Search}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => onGoalClick?.(goal)}
              className={
                onGoalClick
                  ? "cursor-pointer hover:opacity-95 transition-opacity h-full"
                  : "h-full"
              }
            >
              <GoalCard goal={goal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Subcomponente simples para Empty State
function EmptyState({
  message,
  icon: Icon,
}: {
  message: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground animate-in fade-in duration-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 opacity-50" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
