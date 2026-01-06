import { useState, useMemo, useEffect } from "react";
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
  headerAction?: React.ReactNode;
  onGoalClick?: (goal: HydratedGoal) => void;
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
  // 1. Lógica de Padrões Inteligentes
  const currentSemester = new Date().getMonth() < 6 ? "01" : "02";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] =
    useState<string>(currentSemester);

  // 2. Extrair anos únicos
  const availableYears = useMemo(() => {
    if (!goals) return [];
    const years = new Set<string>();
    goals.forEach((goal) => {
      if (goal.reference) {
        const [year] = goal.reference.split("/");
        if (year && year.length === 4) years.add(year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [goals]);

  // 3. Auto-seleção do ano mais recente
  useEffect(() => {
    if (availableYears.length > 0) {
      // Se não houver seleção ou a seleção atual não existir na lista
      if (!selectedYear || !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
      }
    }
  }, [availableYears, selectedYear]);

  // Lógica de Loading / Erro
  if (isLoading) return <GoalsSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        Erro ao carregar metas. Por favor, tente novamente.
      </div>
    );
  }

  // 4. Filtragem Estrita (Sem "All")
  const filteredGoals =
    goals?.filter((goal) => {
      const [refYear, refSemester] = (goal.reference || "").split("/");

      // Se o filtro de ano/semestre ainda não estiver definido (loading inicial), oculta ou mostra tudo?
      // Aqui optamos por consistência: se tem filtro, usa. Se não tem ano selecionado, não mostra nada (ou espera).
      if (!selectedYear) return false;

      const matchesSearch = goal.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesYear = refYear === selectedYear;
      const matchesSemester = refSemester === selectedSemester;

      return matchesSearch && matchesYear && matchesSemester;
    }) || [];

  const hasGoals = goals && goals.length > 0;

  // 5. Função para "Resetar" filtros (Volta ao padrão atual/recente)
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSemester(currentSemester);
    if (availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  };

  // Verifica se o estado atual é diferente do "padrão" para mostrar o botão de limpar
  const isDefaultView =
    searchTerm === "" &&
    selectedSemester === currentSemester &&
    (availableYears.length === 0 || selectedYear === availableYears[0]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
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
            disabled={!hasGoals || availableYears.length === 0}
          >
            <SelectTrigger className="w-full sm:w-25 bg-background">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
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

          {/* Botão Limpar Filtros (Resetar) */}
          {!isDefaultView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              title="Restaurar visualização padrão"
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
          message={`Nenhuma meta encontrada em ${selectedSemester}/${selectedYear}${
            searchTerm ? " com este termo" : ""
          }.`}
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
