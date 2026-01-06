import { useState, useMemo } from "react";
import { Search, FilterX, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GoalCard } from "@/components/GoalCard";
import GoalsSkeleton from "@/components/GoalSkeleton";
import type { HydratedGoal } from "@/types/goal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  // 1. Extrair anos únicos das metas existentes para preencher o Dropdown
  const availableYears = useMemo(() => {
    if (!goals) return [];
    const years = new Set<string>();
    goals.forEach((goal) => {
      // Supondo formato "YYYY/SS" no campo reference
      if (goal.reference) {
        const [year] = goal.reference.split("/");
        if (year && year.length === 4) years.add(year);
      }
    });
    // Ordena do mais recente para o mais antigo
    return Array.from(years).sort().reverse();
  }, [goals]);

  // Lógica de Loading / Erro
  if (isLoading) return <GoalsSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        Erro ao carregar metas. Por favor, tente novamente.
      </div>
    );
  }

  // 2. Filtragem Combinada (Texto + Ano + Semestre)
  const filteredGoals =
    goals?.filter((goal) => {
      const [refYear, refSemester] = (goal.reference || "").split("/");

      // Filtro de Texto
      const matchesSearch = goal.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Filtro de Ano (Se 'all', passa tudo. Senão, compara o ano)
      const matchesYear = selectedYear === "all" || refYear === selectedYear;

      // Filtro de Semestre
      const matchesSemester =
        selectedSemester === "all" || refSemester === selectedSemester;

      return matchesSearch && matchesYear && matchesSemester;
    }) || [];

  const hasGoals = goals && goals.length > 0;

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedYear("all");
    setSelectedSemester("all");
  };

  const isFiltering =
    searchTerm !== "" || selectedYear !== "all" || selectedSemester !== "all";

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

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          {/* Dropdown de ANO */}
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
            disabled={!hasGoals}
          >
            <SelectTrigger className="w-full sm:w-25 bg-background">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dropdown de SEMESTRE */}
          <Select
            value={selectedSemester}
            onValueChange={setSelectedSemester}
            disabled={!hasGoals}
          >
            <SelectTrigger className="w-full sm:w-32.5 bg-background">
              <SelectValue placeholder="Semestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="01">1º Semestre</SelectItem>
              <SelectItem value="02">2º Semestre</SelectItem>
            </SelectContent>
          </Select>

          {/* Barra de Busca */}
          <div className="relative flex-1 sm:w-64 w-full">
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

          {/* Botão Limpar Filtros */}
          {isFiltering && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Limpar filtros"
              className="shrink-0"
            >
              <FilterX className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}

          {/* Ação Extra (Botão Nova Meta) */}
          {headerAction}
        </div>
      </div>

      {/* Estados de Lista */}
      {!hasGoals ? (
        <EmptyState message={emptyMessage} icon={Icon} />
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          message="Nenhuma meta encontrada com os filtros selecionados."
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
